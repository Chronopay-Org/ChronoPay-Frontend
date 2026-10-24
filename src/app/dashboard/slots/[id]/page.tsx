import type { Metadata } from "next";
import { slots } from "@/components/dashboard/dashboard-data";
import { NO_INDEX } from "@/lib/seo";
import SlotDetailClient from "./slot-detail-client";

type SlotDetailPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: SlotDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  // Mirror the client fallback: unknown ids render the first slot.
  const slot = slots.find((s) => s.id === id) ?? slots[0];

  return {
    title: slot?.title ?? "Slot details",
    robots: NO_INDEX,
  };
}

export default function SlotDetailPage({ params }: SlotDetailPageProps) {
  return <SlotDetailClient params={params} />;
}
