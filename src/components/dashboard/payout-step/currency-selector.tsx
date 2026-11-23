"use client";

import { useId } from "react";
import { CheckCircle } from "lucide-react";
import { CURRENCIES, type PayoutCurrency } from "./types";

export interface CurrencySelectorProps {
  value: PayoutCurrency;
  onChange: (value: PayoutCurrency) => void;
}

function CurrencyOption({
  value,
  label,
  network,
  description,
  selected,
  onSelect,
}: {
  value: PayoutCurrency;
  label: string;
  network: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const id = useId();
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors ${
        selected
          ? "border-cyan-300/40 bg-cyan-300/10"
          : "border-white/10 bg-white/5 hover:border-white/20"
      }`}
    >
      <input
        id={id}
        type="radio"
        name="payout-currency"
        value={value}
        checked={selected}
        onChange={onSelect}
        className="mt-1 h-4 w-4 shrink-0 accent-cyan-300"
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
            {network}
          </span>
        </div>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
          {description}
        </p>
      </div>
      {selected && (
        <span className="ml-auto shrink-0 text-cyan-300" aria-hidden="true">
          <CheckCircle className="h-5 w-5" />
        </span>
      )}
    </label>
  );
}

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const currencyLabelId = useId();

  return (
    <fieldset aria-labelledby={currencyLabelId}>
      <legend
        id={currencyLabelId}
        className="mb-3 text-sm font-semibold text-white"
      >
        Preferred payout currency
      </legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CURRENCIES.map((c) => (
          <CurrencyOption
            key={c.value}
            value={c.value}
            label={c.label}
            network={c.network}
            description={c.description}
            selected={value === c.value}
            onSelect={() => onChange(c.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}
