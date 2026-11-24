"use client";

import DashboardError from "@/app/dashboard/error";

export default function AdminUsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <DashboardError error={error} reset={reset} />;
}
export { RouteError as default } from "@/app/components/route-error";
