import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { CARDS } from "@/data/cards";
import { CATEGORY_LABEL } from "@/data/types";
import type { Category } from "@/data/types";
import { rankCards, scoreBreakdown } from "@/lib/scoring";
import { CardTile } from "@/components/card-tile";
import { ArrowLeft } from "lucide-react";

const VALID: Category[] = [
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

export const Route = createFileRoute("/rankings_/$category")({
  loader: ({ params }) => {
    if (!VALID.includes(params.category as Category)) throw notFound();
    return { category: params.category as Category };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `Best credit cards for ${CATEGORY_LABEL[loaderData.category]} — CardSavvy` },
          {
            name: "description",
            content: `Top-ranked credit cards for ${CATEGORY_LABEL[loaderData.category]} across all countries.`,
          },
          { property: "og:title", content: `Best for ${CATEGORY_LABEL[loaderData.category]}` },
        ]
      : [{ title: "Category not found" }],
  }),
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Unknown category</h1>
      <Link to="/rankings" className="mt-4 inline-block text-primary hover:underline">
        All rankings →
      </Link>
    </div>
  ),
  errorComponent: ({ error }) => <div className="p-8 text-destructive">{error instanceof Error ? error.message : "Unable to load these rankings."}</div>,
  component: CategoryRanking,
});

function CategoryRanking() {
  const { category } = Route.useLoaderData() as { category: Category };
  const ranked = rankCards(CARDS, category).slice(0, 10);
  const winner = ranked[0];
  const winnerScore = scoreBreakdown(winner, category);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link
        to="/rankings"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All rankings
      </Link>
      <h1 className="mt-4 text-3xl font-bold">Best credit cards for {CATEGORY_LABEL[category]}</h1>
      <p className="mt-1 text-muted-foreground">
        Ranked by optimizer score tuned for this category.
      </p>

      <div className="mt-6 rounded-xl border bg-gradient-to-br from-primary/10 to-accent/10 p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          #1 pick
        </p>
        <h2 className="mt-1 text-2xl font-bold">{winner.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{winner.description}</p>
        <p className="mt-3 text-sm">
          Score <span className="font-semibold text-foreground">{winnerScore.total}/100</span>
          <span className="text-muted-foreground">
            {" "}
            · {winnerScore.automated} automated + {winnerScore.editor} editor
          </span>
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ranked.map((c, i) => (
          <CardTile key={c.id} card={c} rank={i + 1} category={category} />
        ))}
      </div>
    </div>
  );
}
