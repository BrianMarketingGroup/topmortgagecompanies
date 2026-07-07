export const PRICING = {
  basicPerCity: 289,
  additionalProduct: 89,
  featuredFirstCity: 689,
  featuredAdditionalCity: 345, // 50% off $689
} as const;

export interface QuoteInput {
  loanProducts: string[];
  cities: { city: string; state: string }[];
  featured: boolean;
  excludedFeatured: string[];
}

export interface QuoteLineItem {
  label: string;
  amount: number;
}

export interface Quote {
  lineItems: QuoteLineItem[];
  total: number;
}

export function calculateQuote({ loanProducts, cities, featured, excludedFeatured }: QuoteInput): Quote {
  const lineItems: QuoteLineItem[] = [];
  const productCount = loanProducts.length;
  const cityCount = Math.max(1, cities.length);

  if (productCount >= 1) {
    lineItems.push({
      label: `${productCount} loan product${productCount > 1 ? "s" : ""} × ${cityCount} cit${cityCount > 1 ? "ies" : "y"}`,
      amount: PRICING.basicPerCity * productCount * cityCount,
    });
  }

  if (featured) {
    let firstIncluded = true;
    let includedCount = 0;
    let featuredTotal = 0;

    for (const loc of cities) {
      for (const product of loanProducts) {
        const key = `${loc.city}|${product}`;
        if (!excludedFeatured.includes(key)) {
          includedCount++;
          featuredTotal += firstIncluded ? PRICING.featuredFirstCity : PRICING.featuredAdditionalCity;
          firstIncluded = false;
        }
      }
    }

    if (includedCount > 0) {
      lineItems.push({
        label: `Featured Placement (${includedCount} slot${includedCount > 1 ? "s" : ""})`,
        amount: featuredTotal,
      });
    }
  }

  const total = lineItems.reduce((sum, item) => sum + item.amount, 0);
  return { lineItems, total };
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Featured Placement here is sold per (city, loan product) pair. Given the
 * checkout wizard's per-market `featuredAreaIds` selections, compute the
 * `excludedFeatured` key list (`${city}|${productLabel}`) that
 * calculateQuote() and the BFF payload both expect — every combination NOT
 * selected as featured. Shared by OrderSummarySidebar and lib/submission.ts
 * so the two never drift out of sync.
 */
export function computeExcludedFeatured(
  selectedMarkets: { city: string; state: string; featuredAreaIds: string[] }[],
  productOptions: { id: string; label: string }[],
  specialtyIds: string[],
): string[] {
  const excluded: string[] = [];
  for (const market of selectedMarkets) {
    for (const productId of specialtyIds) {
      const product = productOptions.find((o) => o.id === productId);
      if (!product) continue;
      if (!market.featuredAreaIds.includes(productId)) {
        excluded.push(`${market.city}|${product.label}`);
      }
    }
  }
  return excluded;
}
