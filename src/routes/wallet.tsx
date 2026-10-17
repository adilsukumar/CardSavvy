import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CARDS } from "@/data/cards";
import { CATEGORY_LABEL, FEATURE_LABEL } from "@/data/types";
import type { Category } from "@/data/types";
import {
  useWallet,
  useSpending,
  useApplications,
  useBenefitExpiry,
  gapSuggestions,
  bestForCategory,
  coveredFeatures,
  spendingAnalytics,
  spendingRecommendations,
} from "@/lib/wallet";
import { CardTile } from "@/components/card-tile";
import { AiPredictor } from "@/components/wallet/ai-predictor";
import {
  Wallet as WalletIcon,
  Sparkles,
  X,
  ExternalLink,
  Plus,
  TrendingUp,
  Calendar,
  AlertCircle,
  BarChart3,
  PlusCircle,
  BrainCircuit,
} from "lucide-react";

export const Route = createFileRoute("/wallet")({
  head: () => ({
    meta: [
      { title: "My Wallet — CardSavvy" },
      {
        name: "description",
        content:
          "Track the credit cards you own, see your benefit coverage and get personalized recommendations.",
      },
    ],
  }),
  component: WalletPage,
});

const SPEND_CATEGORIES: Category[] = [
  "travel",
  "lounge",
  "dining",
  "fuel",
  "online",
  "groceries",
  "cashback",
];

function WalletPage() {
  const wallet = useWallet();
  const spending = useSpending();
  const applications = useApplications();
  const benefitExpiry = useBenefitExpiry();
  const [picker, setPicker] = useState(false);
  const [spendCategory, setSpendCategory] = useState<Category>("dining");
  const [activeTab, setActiveTab] = useState<
    "overview" | "spending" | "applications" | "benefits" | "ai"
  >("overview");

  const covered = coveredFeatures(wallet.cards);
  const suggestions = gapSuggestions(wallet.cards, CARDS, 4);
  const best = bestForCategory(wallet.cards, spendCategory);
  const analytics = spendingAnalytics(spending.entries);
  const recommendations = spendingRecommendations(wallet.cards, spending.entries, CARDS);
  const expiringBenefits = benefitExpiry.expiringSoon(30);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My wallet</h1>
          <p className="mt-1 text-muted-foreground">
            {wallet.cards.length === 0
              ? "Add the cards you own to unlock recommendations."
              : `${wallet.cards.length} card${wallet.cards.length === 1 ? "" : "s"} tracked. Stored locally on your device.`}
          </p>
        </div>
        <button
          onClick={() => setPicker(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Add card
        </button>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "overview"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab("spending")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "spending"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="inline h-4 w-4 mr-1" /> Spending
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "applications"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="inline h-4 w-4 mr-1" /> Applications
        </button>
        <button
          onClick={() => setActiveTab("benefits")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "benefits"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <AlertCircle className="inline h-4 w-4 mr-1" /> Benefits
        </button>
        <button
          onClick={() => setActiveTab("ai")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "ai"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BrainCircuit className="inline h-4 w-4 mr-1" /> AI Predictor
        </button>
      </div>

      {wallet.cards.length === 0 ? (
        <div className="mt-10 rounded-2xl border bg-card p-12 text-center">
          <WalletIcon className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-4 font-semibold">Your wallet is empty</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse cards and tap "Wallet" to start tracking.
          </p>
          <Link
            to="/cards"
            className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Browse cards
          </Link>
        </div>
      ) : (
        <>
          {activeTab === "overview" && (
            <>
              {/* Cards */}
              <section className="mt-8">
                <h2 className="text-xl font-semibold">Your cards</h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {wallet.cards.map((c) => (
                    <CardTile key={c.id} card={c} />
                  ))}
                </div>
              </section>

              {/* Which card to use */}
              <section className="mt-12 rounded-2xl border bg-gradient-to-br from-primary/10 to-accent/10 p-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" /> Which card should I use?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick a spend category and we'll point you at the best card in your wallet.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {SPEND_CATEGORIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSpendCategory(c)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                        spendCategory === c
                          ? "bg-primary text-primary-foreground"
                          : "bg-card hover:bg-secondary"
                      }`}
                    >
                      {CATEGORY_LABEL[c]}
                    </button>
                  ))}
                </div>

                {best ? (
                  <div className="mt-5 rounded-xl border bg-card p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Best for {CATEGORY_LABEL[spendCategory]}
                    </p>
                    <Link
                      to="/cards/$cardId"
                      params={{ cardId: best.id }}
                      className="mt-1 block text-xl font-semibold hover:underline"
                    >
                      {best.name}
                    </Link>
                    <p className="mt-1 text-sm text-muted-foreground">{best.rewardRate}</p>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-muted-foreground">
                    No matching card — try adding one.
                  </p>
                )}
              </section>

              {/* Benefit coverage */}
              <section className="mt-12">
                <h2 className="text-xl font-semibold">Benefit coverage</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {covered.size} unique benefits across your wallet.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.keys(FEATURE_LABEL).map((f) => {
                    const has = covered.has(f as keyof typeof FEATURE_LABEL);
                    return (
                      <span
                        key={f}
                        className={`rounded-md border px-2 py-1 text-xs ${
                          has
                            ? "border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                            : "bg-secondary/50 text-muted-foreground"
                        }`}
                      >
                        {has ? "✓ " : "  "}
                        {FEATURE_LABEL[f as keyof typeof FEATURE_LABEL]}
                      </span>
                    );
                  })}
                </div>
              </section>

              {/* Gap suggestions */}
              {suggestions.length > 0 && (
                <section className="mt-12">
                  <h2 className="text-xl font-semibold">Cards that fill the most gaps</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ranked by how many new benefits they'd add to your wallet.
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {suggestions.map(({ card, newFeatures }) => (
                      <div key={card.id} className="rounded-xl border bg-card p-4">
                        <Link
                          to="/cards/$cardId"
                          params={{ cardId: card.id }}
                          className="font-semibold hover:underline"
                        >
                          {card.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{card.issuer}</p>
                        <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                          +{newFeatures.length} new benefit{newFeatures.length === 1 ? "" : "s"}
                        </p>
                        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
                          {newFeatures.slice(0, 4).map((f) => (
                            <li key={f}>• {FEATURE_LABEL[f]}</li>
                          ))}
                        </ul>
                        <a
                          href={card.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Apply <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          {activeTab === "spending" && (
            <>
              <section className="mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Spending Analytics</h2>
                  <button
                    onClick={() => spending.clearAll()}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Clear all data
                  </button>
                </div>

                {spending.entries.length === 0 ? (
                  <div className="mt-6 rounded-xl border bg-card p-8 text-center">
                    <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-4 font-semibold">No spending data yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Track your spending to get optimization recommendations.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mt-6 grid gap-4 sm:grid-cols-3">
                      <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Total Spending</p>
                        <p className="mt-2 text-2xl font-bold">${analytics.total.toFixed(2)}</p>
                      </div>
                      <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Transactions</p>
                        <p className="mt-2 text-2xl font-bold">{spending.entries.length}</p>
                      </div>
                      <div className="rounded-xl border bg-card p-4">
                        <p className="text-sm text-muted-foreground">Categories</p>
                        <p className="mt-2 text-2xl font-bold">
                          {Object.keys(analytics.byCategory).length}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-xl border bg-card p-6">
                      <h3 className="font-semibold">Spending by Category</h3>
                      <div className="mt-4 space-y-3">
                        {Object.entries(analytics.byCategory).map(([category, amount]) => (
                          <div key={category} className="flex items-center justify-between">
                            <span className="text-sm">{CATEGORY_LABEL[category as Category]}</span>
                            <span className="font-semibold">${amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {recommendations.length > 0 && (
                      <div className="mt-6 rounded-xl border bg-gradient-to-br from-primary/10 to-accent/10 p-6">
                        <h3 className="font-semibold flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" /> Optimization
                          Recommendations
                        </h3>
                        <div className="mt-4 space-y-3">
                          {recommendations.map((rec) => (
                            <div key={rec.card.id} className="rounded-lg border bg-card p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <Link
                                    to="/cards/$cardId"
                                    params={{ cardId: rec.card.id }}
                                    className="font-semibold hover:underline"
                                  >
                                    {rec.card.name}
                                  </Link>
                                  <p className="text-sm text-muted-foreground">{rec.reason}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                    +${rec.potentialSavings.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">potential savings</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>
            </>
          )}

          {activeTab === "applications" && (
            <>
              <section className="mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Application Tracking</h2>
                  <button
                    onClick={() => {
                      const cardId = prompt("Enter card ID:");
                      if (cardId) {
                        applications.addApplication({
                          cardId,
                          status: "pending",
                          submittedDate: new Date().toISOString(),
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    <PlusCircle className="h-4 w-4" /> Track Application
                  </button>
                </div>

                {applications.entries.length === 0 ? (
                  <div className="mt-6 rounded-xl border bg-card p-8 text-center">
                    <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-4 font-semibold">No applications tracked</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Track your credit card applications to monitor status.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {applications.entries.map((app, index) => {
                      const card = CARDS.find((c) => c.id === app.cardId);
                      return (
                        <div key={index} className="rounded-xl border bg-card p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{card?.name || app.cardId}</p>
                              <p className="text-sm text-muted-foreground">
                                Submitted: {new Date(app.submittedDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  app.status === "approved"
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                    : app.status === "rejected"
                                      ? "bg-red-500/10 text-red-700 dark:text-red-300"
                                      : app.status === "cancelled"
                                        ? "bg-gray-500/10 text-gray-700 dark:text-gray-300"
                                        : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-300"
                                }`}
                              >
                                {app.status}
                              </span>
                              <select
                                value={app.status}
                                onChange={(e) =>
                                  applications.updateApplication(index, {
                                    status: e.target.value as any,
                                  })
                                }
                                className="rounded border bg-background px-2 py-1 text-sm"
                              >
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                              <button
                                onClick={() => applications.removeApplication(index)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === "benefits" && (
            <>
              <section className="mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Benefit Expiration Tracking</h2>
                  <button
                    onClick={() => {
                      const cardId = prompt("Enter card ID:");
                      const benefitName = prompt("Enter benefit name:");
                      const expiryDate = prompt("Enter expiry date (YYYY-MM-DD):");
                      const description = prompt("Enter description:");
                      if (cardId && benefitName && expiryDate) {
                        benefitExpiry.addExpiry({
                          cardId,
                          benefitName,
                          expiryDate,
                          description: description || "",
                        });
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                  >
                    <PlusCircle className="h-4 w-4" /> Add Expiry
                  </button>
                </div>

                {expiringBenefits.length > 0 && (
                  <div className="mt-6 rounded-xl border bg-gradient-to-br from-red-500/10 to-orange-500/10 p-6">
                    <h3 className="font-semibold flex items-center gap-2 text-red-700 dark:text-red-300">
                      <AlertCircle className="h-5 w-5" /> Expiring Soon (30 days)
                    </h3>
                    <div className="mt-4 space-y-3">
                      {expiringBenefits.map((benefit, index) => {
                        const card = CARDS.find((c) => c.id === benefit.cardId);
                        return (
                          <div key={index} className="rounded-lg border bg-card p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{benefit.benefitName}</p>
                                <p className="text-sm text-muted-foreground">
                                  {card?.name || benefit.cardId}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {benefit.description}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-red-600 dark:text-red-400">
                                  {new Date(benefit.expiryDate).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {Math.ceil(
                                    (new Date(benefit.expiryDate).getTime() - Date.now()) /
                                      (1000 * 60 * 60 * 24),
                                  )}{" "}
                                  days left
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {benefitExpiry.entries.length === 0 ? (
                  <div className="mt-6 rounded-xl border bg-card p-8 text-center">
                    <AlertCircle className="mx-auto h-10 w-10 text-muted-foreground" />
                    <p className="mt-4 font-semibold">No benefits tracked</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Track benefit expirations to never miss out on perks.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 space-y-3">
                    {benefitExpiry.entries.map((benefit, index) => {
                      const card = CARDS.find((c) => c.id === benefit.cardId);
                      return (
                        <div key={index} className="rounded-xl border bg-card p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{benefit.benefitName}</p>
                              <p className="text-sm text-muted-foreground">
                                {card?.name || benefit.cardId}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {benefit.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-semibold">
                                  {new Date(benefit.expiryDate).toLocaleDateString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {Math.ceil(
                                    (new Date(benefit.expiryDate).getTime() - Date.now()) /
                                      (1000 * 60 * 60 * 24),
                                  )}{" "}
                                  days left
                                </p>
                              </div>
                              <button
                                onClick={() => benefitExpiry.removeExpiry(index)}
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          )}

          {activeTab === "ai" && <AiPredictor walletCards={wallet.cards} />}
        </>
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
              <h2 className="text-lg font-semibold">Add a card to your wallet</h2>
              <button
                onClick={() => setPicker(false)}
                className="rounded-md p-1 hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-1">
              {CARDS.filter((c) => !wallet.has(c.id)).map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => {
                      wallet.add(c.id);
                      setPicker(false);
                    }}
                    className="flex w-full items-center justify-between rounded-md p-2 text-left hover:bg-secondary"
                  >
                    <span>
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{c.issuer}</span>
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
