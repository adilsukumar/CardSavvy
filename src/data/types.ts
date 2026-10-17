export type Country =
  | "US"
  | "UK"
  | "EU"
  | "IN"
  | "CN"
  | "AE"
  | "SG"
  | "CA"
  | "AU"
  | "JP"
  | "Global";

export const COUNTRY_LABEL: Record<Country, string> = {
  US: "United States",
  UK: "United Kingdom",
  EU: "European Union",
  IN: "India",
  CN: "China",
  AE: "United Arab Emirates",
  SG: "Singapore",
  CA: "Canada",
  AU: "Australia",
  JP: "Japan",
  Global: "Global",
};

export type Network =
  | "Visa"
  | "Mastercard"
  | "Amex"
  | "Discover"
  | "UnionPay"
  | "JCB"
  | "RuPay"
  | "Diners Club"
  | "Store";

export type Category =
  | "travel"
  | "lounge"
  | "cashback"
  | "dining"
  | "fuel"
  | "online"
  | "groceries"
  | "no-annual-fee"
  | "beginner"
  | "luxury"
  | "fitness"
  | "shopping";

export const CATEGORY_LABEL: Record<Category, string> = {
  travel: "Travel",
  lounge: "Airport Lounge",
  cashback: "Cashback",
  dining: "Dining",
  fuel: "Fuel",
  online: "Online Shopping",
  groceries: "Groceries",
  "no-annual-fee": "No Annual Fee",
  beginner: "Beginner Friendly",
  luxury: "Luxury / Premium",
  fitness: "Fitness",
  shopping: "Shopping",
};

export type Feature =
  | "priority-pass"
  | "lounge-domestic"
  | "lounge-intl"
  | "no-fx-fee"
  | "travel-insurance"
  | "rental-insurance"
  | "concierge"
  | "golf"
  | "dining-discount"
  | "fuel-waiver"
  | "movie-tickets"
  | "hotel-status"
  | "transfer-partners"
  | "milestone-bonus"
  | "contactless"
  | "metal-card"
  | "welcome-bonus";

export const FEATURE_LABEL: Record<Feature, string> = {
  "priority-pass": "Priority Pass membership",
  "lounge-domestic": "Domestic lounge access",
  "lounge-intl": "International lounge access",
  "no-fx-fee": "No foreign-exchange fee",
  "travel-insurance": "Travel insurance",
  "rental-insurance": "Rental-car insurance",
  concierge: "24/7 concierge",
  golf: "Complimentary golf",
  "dining-discount": "Dining discounts",
  "fuel-waiver": "Fuel surcharge waiver",
  "movie-tickets": "Movie ticket benefits",
  "hotel-status": "Hotel elite status",
  "transfer-partners": "Airline/hotel transfer partners",
  "milestone-bonus": "Spend milestone bonus",
  contactless: "Contactless payments",
  "metal-card": "Premium metal card",
  "welcome-bonus": "Welcome bonus",
};

export interface BenefitUpdate {
  date: string; // ISO date the change went live
  summary: string; // short human-readable change ("Added Priority Pass")
  feature?: Feature; // optional structured tag
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  expiryDate?: string; // ISO date the offer expires
  type: "targeted" | "public";
  terms?: string;
}

export interface Card {
  id: string;
  name: string;
  issuer: string;
  network: Network;
  country: Country;
  annualFee: number;
  annualFeeCurrency: string;
  fxFee: number; // percentage
  rewardRate: string; // human description
  rewardRateBest: number; // best multiplier as number for scoring
  welcomeBonus: string;
  eligibility: string;
  features: Feature[];
  categories: Category[];
  description: string;
  applyUrl: string; // affiliate-friendly link
  editorPick?: Category[]; // hand-curated wins for these categories
  color: string; // tailwind gradient stops
  addedAt?: string; // ISO date the card was added to the catalogue
  benefitUpdates?: BenefitUpdate[]; // chronological log of benefit changes
  activeOffers?: Offer[]; // dynamic rotating merchant offers (e.g., Amex Offers)
}

// Default catalogue epoch for cards without an explicit addedAt.
export const CATALOGUE_EPOCH = "2024-01-01";

export function cardAddedAt(card: Card): string {
  return card.addedAt ?? CATALOGUE_EPOCH;
}

// "Recent" window for the New section (in days).
export const NEW_WINDOW_DAYS = 45;

export function isNewCard(card: Card, now: Date = new Date()): boolean {
  const added = new Date(cardAddedAt(card)).getTime();
  const age = now.getTime() - added;
  return Number.isFinite(age) && age >= 0 && age <= NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
}

export function recentBenefitUpdates(card: Card, now: Date = new Date()): BenefitUpdate[] {
  if (!card.benefitUpdates) return [];
  const cutoff = now.getTime() - NEW_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return card.benefitUpdates
    .filter((u) => new Date(u.date).getTime() >= cutoff)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
