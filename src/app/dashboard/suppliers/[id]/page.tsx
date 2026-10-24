import type { Metadata } from "next";
import { suppliers } from "@/components/dashboard/dashboard-data";
import { NO_INDEX } from "@/lib/seo";
import SupplierProfileClient from "./supplier-profile-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supplier = suppliers.find((s) => s.id === id);

  return {
    title: supplier ? supplier.name : "Supplier profile",
    robots: NO_INDEX,
  };
}

export default function SupplierProfilePage({ params }: { params: { id: string } }) {
  return <SupplierProfileClient params={params} />;
}
