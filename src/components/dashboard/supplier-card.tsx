import { Card, CardHeader, CardBody } from "./card";

export interface Supplier {
  id: string;
  name: string;
  role: string;
  badges: string[];
  rating: number;
  reviewCount: number;
}

export interface SupplierCardProps {
  supplier: Supplier;
  viewMode?: "grid" | "compact-list";
}

/**
 * SupplierCard displays a supplier's information.
 *
 * It supports a "grid" (default) mode and a "compact-list" mode.
 * The compact-list mode is optimized for keyboard and screen-reader users,
 * using a linearized table-like layout with a single tab stop per row,
 * and preserving trust badges as text-first.
 */
export function SupplierCard({ supplier, viewMode = "grid" }: SupplierCardProps) {
  if (viewMode === "compact-list") {
    return (
      <Card
        variant="compact-list"
        interactive
        as="a"
        href={`/marketplace/suppliers/${supplier.id}`}
        // Single tab stop per row for the compact list
        className="flex items-center justify-between p-4 focus-visible:ring-2 focus-visible:ring-cyan-300 focus:outline-none rounded-xl border border-white/10 hover:bg-white/5 transition-colors"
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 w-full">
          <div className="min-w-[150px]">
            <div className="font-semibold text-white">{supplier.name}</div>
            <div className="text-sm text-slate-400">{supplier.role}</div>
          </div>
          <div className="flex-1 text-sm text-slate-300">
            <span className="sr-only">Rating: </span>
            <span aria-hidden="true">★ </span>
            {supplier.rating} ({supplier.reviewCount} reviews)
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300">
            <span className="sr-only">Trust Badges: </span>
            {supplier.badges.map((badge) => (
              <span key={badge} className="rounded bg-white/5 px-2 py-1">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Default Grid View
  return (
    <Card
      interactive
      as="a"
      href={`/marketplace/suppliers/${supplier.id}`}
      className="flex flex-col focus-visible:ring-2 focus-visible:ring-cyan-300 focus:outline-none"
    >
      <CardHeader className="p-4 border-b border-white/5">
        <div className="font-semibold text-white">{supplier.name}</div>
        <div className="text-sm text-slate-400">{supplier.role}</div>
      </CardHeader>
      <CardBody className="p-4 space-y-3">
        <div className="text-sm text-slate-300 flex items-center gap-1">
          <span className="text-yellow-400" aria-hidden="true">★</span>
          <span className="sr-only">Rating:</span>
          {supplier.rating} ({supplier.reviewCount} reviews)
        </div>
        <div className="flex flex-wrap gap-2">
          {supplier.badges.map((badge) => (
            <span key={badge} className="rounded bg-white/5 px-2 py-1 text-xs text-slate-300">
              {badge}
            </span>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
