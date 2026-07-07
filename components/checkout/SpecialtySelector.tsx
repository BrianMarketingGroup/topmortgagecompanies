"use client";

import { clsx } from "clsx";
import type { SiteConfig } from "@/lib/config";
import { useCheckoutStore } from "@/lib/store/checkoutStore";
import { formatCurrency } from "@/lib/pricing";

export default function SpecialtySelector({ config }: { config: SiteConfig }) {
  const specialtyIds = useCheckoutStore((s) => s.specialtyIds);
  const toggleSpecialty = useCheckoutStore((s) => s.toggleSpecialty);

  const { specialty } = config;
  if (!specialty) return null;

  return (
    <div>
      <p className="text-sm font-semibold text-primary mb-2">
        {specialty.label}
        {specialty.required && <span className="text-accent-dark ml-1">*</span>}
        <span className="text-xs font-normal text-muted ml-1">
          (first one included — additional {formatCurrency(specialty.pricePerOption)} each)
        </span>
      </p>
      <div className="flex flex-wrap gap-2">
        {specialty.options.map((opt) => {
          const isSelected = specialtyIds.includes(opt.id);
          const isIncluded = isSelected && specialtyIds[0] === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleSpecialty(opt.id)}
              className={clsx(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isSelected
                  ? "border-accent bg-accent/15 text-accent-dark"
                  : "border-border bg-card text-dark hover:border-accent/50",
              )}
            >
              {opt.label}
              <span className={clsx("ml-1.5", isSelected ? "text-accent-dark" : "text-muted")}>
                {isIncluded ? "Included" : `+${formatCurrency(specialty.pricePerOption)}`}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
