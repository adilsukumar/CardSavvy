import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useMemo, useState, useEffect } from "react";
import { CARDS } from "@/data/cards";
import { CATEGORY_LABEL, COUNTRY_LABEL, FEATURE_LABEL } from "@/data/types";
import type { Category, Country, Feature } from "@/data/types";
import { rankCards } from "@/lib/scoring";
import { CardTile } from "@/components/card-tile";
import { Search, X } from "lucide-react";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  country: fallback(z.string(), "").default(""),
  category: fallback(z.string(), "").default(""),
  feature: fallback(z.string(), "").default(""),
  noFee: fallback(z.boolean(), false).default(false),
  noFx: fallback(z.boolean(), false).default(false),
});

export const Route = createFileRoute("/cards")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Browse credit cards — CardSavvy" },
      {
        name: "description",
        content:
          "Search and filter credit cards from around the world by feature, country, fee and reward category.",
      },
    ],
  }),
  component: CardsPage,
});

const ALL_COUNTRIES: Country[] = ["US", "UK", "EU", "IN", "CN", "AE", "SG", "CA", "AU", "JP"];
const ALL_CATEGORIES: Category[] = [
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
const ALL_FEATURES: Feature[] = [
  "priority-pass",
  "lounge-intl",
  "lounge-domestic",
  "no-fx-fee",
  "travel-insurance",
  "rental-insurance",
  "concierge",
  "golf",
  "dining-discount",
  "fuel-waiver",
  "movie-tickets",
  "hotel-status",
  "transfer-partners",
  "milestone-bonus",
  "metal-card",
];

function CardsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [localQ, setLocalQ] = useState(search.q);

  useEffect(() => {
    // Only sync from URL to local state if they are out of sync AND the user isn't currently typing
    // (i.e. if the URL was changed by a "Clear All" button or back navigation)
    if (search.q !== localQ) {
      setLocalQ(search.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.q]);

  useEffect(() => {
    if (search.q !== localQ) {
      const timer = setTimeout(() => {
        navigate({ search: (prev: any) => ({ ...prev, q: localQ }), replace: true });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [localQ, search.q, navigate]);

  function update(partial: Partial<typeof search>) {
    navigate({ search: (prev: typeof search) => ({ ...prev, ...partial }), replace: true });
  }

  const filtered = useMemo(() => {
    const tokens = localQ.toLowerCase().split(/\s+/).filter(Boolean);
    return rankCards(
      CARDS.filter((c) => {
        if (search.country && c.country !== search.country) return false;
        if (search.category && !c.categories.includes(search.category as Category)) return false;
        if (search.feature && !c.features.includes(search.feature as Feature)) return false;
        if (search.noFee && c.annualFee !== 0) return false;
        if (search.noFx && c.fxFee !== 0) return false;
        if (tokens.length > 0) {
          const hay = [
            c.name,
            c.issuer,
            c.network,
            c.description,
            ...c.features.map((f) => FEATURE_LABEL[f]),
            ...c.categories.map((cat) => CATEGORY_LABEL[cat]),
            COUNTRY_LABEL[c.country],
          ]
            .filter(Boolean)
            .join(" ");

          // Use word boundaries to prevent 'id' from matching 'edition' or 'valid'
          const matches = tokens.every((t: string) => {
            try {
              const regex = new RegExp(`\\b${t}`, "i");
              return regex.test(hay);
            } catch (e) {
              // Fallback to simple includes if regex fails (e.g. invalid regex characters)
              return hay.toLowerCase().includes(t.toLowerCase());
            }
          });
          if (!matches) return false;
        }
        return true;
      }),
      (search.category as Category) || undefined,
    );
  }, [search, localQ]);

  const activeFilters = [
    search.country && { key: "country", label: COUNTRY_LABEL[search.country as Country] },
    search.category && { key: "category", label: CATEGORY_LABEL[search.category as Category] },
    search.feature && { key: "feature", label: FEATURE_LABEL[search.feature as Feature] },
    search.noFee && { key: "noFee", label: "No annual fee" },
    search.noFx && { key: "noFx", label: "No FX fee" },
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold">Browse cards</h1>
      <p className="mt-1 text-muted-foreground">
        {filtered.length} of {CARDS.length} cards · ranked by optimizer score
      </p>

      <div className="mt-6 flex items-center gap-2 rounded-xl border bg-card p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
        <Search className="ml-2 h-5 w-5 text-muted-foreground" />
        <input
          value={localQ}
          onChange={(e) => setLocalQ(e.target.value)}
          placeholder="Search cards, networks, perks, issuers…"
          className="flex-1 bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground text-foreground"
        />
      </div>

      <div className="mt-8 flex flex-col xl:flex-row gap-6">
        {/* Horizontal Filters Bar */}
        <div className="flex-1 rounded-3xl border bg-white p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-fit">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-full sm:w-auto">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-foreground">Filters</h2>
                {activeFilters.length > 0 && (
                  <Link
                    to="/cards"
                    search={{
                      q: "",
                      country: "",
                      category: "",
                      feature: "",
                      noFee: false,
                      noFx: false,
                    }}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Clear all
                  </Link>
                )}
              </div>
            </div>
            <div className="flex flex-1 flex-wrap items-center gap-3 w-full">
              <SelectInput
                value={search.country}
                onChange={(v) => update({ country: v })}
                options={[
                  ["", "All countries"],
                  ...ALL_COUNTRIES.map((c) => [c, COUNTRY_LABEL[c]] as [string, string]),
                ]}
              />
              <SelectInput
                value={search.category}
                onChange={(v) => update({ category: v })}
                options={[
                  ["", "All categories"],
                  ...ALL_CATEGORIES.map((c) => [c, CATEGORY_LABEL[c]] as [string, string]),
                ]}
              />
              <SelectInput
                value={search.feature}
                onChange={(v) => update({ feature: v })}
                options={[
                  ["", "Any feature"],
                  ...ALL_FEATURES.map((f) => [f, FEATURE_LABEL[f]] as [string, string]),
                ]}
              />

              <div className="flex items-center gap-4 ml-auto pl-4 border-l">
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={search.noFee}
                    onChange={(e) => update({ noFee: e.target.checked })}
                    className="rounded border-input text-primary focus:ring-primary/50"
                  />
                  <span className="group-hover:text-foreground transition-colors">No Fee</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={search.noFx}
                    onChange={(e) => update({ noFx: e.target.checked })}
                    className="rounded border-input text-primary focus:ring-primary/50"
                  />
                  <span className="group-hover:text-foreground transition-colors">No FX</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results Bento Grid */}
      <section className="mt-8">
        {activeFilters.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() =>
                  update({ [f.key]: f.key === "noFee" || f.key === "noFx" ? false : "" } as Partial<
                    typeof search
                  >)
                }
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary px-3 py-1 text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                {f.label} <X className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-xl border bg-card p-10 text-center">
            <p className="font-semibold">No cards match your filters.</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try clearing some filters or searching for a different perk.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-max">
            {filtered.map((card) => (
              <CardTile
                key={card.id}
                card={card}
                category={(search.category as Category) || undefined}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all shadow-sm"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
