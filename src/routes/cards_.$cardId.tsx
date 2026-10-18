import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CARDS } from "@/data/cards";
import { CATEGORY_LABEL, COUNTRY_LABEL, FEATURE_LABEL } from "@/data/types";
import { scoreBreakdown } from "@/lib/scoring";
import { useWallet } from "@/lib/wallet";
import { ScoreBadge, CountryFlag, FeatureChip } from "@/components/card-tile";
import { ArrowLeft, Check, ExternalLink, Plus, RefreshCw } from "lucide-react";
import type { Card, Category, Feature, Offer } from "@/data/types";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { syncAmexOffers } from "@/lib/api/scraper";

export const Route = createFileRoute("/cards_/$cardId")({
  loader: ({ params }) => {
    const card = CARDS.find((c) => c.id === params.cardId);
    if (!card) throw notFound();
    return { card };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.card.name} — CardSavvy` },
          { name: "description", content: loaderData.card.description },
          { property: "og:title", content: loaderData.card.name },
          { property: "og:description", content: loaderData.card.description },
        ]
      : [{ title: "Card not found" }],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Card not found</h1>
      <Link to="/cards" className="mt-4 inline-block text-primary hover:underline">
        Browse all cards →
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <p className="text-destructive">{error instanceof Error ? error.message : "Unable to load this card."}</p>
    </div>
  ),
  component: CardDetail,
});

function CardDetail() {
  const { card } = Route.useLoaderData() as { card: Card };
  const wallet = useWallet();
  const owned = wallet.has(card.id);
  const score = scoreBreakdown(card);

  const [liveOffers, setLiveOffers] = useState<Offer[]>(card.activeOffers || []);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Only load live offers for Amex cards to avoid unnecessary DB reads
    if (card.network === "Amex" && supabase) {
      const fetchOffers = async () => {
        try {
          if (!supabase) return;
          const { data, error } = await supabase.from("amex_offers").select("*");
          if (error) throw error;
          if (data && data.length > 0) setLiveOffers(data as Offer[]);
        } catch (e) {
          console.error("Failed to load live offers", e);
        }
      };
      fetchOffers();
    }
  }, [card.id, card.network]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const result = await syncAmexOffers();
      if (result.success) {
        setLiveOffers(result.offers);
        alert(`Successfully scraped and synced ${result.count} offers!`);
      }
    } catch (e: any) {
      alert("Failed to sync offers: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        to="/cards"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to cards
      </Link>

      <div className="mt-6 grid gap-8 md:grid-cols-[1fr,300px]">
        <div>
          <div
            className={`mb-6 rounded-2xl bg-gradient-to-br ${card.color} p-8 text-white shadow-lg`}
          >
            <p className="text-xs uppercase tracking-wide opacity-80">
              {card.issuer} · {card.network}
            </p>
            <h1 className="mt-2 text-3xl font-bold">{card.name}</h1>
            <p className="mt-4 max-w-2xl text-sm opacity-90">{card.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <CountryFlag country={card.country} />
            <ScoreBadge score={score.total} />
            {card.editorPick && card.editorPick.length > 0 && (
              <span className="inline-flex items-center rounded-md bg-accent/20 px-2 py-0.5 text-xs font-semibold text-accent-foreground">
                Editor's pick
              </span>
            )}
          </div>

          <Section title="At a glance">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <Stat
                label="Annual fee"
                value={
                  card.annualFee === 0
                    ? "None"
                    : `${card.annualFeeCurrency} ${card.annualFee.toLocaleString()}`
                }
              />
              <Stat
                label="Foreign-exchange fee"
                value={card.fxFee === 0 ? "None" : `${card.fxFee}%`}
              />
              <Stat label="Reward rate" value={card.rewardRate} />
              <Stat label="Welcome bonus" value={card.welcomeBonus} />
              <Stat label="Eligibility" value={card.eligibility} />
              <Stat label="Country" value={COUNTRY_LABEL[card.country]} />
            </dl>
          </Section>

          <Section title="Benefits & features">
            <div className="flex flex-wrap gap-2">
              {card.features.map((f: Feature) => (
                <FeatureChip key={f} feature={f} />
              ))}
            </div>
          </Section>

          <Section title="Best for">
            <div className="flex flex-wrap gap-2">
              {card.categories.map((c: Category) => (
                <Link
                  key={c}
                  to="/rankings/$category"
                  params={{ category: c }}
                  className="rounded-full bg-secondary px-3 py-1 text-sm font-medium hover:bg-primary hover:text-primary-foreground"
                >
                  {CATEGORY_LABEL[c]}
                </Link>
              ))}
            </div>
          </Section>

          {card.network === "Amex" && (
            <Section title="Current Offers (Live from Supabase)">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Scraping latest deals directly from the web.
                </p>
                <button
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Syncing..." : "Sync Latest Offers"}
                </button>
              </div>

              {liveOffers.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {liveOffers.map((offer: Offer) => (
                    <div
                      key={offer.id}
                      className="relative overflow-hidden rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className="font-semibold"
                          dangerouslySetInnerHTML={{ __html: offer.title }}
                        />
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${offer.type === "targeted" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"}`}
                        >
                          {offer.type === "targeted" ? "Targeted" : "Public"}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-foreground line-clamp-4 whitespace-pre-wrap">
                        {offer.description.replace(/<[^>]*>?/gm, "")}
                      </div>
                      {(offer.expiryDate || offer.terms) && (
                        <div className="mt-4 space-y-1 text-xs text-muted-foreground border-t pt-3">
                          {offer.expiryDate && (
                            <p>Expires: {new Date(offer.expiryDate).toLocaleDateString()}</p>
                          )}
                          {offer.terms && <p className="italic opacity-80">{offer.terms}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                  No active offers found. Click Sync to scrape the web!
                </div>
              )}
            </Section>
          )}
        </div>

        {/* Side panel */}
        <aside className="space-y-4 md:sticky md:top-20 md:self-start">
          <div className="rounded-xl border bg-card p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Optimizer score
            </p>
            <p className="mt-1 text-4xl font-bold">
              {score.total}
              <span className="text-base text-muted-foreground">/100</span>
            </p>
            <div className="mt-3 space-y-1 text-xs text-muted-foreground">
              <p>
                Automated: <span className="font-medium text-foreground">{score.automated}</span>
              </p>
              <p>
                Editor's bonus: <span className="font-medium text-foreground">+{score.editor}</span>
              </p>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              Blends a benefit-weighted model with hand-curated category picks. See{" "}
              <Link to="/about" className="text-primary hover:underline">
                methodology
              </Link>
              .
            </p>
          </div>

          <a
            href={card.applyUrl}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Apply on issuer site <ExternalLink className="h-4 w-4" />
          </a>

          <button
            onClick={() => wallet.toggle(card.id)}
            className={`flex w-full items-center justify-center gap-1.5 rounded-lg border px-4 py-3 text-sm font-medium transition-colors ${
              owned
                ? "border-emerald-600/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                : "bg-background hover:bg-secondary"
            }`}
          >
            {owned ? (
              <>
                <Check className="h-4 w-4" /> In your wallet
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Add to wallet
              </>
            )}
          </button>

          <Link
            to="/compare"
            search={{ ids: card.id }}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Compare this card
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{value}</dd>
    </div>
  );
}
