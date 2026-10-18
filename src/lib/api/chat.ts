import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { CARDS } from "../../data/cards";
import * as cheerio from "cheerio";

export const askChatbot = createServerFn({ method: "POST" })
  .validator((data: unknown) =>
    z
      .object({
        messages: z
          .array(
            z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }),
          )
          .min(1)
          .max(30),
      })
      .parse(data),
  )
  .handler(async (ctx) => {
    const data = ctx.data;
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey)
      return {
        text: "AI chat is not configured. Browse and compare the local catalogue, or set GROQ_API_KEY on your server.",
      };
    const groq = createGroq({ apiKey });
    try {
      let currentMessages: any[] = [...data.messages];
      let finalResponse = "";

      for (let i = 0; i < 5; i++) {
        const { text } = await generateText({
          model: groq("llama-3.3-70b-versatile"),
          system:
            "You are an expert credit card optimizer assistant for 'CardSavvy'.\n\nIf you need to search the local database for credit cards, output EXACTLY this string and nothing else: \nTOOL:DATABASE:your_search_query\n\nIf you need to search the web for live offers, output EXACTLY this string and nothing else:\nTOOL:WEB:your_search_query\n\nWait for the result. Once you have the information, provide a helpful and concise response in markdown. \n\nCRITICAL FORMATTING INSTRUCTION: At the very end of your final response, you MUST add exactly ONE empty line, followed by your source tag. If you used web search, use '🦆 (Sourced via DuckDuckGo)'. If you relied on your internal knowledge or the database, use '🧠 (Answered by Groq AI)'. Do NOT place the tag inline with the text.",
          messages: currentMessages,
        });

        // Parse custom tool calls
        const dbMatch = text.match(/TOOL:DATABASE:(.+)/i);
        const webMatch = text.match(/TOOL:WEB:(.+)/i);

        if (dbMatch) {
          const query = dbMatch[1].trim();
          const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
          const results = CARDS.map((c) => {
            const hay = [
              c.name,
              c.issuer,
              c.country,
              c.network,
              c.description,
              ...(c.categories || []),
            ]
              .join(" ")
              .toLowerCase();
            const score = tokens.reduce((acc, t) => acc + (hay.includes(t) ? 1 : 0), 0);
            return { card: c, score };
          })
            .filter((r) => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5)
            .map((r) => r.card);

          const dbResult =
            results.length === 0
              ? "No cards found matching your query."
              : JSON.stringify(
                  results.map((c) => ({
                    name: c.name,
                    issuer: c.issuer,
                    fee: c.annualFee,
                    rewards: c.rewardRate,
                    features: c.features,
                  })),
                );

          currentMessages.push({ role: "assistant", content: text });
          currentMessages.push({ role: "user", content: `DATABASE RESULT: ${dbResult}` });
          continue;
        }

        if (webMatch) {
          const query = webMatch[1].trim();
          let webResult = "";
          try {
            const res = await fetch(
              `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
              {
                signal: AbortSignal.timeout(10000),
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
              },
            );
            if (!res.ok) {
              webResult = "Search blocked. Use database or general knowledge.";
            } else {
              const html = await res.text();
              const $ = cheerio.load(html);
              const results: string[] = [];
              $(".result__snippet").each((i, el) => {
                if (i < 3) results.push($(el).text().trim());
              });
              webResult = results.length === 0 ? "No results found." : results.join("\n\n");
            }
          } catch (e) {
            webResult = "Failed to search web.";
          }
          currentMessages.push({ role: "assistant", content: text });
          currentMessages.push({ role: "user", content: `WEB RESULT: ${webResult}` });
          continue;
        }

        // If no tool calls, this is the final response
        finalResponse = text;
        break;
      }

      return {
        text:
          finalResponse ||
          "I couldn't formulate a response. Could you try asking more specifically?",
      };
    } catch (error: any) {
      console.error("Chatbot request failed");
      throw new Error("The chat service is unavailable. Please try again later.");
    }
  });
