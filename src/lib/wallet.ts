import { useEffect, useState, useCallback } from "react";
import { CARDS } from "@/data/cards";
import type { Card, Category, Feature } from "@/data/types";

function safeSetItem(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* Private-mode or full storage must not crash the page. */
  }
}

const STORAGE_KEY = "cco:wallet:v1";
const SPENDING_KEY = "cco:spending:v1";
const APPLICATIONS_KEY = "cco:applications:v1";
const BENEFIT_EXPIRY_KEY = "cco:benefit-expiry:v1";

function read(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value)
      ? [...new Set(value.filter((id): id is string => typeof id === "string"))]
      : [];
  } catch {
    return [];
  }
}

function write(ids: string[]) {
  if (typeof window === "undefined") return;
  safeSetItem(STORAGE_KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("cco:wallet-changed"));
}

export interface SpendingEntry {
  cardId: string;
  amount: number;
  currency: string;
  category: Category;
  date: string;
  merchant?: string;
}

export interface ApplicationEntry {
  cardId: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  submittedDate: string;
  decisionDate?: string;
  notes?: string;
}

export interface BenefitExpiry {
  cardId: string;
  benefitName: string;
  expiryDate: string;
  description: string;
}

function readSpending(): SpendingEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SPENDING_KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value)
      ? value.filter(
          (item): item is SpendingEntry =>
            typeof item === "object" && item !== null && typeof item.cardId === "string",
        )
      : [];
  } catch {
    return [];
  }
}

function writeSpending(entries: SpendingEntry[]) {
  if (typeof window === "undefined") return;
  safeSetItem(SPENDING_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent("cco:spending-changed"));
}

function readApplications(): ApplicationEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(APPLICATIONS_KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value)
      ? value.filter(
          (item): item is ApplicationEntry =>
            typeof item === "object" && item !== null && typeof item.cardId === "string",
        )
      : [];
  } catch {
    return [];
  }
}

function writeApplications(entries: ApplicationEntry[]) {
  if (typeof window === "undefined") return;
  safeSetItem(APPLICATIONS_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent("cco:applications-changed"));
}

function readBenefitExpiry(): BenefitExpiry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BENEFIT_EXPIRY_KEY);
    const value: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(value)
      ? value.filter(
          (item): item is BenefitExpiry =>
            typeof item === "object" && item !== null && typeof item.cardId === "string",
        )
      : [];
  } catch {
    return [];
  }
}

function writeBenefitExpiry(entries: BenefitExpiry[]) {
  if (typeof window === "undefined") return;
  safeSetItem(BENEFIT_EXPIRY_KEY, JSON.stringify(entries));
  window.dispatchEvent(new CustomEvent("cco:benefit-expiry-changed"));
}

export function useWallet() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    setIds(read());
    const onChange = () => setIds(read());
    window.addEventListener("cco:wallet-changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("cco:wallet-changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const add = useCallback((id: string) => {
    const next = Array.from(new Set([...read(), id]));
    write(next);
  }, []);

  const remove = useCallback((id: string) => {
    write(read().filter((x) => x !== id));
  }, []);

  const toggle = useCallback((id: string) => {
    const current = read();
    if (current.includes(id)) write(current.filter((x) => x !== id));
    else write([...current, id]);
  }, []);

  const cards = ids
    .map((id: string) => CARDS.find((c) => c.id === id))
    .filter((c): c is Card => Boolean(c));

  return { ids, cards, add, remove, toggle, has: (id: string) => ids.includes(id) };
}

export function useSpending() {
  const [entries, setEntries] = useState<SpendingEntry[]>([]);

  useEffect(() => {
    setEntries(readSpending());
    const onChange = () => setEntries(readSpending());
    window.addEventListener("cco:spending-changed", onChange);
    return () => window.removeEventListener("cco:spending-changed", onChange);
  }, []);

  const addEntry = useCallback((entry: SpendingEntry) => {
    const next = [...readSpending(), entry];
    writeSpending(next);
  }, []);

  const removeEntry = useCallback((index: number) => {
    const next = readSpending().filter((_, i) => i !== index);
    writeSpending(next);
  }, []);

  const clearAll = useCallback(() => {
    writeSpending([]);
  }, []);

  return { entries, addEntry, removeEntry, clearAll };
}

export function useApplications() {
  const [entries, setEntries] = useState<ApplicationEntry[]>([]);

  useEffect(() => {
    setEntries(readApplications());
    const onChange = () => setEntries(readApplications());
    window.addEventListener("cco:applications-changed", onChange);
    return () => window.removeEventListener("cco:applications-changed", onChange);
  }, []);

  const addApplication = useCallback((entry: ApplicationEntry) => {
    const next = [...readApplications(), entry];
    writeApplications(next);
  }, []);

  const updateApplication = useCallback((index: number, updates: Partial<ApplicationEntry>) => {
    const next = readApplications().map((e, i) => (i === index ? { ...e, ...updates } : e));
    writeApplications(next);
  }, []);

  const removeApplication = useCallback((index: number) => {
    const next = readApplications().filter((_, i) => i !== index);
    writeApplications(next);
  }, []);

  return { entries, addApplication, updateApplication, removeApplication };
}

export function useBenefitExpiry() {
  const [entries, setEntries] = useState<BenefitExpiry[]>([]);

  useEffect(() => {
    setEntries(readBenefitExpiry());
    const onChange = () => setEntries(readBenefitExpiry());
    window.addEventListener("cco:benefit-expiry-changed", onChange);
    return () => window.removeEventListener("cco:benefit-expiry-changed", onChange);
  }, []);

  const addExpiry = useCallback((entry: BenefitExpiry) => {
    const next = [...readBenefitExpiry(), entry];
    writeBenefitExpiry(next);
  }, []);

  const updateExpiry = useCallback((index: number, updates: Partial<BenefitExpiry>) => {
    const next = readBenefitExpiry().map((e, i) => (i === index ? { ...e, ...updates } : e));
    writeBenefitExpiry(next);
  }, []);

  const removeExpiry = useCallback((index: number) => {
    const next = readBenefitExpiry().filter((_, i) => i !== index);
    writeBenefitExpiry(next);
  }, []);

  const expiringSoon = useCallback((days: number = 30) => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    return readBenefitExpiry().filter((e) => new Date(e.expiryDate) <= cutoff);
  }, []);

  return { entries, addExpiry, updateExpiry, removeExpiry, expiringSoon };
}

/** Features the user already has covered across all wallet cards. */
export function coveredFeatures(walletCards: Card[]): Set<Feature> {
  return new Set(walletCards.flatMap((c) => c.features));
}

/** Suggest cards that add the most NEW features to the wallet. */
export function gapSuggestions(walletCards: Card[], allCards: Card[], limit = 4) {
  const owned = new Set(walletCards.map((c) => c.id));
  const covered = coveredFeatures(walletCards);
  return allCards
    .filter((c) => !owned.has(c.id))
    .map((c) => {
      const newFeatures = c.features.filter((f) => !covered.has(f));
      return { card: c, newFeatures };
    })
    .filter((x) => x.newFeatures.length > 0)
    .sort((a, b) => b.newFeatures.length - a.newFeatures.length)
    .slice(0, limit);
}

/** Pick the best card from the user's wallet for a given category. */
export function bestForCategory(walletCards: Card[], category: Category): Card | null {
  if (walletCards.length === 0) return null;
  const matches = walletCards.filter((c) => c.categories.includes(category));
  const pool = matches.length > 0 ? matches : walletCards;
  return [...pool].sort((a, b) => b.rewardRateBest - a.rewardRateBest)[0] ?? null;
}

/** Calculate spending analytics by category */
export function spendingAnalytics(entries: SpendingEntry[]) {
  const byCategory: Record<Category, number> = {} as Record<Category, number>;
  const byCard: Record<string, number> = {};
  let total = 0;

  entries.forEach((e) => {
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    byCard[e.cardId] = (byCard[e.cardId] || 0) + e.amount;
    total += e.amount;
  });

  return { byCategory, byCard, total };
}

/** Get spending optimization recommendations */
export function spendingRecommendations(
  walletCards: Card[],
  spendingEntries: SpendingEntry[],
  allCards: Card[],
) {
  const analytics = spendingAnalytics(spendingEntries);
  const recommendations: { card: Card; reason: string; potentialSavings: number }[] = [];

  // Find categories with high spending but no optimal card
  Object.entries(analytics.byCategory).forEach(([category, amount]) => {
    const bestWalletCard = bestForCategory(walletCards, category as Category);
    const bestOverallCard = allCards
      .filter((c) => c.categories.includes(category as Category))
      .sort((a, b) => b.rewardRateBest - a.rewardRateBest)[0];

    if (
      bestOverallCard &&
      (!bestWalletCard || bestWalletCard.rewardRateBest < bestOverallCard.rewardRateBest)
    ) {
      const currentRate = bestWalletCard?.rewardRateBest || 1;
      const potentialSavings = amount * ((bestOverallCard.rewardRateBest - currentRate) / 100);
      if (potentialSavings > 10) {
        recommendations.push({
          card: bestOverallCard,
          reason: `Higher reward rate for ${category} spending`,
          potentialSavings,
        });
      }
    }
  });

  return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings).slice(0, 5);
}
