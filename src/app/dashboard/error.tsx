"use client";

import { RouteError } from "../components/route-error";

export function DashboardError({
  error,
  reset,
}: {
  error?: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      description="We couldn't load your dashboard. This might be a temporary network glitch."
    />
  );
}

export default DashboardError;
