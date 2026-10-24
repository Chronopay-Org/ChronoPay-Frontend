import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import SharedReceiptClient from "./shared-receipt-client";

export const metadata: Metadata = {
  title: "Shared receipt",
  robots: NO_INDEX,
};

type SharedReceiptPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function SharedReceiptPage({ params, searchParams }: SharedReceiptPageProps) {
  return <SharedReceiptClient params={params} searchParams={searchParams} />;
}
