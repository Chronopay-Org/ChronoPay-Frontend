"use client";

import { useId } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "./card";
import { StatusChip } from "./status-chip";
import type { Tone } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SecurityItemStatus =
  | "enabled"
  | "disabled"
  | "not-setup"
  | "attention";

export type SecurityItem = {
  id: string;
  label: string;
  description: string;
  status: SecurityItemStatus;
  statusLabel: string;
  tone: Tone;
  ctaLabel: string;
  onAction: () => void;
};

export type SecurityStatusCardProps = {
  /**
   * Security items to display. Defaults to 2FA, recovery key, and active
   * sessions when omitted.
   */
  items?: SecurityItem[];
  /** Visually hidden heading accessible to screen readers. */
  heading?: string;
};

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

const defaultStatusChip: Record<SecurityItemStatus, string> = {
  enabled: "Enabled",
  disabled: "Disabled",
  "not-setup": "Not set up",
  attention: "Action needed",
};

const defaultTone: Record<SecurityItemStatus, Tone> = {
  enabled: "positive",
  disabled: "warning",
  "not-setup": "muted",
  attention: "critical",
};

export function createSecurityItems(
  overrides: Partial<Record<string, SecurityItemStatus>> = {},
): SecurityItem[] {
  const twoFactorStatus = overrides.twoFactor ?? "disabled";
  const recoveryStatus = overrides.recovery ?? "not-setup";
  const sessionsStatus = overrides.sessions ?? "enabled";

  return [
    {
      id: "two-factor",
      label: "Two-factor authentication",
      description:
        twoFactorStatus === "enabled"
          ? "Your account is protected by 2FA."
          : "Add an extra layer of security to your account.",
      status: twoFactorStatus,
      statusLabel: defaultStatusChip[twoFactorStatus],
      tone: defaultTone[twoFactorStatus],
      ctaLabel:
        twoFactorStatus === "enabled"
          ? "Manage 2FA"
          : "Set up 2FA",
      onAction: () => {},
    },
    {
      id: "recovery-key",
      label: "Recovery key",
      description:
        recoveryStatus === "enabled"
          ? "Recovery codes have been saved."
          : "Save recovery codes to regain access if you lose your device.",
      status: recoveryStatus,
      statusLabel: defaultStatusChip[recoveryStatus],
      tone: defaultTone[recoveryStatus],
      ctaLabel:
        recoveryStatus === "enabled"
          ? "Review recovery key"
          : "Generate recovery key",
      onAction: () => {},
    },
    {
      id: "active-sessions",
      label: "Active sessions",
      description: "You have devices signed in to your account.",
      status: sessionsStatus,
      statusLabel: defaultStatusChip[sessionsStatus],
      tone: defaultTone[sessionsStatus],
      ctaLabel: "Review sessions",
      onAction: () => {},
    },
  ];
}

export const DEFAULT_SECURITY_ITEMS = createSecurityItems();

// ---------------------------------------------------------------------------
// SecurityStatusCard
// ---------------------------------------------------------------------------

/**
 * SecurityStatusCard — displays a tri-row summary of wallet security settings
 * (2FA, recovery key, active sessions) with per-row status chips and CTAs.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - Card is labelled by its heading
 *   - Each row uses semantic list markup
 *   - CTAs are `<button>` elements with descriptive aria-label
 *   - Status chips include aria-label for screen readers
 *   - Visible focus rings via `focus-visible:ring-cyan-300`
 *   - Polite live region announces state changes
 */
export function SecurityStatusCard({
  items = DEFAULT_SECURITY_ITEMS,
  heading = "Security status",
}: SecurityStatusCardProps) {
  const baseId = useId();
  const headingId = `${baseId}-heading`;
  const listId = `${baseId}-list`;
  const announceId = `${baseId}-announce`;

  return (
    <Card
      aria-labelledby={headingId}
      aria-describedby={announceId}
      role="region"
    >
      {/* Polite announcement for screen readers */}
      <p
        id={announceId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        Security status summary loaded. {items.length} item
        {items.length !== 1 ? "s" : ""} to review.
      </p>

      <CardHeader>
        <h2
          id={headingId}
          className="text-sm font-semibold text-white"
        >
          {heading}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Review your account security settings and active sessions.
        </p>
      </CardHeader>

      <CardBody className="mt-5">
        <ul
          id={listId}
          role="list"
          className="divide-y divide-white/10"
          aria-label="Security items"
        >
          {items.map((item, index) => (
            <SecurityRow
              key={item.id}
              item={item}
              index={index}
              baseId={baseId}
            />
          ))}
        </ul>
      </CardBody>

      <CardFooter className="mt-5">
        <p className="text-xs text-slate-500">
          Review each item to ensure your account is secure.
        </p>
      </CardFooter>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// SecurityRow
// ---------------------------------------------------------------------------

function SecurityRow({
  item,
  index,
  baseId,
}: {
  item: SecurityItem;
  index: number;
  baseId: string;
}) {
  const rowId = `${baseId}-row-${item.id}`;
  const labelId = `${rowId}-label`;
  const descId = `${rowId}-desc`;

  return (
    <li
      className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
      data-testid={`security-row-${item.id}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p id={labelId} className="text-sm font-medium text-white">
            {item.label}
          </p>
          <StatusChip
            tone={item.tone}
            aria-label={`${item.label}: ${item.statusLabel}`}
          >
            {item.statusLabel}
          </StatusChip>
        </div>
        <p
          id={descId}
          className="mt-1 text-sm leading-5 text-slate-400"
        >
          {item.description}
        </p>
      </div>

      <button
        type="button"
        onClick={item.onAction}
        aria-label={`${item.ctaLabel} for ${item.label}`}
        aria-describedby={descId}
        className={[
          "inline-flex shrink-0 items-center justify-center rounded-full font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
          "focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
          "px-4 py-2.5 text-sm",
          "border border-white/12 bg-white/6 text-slate-100",
          "hover:border-cyan-200/30 hover:bg-white/10",
          "active:bg-white/12",
        ].join(" ")}
      >
        {item.ctaLabel}
      </button>
    </li>
  );
}
