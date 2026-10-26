import type { Metadata } from "next";
import { suppliers } from "@/components/dashboard/dashboard-data";
import SupplierDetailClient from "./supplier-detail-client";

const supplierDetails: Record<string, { name: string; role: string; rating: string; responseTime: string; completionRate: string }> = {
  "supplier-1": {
    name: "Alex Rivera",
    role: "Product & Strategy Consultant",
    rating: "4.6 (42)",
    responseTime: "~2.4 min",
    completionRate: "98%",
  },
  "supplier-2": {
    name: "Morgan Chen",
    role: "UX Design Lead",
    rating: "4.8 (28)",
    responseTime: "~1.8 min",
    completionRate: "99%",
  },
  "supplier-3": {
    name: "Jordan Taylor",
    role: "Executive Coach",
    rating: "4.5 (15)",
    responseTime: "~3.2 min",
    completionRate: "96%",
  },
};

export const metadata = ({ params }: { params: Promise<{ id: string }> }) => {
  return new Promise<Metadata>((resolve) => {
    params.then(({ id }) => {
      const supplier = suppliers.find((s) => s.id === id) || suppliers[0];
      const details = supplierDetails[id] || supplierDetails["supplier-1"];
      resolve({
        title: details.name,
        description: `${details.name} — ${details.role}. ${details.rating} rating on ChronoPay.`,
        robots: {
          index: false,
          follow: false,
        },
      });
    });
  });
};

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const details = supplierDetails[id] || supplierDetails["supplier-1"];
  return (
    <SupplierDetailClient
      id={id}
      name={details.name}
      role={details.role}
      rating={details.rating}
      responseTime={details.responseTime}
      completionRate={details.completionRate}
    />
  );
}
