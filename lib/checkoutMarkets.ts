import { citiesByState } from "@/content/cities";
import { US_STATES } from "@/content/states";

export interface Market {
  id: string;
  city: string;
  state: string;
}

export interface SelectedMarket {
  marketId: string;
  city: string;
  state: string;
  // Featured Placement is sold per (city, loan product) here, not per city —
  // holds the set of loan-product ids the user wants Featured for in this city.
  featuredAreaIds: string[];
}

export const ALL_MARKETS: Market[] = Object.entries(citiesByState).flatMap(([state, cities]) =>
  cities.map((city) => ({ id: `${state}::${city}`, city, state })),
);

export function getMarketById(id: string): Market | undefined {
  return ALL_MARKETS.find((m) => m.id === id);
}

// No population data exists for this site, so there's no real "popular
// cities" signal — callers must treat this as "feature unavailable".
export function getPopularMarkets(): Market[] {
  return [];
}

// No lat/lng or population, so no real "nearby" signal either.
export function getNearbyMarkets(_market: Market): Market[] {
  return [];
}

export function searchMarkets(query: string): Market[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_MARKETS.filter(
    (m) => m.city.toLowerCase().includes(q) || `${m.city}, ${m.state}`.toLowerCase().includes(q),
  ).slice(0, 30);
}

export const ALL_STATES: string[] = Array.from(new Set(US_STATES.map((s) => s.abbr))).sort();
