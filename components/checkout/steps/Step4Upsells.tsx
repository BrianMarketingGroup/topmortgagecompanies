"use client";

import { useEffect, useState } from "react";
import FadeIn from "@/components/ui/FadeIn";
import Button from "@/components/ui/Button";
import UpsellCard from "@/components/checkout/UpsellCard";
import FeaturedCityOffer from "@/components/checkout/FeaturedCityOffer";
import OrderSummarySidebar from "@/components/checkout/OrderSummarySidebar";
import { useCheckoutStore } from "@/lib/store/checkoutStore";
import type { SiteConfig } from "@/lib/config";

export default function Step4Upsells({ config }: { config: SiteConfig }) {
  const selectedMarkets = useCheckoutStore((s) => s.selectedMarkets);
  const specialtyIds = useCheckoutStore((s) => s.specialtyIds);
  const toggleMarketFeaturedArea = useCheckoutStore((s) => s.toggleMarketFeaturedArea);
  const selectedUpsellIds = useCheckoutStore((s) => s.selectedUpsellIds);
  const toggleUpsell = useCheckoutStore((s) => s.toggleUpsell);
  const goNext = useCheckoutStore((s) => s.goNext);
  const goBack = useCheckoutStore((s) => s.goBack);

  const areas = (config.specialty?.options ?? []).filter((o) => specialtyIds.includes(o.id));
  const specialtyLabel = (config.specialty?.label ?? "specialty").toLowerCase();
  const [takenSlots, setTakenSlots] = useState<string[]>([]);

  useEffect(() => {
    if (selectedMarkets.length === 0 || areas.length === 0) {
      setTakenSlots([]);
      return;
    }
    const cities = selectedMarkets.map((m) => ({ city: m.city, state: m.state }));
    const areaLabels = areas.map((a) => a.label);
    const params = new URLSearchParams({
      cities: JSON.stringify(cities),
      areas: JSON.stringify(areaLabels),
    });
    fetch(`/api/cities/availability?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : { takenSlots: [] }))
      .then((data) => setTakenSlots(data.takenSlots ?? []))
      .catch(() => setTakenSlots([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(selectedMarkets.map((m) => `${m.city}|${m.state}`)), JSON.stringify(specialtyIds)]);

  return (
    <FadeIn>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {selectedMarkets.length > 0 && areas.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-primary mb-1">
                  Featured Placement is available for your selected markets
                </h2>
                <p className="text-sm text-muted">
                  Want to be the top {config.businessNoun} for a {specialtyLabel} in each of these
                  cities? Featured listings get top placement and a highlighted badge. Only one
                  company can be featured per city and {specialtyLabel}.
                </p>
              </div>
              <div className="space-y-4">
                {selectedMarkets.map((market) =>
                  areas.map((area) => {
                    const slotKey = `${market.city}|${area.label}`;
                    const isSoldOut = takenSlots.includes(slotKey);
                    return (
                      <FeaturedCityOffer
                        key={`${market.marketId}::${area.id}`}
                        city={market.city}
                        state={market.state}
                        areaLabel={area.label}
                        businessNoun={config.businessNoun}
                        price={config.featuredUpgradePrice}
                        isSelected={market.featuredAreaIds.includes(area.id)}
                        isSoldOut={isSoldOut}
                        onToggle={() => toggleMarketFeaturedArea(market.marketId, area.id)}
                      />
                    );
                  }),
                )}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold text-primary mb-1">Recommended Enhancements</h2>
            <p className="text-sm text-muted">
              Boost your visibility. Selections update your order total immediately.
            </p>
          </div>

          {config.upsells.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.upsells.map((upsell) => (
                <UpsellCard
                  key={upsell.id}
                  upsell={upsell}
                  isSelected={selectedUpsellIds.includes(upsell.id)}
                  onToggle={() => toggleUpsell(upsell.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted italic">No enhancements configured for this site.</p>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="ghost" onClick={goBack}>
              Back
            </Button>
            <Button onClick={goNext}>Continue</Button>
          </div>
        </div>

        <OrderSummarySidebar config={config} />
      </div>
    </FadeIn>
  );
}
