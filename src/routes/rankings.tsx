import { createFileRoute, Link } from "@tanstack/react-router";
import { CARDS } from "@/data/cards";
import { CATEGORY_LABEL } from "@/data/types";
import type { Category } from "@/data/types";
import { rankCards } from "@/lib/scoring";
import { CardTile } from "@/components/card-tile";

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Card rankings — CardSavvy" },
      {
        name: "description",
        content:
          "Best credit cards globally and by category — travel, lounge, cashback, dining and more.",
      },
    ],
  }),
  component: RankingsPage,
});

const CATEGORIES: Category[] = [
  "travel",
  "lounge",
  "cashback",
  "dining",
  "fuel",
  "online",
  "groceries",
  "no-annual-fee",
  "beginner",
  "luxury",
];

function RankingsPage() {
  const overall = rankCards(CARDS).slice(0, 6);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">Rankings</h1>
      <p className="mt-1 text-muted-foreground">
        Best overall and best in every domain — combining automated scoring with editor's picks.
      </p>

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-semibold">Best overall</h2>
          <Link to="/cards" className="text-sm font-medium text-primary hover:underline">
            View all cards →
          </Link>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {overall.map((c, i) => (
            <CardTile key={c.id} card={c} rank={i + 1} />
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold">Best by category</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((cat) => {
            const top = rankCards(CARDS, cat)[0];
            return (
              <Link
                key={cat}
                to="/rankings/$category"
                params={{ category: cat }}
                className="group flex items-center justify-between rounded-xl border bg-card p-4 transition-shadow hover:shadow-md"
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Best for {CATEGORY_LABEL[cat]}
                  </p>
                  <p className="mt-1 font-semibold">{top.name}</p>
                  <p className="text-xs text-muted-foreground">{top.issuer}</p>
                </div>
                <span className="text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  →
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
