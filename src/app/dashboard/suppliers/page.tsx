"use client";

import { DashboardShell } from "@/app/components/dashboard-shell";
import { BrowseToolbar, useViewMode } from "@/components/dashboard/browse-toolbar";
import { suppliers as dashboardSuppliers } from "@/components/dashboard/dashboard-data";
import { SupplierCard, type Supplier as SupplierCardData } from "@/components/dashboard/supplier-card";

const suppliers: SupplierCardData[] = dashboardSuppliers.map((supplier) => ({
  id: supplier.id,
  name: supplier.name,
  role: supplier.title,
  badges: supplier.badges.map((badge) => badge.label),
}));

export default function SuppliersPage() {
  const { viewMode, toggleViewMode } = useViewMode();

  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-white">Suppliers</h1>
        <BrowseToolbar viewMode={viewMode} onViewModeChange={toggleViewMode} />
        <ul
          aria-label="Suppliers"
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
              : "flex flex-col gap-3"
          }
        >
          {suppliers.map((supplier) => (
            <li key={supplier.id}>
              <SupplierCard supplier={supplier} viewMode={viewMode} />
            </li>
          ))}
        </ul>
      </div>
    </DashboardShell>
  );
}
