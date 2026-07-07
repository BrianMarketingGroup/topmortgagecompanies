import type { ApplyFormData } from "@/lib/schema";
import type { SiteConfig } from "@/lib/config";
import type { SelectedMarket } from "@/lib/checkoutMarkets";
import type {
  ContactInfo,
  PlaqueShippingAddress,
  PaymentInfo,
  ListingInfo,
} from "@/lib/store/checkoutStore";
import { computeExcludedFeatured } from "@/lib/pricing";

/**
 * Maps the checkout wizard's store state into topmortgagecompanies' existing
 * ApplyFormData shape, so it can be POSTed straight to the existing
 * /api/apply route (which already validates against applySchema and calls
 * the BFF via lib/bff.ts — this function does not talk to the BFF directly).
 */
export function buildApplyPayload(params: {
  config: SiteConfig;
  selectedMarkets: SelectedMarket[];
  specialtyIds: string[];
  contact: ContactInfo;
  plaqueShipping: PlaqueShippingAddress | null;
  payment: PaymentInfo;
  listingChoice: "now" | "later";
  listingInfo: ListingInfo | null;
}): ApplyFormData {
  const productOptions = params.config.specialty?.options ?? [];
  const productLabels = productOptions
    .filter((o) => params.specialtyIds.includes(o.id))
    .map((o) => o.label);

  const excludedFeatured = computeExcludedFeatured(
    params.selectedMarkets,
    productOptions,
    params.specialtyIds,
  );
  const featuredPlacement = params.selectedMarkets.some((m) => m.featuredAreaIds.length > 0);

  return {
    type: "apply",
    companyName: params.listingInfo?.businessName || params.contact.company,
    website: params.listingInfo?.website ?? "",
    companyPhone: params.listingInfo?.listingPhone || params.contact.phone,
    loanOfficers: params.listingInfo?.people ? [{ name: params.listingInfo.people }] : [],
    assetPermission: (params.listingInfo?.assetPermission ?? true) ? "grant" : "support",
    locations: params.selectedMarkets.map((m) => ({ city: m.city, state: m.state })),
    loanProducts: productLabels,
    featuredPlacement,
    excludedFeatured,
    contactFirstName: params.contact.firstName,
    contactLastName: params.contact.lastName,
    email: params.contact.email,
    contactPhone: params.contact.phone,
    contactTitle: params.contact.title,
    plaqueShippingAddress: params.plaqueShipping?.street ?? "",
    plaqueShippingCity: params.plaqueShipping?.city ?? "",
    plaqueShippingState: params.plaqueShipping?.state ?? "",
    plaqueShippingZip: params.plaqueShipping?.zip ?? "",
    notes: params.contact.notes,
    cardNumber: params.payment.cardNumber,
    cardExpiry: params.payment.expiry,
    cardCvc: params.payment.cvv,
    cardName: params.payment.cardholderName,
    billingAddress: params.payment.billingAddress,
    billingCity: params.payment.billingCity,
    billingState: params.payment.billingState,
    billingZip: params.payment.billingZip,
    consentToTerms: true,

    listingChoice: params.listingChoice,
    listingBio: params.listingInfo?.bio,
    listingHours: params.listingInfo?.hours,
    sameAsBilling: params.listingInfo?.sameAsBilling,
    businessAddress: params.listingInfo?.businessAddress ?? null,
  };
}
