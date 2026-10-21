"use client";

import { useState, useCallback } from "react";
import { PayoutStep } from "@/components/dashboard/payout-step";
import type { PayoutStepProps } from "@/components/dashboard/payout-step";

const demoPreview = {
  walletAddress: "GBS43E6X4Q3K7Z5N2F6T8H9J0K1L2M3N4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7",
  walletLabel: "Freighter Wallet",
  network: "Stellar",
};

function StateCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800 text-[10px] font-bold text-slate-300">
          S
        </span>
        <h3 className="text-sm font-semibold text-slate-200">{label}</h3>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 backdrop-blur-md">
        {children}
      </div>
    </div>
  );
}

export function PayoutStepShowcase() {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showPending, setShowPending] = useState(false);

  const handleSaveIdle = useCallback(async () => {
    // Just resolves
  }, []);

  const handleSaveSuccess = useCallback(async () => {
    setShowSuccess(true);
  }, []);

  const handleSaveError = useCallback(async () => {
    throw new Error("Connection timed out. Please check your wallet and try again.");
  }, []);

  const handleSavePending = useCallback(async () => {
    setShowPending(true);
    await new Promise((resolve) => setTimeout(resolve, 3000));
    setShowPending(false);
  }, []);

  const successState: PayoutStepProps = {
    preview: demoPreview,
    onSave: handleSaveSuccess,
    status: "success",
  };

  const errorState: PayoutStepProps = {
    preview: demoPreview,
    onSave: handleSaveError,
    status: "error",
    errorMessage: "Connection timed out. Please check your wallet and try again.",
  };

  // Use controlled states when triggered, fall back to default showcase
  const successProps = showSuccess
    ? { ...successState, status: "success" as const }
    : {
        preview: demoPreview,
        onSave: handleSaveSuccess,
      };

  const errorProps = showError
    ? { ...errorState, status: "error" as const }
    : {
        preview: demoPreview,
        onSave: handleSaveError,
      };

  return (
    <div className="space-y-8">
      {/* Idle state */}
      <StateCard label="Idle — default form">
        <PayoutStep
          preview={demoPreview}
          onSave={handleSaveIdle}
          draftStatus="saved"
          lastSavedLabel="a few seconds ago"
        />
      </StateCard>

      {/* Pending/saving state */}
      <StateCard label="Pending — saving in progress">
        <PayoutStep
          preview={demoPreview}
          onSave={showPending ? handleSavePending : handleSaveIdle}
          status={showPending ? "pending" : "idle"}
        />
        {!showPending && (
          <button
            type="button"
            onClick={async () => {
              setShowPending(true);
              // The PayoutStep manages pending state internally when onSave is called
            }}
            className="mt-3 rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Simulate save (3s delay)
          </button>
        )}
      </StateCard>

      {/* Success state */}
      <StateCard label="Success — payouts configured">
        {showSuccess ? (
          <PayoutStep {...successProps} />
        ) : (
          <div className="space-y-3">
            <PayoutStep
              preview={demoPreview}
              onSave={handleSaveSuccess}
              status="success"
            />
            <button
              type="button"
              onClick={() => setShowSuccess(false)}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Reset to idle
            </button>
          </div>
        )}
      </StateCard>

      {/* Error state */}
      <StateCard label="Error — connection failure">
        {showError ? (
          <PayoutStep {...errorProps} />
        ) : (
          <div className="space-y-3">
            <PayoutStep
              preview={demoPreview}
              onSave={handleSaveError}
              status="error"
              errorMessage="Connection timed out. Please check your wallet and try again."
            />
            <button
              type="button"
              onClick={() => setShowError(false)}
              className="rounded-full border border-white/10 px-4 py-2 text-xs font-medium text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Reset to idle
            </button>
          </div>
        )}
      </StateCard>

      {/* Without preview — no wallet connected */}
      <StateCard label="No wallet — no payout preview">
        <PayoutStep
          preview={null}
          onSave={handleSaveIdle}
        />
      </StateCard>

      {/* Accessibility notes */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/30 p-4 text-xs text-slate-500">
        <p className="font-semibold text-slate-400">Accessibility notes</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            <strong>Keyboard:</strong> Currency selector uses native radio inputs
            with arrow-key navigation. Consent checkbox is fully keyboard
            accessible.
          </li>
          <li>
            <strong>Screen reader:</strong> PanelShell provides
            <code className="text-cyan-300 font-mono"> aria-labelledby</code> and
            <code className="text-cyan-300 font-mono"> aria-describedby</code>.
            Error messages use <code className="text-cyan-300 font-mono">role=&quot;alert&quot;</code>.
            Save button updates <code className="text-cyan-300 font-mono">aria-busy</code>.
          </li>
          <li>
            <strong>Contrast:</strong> All text meets 4.5:1 ratio against the
            dark surface. Focus rings are 2px cyan at 4px offset.
          </li>
          <li>
            <strong>Consent:</strong> Checkbox has
            <code className="text-cyan-300 font-mono"> aria-required</code> with
            linked error text via
            <code className="text-cyan-300 font-mono"> aria-describedby</code>.
          </li>
        </ul>
      </div>
    </div>
  );
}
