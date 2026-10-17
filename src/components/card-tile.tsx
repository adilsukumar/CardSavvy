import { Link } from "@tanstack/react-router";
import type { Card } from "@/data/types";
import { COUNTRY_LABEL, FEATURE_LABEL, CATEGORY_LABEL } from "@/data/types";
import { optimizerScore } from "@/lib/scoring";
import { useWallet } from "@/lib/wallet";
import { Check, Plus, Sparkles } from "lucide-react";

function formatFee(card: Card) {
  if (card.annualFee === 0) return "No annual fee";
  return `${card.annualFeeCurrency} ${card.annualFee.toLocaleString()}/yr`;
}

export function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? "bg-emerald-500/15 text-emerald-700"
      : score >= 60
        ? "bg-blue-500/15 text-blue-700"
        : score >= 40
          ? "bg-amber-500/15 text-amber-700"
          : "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${tone}`}
    >
      <Sparkles className="h-3 w-3" /> {score}
    </span>
  );
}

export function CountryFlag({ country }: { country: Card["country"] }) {
  return (
    <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
      {COUNTRY_LABEL[country]}
    </span>
  );
}

export function CardTile({
  card,
  rank,
  category,
}: {
  card: Card;
  rank?: number;
  category?: import("@/data/types").Category;
}) {
  const score = optimizerScore(card, category);
  const wallet = useWallet();
  const owned = wallet.has(card.id);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-primary/30">
      <Link
        to="/cards/$cardId"
        params={{ cardId: card.id }}
        className="flex flex-1 flex-col outline-none"
      >
        <div className="p-4 pb-0">
          <div
            className={`relative h-48 w-full overflow-hidden rounded-xl bg-gradient-to-br ${card.color} p-5 text-white shadow-xl transition-transform duration-500 group-hover:scale-[1.02]`}
          >
            <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
            {/* Faux Credit Card Chip */}
            <div className="absolute left-5 top-1/2 h-8 w-12 -translate-y-1/2 rounded-md bg-gradient-to-br from-yellow-200/80 to-yellow-500/80 shadow-inner opacity-70"></div>

            {rank !== undefined && (
              <span className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-xs font-bold backdrop-blur-md border border-white/20">
                #{rank}
              </span>
            )}
            <p className="relative z-10 text-xs uppercase tracking-widest text-white/80">
              {card.issuer}
            </p>
            <h3 className="relative z-10 mt-2 text-xl font-bold leading-tight tracking-tight drop-shadow-md">
              {card.name}
            </h3>

            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between">
              <p className="text-sm font-medium tracking-widest opacity-90 font-mono">
                •••• •••• •••• ••••
              </p>
              <p className="text-xs font-bold opacity-80 uppercase">{card.network}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 pb-14">
          <div className="flex items-center justify-between gap-2">
            <CountryFlag country={card.country} />
            <ScoreBadge score={score} />
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{card.description}</p>
          <div className="flex flex-wrap gap-1">
            {card.categories.slice(0, 3).map((c) => (
              <span
                key={c}
                className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground"
              >
                {CATEGORY_LABEL[c]}
              </span>
            ))}
          </div>
        </div>
      </Link>

      {/* Absolutely positioned bottom row (Fee + Button) outside the Link to avoid nested interactive elements */}
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
        <span className="text-sm font-medium text-foreground">{formatFee(card)}</span>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            wallet.toggle(card.id);
          }}
          className={`pointer-events-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
            owned
              ? "bg-emerald-500/15 text-emerald-700"
              : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
          }`}
          aria-label={owned ? "Remove from wallet" : "Add to wallet"}
        >
          {owned ? (
            <>
              <Check className="h-3 w-3" /> In wallet
            </>
          ) : (
            <>
              <Plus className="h-3 w-3" /> Wallet
            </>
          )}
        </button>
      </div>
    </article>
  );
}

export function FeatureChip({ feature }: { feature: Card["features"][number] }) {
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs">
      {FEATURE_LABEL[feature]}
    </span>
  );
}
