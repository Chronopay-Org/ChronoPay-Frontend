"use client";

/**
 * PayoutStep
 *
 * The "Payout account" step in the supplier onboarding flow. Composed of
 * focused sub-components for destination type, currency selection, Stellar
 * address + memo entry with inline validation, and a live payout summary.
 * In-progress entries persist to sessionStorage via `usePayoutDraft`
 * (backed by `useStoredState`) so reloading resumes where the user left off.
 */

import { useState, useCallback, useId, useRef, useMemo } from "react";
import { PanelShell } from "../panel-shell";
import { StatusChip } from "../status-chip";
import { ButtonLink } from "@/app/components/ui/button-link";
import { LiveRegion } from "@/components/common/LiveRegion";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { DestinationTypeSelector } from "./destination-type";
import { CurrencySelector } from "./currency-selector";
import { AddressField } from "./address-field";
import { PayoutSummary } from "./payout-summary";
import { usePayoutDraft } from "./use-payout-draft";
import {
  validateStellarAddress,
  validateStellarMemo,
} from "./validation";
import {
  CONSENT_TEXT,
  STATUS_LABEL,
  STATUS_TONE,
  type PayoutConsent,
  type PayoutCurrency,
  type PayoutDestinationType,
  type PayoutStepProps,
  type PayoutStepStatus,
} from "./types";

export function PayoutStep({
  preview = null,
  onSave,
  onBack,
  onNext,
  status: externalStatus,
  errorMessage,
  onRetry,
  initialCurrency = "XLM",
  initialDestinationType = "connected_wallet",
  initialAddress = "",
  initialMemo = "",
  storageKey,
  draftStatus = "saved",
  lastSavedLabel,
}: PayoutStepProps) {
  const {
    draft,
    setDestinationType,
    setCurrency,
    setCustomAddress,
    setMemo,
    clearDraft,
  } = usePayoutDraft({
    storageKey,
    initialCurrency,
    initialDestinationType,
    initialAddress,
    initialMemo,
  });

  const [consent, setConsent] = useState<PayoutConsent>({
    accepted: false,
    acceptedAt: null,
  });
  const [localStatus, setLocalStatus] = useState<PayoutStepStatus>("idle");
  const [localError, setLocalError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [touchedAddress, setTouchedAddress] = useState(false);
  const [touchedMemo, setTouchedMemo] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  const announcementTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const memoInputRef = useRef<HTMLInputElement | null>(null);
  const consentInputRef = useRef<HTMLInputElement | null>(null);

  const status = externalStatus ?? localStatus;
  const displayError = errorMessage ?? localError;

  const isCustomAddress = draft.destinationType === "stellar_address";

  const addressValidation = useMemo(
    () =>
      isCustomAddress
        ? validateStellarAddress(draft.customAddress)
        : { valid: true },
    [isCustomAddress, draft.customAddress],
  );

  const memoValidation = useMemo(
    () =>
      isCustomAddress
        ? validateStellarMemo(draft.memo)
        : { valid: true, byteLength: 0 },
    [isCustomAddress, draft.memo],
  );

  const connectedWalletValid = useMemo(() => {
    if (isCustomAddress || !preview) return true;
    const trimmed = preview.walletAddress.trim();
    if (trimmed.length === 0) return true;
    return trimmed.startsWith("G") && trimmed.length >= 56;
  }, [isCustomAddress, preview]);

  const isFormValid =
    consent.accepted &&
    addressValidation.valid &&
    memoValidation.valid &&
    connectedWalletValid;

  const announce = useCallback((msg: string) => {
    setAnnouncement("");
    if (announcementTimer.current) clearTimeout(announcementTimer.current);
    requestAnimationFrame(() => {
      setAnnouncement(msg);
      announcementTimer.current = setTimeout(() => setAnnouncement(""), 3000);
    });
  }, []);

  const handleDestinationTypeChange = useCallback(
    (value: PayoutDestinationType) => {
      setDestinationType(value);
      setAttemptedSubmit(false);
    },
    [setDestinationType],
  );

  const handleCurrencyChange = useCallback(
    (value: PayoutCurrency) => {
      setCurrency(value);
    },
    [setCurrency],
  );

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

  const focusFirstInvalidField = useCallback(() => {
    if (isCustomAddress && !addressValidation.valid) {
      addressInputRef.current?.focus();
      if (addressValidation.error) announce(addressValidation.error);
      return;
    }
    if (isCustomAddress && !memoValidation.valid) {
      memoInputRef.current?.focus();
      if (memoValidation.error) announce(memoValidation.error);
      return;
    }
    if (!consent.accepted) {
      consentInputRef.current?.focus();
      announce("You must agree to the payout terms before saving.");
    }
  }, [
    isCustomAddress,
    addressValidation,
    memoValidation,
    consent.accepted,
    announce,
  ]);

  const handleSave = useCallback(async () => {
    if (status === "pending") return;

    if (!isFormValid) {
      setAttemptedSubmit(true);
      focusFirstInvalidField();
      return;
    }

    setLocalStatus("pending");
    setLocalError(null);
    try {
      await onSave(draft.currency, consent);
      clearDraft();
      setLocalStatus("success");
      announce("Payout settings saved successfully.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Could not save payout settings.";
      setLocalError(msg);
      setLocalStatus("error");
      announce(`Error: ${msg}`);
    }
  }, [
    status,
    isFormValid,
    focusFirstInvalidField,
    onSave,
    draft.currency,
    consent,
    clearDraft,
    announce,
  ]);

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

  // ── Render ──────────────────────────────────────────────────────────────────

  if (status === "success") {
    return (
      <PanelShell
        eyebrow="Step 3 of 4"
        title="Payout account"
        description="Your payout account is configured and ready."
        action={<StatusChip tone="positive">Payouts active</StatusChip>}
      >
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle
              className="h-8 w-8 text-emerald-400"
              aria-hidden="true"
            />
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
            {onNext && (
              <ButtonLink
                href="#"
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  onNext();
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

  if (status === "error") {
    return (
      <PanelShell
        eyebrow="Step 3 of 4"
        title="Payout account"
        description="We ran into an issue while saving your payout settings."
        action={<StatusChip tone="critical">Connection issue</StatusChip>}
      >
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
            <AlertTriangle
              className="h-8 w-8 text-red-400"
              aria-hidden="true"
            />
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
              loading={false}
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
        <PayoutSummary
          preview={preview}
          destinationType={draft.destinationType}
          customAddress={draft.customAddress}
          memo={draft.memo}
          currency={draft.currency}
        />

        <DestinationTypeSelector
          value={draft.destinationType}
          onChange={handleDestinationTypeChange}
          hasConnectedWallet={Boolean(preview)}
        />

        {isCustomAddress && (
          <AddressField
            address={draft.customAddress}
            onAddressChange={setCustomAddress}
            addressError={addressValidation.error}
            showAddressError={touchedAddress || attemptedSubmit}
            addressInputRef={addressInputRef}
            memo={draft.memo}
            onMemoChange={setMemo}
            memoError={memoValidation.error}
            memoByteLength={memoValidation.byteLength}
            showMemoError={touchedMemo || attemptedSubmit}
            memoInputRef={memoInputRef}
            onAddressBlur={() => setTouchedAddress(true)}
            onMemoBlur={() => setTouchedMemo(true)}
          />
        )}

        <CurrencySelector
          value={draft.currency}
          onChange={handleCurrencyChange}
        />

        <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <div className="flex items-start gap-3">
            <div className="flex min-h-11 items-center">
              <input
                ref={consentInputRef}
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
              disabled={!isFormValid || status === "pending"}
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

        <div className="sr-only">
          <LiveRegion ariaLive="polite">{announcement}</LiveRegion>
        </div>
      </div>
    </PanelShell>
  );
}

export {
  CURRENCIES,
  DESTINATION_TYPES,
  PAYOUT_STEPS,
  truncateAddress,
} from "./types";
export type {
  PayoutConsent,
  PayoutCurrency,
  PayoutDestinationType,
  PayoutDraft,
  PayoutPreview,
  PayoutStepProps,
  PayoutStepStatus,
} from "./types";
export {
  STELLAR_ADDRESS_LENGTH,
  STELLAR_MEMO_MAX_BYTES,
  validateStellarAddress,
  validateStellarMemo,
} from "./validation";
export type { ValidationResult, MemoValidationResult } from "./validation";
export { DestinationTypeSelector } from "./destination-type";
export { CurrencySelector } from "./currency-selector";
export { AddressField } from "./address-field";
export { PayoutSummary } from "./payout-summary";
export { usePayoutDraft, DEFAULT_PAYOUT_STORAGE_KEY } from "./use-payout-draft";
