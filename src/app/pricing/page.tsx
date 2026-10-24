import type { Metadata } from "next";
import PricingClient from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing",
  description: "Compare ChronoPay plans and billing options for time sellers and buyers.",
};

export default function PricingPage() {
  return <PricingClient />;
}
