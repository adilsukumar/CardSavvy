import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useState } from "react";
import { CARDS } from "@/data/cards";
import { CATEGORY_LABEL, FEATURE_LABEL, COUNTRY_LABEL } from "@/data/types";
import { optimizerScore } from "@/lib/scoring";
import { X, Plus, ExternalLink } from "lucide-react";

const searchSchema = z.object({
  ids: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/compare")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Compare credit cards — CardSavvy" },
      {
        name: "description",
        content:
          "Compare up to three credit cards side by side: fees, rewards, perks and optimizer score.",
      },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [picker, setPicker] = useState(false);

  const ids: string[] = search.ids.split(",").filter(Boolean);
  const cards = ids
    .map((id: string) => CARDS.find((c) => c.id === id))
    .filter(Boolean) as typeof CARDS;

  function setIds(next: string[]) {
    navigate({ search: { ids: next.join(",") } });
  }
  function addCard(id: string) {
    if (cards.length >= 3 || ids.includes(id)) return;
    setIds([...ids, id]);
    setPicker(false);
  }
  function removeCard(id: string) {
    setIds(ids.filter((x: string) => x !== id));
  }

  const allFeatures = Array.from(new Set(cards.flatMap((c) => c.features)));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">Compare cards</h1>
      <p className="mt-1 text-muted-foreground">Pick up to 3 cards to compare side by side.</p>

      {cards.length === 0 ? (
        <div className="mt-8 rounded-xl border bg-card p-10 text-center">
          <p className="font-semibold">No cards selected yet.</p>
          <button
            onClick={() => setPicker(true)}
            className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> Add a card
          </button>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-x-3 text-sm">
            <thead>
              <tr>
                <th className="w-40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {" "}
                </th>
                {cards.map((c) => (
                  <th key={c.id} className="text-left align-top">
                    <div className="relative rounded-xl border bg-card p-4">
                      <button
                        onClick={() => removeCard(c.id)}
                        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-secondary"
                        aria-label="Remove"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <p className="text-xs text-muted-foreground">{c.issuer}</p>
                      <Link
                        to="/cards/$cardId"
                        params={{ cardId: c.id }}
                        className="mt-1 block font-semibold hover:underline"
                      >
                        {c.name}
                      </Link>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {COUNTRY_LABEL[c.country]}
                      </p>
                    </div>
                  </th>
                ))}
                {cards.length < 3 && (
                  <th>
                    <button
                      onClick={() => setPicker(true)}
                      className="flex h-full w-full items-center justify-center rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground hover:bg-secondary"
                    >
                      <Plus className="mr-1 h-4 w-4" /> Add card
                    </button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              <Row
                label="Optimizer score"
                cards={cards}
                render={(c) => <span className="font-semibold">{optimizerScore(c)}/100</span>}
              />
              <Row label="Network" cards={cards} render={(c) => c.network} />
              <Row
                label="Annual fee"
                cards={cards}
                render={(c) =>
                  c.annualFee === 0
                    ? "None"
                    : `${c.annualFeeCurrency} ${c.annualFee.toLocaleString()}`
                }
              />
              <Row
                label="FX fee"
                cards={cards}
                render={(c) => (c.fxFee === 0 ? "None" : `${c.fxFee}%`)}
              />
              <Row label="Reward rate" cards={cards} render={(c) => c.rewardRate} />
              <Row label="Welcome bonus" cards={cards} render={(c) => c.welcomeBonus} />
              <Row label="Eligibility" cards={cards} render={(c) => c.eligibility} />
              <Row
                label="Best for"
                cards={cards}
                render={(c) => c.categories.map((cat) => CATEGORY_LABEL[cat]).join(", ")}
              />
              <tr>
                <td className="py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Features
                </td>
                {cards.map((c) => (
                  <td key={c.id} className="align-top py-3">
                    <ul className="space-y-1">
                      {allFeatures.map((f) => (
                        <li
                          key={f}
                          className={`text-xs ${c.features.includes(f) ? "text-foreground" : "text-muted-foreground/40 line-through"}`}
                        >
                          {c.features.includes(f) ? "✓" : "—"} {FEATURE_LABEL[f]}
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
              <tr>
                <td></td>
                {cards.map((c) => (
                  <td key={c.id} className="py-3">
                    <a
                      href={c.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
                    >
                      Apply <ExternalLink className="h-3 w-3" />
                    </a>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {picker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPicker(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add a card</h2>
              <button
                onClick={() => setPicker(false)}
                className="rounded-md p-1 hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-1">
              {CARDS.filter((c) => !ids.includes(c.id)).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => addCard(c.id)}
                    className="flex w-full items-center justify-between rounded-md p-2 text-left hover:bg-secondary"
                  >
                    <span>
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {c.issuer} · {COUNTRY_LABEL[c.country]}
                      </span>
                    </span>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  cards,
  render,
}: {
  label: string;
  cards: typeof CARDS;
  render: (c: (typeof CARDS)[number]) => React.ReactNode;
}) {
  return (
    <tr className="border-t">
      <td className="py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </td>
      {cards.map((c) => (
        <td key={c.id} className="py-3 align-top">
          {render(c)}
        </td>
      ))}
    </tr>
  );
}
