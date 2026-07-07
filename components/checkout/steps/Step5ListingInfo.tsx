"use client";

import { useState } from "react";
import { Mail, FileEdit } from "lucide-react";
import { clsx } from "clsx";
import { z } from "zod";
import FadeIn from "@/components/ui/FadeIn";
import Button from "@/components/ui/Button";
import { FormField, Input, Select, Checkbox } from "@/components/ui/FormField";
import ListingPreviewMockup from "@/components/checkout/ListingPreviewMockup";
import CharacterCounterTextarea from "@/components/checkout/CharacterCounterTextarea";
import BusinessHoursEditor from "@/components/checkout/BusinessHoursEditor";
import FileUploadDropzone from "@/components/checkout/FileUploadDropzone";
import { useCheckoutStore, type UploadKind } from "@/lib/store/checkoutStore";
import { buildListingInfoNowSchema, listingInfoLaterSchema } from "@/lib/checkoutSchema";
import { buildApplyPayload } from "@/lib/submission";
import { ALL_STATES } from "@/lib/checkoutMarkets";
import type { SiteConfig } from "@/lib/config";

const UPLOAD_LABELS: Record<UploadKind, string> = {
  logo: "Logo",
  profilePhoto: "Profile Photo",
  bannerImage: "Banner Image",
};

export default function Step5ListingInfo({ config }: { config: SiteConfig }) {
  const store = useCheckoutStore();
  const [listingChoice, setLocalListingChoice] = useState<"now" | "later">(
    store.listingChoice ?? "now",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const info = store.listingInfo;
  const firstMarket = store.selectedMarkets[0] ?? null;

  async function submitToApi(choice: "now" | "later") {
    const payload = buildApplyPayload({
      config,
      selectedMarkets: store.selectedMarkets,
      specialtyIds: store.specialtyIds,
      contact: store.contact,
      plaqueShipping: store.plaqueShipping,
      payment: store.payment,
      listingChoice: choice,
      listingInfo: choice === "now" ? info : null,
    });

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setSubmitError(
          body?.error ?? "Something went wrong submitting your application. Please try again.",
        );
        return;
      }
      store.setListingChoice(choice);
      store.setDebugSubmissionPayload(payload);
      store.goNext();
    } catch {
      setSubmitError("Could not reach the server. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit() {
    if (listingChoice === "later") {
      const emailCheck = z.string().email("Enter a valid email address").safeParse(store.contact.email);
      if (!emailCheck.success) {
        setErrors({ linkEmail: emailCheck.error.issues[0]?.message ?? "Enter a valid email address" });
        return;
      }
      setErrors({});
      await submitToApi("later");
      return;
    }

    const result = buildListingInfoNowSchema(config).safeParse({ listingChoice: "now", ...info });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    await submitToApi("now");
  }

  return (
    <FadeIn>
      <div className="space-y-8 max-w-3xl">
        <ListingPreviewMockup
          businessName={info.businessName}
          bio={info.bio}
          people={info.people}
          market={firstMarket}
          logo={store.uploadedFiles.logo}
          hasFeatured={store.selectedMarkets.some((m) => m.featuredAreaIds.length > 0)}
        />

        <div>
          <p className="text-sm font-semibold text-primary mb-2">How would you like to proceed?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLocalListingChoice("now")}
              className={clsx(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                listingChoice === "now"
                  ? "border-accent bg-accent/5"
                  : "border-border bg-card hover:border-accent/40",
              )}
            >
              <FileEdit size={18} className="text-primary shrink-0" />
              <div>
                <p className="font-semibold text-dark text-sm">Complete Listing Now</p>
                <p className="text-xs text-muted">Fill out your listing details right away.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setLocalListingChoice("later")}
              className={clsx(
                "flex items-center gap-3 rounded-xl border p-4 text-left transition-colors",
                listingChoice === "later"
                  ? "border-accent bg-accent/5"
                  : "border-border bg-card hover:border-accent/40",
              )}
            >
              <Mail size={18} className="text-primary shrink-0" />
              <div>
                <p className="font-semibold text-dark text-sm">Email Me a Link to Complete Later</p>
                <p className="text-xs text-muted">
                  We&apos;ll send a checklist to finish your listing whenever you&apos;re ready.
                </p>
              </div>
            </button>
          </div>
        </div>

        {listingChoice === "later" && (
          <div className="rounded-xl border border-border bg-card p-4 max-w-md">
            <FormField
              label="Send the link to"
              required
              hint="We'll email a checklist to finish your listing to this address."
              error={errors.linkEmail}
            >
              <Input
                type="email"
                value={store.contact.email}
                onChange={(e) => store.setContact({ email: e.target.value })}
                error={errors.linkEmail}
              />
            </FormField>
          </div>
        )}

        {listingChoice === "now" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Company Name"
                required
                className="sm:col-span-2"
                error={errors.businessName}
              >
                <Input
                  value={info.businessName}
                  onChange={(e) => store.setListingInfo({ businessName: e.target.value })}
                  error={errors.businessName}
                  placeholder="Summit Home Lending"
                />
              </FormField>
              <FormField
                label={config.listingFields.peopleLabel}
                required
                className="sm:col-span-2"
                hint="Separate multiple names with commas"
                error={errors.people}
              >
                <Input
                  value={info.people}
                  onChange={(e) => store.setListingInfo({ people: e.target.value })}
                  error={errors.people}
                />
              </FormField>
              <FormField label="Listing Phone Number" required error={errors.listingPhone}>
                <Input
                  value={info.listingPhone}
                  onChange={(e) => store.setListingInfo({ listingPhone: e.target.value })}
                  error={errors.listingPhone}
                />
              </FormField>
              <FormField label="Listing Email Address" required error={errors.listingEmail}>
                <Input
                  value={info.listingEmail}
                  onChange={(e) => store.setListingInfo({ listingEmail: e.target.value })}
                  error={errors.listingEmail}
                />
              </FormField>
              <FormField label="Website" className="sm:col-span-2" error={errors.website}>
                <Input
                  value={info.website}
                  onChange={(e) => store.setListingInfo({ website: e.target.value })}
                  error={errors.website}
                  placeholder="https://yourcompany.com"
                />
              </FormField>
            </div>

            <div>
              <Checkbox
                label="Business Address same as Billing Address"
                checked={info.sameAsBilling}
                onChange={(e) =>
                  store.setListingInfo({
                    sameAsBilling: e.target.checked,
                    businessAddress: e.target.checked
                      ? null
                      : (info.businessAddress ?? { street: "", city: "", state: "", zip: "" }),
                  })
                }
              />
              {!info.sameAsBilling && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <FormField label="Street" required className="sm:col-span-2">
                    <Input
                      value={info.businessAddress?.street ?? ""}
                      onChange={(e) =>
                        store.setListingInfo({
                          businessAddress: {
                            ...(info.businessAddress ?? { street: "", city: "", state: "", zip: "" }),
                            street: e.target.value,
                          },
                        })
                      }
                    />
                  </FormField>
                  <FormField label="City" required>
                    <Input
                      value={info.businessAddress?.city ?? ""}
                      onChange={(e) =>
                        store.setListingInfo({
                          businessAddress: {
                            ...(info.businessAddress ?? { street: "", city: "", state: "", zip: "" }),
                            city: e.target.value,
                          },
                        })
                      }
                    />
                  </FormField>
                  <FormField label="State" required>
                    <Select
                      value={info.businessAddress?.state ?? ""}
                      onChange={(e) =>
                        store.setListingInfo({
                          businessAddress: {
                            ...(info.businessAddress ?? { street: "", city: "", state: "", zip: "" }),
                            state: e.target.value,
                          },
                        })
                      }
                    >
                      <option value="">Select…</option>
                      {ALL_STATES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="ZIP" required>
                    <Input
                      value={info.businessAddress?.zip ?? ""}
                      onChange={(e) =>
                        store.setListingInfo({
                          businessAddress: {
                            ...(info.businessAddress ?? { street: "", city: "", state: "", zip: "" }),
                            zip: e.target.value,
                          },
                        })
                      }
                    />
                  </FormField>
                </div>
              )}
              {errors.businessAddress && (
                <p className="text-xs text-danger mt-1" role="alert">
                  {errors.businessAddress}
                </p>
              )}
            </div>

            <CharacterCounterTextarea
              label="About / Bio"
              value={info.bio}
              onChange={(v) => store.setListingInfo({ bio: v })}
              maxChars={config.listingFields.bioMaxChars}
              error={errors.bio}
              placeholder="Tell prospective borrowers about your company…"
            />

            <BusinessHoursEditor
              value={info.hours}
              onChange={(hours) => store.setListingInfo({ hours })}
            />

            <div>
              <p className="text-sm font-semibold text-primary mb-2">
                Upload or Attach to Email
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {config.listingFields.fileUploadTypes.map((kind) => (
                  <FileUploadDropzone
                    key={kind}
                    label={UPLOAD_LABELS[kind]}
                    value={store.uploadedFiles[kind]}
                    onChange={(meta) => store.setUploadedFile(kind, meta)}
                  />
                ))}
              </div>
            </div>

            <Checkbox
              label="Yes, you may use content and images from our website to help build our listing."
              checked={info.assetPermission}
              onChange={(e) => store.setListingInfo({ assetPermission: e.target.checked })}
            />
          </div>
        )}

        {submitError && (
          <p className="text-sm text-danger" role="alert">
            {submitError}
          </p>
        )}

        <div className="flex justify-between">
          <Button type="button" variant="ghost" onClick={store.goBack} disabled={isSubmitting}>
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting…" : listingChoice === "later" ? "Send Me the Link" : "Submit"}
          </Button>
        </div>
      </div>
    </FadeIn>
  );
}
