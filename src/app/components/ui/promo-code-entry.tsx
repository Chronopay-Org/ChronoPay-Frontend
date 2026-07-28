"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Loader2, Tag, XCircle } from "lucide-react";

interface PromoCodeEntryProps {
  baseTotal: number;
  onDiscountApplied?: (discount: { code: string; percent: number; discountedTotal: number }) => void;
}

interface PromoRule {
  code: string;
  percent: number;
  expiresAt: string;
  description: string;
}

const PROMO_RULES: PromoRule[] = [
  { code: "SAVE20", percent: 20, expiresAt: "2099-12-31", description: "20% off your booking" },
  { code: "WELCOME10", percent: 10, expiresAt: "2024-12-31", description: "10% off for first-time buyers" },
  { code: "EARLYBIRD", percent: 15, expiresAt: "2099-12-31", description: "15% off for early reservations" },
];

function resolvePromo(value: string) {
  const normalized = value.trim().toUpperCase();
  const rule = PROMO_RULES.find((entry) => entry.code === normalized);

  if (!rule) {
    return { status: "invalid" as const, message: "Promo code not found. Try SAVE20 or EARLYBIRD.", percent: 0 };
  }

  const now = new Date();
  const expiresAt = new Date(`${rule.expiresAt}T23:59:59`);
  if (now > expiresAt) {
    return { status: "expired" as const, message: "This promo code has expired.", percent: 0 };
  }

  return { status: "valid" as const, message: `${rule.description} applied.`, percent: rule.percent };
}

export function PromoCodeEntry({ baseTotal, onDiscountApplied }: PromoCodeEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "valid" | "invalid" | "expired">("idle");
  const [message, setMessage] = useState("");
  const [appliedPercent, setAppliedPercent] = useState(0);

  const discountedTotal = useMemo(() => {
    if (!appliedPercent) return baseTotal;
    return Math.max(0, baseTotal * (1 - appliedPercent / 100));
  }, [appliedPercent, baseTotal]);

  const handleApply = () => {
    const normalizedValue = value.trim().toUpperCase();
    if (!normalizedValue) {
      setStatus("invalid");
      setMessage("Enter a promo code to continue.");
      return;
    }

    setStatus("loading");
    setMessage("Checking promo code…");

    window.setTimeout(() => {
      const result = resolvePromo(normalizedValue);
      setStatus(result.status);
      setMessage(result.message);
      setAppliedPercent(result.status === "valid" ? result.percent : 0);

      if (result.status === "valid") {
        const nextDiscountedTotal = Math.max(0, baseTotal * (1 - result.percent / 100));
        onDiscountApplied?.({
          code: normalizedValue,
          percent: result.percent,
          discountedTotal: nextDiscountedTotal,
        });
      } else {
        onDiscountApplied?.({
          code: normalizedValue,
          percent: 0,
          discountedTotal: baseTotal,
        });
      }
    }, 500);
  };

  const handleClear = () => {
    setValue("");
    setStatus("idle");
    setMessage("");
    setAppliedPercent(0);
    onDiscountApplied?.({
      code: "",
      percent: 0,
      discountedTotal: baseTotal,
    });
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setValue("");
      setStatus("idle");
      setMessage("");
      setAppliedPercent(0);
      onDiscountApplied?.({
        code: "",
        percent: 0,
        discountedTotal: baseTotal,
      });
      return;
    }

    setIsOpen(true);
  };

  const toneClasses: Record<string, string> = {
    valid: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
    invalid: "border-rose-400/30 bg-rose-400/10 text-rose-100",
    expired: "border-amber-400/30 bg-amber-400/10 text-amber-100",
    loading: "border-cyan-400/30 bg-cyan-400/10 text-cyan-100",
    idle: "border-white/10 bg-white/5 text-slate-300",
  };

  const iconClasses = {
    valid: <Check className="h-4 w-4" aria-hidden="true" />,
    invalid: <XCircle className="h-4 w-4" aria-hidden="true" />,
    expired: <XCircle className="h-4 w-4" aria-hidden="true" />,
    loading: <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />,
    idle: <Tag className="h-4 w-4" aria-hidden="true" />,
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
      <button
        type="button"
        onClick={handleToggle}
        className="flex w-full items-center justify-between rounded-xl px-2 py-2 text-left text-sm font-semibold text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        aria-expanded={isOpen}
        aria-controls="promo-code-panel"
      >
        <span className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-cyan-400" aria-hidden="true" />
          Add promo code
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <div id="promo-code-panel" className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="promo-code-input">
              Promo code
            </label>
            <input
              id="promo-code-input"
              value={value}
              onChange={(event) => setValue(event.target.value.toUpperCase())}
              placeholder="Enter code"
              className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              autoCapitalize="characters"
              autoComplete="off"
              inputMode="text"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleApply}
                className="rounded-xl bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                Clear
              </button>
            </div>
          </div>

          {status !== "idle" && (
            <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${toneClasses[status]}`} role="status" aria-live="polite">
              {iconClasses[status]}
              <div>
                <p className="font-semibold">{message}</p>
                {status === "valid" && appliedPercent > 0 && (
                  <p className="mt-0.5 text-xs text-emerald-100/90">{appliedPercent}% off the booking total</p>
                )}
              </div>
            </div>
          )}

          {appliedPercent > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
              <span className="flex items-center gap-2 font-semibold">
                <Check className="h-4 w-4" aria-hidden="true" />
                {value.toUpperCase()} applied
              </span>
              <span className="text-xs text-emerald-100/80">{appliedPercent}% off</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Example codes: SAVE20, EARLYBIRD</span>
            <span>Discounted total: {discountedTotal.toFixed(2)} XLM</span>
          </div>
        </div>
      )}
    </div>
  );
}
