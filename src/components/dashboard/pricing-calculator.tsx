"use client";

import {
  useState,
  useEffect,
  useId,
  useCallback,
  type ChangeEvent,
} from "react";
import clsx from "clsx";
import {
  Calculator,
  Coins,
  TrendingUp,
  Clock,
  Layers,
  Zap,
} from "lucide-react";
import { Card, CardHeader, CardBody, CardFooter } from "./card";
import { Tooltip } from "@/app/components/ui/tooltip";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { glossary } from "@/lib/glossary";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FeeBreakdown {
  platformFee: number;
  networkFee: number;
  perSessionTakeHome: number;
  monthlyTakeHome: number;
  platformRate: number;
}

export interface PricingCalculatorProps {
  initialPrice?: number;
  initialDuration?: number;
  initialVolume?: number;
  platformRate?: number;
  networkFeePerTx?: number;
  onRecalculate?: (breakdown: FeeBreakdown) => void;
  className?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_PLATFORM_RATE = 0.05; // 5%
const DEFAULT_NETWORK_FEE = 0.01; // 0.01 XLM per session
const DEBOUNCE_MS = 250;

const PRICE_MIN = 0;
const PRICE_MAX = 500;
const PRICE_STEP = 5;

const DURATION_MIN = 15;
const DURATION_MAX = 240;
const DURATION_STEP = 15;

const VOLUME_MIN = 1;
const VOLUME_MAX = 200;
const VOLUME_STEP = 1;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Compute the effective session price from the base hourly rate and duration. */
function effectivePrice(hourlyRate: number, durationMinutes: number): number {
  return roundCents(hourlyRate * (durationMinutes / 60));
}

function safeCalc(
  hourlyRate: number,
  durationMinutes: number,
  volume: number,
  platformRate: number,
  networkFeePerTx: number,
): FeeBreakdown {
  if (hourlyRate <= 0 || durationMinutes <= 0 || volume <= 0) {
    return {
      platformFee: 0,
      networkFee: 0,
      perSessionTakeHome: 0,
      monthlyTakeHome: 0,
      platformRate,
    };
  }

  const sessionPrice = effectivePrice(hourlyRate, durationMinutes);
  const platformFee = roundCents(sessionPrice * platformRate);
  const networkFee = networkFeePerTx;
  const perSessionTakeHome = Math.max(
    0,
    roundCents(sessionPrice - platformFee - networkFee),
  );
  const monthlyTakeHome = roundCents(perSessionTakeHome * volume);

  return {
    platformFee,
    networkFee,
    perSessionTakeHome,
    monthlyTakeHome,
    platformRate,
  };
}

function roundCents(value: number): number {
  return Number(value.toFixed(2));
}

function formatXlm(value: number): string {
  return `${value.toFixed(2)} XLM`;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

// ─── Slider sub-component ────────────────────────────────────────────────────

interface SliderInputProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  icon: React.ReactNode;
  onChange: (value: number) => void;
  helperText?: React.ReactNode;
}

function SliderInput({
  id,
  label,
  value,
  min,
  max,
  step,
  unit,
  icon,
  onChange,
  helperText,
}: SliderInputProps) {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange],
  );

  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={id}
          className="flex items-center gap-2 text-sm font-medium text-[var(--helper-text-color)]"
        >
          <span
            className="text-[var(--helper-text-color-muted)]"
            aria-hidden="true"
          >
            {icon}
          </span>
          {label}
          {helperText}
        </label>
        <output
          htmlFor={id}
          className="text-sm font-semibold tabular-nums text-[var(--foreground)]"
          aria-live="polite"
        >
          {value} {unit}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        aria-valuetext={`${value} ${unit}`}
        style={{
          background: `linear-gradient(to right, var(--accent, #6ee7f9) 0%, var(--accent, #6ee7f9) ${progress}%, rgba(148,163,184,0.2) ${progress}%, rgba(148,163,184,0.2) 100%)`,
        }}
        className={[
          "w-full h-2 rounded-full appearance-none cursor-pointer",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--foreground)]",
          "[&::-webkit-slider-thumb]:shadow-[0_0_0_2px_var(--accent)]",
          "[&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-shadow",
          "[&::-webkit-slider-thumb]:hover:shadow-[0_0_0_3px_var(--accent)]",
          "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5",
          "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--foreground)]",
          "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[var(--accent)]",
          "[&::-moz-range-thumb]:cursor-pointer",
          "[&::-moz-range-track]:bg-transparent",
          "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full",
          "motion-reduce:transition-none",
          // RTL support: gradient direction mirrors
          "[dir='rtl']:bg-gradient-to-l",
        ].join(" ")}
      />
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function PricingCalculator({
  initialPrice = 50,
  initialDuration = 60,
  initialVolume = 20,
  platformRate = DEFAULT_PLATFORM_RATE,
  networkFeePerTx = DEFAULT_NETWORK_FEE,
  onRecalculate,
  className,
}: PricingCalculatorProps) {
  const [price, setPrice] = useState(initialPrice);
  const [duration, setDuration] = useState(initialDuration);
  const [volume, setVolume] = useState(initialVolume);

  const debouncedPrice = useDebounce(price, DEBOUNCE_MS);
  const debouncedDuration = useDebounce(duration, DEBOUNCE_MS);
  const debouncedVolume = useDebounce(volume, DEBOUNCE_MS);

  const breakdown = safeCalc(
    debouncedPrice,
    debouncedDuration,
    debouncedVolume,
    platformRate,
    networkFeePerTx,
  );

  const isCalculating =
    price !== debouncedPrice ||
    duration !== debouncedDuration ||
    volume !== debouncedVolume;

  const sessionPrice = effectivePrice(debouncedPrice, debouncedDuration);

  useEffect(() => {
    onRecalculate?.(breakdown);
  }, [breakdown, onRecalculate]);

  const titleId = useId();
  const summaryId = useId();

  const platformPercent = Math.round(platformRate * 100);

  return (
    <Card
      aria-labelledby={titleId}
      aria-describedby={summaryId}
      className={clsx(className)}
    >
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/10 text-cyan-300"
            aria-hidden="true"
          >
            <Calculator className="h-5 w-5" />
          </span>
          <div>
            <h3
              id={titleId}
              className="text-lg font-semibold text-[var(--foreground)]"
            >
              Fee Calculator
            </h3>
            <p className="text-xs text-[var(--helper-text-color-muted)]">
              Estimate your take-home after fees
            </p>
          </div>
        </div>
      </CardHeader>

      <CardBody className="mt-5 space-y-6">
        {/* ── Sliders ─────────────────────────────────────────────────────── */}
        <div className="space-y-5">
          <SliderInput
            id={`${titleId}-price`}
            label="Hourly rate"
            value={price}
            min={PRICE_MIN}
            max={PRICE_MAX}
            step={PRICE_STEP}
            unit="XLM/hr"
            icon={<Coins className="h-4 w-4" />}
            onChange={setPrice}
            helperText={<HelpPopover term={glossary.basePrice} />}
          />

          <SliderInput
            id={`${titleId}-duration`}
            label="Session duration"
            value={duration}
            min={DURATION_MIN}
            max={DURATION_MAX}
            step={DURATION_STEP}
            unit="min"
            icon={<Clock className="h-4 w-4" />}
            onChange={setDuration}
            helperText={<HelpPopover term={glossary.sessionDuration} />}
          />

          <SliderInput
            id={`${titleId}-volume`}
            label="Monthly volume"
            value={volume}
            min={VOLUME_MIN}
            max={VOLUME_MAX}
            step={VOLUME_STEP}
            unit="sessions"
            icon={<Layers className="h-4 w-4" />}
            onChange={setVolume}
          />
        </div>

        {/* ── Fee breakdown ───────────────────────────────────────────────── */}
        <div
          className={clsx(
            "rounded-2xl border p-4 transition-opacity duration-300",
            "border-[var(--border-subtle)] bg-[var(--surface)]",
            isCalculating && "opacity-50",
          )}
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--helper-text-color-muted)]">
            Per-session breakdown
          </p>
          <dl className="space-y-2.5">
            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="text-[var(--helper-text-color)]">
                Session price ({duration} min)
              </dt>
              <dd className="font-medium tabular-nums text-[var(--foreground)]">
                {formatXlm(sessionPrice)}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="flex items-center gap-1.5 text-[var(--helper-text-color)]">
                Platform fee ({platformPercent}%)
                <HelpPopover term={glossary.platformFee} />
              </dt>
              <dd className="font-medium tabular-nums text-[var(--accent-warm)]">
                −{formatXlm(breakdown.platformFee)}
              </dd>
            </div>

            <div className="flex items-center justify-between gap-4 text-sm">
              <dt className="flex items-center gap-1.5 text-[var(--helper-text-color)]">
                Network fee
                <Tooltip
                  content={`Stellar network fee of ${networkFeePerTx.toFixed(2)} XLM per transaction — covers ledger operations, token transfers, and escrow settlement.`}
                  ariaLabel="Help: what is the network fee?"
                />
              </dt>
              <dd className="font-medium tabular-nums text-[var(--accent-warm)]">
                −{formatXlm(breakdown.networkFee)}
              </dd>
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-2.5">
              <div className="flex items-center justify-between gap-4 text-sm">
                <dt className="flex items-center gap-1.5 text-[var(--helper-text-color)] font-medium">
                  <Zap
                    className="h-3.5 w-3.5 text-[var(--accent)]"
                    aria-hidden="true"
                  />
                  Per-session take-home
                  <HelpPopover term={glossary.takeHome} />
                </dt>
                <dd
                  className="font-semibold tabular-nums text-[var(--accent)]"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {formatXlm(breakdown.perSessionTakeHome)}
                </dd>
              </div>
            </div>
          </dl>
        </div>
      </CardBody>

      <CardFooter className="mt-4">
        <div
          id={summaryId}
          className={clsx(
            "flex items-center justify-between gap-4 rounded-2xl border p-4 transition-opacity duration-300",
            "bg-gradient-to-r from-[var(--accent)]/10 to-[var(--success)]/10",
            "border-[var(--accent)]/20",
            "[dir='rtl']:bg-gradient-to-l",
            isCalculating && "opacity-60",
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          <div>
            <p className="flex items-center gap-2 text-sm text-[var(--helper-text-color)]">
              <TrendingUp
                className="h-4 w-4 text-[var(--success)]"
                aria-hidden="true"
              />
              Monthly take-home
              <HelpPopover term={glossary.takeHome} />
            </p>
            <p className="text-xs text-[var(--helper-text-color-muted)] mt-0.5">
              {debouncedVolume > 0
                ? `${debouncedVolume} session${debouncedVolume !== 1 ? "s" : ""} × ${formatXlm(sessionPrice)}`
                : "No sessions selected"}
            </p>
          </div>
          <output
            className="text-2xl font-bold tabular-nums tracking-tight text-[var(--foreground)] sm:text-3xl"
            aria-live="polite"
          >
            {formatXlm(breakdown.monthlyTakeHome)}
          </output>
        </div>
      </CardFooter>
    </Card>
  );
}
