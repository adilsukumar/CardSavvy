import { createFileRoute, Link } from "@tanstack/react-router";
import { CARDS } from "@/data/cards";
import {
  isNewCard,
  recentBenefitUpdates,
  cardAddedAt,
  COUNTRY_LABEL,
  FEATURE_LABEL,
  NEW_WINDOW_DAYS,
  type BenefitUpdate,
  type Card,
} from "@/data/types";
import { CardTile } from "@/components/card-tile";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, History, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/new")({
  head: () => ({
    meta: [
      { title: "New Cards & New Benefits — CardSavvy" },
      {
        name: "description",
        content:
          "Latest credit-card launches and benefit changes from issuers worldwide, updated as soon as they go live.",
      },
      { property: "og:title", content: "New Cards & New Benefits — CardSavvy" },
      {
        property: "og:description",
        content:
          "Track every new credit card launched and every benefit change across global issuers.",
      },
    ],
  }),
  component: NewPage,
});

function formatRelative(dateISO: string, now: Date = new Date()): string {
  const days = Math.max(0, Math.round((now.getTime() - new Date(dateISO).getTime()) / 86_400_000));
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.round(days / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

function NewPage() {
  const now = new Date();
  const newCards = CARDS.filter((c) => isNewCard(c, now)).sort(
    (a, b) => new Date(cardAddedAt(b)).getTime() - new Date(cardAddedAt(a)).getTime(),
  );

  const benefitFeed: Array<{ card: Card; update: BenefitUpdate }> = CARDS.flatMap((card) =>
    recentBenefitUpdates(card, now).map((update) => ({ card, update })),
  ).sort((a, b) => new Date(b.update.date).getTime() - new Date(a.update.date).getTime());

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Live in the last {NEW_WINDOW_DAYS} days
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
          What's new in credit cards
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Brand-new cards launched by issuers worldwide and benefit changes to cards that already
          exist. Updated whenever issuers ship a change.
        </p>
      </div>

      <Tabs defaultValue="cards" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="cards" className="gap-2">
            <Sparkles className="h-4 w-4" />
            New Cards
            <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
              {newCards.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="benefits" className="gap-2">
            <History className="h-4 w-4" />
            New Benefits
            <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-[10px] font-semibold text-primary">
              {benefitFeed.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards">
          {newCards.length === 0 ? (
            <EmptyState
              title="No new cards yet"
              copy="Nothing has launched in the last 45 days. Check back soon."
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {newCards.map((card) => (
                <div key={card.id} className="relative">
                  <span className="absolute -top-2 left-3 z-10 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-primary to-primary/70 px-2.5 py-0.5 text-[11px] font-semibold text-primary-foreground shadow">
                    <Sparkles className="h-3 w-3" />
                    {formatRelative(cardAddedAt(card), now)}
                  </span>
                  <CardTile card={card} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="benefits">
          {benefitFeed.length === 0 ? (
            <EmptyState
              title="No benefit changes yet"
              copy="When an issuer updates benefits on an existing card, it'll show up here."
            />
          ) : (
            <ol className="space-y-3">
              {benefitFeed.map(({ card, update }, i) => (
                <li
                  key={`${card.id}-${i}`}
                  className="group rounded-xl border bg-card p-4 transition-colors hover:bg-secondary/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{card.issuer}</span>
                        <span>·</span>
                        <span>{COUNTRY_LABEL[card.country]}</span>
                        <span>·</span>
                        <time dateTime={update.date}>{formatRelative(update.date, now)}</time>
                        {update.feature && (
                          <>
                            <span>·</span>
                            <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium">
                              {FEATURE_LABEL[update.feature]}
                            </span>
                          </>
                        )}
                      </div>
                      <p className="mt-1.5 font-medium leading-snug">{update.summary}</p>
                      <Link
                        to="/cards/$cardId"
                        params={{ cardId: card.id }}
                        className="mt-1 inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        {card.name}
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <div
                      className={`hidden h-14 w-24 shrink-0 rounded-md bg-gradient-to-br ${card.color} sm:block`}
                      aria-hidden
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-card/50 p-10 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{copy}</p>
    </div>
  );
}
