"use client";

import { RouteError } from "@/app/components/route-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        <RouteError error={error} reset={reset} />
      </body>
    </html>
  );
}
