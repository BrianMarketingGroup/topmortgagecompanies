"use client";

import { clsx } from "clsx";
import { Check } from "lucide-react";
import type { UpsellOption } from "@/lib/config";
import { formatCurrency } from "@/lib/pricing";

export default function UpsellCard({
  upsell,
  isSelected,
  onToggle,
}: {
  upsell: UpsellOption;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        "flex items-start justify-between gap-4 rounded-xl border p-4 text-left w-full transition-colors",
        isSelected ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/40",
      )}
    >
      <div>
        <p className="font-semibold text-dark">{upsell.label}</p>
        <p className="text-sm text-muted mt-0.5">{upsell.description}</p>
        <p className="text-sm font-semibold text-primary mt-2">
          {upsell.price === 0 ? "Included" : `+${formatCurrency(upsell.price)}`}
        </p>
      </div>
      <span
        className={clsx(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 mt-1",
          isSelected ? "bg-accent border-accent text-primary-dark" : "border-border",
        )}
      >
        {isSelected && <Check size={14} />}
      </span>
    </button>
  );
}
