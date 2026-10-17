import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { CARDS } from "@/data/cards";
import { COUNTRY_LABEL, CATEGORY_LABEL } from "@/data/types";
import type { Category, Country } from "@/data/types";
import { rankCards } from "@/lib/scoring";
import { CardTile } from "@/components/card-tile";
import { Search, ArrowRight, Globe2, Trophy, Wallet, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CardSavvy — Find the best credit card, anywhere" },
      {
        name: "description",
        content:
          "Search global credit cards by perks, lounges, cashback and rewards. Track your wallet and find the best card per spend category.",
      },
      { property: "og:title", content: "CardSavvy" },
      {
        property: "og:description",
        content: "Search, compare and rank credit cards from around the world.",
      },
    ],
  }),
  component: Index,
});

const FEATURED_COUNTRIES: Country[] = ["US", "UK", "IN", "CN", "AE", "SG", "JP", "EU", "CA", "AU"];
const SPOTLIGHT_CATEGORIES: Category[] = [
  "travel",
  "lounge",
  "cashback",
  "dining",
  "no-annual-fee",
];

function Index() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const topCards = rankCards(CARDS).slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Globe2 className="h-3 w-3" /> Global · {CARDS.length} cards across{" "}
              {FEATURED_COUNTRIES.length}+ countries
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl">
              Find the best credit card.
              <br />
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Anywhere in the world.
              </span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Search by perk, ranking, or country. Track the cards you have, discover the ones you
              don't.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate({ to: "/cards", search: { q: query } });
              }}
              className="mx-auto mt-8 flex max-w-2xl items-center gap-2 rounded-xl border bg-card p-2 shadow-sm focus-within:ring-2 focus-within:ring-ring"
            >
              <Search className="ml-2 h-5 w-5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try 'airport lounge', 'no FX fee', 'cashback in India'…"
                className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Search <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              {SPOTLIGHT_CATEGORIES.map((c) => (
                <Link
                  key={c}
                  to="/rankings/$category"
                  params={{ category: c }}
                  className="rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  Best for {CATEGORY_LABEL[c]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          <ValueCard
            icon={<Trophy className="h-5 w-5" />}
            title="Rankings that explain themselves"
            body="Our optimizer score blends an automated benefits model with editor's picks for each category."
          />
          <ValueCard
            icon={<Wallet className="h-5 w-5" />}
            title="Your wallet, optimized"
            body="Track the cards you own, see your benefit gaps and learn which card to swipe for each purchase."
          />
          <ValueCard
            icon={<BarChart3 className="h-5 w-5" />}
            title="Compare side by side"
            body="Stack any three cards across fees, rewards and perks to pick your next one with confidence."
          />
        </div>
      </section>

      {/* Countries */}
      <section className="border-t bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="text-2xl font-bold">Browse by country</h2>
          <p className="mt-1 text-muted-foreground">
            From the United States to China, India to the UAE — we cover the markets that matter.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {FEATURED_COUNTRIES.map((c) => {
              const count = CARDS.filter((card) => card.country === c).length;
              return (
                <Link
                  key={c}
                  to="/cards"
                  search={{ country: c }}
                  className="group flex items-center justify-between rounded-lg border bg-background p-4 transition-colors hover:border-primary"
                >
                  <div>
                    <p className="font-medium">{COUNTRY_LABEL[c]}</p>
                    <p className="text-xs text-muted-foreground">{count} cards</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top ranked */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">Top-ranked cards globally</h2>
            <p className="mt-1 text-muted-foreground">
              By optimizer score — automated benefits + editor's picks.
            </p>
          </div>
          <Link to="/rankings" className="text-sm font-medium text-primary hover:underline">
            All rankings →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topCards.map((card, i) => (
            <CardTile key={card.id} card={card} rank={i + 1} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ValueCard({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
