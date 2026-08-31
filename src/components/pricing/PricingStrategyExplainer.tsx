import React, { useState, useEffect } from "react";
import { PricingStrategyPreview } from "./PricingStrategyPreview";

type Strategy = "fixed" | "tiered" | "dynamic";

export function PricingStrategyExplainer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [strategy, setStrategy] = useState<Strategy>("fixed");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate a retryable preview data load (deterministic). State resets are
  // deferred to a timeout callback so they don't run synchronously inside the
  // effect body, then a second timer completes the fake load.
  useEffect(() => {
    if (!open) return;
    const resetTimer = setTimeout(() => {
      setLoading(true);
      setError(null);
    }, 0);
    const doneTimer = setTimeout(() => {
      // deterministic success path
      setLoading(false);
    }, 120);

    return () => {
      clearTimeout(resetTimer);
      clearTimeout(doneTimer);
    };
  }, [open, strategy]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pricing strategy explainer"
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 transition-transform ${
        open ? "" : "pointer-events-none"
      }`}
    >
      <div
        className={`w-full max-w-2xl rounded-xl bg-slate-900/95 border border-white/6 p-6 shadow-lg transform transition-all ${
          open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Pricing strategy</h2>
            <p className="text-sm text-slate-300 mt-1">Compare Fixed, Tiered and Dynamic pricing with a live preview.</p>
          </div>
          <div>
            <button
              aria-label="Close"
              className="text-slate-300 hover:text-white"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <fieldset>
            <legend className="sr-only">Pricing strategy</legend>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="strategy"
                value="fixed"
                checked={strategy === "fixed"}
                onChange={() => setStrategy("fixed")}
              />
              <div className="text-sm">
                <div className="font-medium text-white">Fixed</div>
                <div className="text-xs text-slate-300">Single price per time slot</div>
              </div>
            </label>

            <label className="flex items-center gap-2 mt-3">
              <input
                type="radio"
                name="strategy"
                value="tiered"
                checked={strategy === "tiered"}
                onChange={() => setStrategy("tiered")}
              />
              <div className="text-sm">
                <div className="font-medium text-white">Tiered</div>
                <div className="text-xs text-slate-300">Different prices for time ranges</div>
              </div>
            </label>

            <label className="flex items-center gap-2 mt-3">
              <input
                type="radio"
                name="strategy"
                value="dynamic"
                checked={strategy === "dynamic"}
                onChange={() => setStrategy("dynamic")}
              />
              <div className="text-sm">
                <div className="font-medium text-white">Dynamic</div>
                <div className="text-xs text-slate-300">Price varies with demand patterns</div>
              </div>
            </label>
          </fieldset>

          <div className="sm:col-span-2">
            {loading ? (
              <div className="p-4 text-sm text-slate-300">Loading preview…</div>
            ) : error ? (
              <div className="p-4 text-sm text-rose-300">
                {error}
                <button
                  className="ml-3 underline"
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    setTimeout(() => setLoading(false), 80);
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <PricingStrategyPreview strategy={strategy} />
            )}
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-2 rounded-md bg-white/6 text-sm text-white hover:bg-white/10"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default PricingStrategyExplainer;
