"use client";

import { Check } from "lucide-react";
import { clsx } from "clsx";
import { useCheckoutStore, type WizardStep } from "@/lib/store/checkoutStore";

const STEPS: { step: WizardStep; label: string }[] = [
  { step: 1, label: "Select Market" },
  { step: 2, label: "Contact" },
  { step: 3, label: "Payment" },
  { step: 4, label: "Enhancements" },
  { step: 5, label: "Listing Info" },
  { step: 6, label: "Thank You" },
];

const WINDOW_SIZE = 3;
const MAX_WINDOW_START = STEPS.length - WINDOW_SIZE + 1;

// A 3-wide window of real step bubbles, anchored at the current step and
// clamped so it never slides past the last step: 1 -> [1,2,3], 2 -> [2,3,4],
// ... 4,5,6 all show [4,5,6] since the window can't extend past step 6.
function getWindowStart(step: WizardStep): number {
  return Math.min(step, MAX_WINDOW_START);
}

export default function StepProgress() {
  const step = useCheckoutStore((s) => s.step);
  const furthestStep = useCheckoutStore((s) => s.furthestStep);
  const goToStep = useCheckoutStore((s) => s.goToStep);

  const windowStart = getWindowStart(step);
  const visibleSteps = STEPS.slice(windowStart - 1, windowStart - 1 + WINDOW_SIZE);

  return (
    <nav aria-label="Checkout progress" className="mb-8">
      <ol className="flex items-center w-full">
        {visibleSteps.map(({ step: s, label }, i) => {
          const isCompleted = s < step;
          const isCurrent = s === step;
          const isReachable = s <= furthestStep;
          const isLast = i === visibleSteps.length - 1;

          return (
            <li key={s} className={clsx("flex items-center", !isLast && "flex-1")}>
              <button
                type="button"
                disabled={!isReachable}
                onClick={() => goToStep(s)}
                className={clsx(
                  "flex flex-col items-center gap-1.5 group",
                  isReachable ? "cursor-pointer" : "cursor-not-allowed",
                )}
              >
                <span
                  className={clsx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold border-2 transition-colors",
                    isCompleted && "bg-primary border-primary text-white",
                    isCurrent && "bg-accent border-accent text-primary-dark",
                    !isCompleted && !isCurrent && "bg-white border-border text-muted",
                  )}
                >
                  {isCompleted ? <Check size={16} /> : s}
                </span>
                <span
                  className={clsx(
                    "hidden sm:block text-xs font-medium whitespace-nowrap",
                    isCurrent ? "text-primary" : "text-muted",
                  )}
                >
                  {label}
                </span>
              </button>
              {!isLast && (
                <span
                  className={clsx(
                    "mx-2 h-0.5 flex-1 rounded-full",
                    s < step ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
