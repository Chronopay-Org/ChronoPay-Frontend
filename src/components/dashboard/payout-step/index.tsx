"use client";

/**
 * PayoutStep
 *
 * The "Payout account" step in the supplier onboarding flow. Suppliers
 * configure where and in which currency they receive payouts, review a
 * preview of their connected wallet, and provide signed consent for the
 * payout terms.
 *
 * States
 * ------
 * idle     – Form with currency selector, consent checkbox, payout preview
 * pending  – Saving/connecting the payout account
 * success  – Payout account configured successfully
 * error    – Connection failure with retry option
 *
 * Accessibility (WCAG 2.1 AA)
 * ---------------------------
 * - PanelShell provides header semantics + eyebrow + description
 * - Currency radio group with arrow-key navigation
 * - Consent checkbox with aria-required and linked error
 * - Error text uses role="alert"
 * - LiveRegion for screen reader announcements
 * - aria-busy on the save button during submission
 */

import { useState, useCallback, useId, useRef } from "react";
import { PanelShell } from "../panel-shell";
import { StatusChip } from "../status-chip";
import { ButtonLink } from "@/app/components/ui/button-link";
import { LiveRegion } from "@/components/common/LiveRegion";
import { Wallet, CheckCircle, AlertTriangle } from "lucide-react";
import type { DraftStatus, Tone } from "../types";

// ── Types ──────────────────────────────────────────────────────────────────────

export type PayoutCurrency = "XLM" | "USDC" | "EURC";

export interface PayoutConsent {
  accepted: boolean;
  acceptedAt: Date | null;
}

export interface PayoutPreview {
  walletAddress: string;
  walletLabel: string;
  network: string;
}

export type PayoutStepStatus = "idle" | "pending" | "success" | "error";

export interface PayoutStepProps {
  preview?: PayoutPreview | null;
  onSave: (currency: PayoutCurrency, consent: PayoutConsent) => Promise<void>;
  onBack?: () => void;
  status?: PayoutStepStatus;
  errorMessage?: string;
  onRetry?: () => void;
  initialCurrency?: PayoutCurrency;
  draftStatus?: DraftStatus;
  lastSavedLabel?: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const CURRENCIES: {
  value: PayoutCurrency;
  label: string;
  network: string;
  description: string;
}[] = [
  {
    value: "XLM",
    label: "XLM (Lumens)",
    network: "Stellar",
    description: "Native Stellar asset — low fees, fast settlement.",
  },
  {
    value: "USDC",
    label: "USDC",
    network: "Stellar",
    description: "USD-pegged stablecoin on the Stellar network.",
  },
  {
    value: "EURC",
    label: "EURC",
    network: "Stellar",
    description: "EUR-pegged stablecoin on the Stellar network.",
  },
];

const STATUS_TONE: Record<DraftStatus, Tone> = {
  saved: "positive",
  saving: "warning",
  offline: "neutral",
};

const STATUS_LABEL: Record<DraftStatus, string> = {
  saved: "Saved as draft",
  saving: "Saving…",
  offline: "Offline — changes local only",
};

const CONSENT_TEXT =
  "I authorise ChronoPay to send payout funds to the connected wallet address using the selected currency. I understand that payout timing depends on network conditions and that I can update my payout settings at any time from my account settings.";

// ── Helpers ────────────────────────────────────────────────────────────────────

function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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

function PayoutAccountPreview({
  preview,
  currency,
}: {
  preview: PayoutPreview;
  currency: PayoutCurrency;
}) {
  const currencyMeta = CURRENCIES.find((c) => c.value === currency);
  return (
    <div
      className="rounded-2xl border border-cyan-300/20 bg-cyan-950/20 p-4"
      aria-label="Payout destination preview"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-300/20 text-cyan-300">
          <Wallet className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Payout destination
          </p>
          <p className="text-sm font-medium text-white">{preview.walletLabel}</p>
          <p className="font-mono text-xs text-slate-400">
            {truncateAddress(preview.walletAddress)}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              Connected
            </span>
            <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-300">
              {preview.network}
            </span>
            {currencyMeta && (
              <span className="inline-flex items-center rounded-full bg-cyan-900/30 px-2 py-0.5 text-[10px] font-medium text-cyan-300">
                {currencyMeta.label}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function PayoutStep({
  preview = null,
  onSave,
  onBack,
  status: externalStatus,
  errorMessage,
  onRetry,
  initialCurrency = "XLM",
  draftStatus = "saved",
  lastSavedLabel,
}: PayoutStepProps) {
  const [currency, setCurrency] = useState<PayoutCurrency>(initialCurrency);
  const [consent, setConsent] = useState<PayoutConsent>({
    accepted: false,
    acceptedAt: null,
  });
  const [localStatus, setLocalStatus] = useState<PayoutStepStatus>("idle");
  const [localError, setLocalError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const announcementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const status = externalStatus ?? localStatus;
  const displayError = errorMessage ?? localError;

  // Combined validity
  const canSubmit = consent.accepted;

  const announce = useCallback((msg: string) => {
    setAnnouncement("");
    if (announcementTimer.current) clearTimeout(announcementTimer.current);
    requestAnimationFrame(() => {
      setAnnouncement(msg);
      announcementTimer.current = setTimeout(() => setAnnouncement(""), 3000);
    });
  }, []);

  const handleCurrencyChange = useCallback((value: PayoutCurrency) => {
    setCurrency(value);
  }, []);

  const handleConsentChange = useCallback(
    (accepted: boolean) => {
      setConsent({
        accepted,
        acceptedAt: accepted ? new Date() : null,
      });
      if (accepted) {
        announce("Consent confirmed. You can now save your payout settings.");
      }
    },
    [announce],
  );

  const handleSave = useCallback(async () => {
    if (!canSubmit) return;
    setLocalStatus("pending");
    setLocalError(null);
    try {
      await onSave(currency, consent);
      setLocalStatus("success");
      announce("Payout settings saved successfully.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not save payout settings.";
      setLocalError(msg);
      setLocalStatus("error");
      announce(`Error: ${msg}`);
    }
  }, [canSubmit, currency, consent, onSave, announce]);

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else {
      setLocalStatus("idle");
      setLocalError(null);
    }
  }, [onRetry]);

  const handleReset = useCallback(() => {
    setLocalStatus("idle");
    setLocalError(null);
  }, []);

  const consentId = useId();
  const consentErrorId = useId();
  const currencyLabelId = useId();

  // ── Render ──────────────────────────────────────────────────────────────────

  // Success state
  if (status === "success") {
    return (
      <PanelShell
        eyebrow="Step 3 of 4"
        title="Payout account"
        description="Your payout account is configured and ready."
        action={
          <StatusChip tone="positive">
            Payouts active
          </StatusChip>
        }
      >
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle className="h-8 w-8 text-emerald-400" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">
              Payouts configured
            </h3>
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              Your payout account is ready to receive funds. You can review or
              change these settings at any time from your account settings.
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <ButtonLink
              href="#"
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                handleReset();
              }}
            >
              Edit settings
            </ButtonLink>
            {onBack && (
              <ButtonLink
                href="#"
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  onBack();
                }}
              >
                Next step
              </ButtonLink>
            )}
          </div>
        </div>
      </PanelShell>
    );
  }

  // Error state
  if (status === "error") {
    return (
      <PanelShell
        eyebrow="Step 3 of 4"
        title="Payout account"
        description="We ran into an issue while saving your payout settings."
        action={
          <StatusChip tone="critical">
            Connection issue
          </StatusChip>
        }
      >
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <AlertTriangle className="h-8 w-8 text-red-400" aria-hidden="true" />
          </span>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-white">
              Could not save payout settings
            </h3>
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              {displayError ||
                "An unexpected error occurred. Please try again."}
            </p>
          </div>
          <div className="flex gap-3 pt-2">
            <ButtonLink
              href="#"
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                handleReset();
              }}
            >
              Go back
            </ButtonLink>
            <ButtonLink
              href="#"
              variant="primary"
              size="sm"
              loading={status === "pending"}
              onClick={(e) => {
                e.preventDefault();
                handleRetry();
              }}
            >
              Retry
            </ButtonLink>
          </div>
        </div>
      </PanelShell>
    );
  }

  // Idle / pending state
  return (
    <PanelShell
      eyebrow="Step 3 of 4"
      title="Payout account"
      description="Connect a payout account to receive payments from your bookings. Choose your preferred currency, review the destination, and confirm consent."
      action={
        <StatusChip tone={STATUS_TONE[draftStatus]}>
          {STATUS_LABEL[draftStatus]}
          {draftStatus === "saved" && lastSavedLabel
            ? ` · ${lastSavedLabel}`
            : ""}
        </StatusChip>
      }
    >
      <div className="space-y-6">
        {/* Payout destination preview */}
        {preview && (
          <PayoutAccountPreview preview={preview} currency={currency} />
        )}

        {/* Currency selector */}
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
                selected={currency === c.value}
                onSelect={() => handleCurrencyChange(c.value)}
              />
            ))}
          </div>
        </fieldset>

        {/* Consent capture */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <div className="flex items-start gap-3">
            <div className="flex min-h-11 items-center">
              <input
                id={consentId}
                type="checkbox"
                checked={consent.accepted}
                onChange={(e) => handleConsentChange(e.target.checked)}
                aria-required="true"
                aria-describedby={
                  !consent.accepted ? consentErrorId : undefined
                }
                className="h-5 w-5 rounded border-white/20 bg-slate-800 accent-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              />
            </div>
            <div className="min-w-0">
              <label
                htmlFor={consentId}
                className="text-sm font-medium text-white"
              >
                I agree to the payout terms
              </label>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {CONSENT_TEXT}
              </p>
              {!consent.accepted && (
                <p
                  id={consentErrorId}
                  role="alert"
                  className="mt-2 text-xs font-medium text-rose-300"
                >
                  You must agree to the payout terms before saving.
                </p>
              )}
            </div>
          </div>
          {consent.accepted && consent.acceptedAt && (
            <p className="mt-3 text-[10px] text-slate-500">
              Consent recorded{" "}
              {consent.acceptedAt.toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-4">
          <p className="text-xs text-slate-400">
            You can update payout settings anytime from your account settings.
          </p>
          <div className="flex gap-3">
            {onBack && (
              <ButtonLink
                href="#"
                variant="secondary"
                size="md"
                disabled={status === "pending"}
                onClick={(e) => {
                  e.preventDefault();
                  onBack();
                }}
              >
                Back
              </ButtonLink>
            )}
            <ButtonLink
              href="#"
              variant="primary"
              size="md"
              disabled={!canSubmit || status === "pending"}
              loading={status === "pending"}
              aria-busy={status === "pending" || undefined}
              onClick={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              {status === "pending" ? "Saving…" : "Save & continue"}
            </ButtonLink>
          </div>
        </div>

        {/* Live region */}
        <div className="sr-only">
          <LiveRegion ariaLive="polite">{announcement}</LiveRegion>
        </div>
      </div>
    </PanelShell>
  );
}

export { CURRENCIES, truncateAddress };
