import React from "react";

type Strategy = "fixed" | "tiered" | "dynamic";

interface PreviewProps {
  strategy: Strategy;
}

// Deterministic mock data for preview (24 hourly slots)
const HOURS = Array.from({ length: 24 }).map((_, i) => i);

function getPrices(strategy: Strategy) {
  switch (strategy) {
    case "fixed":
      return HOURS.map(() => 10);
    case "tiered":
      return HOURS.map((h) => (h < 8 ? 8 : h < 16 ? 12 : 16));
    case "dynamic":
      return HOURS.map((h) => 6 + Math.round(Math.sin(h / 3) * 4));
    default:
      return HOURS.map(() => 0);
  }
}

export function PricingStrategyPreview({ strategy }: PreviewProps) {
  const prices = getPrices(strategy);

  return (
    <div className="w-full rounded-lg border border-white/6 bg-slate-800/60 p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-white">Preview</h4>
        <div className="text-xs text-slate-300">Strategy: {strategy}</div>
      </div>

      <div className="grid grid-cols-6 gap-2">
        {prices.map((p, idx) => (
          <div key={idx} className="text-center">
            <div className="text-xs text-slate-300">{idx}:00</div>
            <div className="mt-1 text-sm font-semibold text-white">${p}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PricingStrategyPreview;
