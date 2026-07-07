"use client";

import { clsx } from "clsx";
import { Plus, Check } from "lucide-react";
import type { Market } from "@/lib/checkoutMarkets";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/pricing";

interface MarketCardProps {
  market: Market;
  isSelected: boolean;
  pricePerYear: number;
  onAdd: () => void;
  onRemove: () => void;
}

export default function MarketCard({
  market,
  isSelected,
  pricePerYear,
  onAdd,
  onRemove,
}: MarketCardProps) {
  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-4 rounded-xl border p-4 transition-colors",
        isSelected ? "border-accent bg-accent/5" : "border-border bg-card",
      )}
    >
      <div className="min-w-0">
        <p className="font-semibold text-dark truncate">
          {market.city}, {market.state}
        </p>
        <p className="text-xs text-muted mt-0.5">{formatCurrency(pricePerYear)}/yr</p>
      </div>

      <div className="shrink-0">
        {isSelected ? (
          <Button variant="secondary" size="sm" type="button" onClick={onRemove}>
            <Check size={14} /> Added
          </Button>
        ) : (
          <Button variant="outline" size="sm" type="button" onClick={onAdd}>
            <Plus size={14} /> Add
          </Button>
        )}
      </div>
    </div>
  );
}
