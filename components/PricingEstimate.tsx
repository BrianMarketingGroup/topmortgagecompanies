import { calculateQuote, formatCurrency, PRICING } from "@/lib/pricing";

interface PricingEstimateProps {
  cities: { city: string; state: string }[];
  // Optional: this legacy component (used only by the retired single-page
  // ApplyForm, no longer rendered from any page — superseded by the
  // checkout wizard) predates lib/pricing.ts's per-loan-product pricing
  // model and never collected this itself. Defaults to empty so its quote
  // omits the per-product line item rather than passing a required field.
  loanProducts?: string[];
  featured: boolean;
  excludedFeatured: string[];
  takenSlots: string[];
  onToggleFeatured: (key: string) => void;
}

export default function PricingEstimate({
  cities,
  loanProducts = [],
  featured,
  excludedFeatured = [],
  takenSlots = [],
  onToggleFeatured,
}: PricingEstimateProps) {
  const validCities = cities.filter((l) => l.city && l.state);
  const { lineItems, total } = calculateQuote({
    loanProducts,
    cities: validCities,
    featured,
    excludedFeatured: [...new Set([...excludedFeatured, ...takenSlots])],
  });

  const featuredGrid =
    featured && validCities.length > 0
      ? validCities.map((loc) => ({
          key: `${loc.city}|${loc.state}`,
          label: `${loc.city}, ${loc.state}`,
          taken: takenSlots.includes(`${loc.city}|${loc.state}`),
          excluded: excludedFeatured.includes(`${loc.city}|${loc.state}`),
        }))
      : [];

  const hasTaken = featuredGrid.some((r) => r.taken);

  return (
    <div className="rounded-xl border border-teal/30 bg-navy/5 p-5 space-y-4">
      <p className="text-xs font-semibold text-navy uppercase tracking-widest">
        Estimated Quote
      </p>

      {lineItems.length > 0 && (
        <div className="space-y-2">
          {lineItems.map((item) => (
            <div key={item.label} className="flex justify-between items-center text-sm">
              <span className="text-muted">{item.label}</span>
              <span className="font-medium text-navy">{formatCurrency(item.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {featuredGrid.length > 0 && (
        <div className="border-t border-teal/20 pt-4 space-y-2">
          <p className="text-xs font-semibold text-navy">
            Featured Listing — {formatCurrency(PRICING.featuredFirstCity)} first city / {formatCurrency(PRICING.featuredAdditionalCity)} additional
          </p>
          <p className="text-xs text-muted">Uncheck any cities you don&apos;t want featured.</p>
          <div className="space-y-1.5">
            {featuredGrid.map((row) => (
              <label
                key={row.key}
                className={`flex items-center gap-2.5 text-sm cursor-pointer rounded-lg px-3 py-2 transition-colors ${
                  row.taken
                    ? "opacity-50 cursor-not-allowed bg-red-50"
                    : row.excluded
                    ? "text-muted"
                    : "text-navy hover:bg-teal/5"
                }`}
              >
                <input
                  type="checkbox"
                  checked={!row.excluded && !row.taken}
                  disabled={row.taken}
                  onChange={() => !row.taken && onToggleFeatured(row.key)}
                  className="h-4 w-4 rounded accent-teal flex-shrink-0"
                />
                <span className={row.excluded || row.taken ? "line-through" : ""}>
                  {row.label}
                </span>
                {row.taken && (
                  <span className="ml-auto text-xs text-red-500 font-medium">Unavailable</span>
                )}
              </label>
            ))}
          </div>

          {hasTaken && (
            <p className="text-xs text-red-600 mt-1">
              Featured is already claimed in some cities.{" "}
              <a href="tel:+18665206592" className="font-medium underline hover:text-red-700">
                Call us at (866) 520-6592
              </a>{" "}
              to discuss your options.
            </p>
          )}
        </div>
      )}

      <div className="pt-3 border-t border-teal/20 flex justify-between items-center">
        <span className="font-semibold text-navy">Estimated total</span>
        <span className="font-display text-2xl font-bold text-teal">
          {formatCurrency(total)}
        </span>
      </div>

      <p className="text-xs text-muted">
        Estimate shown for transparency. Call us at (866) 520-6592 if you have any questions.
      </p>
    </div>
  );
}
