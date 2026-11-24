"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { KycDocUpload } from "@/components/dashboard/kyc-doc-upload";
import { KycLivenessCapture } from "@/components/dashboard/kyc-liveness-capture";
import {
  KycStatusTimeline,
  kycPromptPanel,
} from "@/components/dashboard/kyc-status-timeline";
import type { KycTimelineEntry } from "@/components/dashboard/timeline-types";
import TwoFactorEnroll from "@/components/dashboard/two-factor-enroll";
import { useKycFlow } from "@/hooks/use-kyc-flow";

function createEntries(
  stage: ReturnType<typeof useKycFlow>["stage"],
): KycTimelineEntry[] {
  const entries: KycTimelineEntry[] = [
    {
      id: "submitted",
      title: "Documents submitted",
      stage: "submitted",
      timestamp: "Verification started",
    },
  ];

  if (stage !== "submitted") {
    entries.push({
      id: "reviewing",
      title: "Under review",
      stage: "reviewing",
      timestamp: "Documents received",
      details: "Your identity documents are being reviewed.",
    });
  }

  if (stage === "needs_info") {
    entries.push({
      id: "needs-info",
      title: "Additional information needed",
      stage,
      timestamp: "Action required",
      details: "Please retry the capture or upload requested information.",
      isCurrent: true,
    });
  } else if (stage === "rejected") {
    entries.push({
      id: "rejected",
      title: "Verification rejected",
      stage,
      timestamp: "Review complete",
      isCurrent: true,
    });
  } else if (stage === "verified") {
    entries.push({
      id: "verified",
      title: "Verification complete",
      stage,
      timestamp: "Verified",
      isCurrent: true,
    });
  } else {
    const activeEntry = entries[entries.length - 1];
    activeEntry.isCurrent = true;
  }

  return entries;
}

export default function VerificationPage() {
  const router = useRouter();
  const flow = useKycFlow();
  const entries = useMemo(
    () => createEntries(flow.stage),
    [flow.stage],
  );
  const showDocumentCapture =
    flow.stage === "submitted" ||
    (flow.stage === "needs_info" && flow.lastCaptureKind === "document");
  const showLivenessCapture =
    flow.stage === "reviewing" ||
    (flow.stage === "needs_info" && flow.lastCaptureKind === "liveness");

  return (
    <DashboardShell>
      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
            Account security
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-white">
            Verification
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Complete identity verification and set up two-factor authentication
            for your account.
          </p>
        </header>

        <KycStatusTimeline
          entries={entries}
          promptPanel={flow.stage === "needs_info" ? {
            ...kycPromptPanel,
            uploadHref: "/dashboard/settings/verification",
          } : undefined}
        />

        {flow.error && (
          <p className="rounded-xl border border-rose-400/25 bg-rose-950/30 p-4 text-sm text-rose-200" role="alert">
            {flow.error}
          </p>
        )}

        {showDocumentCapture && (
          <section aria-labelledby="document-capture-heading" className="space-y-3">
            <h2 id="document-capture-heading" className="text-xl font-semibold text-white">
              Identity document
            </h2>
            <KycDocUpload onCaptureComplete={flow.completeDocument} />
          </section>
        )}

        {showLivenessCapture && (
          <section aria-labelledby="liveness-capture-heading" className="space-y-3">
            <h2 id="liveness-capture-heading" className="text-xl font-semibold text-white">
              Liveness check
            </h2>
            <KycLivenessCapture onCaptureComplete={flow.completeLiveness} />
          </section>
        )}

        {flow.stage === "rejected" && (
          <p className="rounded-xl border border-rose-400/25 bg-rose-950/30 p-4 text-sm text-rose-200" role="status">
            Verification was rejected. Please contact support for next steps.
          </p>
        )}

        {flow.stage === "verified" && (
          <p className="rounded-xl border border-emerald-400/20 bg-emerald-950/25 p-4 text-sm text-emerald-200" role="status">
            Your identity is verified.
          </p>
        )}

        <section aria-labelledby="two-factor-heading" className="space-y-3">
          <h2 id="two-factor-heading" className="text-xl font-semibold text-white">
            Two-factor authentication
          </h2>
          <TwoFactorEnroll onComplete={() => router.push("/dashboard/settings")} />
        </section>
      </main>
    </DashboardShell>
  );
}
