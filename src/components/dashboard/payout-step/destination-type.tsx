"use client";

import { useId } from "react";
import { CheckCircle } from "lucide-react";
import { DESTINATION_TYPES, type PayoutDestinationType } from "./types";

export interface DestinationTypeSelectorProps {
  value: PayoutDestinationType;
  onChange: (value: PayoutDestinationType) => void;
  hasConnectedWallet: boolean;
}

export function DestinationTypeSelector({
  value,
  onChange,
  hasConnectedWallet,
}: DestinationTypeSelectorProps) {
  const legendId = useId();
  const groupId = useId();

  return (
    <fieldset aria-labelledby={legendId}>
      <legend
        id={legendId}
        className="mb-3 text-sm font-semibold text-white"
      >
        Payout destination type
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {DESTINATION_TYPES.map((option) => {
          const inputId = `${groupId}-${option.value}`;
          const selected = value === option.value;
          const isConnectedOption = option.value === "connected_wallet";

          return (
            <label
              key={option.value}
              htmlFor={inputId}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
                selected
                  ? "border-cyan-300/40 bg-cyan-300/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <input
                id={inputId}
                type="radio"
                name="payout-destination-type"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                className="mt-1 h-4 w-4 shrink-0 accent-cyan-300"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-white">
                    {option.label}
                  </span>
                  {isConnectedOption && !hasConnectedWallet && (
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                      Not connected
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                  {option.description}
                </p>
              </div>
              {selected && (
                <span
                  className="ml-auto shrink-0 text-cyan-300"
                  aria-hidden="true"
                >
                  <CheckCircle className="h-5 w-5" />
                </span>
              )}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
