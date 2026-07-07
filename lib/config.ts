/**
 * SiteConfig drives the checkout wizard (components/checkout/**) — every
 * screen reads behavior off this instead of hardcoding vertical-specific
 * logic, so the same wizard code can be reused across other BMG directory
 * sites later.
 */

import { loanProducts } from "@/content/loanProducts";

export type MarketType =
  | "city"
  | "zip"
  | "county"
  | "airport"
  | "specialty"
  | "practiceArea"
  | "state";

export type SearchMode =
  | "state+city"
  | "zip"
  | "county"
  | "airport"
  | "specialty"
  | "practiceArea";

export interface ListingTier {
  id: string;
  label: string;
  isPaid: boolean;
  basePrice: number;
}

export type UpsellKind = "extra-year" | "extra-city" | "statewide" | "nationwide" | "sister-site";

export interface UpsellOption {
  id: string;
  label: string;
  description: string;
  price: number;
  kind: UpsellKind;
}

export interface SpecialtyOption {
  id: string;
  label: string;
}

export interface SiteConfig {
  siteName: string;
  brandTagline: string;
  businessNoun: string;

  marketType: MarketType;
  marketLabel: string;
  searchMode: SearchMode;

  listingTier: ListingTier;
  featuredScope: "city" | "city_and_specialty" | "specialty_only";
  // Cosmetic "starting at" display value only — the real per-slot price
  // (first slot vs. additional slots) is computed by lib/pricing.ts's
  // calculateQuote(), not this flat config value.
  featuredUpgradePrice: number;
  upsells: UpsellOption[];

  specialty: {
    required: boolean;
    label: string;
    options: SpecialtyOption[];
    pricePerOption: number;
  } | null;

  shippingRequired: boolean;

  listingFields: {
    peopleLabel: string;
    bioMaxChars: number;
    fileUploadTypes: Array<"logo" | "profilePhoto" | "bannerImage">;
  };

  emailTemplates: {
    completeLaterChecklist: string;
    ccAddress: string;
  };

  multiMarketDiscount: {
    minMarkets: number;
    percentOff: number;
  };

  productionTimelineDays: number;
}

export const topMortgageConfig: SiteConfig = {
  siteName: "Top Mortgage Companies",
  brandTagline: "Get Listed — Top Mortgage Companies",
  businessNoun: "mortgage company",

  marketType: "city",
  marketLabel: "City",
  searchMode: "state+city",

  listingTier: {
    id: "standard",
    label: "Standard Listing",
    isPaid: true,
    basePrice: 289,
  },
  // Sold per (city, loan product) pair, matching this site's own pricing
  // model where Featured Placement is available for each loan product a
  // company wants to be the top result for in a given city.
  featuredScope: "city_and_specialty",
  featuredUpgradePrice: 689,

  upsells: [],

  specialty: {
    required: true,
    label: "Loan Product",
    options: loanProducts.map((p) => ({ id: p.id, label: p.label })),
    pricePerOption: 89,
  },

  shippingRequired: true,

  listingFields: {
    peopleLabel: "Loan Officer(s)",
    bioMaxChars: 1500,
    fileUploadTypes: ["logo", "profilePhoto", "bannerImage"],
  },

  emailTemplates: {
    completeLaterChecklist: "complete-later-checklist-v1",
    ccAddress: "support@digitalservicebrands.com",
  },

  // No multi-city discount offered today — set minMarkets unreachably high
  // rather than deleting the field (required by SiteConfig).
  multiMarketDiscount: {
    minMarkets: 999999,
    percentOff: 0,
  },

  productionTimelineDays: 10,
};
