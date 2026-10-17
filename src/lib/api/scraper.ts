import { createServerFn } from "@tanstack/react-start";
import { supabase } from "../supabase";
import type { Offer } from "../../data/types";

// This server function runs on the Node backend
export const syncAmexOffers = createServerFn({ method: "POST" }).handler(async () => {
  try {
    console.log("Scraping live offers from Reddit r/AmexUK...");
    let posts: any[] = [];
    const rssUrl = encodeURIComponent(
      "https://www.reddit.com/r/AmexUK/search.rss?q=offer&restrict_sr=1&sort=new",
    );
    const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error("Failed to fetch from RSS feed API");

    const json = await response.json();
    posts =
      json.items?.map((item: any) => ({
        data: {
          id: item.guid.split("_")[1] || item.guid,
          title: item.title,
          selftext: item.description || item.content,
          url: item.link,
        },
      })) || [];
    const scrapedOffers: Offer[] = [];

    posts.forEach((post: any) => {
      const title = post.data.title || "Amex Offer";
      const text = post.data.selftext || "";
      const combined = (title + " " + text).toLowerCase();

      let description = text.substring(0, 200) + (text.length > 200 ? "..." : "");
      if (!description) {
        const offerPattern = /(?:spend|spend\s*£?(\d+)).*?(?:get|back|credit)\s*£?(\d+)/i;
        const match = combined.match(offerPattern);
        description = match ? `Spend £${match[1] || "X"}, get £${match[2] || "Y"} back.` : title;
      }

      scrapedOffers.push({
        id: `reddit-offer-${post.data.id}`,
        title: title.length > 50 ? title.substring(0, 47) + "..." : title,
        description: description,
        // Community posts do not establish an offer expiry date.
        type: combined.includes("targeted") ? "targeted" : "public",
        terms: `Sourced from Reddit community discussion (${post.data.url})`,
      });
    });

    if (scrapedOffers.length === 0) {
      console.warn("No offers found from Reddit scrape.");
      return { success: true, count: 0, offers: [] };
    }

    // Deduplicate by ID
    const uniqueOffers = Array.from(new Map(scrapedOffers.map((o) => [o.id, o])).values());

    // Write to Supabase (Optional: Don't crash if it fails, just return the data anyway)
    try {
      if (!supabase) return { success: true, count: uniqueOffers.length, offers: uniqueOffers };
      const { error } = await supabase
        .from("amex_offers")
        .upsert(uniqueOffers, { onConflict: "id" });

      if (error) {
        console.warn("Supabase insert warning: " + error.message);
      }
    } catch (dbErr: any) {
      console.warn("Could not save to Supabase, but returning scraped data anyway:", dbErr.message);
    }

    return { success: true, count: uniqueOffers.length, offers: uniqueOffers };
  } catch (error: any) {
    console.error("Scraping error:", error);
    throw new Error(error.message || "Failed to sync offers");
  }
});
