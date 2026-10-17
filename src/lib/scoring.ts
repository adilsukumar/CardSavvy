import type { Card, Category } from "@/data/types";

// Weights for premium features when computing the optimizer score.
const FEATURE_WEIGHTS: Record<string, number> = {
  "priority-pass": 8,
  "lounge-intl": 7,
  "lounge-domestic": 4,
  "no-fx-fee": 6,
  "travel-insurance": 4,
  "rental-insurance": 3,
  concierge: 3,
  golf: 3,
  "dining-discount": 2,
  "fuel-waiver": 2,
  "movie-tickets": 2,
  "hotel-status": 5,
  "transfer-partners": 5,
  "milestone-bonus": 3,
  contactless: 0.5,
  "metal-card": 1,
  "welcome-bonus": 2,
};

// Category-specific weights bias the score for leaderboard rankings.
const CATEGORY_WEIGHTS: Partial<Record<Category, Record<string, number>>> = {
  travel: { "no-fx-fee": 10, "transfer-partners": 8, "travel-insurance": 6, "lounge-intl": 6 },
  lounge: { "priority-pass": 12, "lounge-intl": 10, "lounge-domestic": 6 },
  cashback: {},
  dining: { "dining-discount": 8 },
  fuel: { "fuel-waiver": 10 },
  online: {},
  groceries: {},
  "no-annual-fee": {},
  beginner: { "welcome-bonus": 4 },
  luxury: { "metal-card": 4, concierge: 5, "hotel-status": 6, "priority-pass": 4 },
};

// Value multipliers for different currencies (normalized to USD)
const CURRENCY_MULTIPLIERS: Record<string, number> = {
  USD: 1,
  EUR: 1.1,
  GBP: 1.25,
  CAD: 0.75,
  AUD: 0.65,
  SGD: 0.75,
  JPY: 0.0065,
  INR: 0.012,
  AED: 0.27,
  CNY: 0.14,
};

/** Automated score derived purely from card data. 0–100. */
export function automatedScore(card: Card, category?: Category): number {
  const featureWeights = {
    ...FEATURE_WEIGHTS,
    ...(category ? (CATEGORY_WEIGHTS[category] ?? {}) : {}),
  };
  const featureScore = [...new Set(card.features)].reduce(
    (sum, f) => sum + (featureWeights[f] ?? 0),
    0,
  );

  const rewardBonus = Math.min(card.rewardRateBest * 3, 20);

  // Fee efficiency: lower fee relative to benefits is better.
  const currencyMultiplier = CURRENCY_MULTIPLIERS[card.annualFeeCurrency] || 1;
  const feeInUSD = card.annualFee * currencyMultiplier;
  const feeNorm = feeInUSD / 100;
  const feePenalty = Math.max(0, feeNorm - featureScore * 0.4) * 0.5;

  // No-FX-fee is critical for travel
  const fxBonus = card.fxFee === 0 ? 4 : 0;

  // Category-specific bonus for cashback rate
  let categoryBonus = 0;
  if (
    category === "cashback" ||
    category === "online" ||
    category === "groceries" ||
    category === "fuel"
  ) {
    categoryBonus = Math.min(card.rewardRateBest * 2, 15);
  }
  if (category === "no-annual-fee" && card.annualFee === 0) categoryBonus += 25;
  if (category === "beginner" && feeInUSD < 100) categoryBonus += 10;

  // Bonus for welcome bonus value (normalized)
  const welcomeBonusValue = parseWelcomeBonus(card.welcomeBonus);
  const welcomeBonusScore = Math.min(welcomeBonusValue * 0.01, 5);

  // Combo bonus for having multiple premium features
  const premiumFeatureCount = card.features.filter((f) =>
    ["priority-pass", "lounge-intl", "hotel-status", "transfer-partners"].includes(f),
  ).length;
  const comboBonus = premiumFeatureCount >= 2 ? 5 : 0;

  const raw =
    featureScore +
    rewardBonus +
    fxBonus +
    categoryBonus -
    feePenalty +
    welcomeBonusScore +
    comboBonus;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Parse welcome bonus string to estimate value in USD */
function parseWelcomeBonus(bonus: string): number {
  if (!bonus) return 0;

  // Extract numbers from bonus string
  const numbers = bonus.match(/[\d,]+/g);
  if (!numbers) return 0;

  const value = parseInt(numbers[0].replace(/,/g, ""), 10);

  // Check if it's points/miles (multiply by 0.01 as rough estimate)
  if (bonus.toLowerCase().includes("point") || bonus.toLowerCase().includes("mile")) {
    return value * 0.01;
  }

  // Check if it's currency
  if (
    bonus.toLowerCase().includes("$") ||
    bonus.toLowerCase().includes("credit") ||
    bonus.toLowerCase().includes("cashback")
  ) {
    return value;
  }

  return value * 0.01; // Default to treating as points
}

/** Editor's-pick bonus to combine with automated score. */
export function editorBonus(card: Card, category?: Category): number {
  if (!category) {
    return card.editorPick && card.editorPick.length > 0 ? 5 : 0;
  }
  return card.editorPick?.includes(category) ? 15 : 0;
}

/** Final optimizer score = automated + editor's pick. */
export function optimizerScore(card: Card, category?: Category): number {
  return Math.min(100, automatedScore(card, category) + editorBonus(card, category));
}

export function rankCards(cards: Card[], category?: Category): Card[] {
  // Use Schwartzian transform to avoid computing the score 2N log N times
  const scored = cards.map((card) => ({
    card,
    score: optimizerScore(card, category),
  }));
  return scored.sort((a, b) => b.score - a.score).map((s) => s.card);
}

export function scoreBreakdown(card: Card, category?: Category) {
  return {
    automated: automatedScore(card, category),
    editor: editorBonus(card, category),
    total: optimizerScore(card, category),
  };
}

/** Get top cards by category with scores */
export function topCardsByCategory(
  cards: Card[],
  category: Category,
  limit: number = 5,
): Array<{ card: Card; score: number }> {
  return rankCards(cards, category)
    .slice(0, limit)
    .map((card) => ({ card, score: optimizerScore(card, category) }));
}

/** Compare two cards and return the better one for a given category */
export function compareCards(
  card1: Card,
  card2: Card,
  category?: Category,
): { winner: Card; loser: Card; margin: number } {
  const score1 = optimizerScore(card1, category);
  const score2 = optimizerScore(card2, category);

  if (score1 >= score2) {
    return { winner: card1, loser: card2, margin: score1 - score2 };
  } else {
    return { winner: card2, loser: card1, margin: score2 - score1 };
  }
}
