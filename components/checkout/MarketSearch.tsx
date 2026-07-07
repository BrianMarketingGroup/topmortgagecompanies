"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/FormField";
import type { SiteConfig } from "@/lib/config";
import { searchMarkets, type Market } from "@/lib/checkoutMarkets";

interface MarketSearchProps {
  config: SiteConfig;
  onResults: (results: Market[] | null) => void;
}

export default function MarketSearch({ config, onResults }: MarketSearchProps) {
  const [query, setQuery] = useState("");

  function runSearch(nextQuery: string) {
    if (!nextQuery) {
      onResults(null);
      return;
    }
    onResults(searchMarkets(nextQuery));
  }

  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <Input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          runSearch(e.target.value);
        }}
        placeholder={`Search by ${config.marketLabel.toLowerCase()}…`}
        className="pl-9"
      />
    </div>
  );
}
