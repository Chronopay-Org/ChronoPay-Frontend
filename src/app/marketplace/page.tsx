import type { Metadata } from "next";
import MarketplaceClient from "./marketplace-client";

export const metadata: Metadata = {
  title: "Marketplace",
  description: "Browse and book tokenized time slots from verified suppliers.",
};

export default function MarketplacePage() {
  return <MarketplaceClient />;
}
