"use client";

import { DAY_LABELS, type BusinessHours, type DayKey } from "@/lib/store/checkoutStore";

const DAY_ORDER: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export default function BusinessHoursEditor({
  value,
  onChange,
}: {
  value: BusinessHours;
  onChange: (next: BusinessHours) => void;
}) {
  function updateDay(day: DayKey, patch: Partial<BusinessHours[DayKey]>) {
    onChange({ ...value, [day]: { ...value[day], ...patch } });
  }

  return (
    <div>
      <p className="text-sm font-semibold text-primary mb-2">Business Hours</p>
      <div className="space-y-2">
        {DAY_ORDER.map((day) => {
          const d = value[day];
          return (
            <div
              key={day}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm"
            >
              <label className="flex items-center gap-2 sm:w-32 shrink-0 cursor-pointer">
                <input
                  type="checkbox"
                  checked={d.open}
                  onChange={(e) => updateDay(day, { open: e.target.checked })}
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent shrink-0"
                />
                {DAY_LABELS[day]}
              </label>
              {d.open ? (
                <div className="flex items-center gap-2 pl-6 sm:pl-0">
                  <input
                    type="time"
                    value={d.from}
                    onChange={(e) => updateDay(day, { from: e.target.value })}
                    className="w-[6.5rem] shrink-0 rounded-lg border border-border px-2 py-1.5 text-sm"
                  />
                  <span className="text-muted shrink-0">to</span>
                  <input
                    type="time"
                    value={d.to}
                    onChange={(e) => updateDay(day, { to: e.target.value })}
                    className="w-[6.5rem] shrink-0 rounded-lg border border-border px-2 py-1.5 text-sm"
                  />
                </div>
              ) : (
                <span className="pl-6 sm:pl-0 text-xs text-muted italic">Closed</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
