import type { Metadata } from "next";
import PricingPageClient from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Compare ChronoPay plans for individual time sellers, growing businesses, and large organizations.",
};

export default function PricingPage() {
  return <PricingPageClient />;
}
