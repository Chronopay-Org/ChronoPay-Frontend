"use client";

import {
  useId,
  useState,
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import clsx from "clsx";
import {
  Smartphone,
  Shield,
  KeyRound,
  ExternalLink,
  HelpCircle,
} from "lucide-react";

export type TwoFactorMethodId = "sms" | "totp" | "hardware_key";

export type TwoFactorMethodOption = {
  id: TwoFactorMethodId;
  label: string;
  description: string;
  icon: "Smartphone" | "Shield" | "KeyRound";
  /** Estimated time to complete auth via this method. */
  eta?: string;
  /** A short badge label (e.g. "Recommended"). */
  badge?: string;
};

export const DEFAULT_FALLBACK_METHODS: readonly TwoFactorMethodOption[] = [
  {
    id: "sms",
    label: "SMS code",
    description:
      "Receive a one-time code via text message to your registered phone number.",
    icon: "Smartphone",
    eta: "~30 seconds",
  },
  {
    id: "totp",
    label: "Authenticator app",
    description:
      "Generate a time-based code from your authenticator app (Google Authenticator, Authy, etc.).",
    icon: "Shield",
    eta: "~15 seconds",
  },
  {
    id: "hardware_key",
    label: "Hardware security key",
    description:
      "Use a FIDO2 / WebAuthn security key (YubiKey, etc.) plugged into your device.",
    icon: "KeyRound",
    eta: "~10 seconds",
  },
];

export const METHOD_ICON_MAP: Record<string, React.ReactNode> = {
  Smartphone: <Smartphone className="h-5 w-5" aria-hidden="true" />,
  Shield: <Shield className="h-5 w-5" aria-hidden="true" />,
  KeyRound: <KeyRound className="h-5 w-5" aria-hidden="true" />,
};

export type TwoFactorFallbackPickerProps = {
  /** Called when the user selects a fallback method. */
  onSelect?: (method: TwoFactorMethodOption) => void;
  /** Override the default fallback method options. */
  methods?: readonly TwoFactorMethodOption[];
  /** Panel title. */
  title?: string;
  /** Supporting description under the title. */
  description?: string;
  /** Primary CTA label. */
  continueLabel?: string;
  /** "Help me sign in" link URL. */
  helpLinkHref?: string;
  /** "Help me sign in" link label. */
  helpLinkLabel?: string;
  /** Optional className on the outer container. */
  className?: string;
};

export function TwoFactorFallbackPicker({
  onSelect,
  methods = DEFAULT_FALLBACK_METHODS,
  title = "Choose another sign-in method",
  description = "Your primary two-factor method is unavailable. Pick one of your configured fallback methods below.",
  continueLabel = "Continue",
  helpLinkHref = "/help/sign-in",
  helpLinkLabel = "Help me sign in",
  className = "",
}: TwoFactorFallbackPickerProps) {
  const baseId = useId();
  const titleId = `${baseId}-title`;
  const descriptionId = `${baseId}-description`;
  const groupId = `${baseId}-methods`;
  const groupLabelId = `${baseId}-methods-label`;
  const statusId = `${baseId}-status`;

  const [selectedId, setSelectedId] = useState<TwoFactorMethodId | null>(
    methods[0]?.id ?? null,
  );
  const [announcement, setAnnouncement] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const initialAnnounced = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const selected = methods.find((m) => m.id === selectedId) ?? null;

  const announce = useCallback((message: string) => {
    setAnnouncement("");
    window.setTimeout(() => {
      if (mountedRef.current) {
        setAnnouncement(message);
      }
    }, 0);
  }, []);

  useEffect(() => {
    if (!initialAnnounced.current && methods.length > 0) {
      initialAnnounced.current = true;
      const first = methods[0];
      const message =
        `Default method: ${first.label}. ${first.eta ?? ""} Navigate with arrow keys.`;
      // Deferred so the live-region write doesn't run synchronously in the effect.
      window.setTimeout(() => announce(message), 0);
    }
  }, [announce, methods]);

  const selectMethod = useCallback(
    (id: TwoFactorMethodId) => {
      if (confirmed) return;
      setSelectedId(id);
      const option = methods.find((m) => m.id === id);
      if (option) {
        announce(`Selected: ${option.label}. ${option.eta ?? ""}`);
      }
    },
    [announce, methods, confirmed],
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
      nextIndex = (index + 1) % methods.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (index - 1 + methods.length) % methods.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = methods.length - 1;
    }

    const next = methods[nextIndex];
    selectMethod(next.id);
    const nextButton = document.getElementById(`${groupId}-${next.id}`);
    nextButton?.focus();
  };

  const handleContinue = () => {
    if (!selected || confirmed) return;
    setConfirmed(true);
    onSelect?.(selected);
    announce(`Continuing with: ${selected.label}.`);
  };

  return (
    <div
      className={clsx(
        "rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur sm:p-5 xl:p-6",
        className,
      )}
      role="region"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="space-y-1">
        <h2 id={titleId} className="text-xl font-semibold text-white">
          {title}
        </h2>
        <p id={descriptionId} className="text-sm leading-6 text-slate-300">
          {description}
        </p>
      </div>

      <div className="mt-5 space-y-5">
        <p
          id={groupLabelId}
          className="sr-only text-sm font-medium text-slate-200"
        >
          Available sign-in methods
        </p>

        <div
          role="radiogroup"
          id={groupId}
          aria-labelledby={groupLabelId}
          aria-describedby={descriptionId}
          aria-required="true"
          className="flex flex-col gap-3"
        >
          {methods.map((method, index) => {
            const checked = selectedId === method.id;
            return (
              <button
                key={method.id}
                id={`${groupId}-${method.id}`}
                type="button"
                role="radio"
                aria-checked={checked}
                tabIndex={checked ? 0 : -1}
                onClick={() => selectMethod(method.id)}
                onKeyDown={(event) => handleCardKeyDown(event, index)}
                className={clsx(
                  "group relative flex items-start gap-4 rounded-2xl border p-4 text-left transition-all",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                  checked
                    ? "border-cyan-300/50 bg-cyan-300/10 ring-1 ring-cyan-300/30"
                    : "border-white/12 bg-white/5 text-slate-200 hover:border-cyan-200/30 hover:bg-white/10",
                )}
              >
                {method.badge ? (
                  <span
                    className={clsx(
                      "absolute -top-2.5 right-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]",
                      checked
                        ? "bg-cyan-300 text-slate-950"
                        : "bg-cyan-100/90 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
                    )}
                  >
                    {method.badge}
                  </span>
                ) : null}

                <span
                  className={clsx(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
                    checked
                      ? "bg-cyan-300/20 text-cyan-300"
                      : "bg-white/10 text-slate-400 group-hover:text-slate-200",
                  )}
                >
                  {METHOD_ICON_MAP[method.icon] ?? (
                    <HelpCircle className="h-5 w-5" aria-hidden="true" />
                  )}
                </span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {method.label}
                    </span>
                    {method.eta ? (
                      <span className="text-xs text-slate-400">
                        &middot; {method.eta}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {method.description}
                  </p>
                </div>

                {checked ? (
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-300"
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-400" aria-live="polite">
            {selected
              ? `Selected: ${selected.label}${selected.eta ? ` \u2014 ${selected.eta}` : ""}`
              : "Select a method to continue."}
          </p>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!selected || confirmed}
            className={clsx(
              "inline-flex min-h-11 items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
              selected && !confirmed
                ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
                : "cursor-not-allowed bg-white/10 text-slate-500",
            )}
          >
            {confirmed ? "Continuing..." : continueLabel}
          </button>
        </div>

        <div className="border-t border-white/10 pt-4">
          <a
            href={helpLinkHref}
            className={clsx(
              "inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition-colors",
              "hover:text-cyan-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-md",
            )}
          >
            <HelpCircle className="h-4 w-4" aria-hidden="true" />
            {helpLinkLabel}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>

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
}
