"use client";

import { Zap, Star, MapPin, Home, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/pricing";

const OTHER_LISTINGS = ["Patriot Mortgage Group", "Greenfield Mortgage Solutions", "Apex Capital Lending"];

/**
 * A prominent glowing Featured card mimicking the homepage directory
 * preview, with a few generic "other listings" rows greyed out below it.
 * Placeholder content only — real business data is collected on the Listing
 * Info screen.
 */
export default function FeaturedCityOffer({
  city,
  state,
  areaLabel,
  businessNoun,
  price,
  isSelected,
  isSoldOut,
  onToggle,
}: {
  city: string;
  state: string;
  areaLabel?: string;
  businessNoun: string;
  price: number;
  isSelected: boolean;
  isSoldOut?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="bg-primary px-4 py-3 text-center">
        <p className="text-white text-sm font-semibold capitalize">
          Find a Top-Rated {businessNoun} Near You
        </p>
        <p className="text-white/50 text-xs mt-0.5">
          {city}, {state} · {OTHER_LISTINGS.length + 1} listed
        </p>
      </div>

      <div className="p-4">
        <div className="relative">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-accent via-accent-light to-accent opacity-30 blur-md pointer-events-none" />

          <div className="relative rounded-xl overflow-hidden border border-accent/40 bg-gradient-to-br from-primary via-primary to-primary-dark">
            <div className="flex items-center justify-between bg-gradient-to-r from-accent/25 to-transparent border-b border-accent/25 px-4 py-2">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-accent-light fill-accent-light" />
                <span className="text-xs font-black text-accent-light uppercase tracking-widest">
                  {areaLabel ? `${areaLabel} Spotlight` : "City Spotlight"}
                </span>
              </div>
              <span className="text-[10px] font-bold text-accent-light/90 bg-accent/10 border border-accent/30 px-2 py-0.5 rounded-full uppercase tracking-wide">
                Exclusive · 1 slot
              </span>
            </div>

            <div className="flex gap-4 p-4">
              <div className="relative h-24 w-24 rounded-lg overflow-hidden flex-shrink-0 ring-2 ring-accent/50 shadow-lg shadow-accent/20 flex items-center justify-center bg-gradient-to-br from-accent to-accent-light">
                <Home size={32} className="text-primary-dark" fill="currentColor" strokeWidth={1} />
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="text-base font-black text-white truncate">Your Company Name</h4>
                <div className="flex items-center gap-1 mt-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={13}
                      className="text-accent-light"
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  ))}
                  <span className="text-xs text-white/40">(24)</span>
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <MapPin size={12} className="text-white/30 flex-shrink-0" />
                  <span className="text-xs text-white/50 truncate">
                    {city}, {state}
                  </span>
                </div>
              </div>

              <div className="flex-shrink-0 flex flex-col items-end justify-between">
                {isSoldOut ? (
                  <span className="text-xs bg-white/10 text-white/60 font-black px-4 py-2 rounded shadow-sm whitespace-nowrap">
                    Sold Out
                  </span>
                ) : (
                  <>
                    <span className="text-xs font-semibold text-accent-light whitespace-nowrap">
                      +{formatCurrency(price)}
                    </span>
                    <button
                      type="button"
                      onClick={onToggle}
                      className={
                        isSelected
                          ? "text-xs bg-white text-primary font-black px-4 py-2 rounded shadow-sm whitespace-nowrap"
                          : "text-xs bg-gradient-to-r from-accent to-accent-light text-primary-dark font-black px-4 py-2 rounded shadow-sm shadow-accent/30 whitespace-nowrap"
                      }
                    >
                      {isSelected ? "Remove" : "Add Featured"}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 space-y-2">
        <p className="text-xs font-semibold text-muted px-1">
          Other listings in {city}, {state}
        </p>
        {OTHER_LISTINGS.map((name, i) => (
          <div
            key={name}
            className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-bg opacity-60 grayscale"
          >
            <span className="text-sm font-bold text-muted w-5 text-center flex-shrink-0">
              {i + 2}
            </span>
            <div className="h-10 w-14 rounded bg-muted/20 flex items-center justify-center flex-shrink-0">
              <Building2 size={16} className="text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-muted truncate">{name}</p>
              <p className="text-xs text-muted/70">Standard Listing</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
