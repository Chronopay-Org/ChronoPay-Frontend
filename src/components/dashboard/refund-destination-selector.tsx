"use client";

import {
  useCallback,
  useId,
  useState,
  useRef,
  useEffect,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import clsx from "clsx";
import { Wallet, CreditCard, Zap, Clock, Info } from "lucide-react";
import { PanelShell } from "./panel-shell";
import { Tooltip } from "@/app/components/ui/tooltip";
import { RefundConfirmationModal } from "./refund-confirmation-modal";
import type {
  RefundDestination,
  RefundDestinationOption,
  RefundDestinationSubmission,
} from "./types";

const DEFAULT_DESTINATIONS: readonly RefundDestinationOption[] = [
  {
    id: "wallet",
    label: "ChronoPay Wallet",
    description:
      "Instant credit to your wallet balance. Use for future bookings or withdraw anytime.",
    eta: "Within minutes",
    fee: "No fees",
    icon: "Wallet",
    recommended: true,
    badge: "Recommended",
  },
  {
    id: "card",
    label: "Original Card",
    description:
      "Refund to the card used for payment. Standard bank processing times apply.",
    eta: "3–10 business days",
    fee: "Card network fees may apply",
    icon: "CreditCard",
  },
] as const;

export const REFUND_ICON_MAP: Record<string, React.ReactNode> = {
  Wallet: <Wallet className="h-5 w-5" aria-hidden="true" />,
  CreditCard: <CreditCard className="h-5 w-5" aria-hidden="true" />,
};

export type RefundDestinationSelectorProps = {
  /** Called when the user confirms their selection. */
  onConfirm?: (submission: RefundDestinationSubmission) => void;
  /** Override the default destination options. */
  destinations?: readonly RefundDestinationOption[];
  /** Panel title. */
  title?: string;
  /** Panel eyebrow label. */
  eyebrow?: string;
  /** Supporting description under the title. */
  description?: string;
  /** Optional className on the outer PanelShell section. */
  className?: string;
  /** Hide the PanelShell chrome when embedding in an existing dialog. */
  bare?: boolean;
};

/**
 * RefundDestinationSelector — accessible two-card selector for choosing
 * refund destination (wallet vs original card) with tradeoff copy, badges,
 * and tooltips for fees and ETA details.
 *
 * Accessibility (WCAG 2.1 AA):
 *   - radiogroup with arrow-key navigation between cards
 *   - visible focus rings (cyan)
 *   - LiveRegion announces the default recommendation on mount
 *   - Tooltips are keyboard-accessible via the shared Tooltip component
 *   - Confirmation modal with FocusTrap and Escape dismiss
 */
export function RefundDestinationSelector({
  onConfirm,
  destinations = DEFAULT_DESTINATIONS,
  title = "Refund destination",
  eyebrow = "Payout",
  description = "Choose where your refund should be sent. Wallet refunds are instant and fee-free.",
  className = "",
  bare = false,
}: RefundDestinationSelectorProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const groupId = `${baseId}-destinations`;
  const groupLabelId = `${baseId}-destinations-label`;
  const statusId = `${baseId}-status`;

  // Default to the recommended option or first option
  const defaultDestination =
    destinations.find((d) => d.recommended) ?? destinations[0];
  const [selectedId, setSelectedId] = useState<RefundDestination>(
    defaultDestination?.id ?? "wallet",
  );
  const [announcement, setAnnouncement] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const initialAnnounced = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const selected =
    destinations.find((d) => d.id === selectedId) ?? destinations[0];

  const announce = useCallback((message: string) => {
    setAnnouncement("");
    window.setTimeout(() => {
      if (mountedRef.current) {
        setAnnouncement(message);
      }
    }, 0);
  }, []);

  // Announce the default choice on mount (once). Deferred to a timeout so the
  // live-region write doesn't run synchronously inside the effect body.
  useEffect(() => {
    if (!initialAnnounced.current && defaultDestination) {
      initialAnnounced.current = true;
      const recLabel = defaultDestination.recommended
        ? " (recommended)"
        : "";
      const message =
        `Default refund destination: ${defaultDestination.label}${recLabel}. ${defaultDestination.eta}, ${defaultDestination.fee}.`;
      window.setTimeout(() => announce(message), 0);
    }
  }, [announce, defaultDestination]);

  const selectDestination = useCallback(
    (id: RefundDestination) => {
      setSelectedId(id);
      setConfirmed(false);
      const option = destinations.find((d) => d.id === id);
      if (option) {
        const recLabel = option.recommended ? " (recommended)" : "";
        announce(
          `Selected: ${option.label}${recLabel}. ${option.eta}, ${option.fee}.`,
        );
      }
    },
    [announce, destinations],
  );

  const handleCardKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (
      !["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"].includes(event.key)
    ) {
      return;
    }
    event.preventDefault();

    let nextIndex = index;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (index + 1) % destinations.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + destinations.length) % destinations.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = destinations.length - 1;
    }

    const next = destinations[nextIndex];
    selectDestination(next.id);
    const nextButton = document.getElementById(`${groupId}-${next.id}`);
    nextButton?.focus();
  };

  const handleConfirm = () => {
    if (!selected) return;
    setIsModalOpen(true);
  };

  const handleModalConfirm = () => {
    if (!selected) return;
    const submission: RefundDestinationSubmission = {
      destination: selected.id,
      option: selected,
    };
    onConfirm?.(submission);
    setIsModalOpen(false);
    setConfirmed(true);
    announce(
      `Refund confirmed: ${selected.label}. ${selected.eta}, ${selected.fee}.`,
    );
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const body = (
    <div className={clsx("space-y-5", className)}>
      {bare ? (
        <div className="space-y-1">
          <h2 id={titleId} className="text-lg font-semibold text-white">
            {title}
          </h2>
          <p id={descriptionId} className="text-sm leading-6 text-slate-300">
            {description}
          </p>
        </div>
      ) : null}

      <p id={groupLabelId} className="text-sm font-medium text-slate-200">
        Select destination
      </p>

      <div
        role="radiogroup"
        id={groupId}
        aria-labelledby={groupLabelId}
        aria-describedby={bare ? descriptionId : undefined}
        aria-required="true"
        className="grid gap-4 sm:grid-cols-2"
      >
        {destinations.map((dest, index) => {
          const checked = selectedId === dest.id;
          return (
            <button
              key={dest.id}
              id={`${groupId}-${dest.id}`}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={checked ? 0 : -1}
              onClick={() => selectDestination(dest.id)}
              onKeyDown={(event) => handleCardKeyDown(event, index)}
              className={clsx(
                "group relative flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                checked
                  ? "border-cyan-300/50 bg-cyan-300/10 ring-1 ring-cyan-300/30"
                  : "border-white/12 bg-white/5 text-slate-200 hover:border-cyan-200/30 hover:bg-white/10",
              )}
            >
              {/* Badge */}
              {dest.badge ? (
                <span
                  className={clsx(
                    "absolute -top-2.5 right-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
                    checked
                      ? "bg-cyan-300 text-slate-950"
                      : "bg-cyan-100/90 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
                  )}
                >
                  {dest.badge}
                </span>
              ) : null}

              {/* Icon + Title row */}
              <div className="flex items-center gap-3">
                <span
                  className={clsx(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    checked
                      ? "bg-cyan-300/20 text-cyan-300"
                      : "bg-white/10 text-slate-400 group-hover:text-slate-200",
                  )}
                >
                  {REFUND_ICON_MAP[dest.icon] ?? (
                    <Info className="h-5 w-5" aria-hidden="true" />
                  )}
                </span>
                <span className="text-sm font-semibold text-white">
                  {dest.label}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs leading-5 text-slate-400">
                {dest.description}
              </p>

              {/* Tradeoff details: ETA and Fees with tooltip icons */}
              <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                  <Clock className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span className="font-medium">{dest.eta}</span>
                  <Tooltip
                    content={`Estimated arrival time for refunds to ${dest.label.toLowerCase()}.`}
                    ariaLabel={`ETA info for ${dest.label}`}
                  />
                </span>

                <span className="inline-flex items-center gap-1.5 text-xs text-slate-300">
                  <Zap className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                  <span className="font-medium">{dest.fee}</span>
                  <Tooltip
                    content={`Fee details for refunds to ${dest.label.toLowerCase()}.`}
                    ariaLabel={`Fee info for ${dest.label}`}
                  />
                </span>
              </div>

              {/* Check indicator for selected card */}
              {checked ? (
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-cyan-300"
                  aria-hidden="true"
                >
                  <svg
                    className="h-3 w-3 text-slate-950"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Confirm button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400" aria-live="polite">
          {selected
            ? `Selected: ${selected.label} — ${selected.eta}, ${selected.fee}`
            : "Select a destination to continue."}
        </p>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!selected || confirmed}
          className={clsx(
            "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
            selected && !confirmed
              ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
              : "cursor-not-allowed bg-white/10 text-slate-500",
          )}
        >
          {confirmed ? "Refund confirmed" : "Confirm refund destination"}
        </button>
      </div>

      {/* Screen reader live region */}
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    </div>
  );

  return (
    <>
      {bare ? (
        body
      ) : (
        <PanelShell
          eyebrow={eyebrow}
          title={title}
          description={description}
          id={`${baseId}-panel`}
        >
          {body}
        </PanelShell>
      )}

      {selected ? (
        <RefundConfirmationModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onConfirm={handleModalConfirm}
          destination={selected}
        />
      ) : null}
    </>
  );
}
