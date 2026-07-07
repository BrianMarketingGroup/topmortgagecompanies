"use client";

import { CheckCircle2 } from "lucide-react";
import FadeIn from "@/components/ui/FadeIn";
import Button from "@/components/ui/Button";
import DebugPayloadPanel from "@/components/checkout/DebugPayloadPanel";
import { useCheckoutStore } from "@/lib/store/checkoutStore";
import type { SiteConfig } from "@/lib/config";

export default function Step6ThankYou({ config }: { config: SiteConfig }) {
  const listingChoice = useCheckoutStore((s) => s.listingChoice);
  const debugSubmissionPayload = useCheckoutStore((s) => s.debugSubmissionPayload);
  const contact = useCheckoutStore((s) => s.contact);
  const reset = useCheckoutStore((s) => s.reset);

  return (
    <FadeIn>
      <div className="max-w-2xl mx-auto text-center py-8 space-y-6">
        <CheckCircle2 size={48} className="text-success mx-auto" />
        <div>
          <h2 className="text-2xl font-bold text-primary mb-2">Thank You!</h2>
          {listingChoice === "later" ? (
            <p className="text-muted">
              We&apos;ve emailed a checklist to <strong>{contact.email || "your inbox"}</strong> with
              everything needed to finish your listing (CC&apos;d to{" "}
              {config.emailTemplates.ccAddress}). Complete it whenever you&apos;re ready.
            </p>
          ) : (
            <p className="text-muted">
              Your order has been received. Your listing will go live within approximately{" "}
              <strong>{config.productionTimelineDays} business days</strong>. A confirmation has
              been sent to <strong>{contact.email || "your inbox"}</strong>.
            </p>
          )}
        </div>

        <div className="text-left">
          <DebugPayloadPanel payload={debugSubmissionPayload} />
        </div>

        <Button variant="outline" onClick={reset}>
          Start a New Application
        </Button>
      </div>
    </FadeIn>
  );
}
