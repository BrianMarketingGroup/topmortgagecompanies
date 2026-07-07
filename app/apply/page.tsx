import type { Metadata } from "next";
import CheckoutWizard from "@/components/checkout/CheckoutWizard";
import { topMortgageConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Apply to Be Listed",
  description: "Apply to be listed on TopMortgageCompanies.com. Reach homebuyers, homeowners, and investors actively searching for financing solutions.",
};

export default function ApplyPage() {
  return <CheckoutWizard config={topMortgageConfig} />;
}
