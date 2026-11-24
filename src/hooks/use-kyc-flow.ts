"use client";

import { useCallback, useState } from "react";
import type { KycStage } from "@/components/dashboard/timeline-types";

export type KycCaptureKind = "document" | "liveness";

export interface KycCaptureResult {
  kind: KycCaptureKind;
  success: boolean;
  imageData?: string;
}

export interface KycFlowAdapter {
  processCapture: (result: KycCaptureResult) => Promise<KycStage>;
}

export const demoKycFlowAdapter: KycFlowAdapter = {
  async processCapture({ kind, success }) {
    if (!success) return "needs_info";
    return kind === "document" ? "reviewing" : "verified";
  },
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Verification could not be updated. Please try again.";
}

export function useKycFlow(adapter: KycFlowAdapter = demoKycFlowAdapter) {
  const [stage, setStage] = useState<KycStage>("submitted");
  const [lastCaptureKind, setLastCaptureKind] = useState<KycCaptureKind>("document");
  const [error, setError] = useState<string | null>(null);

  const complete = useCallback(
    async (result: KycCaptureResult) => {
      setError(null);
      try {
        const nextStage = await adapter.processCapture(result);
        setStage(nextStage);
        setLastCaptureKind(result.kind);
      } catch (captureError) {
        setError(getErrorMessage(captureError));
        throw captureError;
      }
    },
    [adapter],
  );

  const completeDocument = useCallback(
    (success: boolean, imageData?: string) =>
      complete({ kind: "document", success, imageData }),
    [complete],
  );

  const completeLiveness = useCallback(
    (success: boolean) => complete({ kind: "liveness", success }),
    [complete],
  );

  return {
    stage,
    lastCaptureKind,
    error,
    clearError: useCallback(() => setError(null), []),
    completeDocument,
    completeLiveness,
  };
}
