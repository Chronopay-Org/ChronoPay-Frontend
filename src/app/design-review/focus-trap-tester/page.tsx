"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { FocusTrap } from "@/components/common/FocusTrap";
import { ReceiptModal } from "@/components/receipt/ReceiptModal";
import { WalletConnectModal } from "@/components/dashboard/WalletConnectModal";
import { HelpPopover } from "@/app/components/ui/help-popover";
import { testFocusTrap } from "@/components/common/focus-trap-test";
import type { FocusTrapTestResult } from "@/components/common/focus-trap-test";
import type { ReceiptData } from "@/components/receipt/types";
import type { WalletProvider } from "@/components/dashboard/WalletConnectModal";

type OverlayGroup = "focus-trap" | "inline" | "no-trap";

interface OverlayEntry {
  id: string;
  name: string;
  description: string;
  group: OverlayGroup;
  note?: string;
  /** How to find the trap container in the DOM once rendered. */
  getTrapContainer: () => HTMLElement | null;
  /** Render the overlay content. */
  render: (onClose: () => void) => React.ReactNode;
  /**
   * Optional async setup before the test runs.
   * Useful for components that require user interaction to open
   * (e.g. HelpPopover which needs a trigger click).
   */
  onBeforeTest?: () => Promise<void>;
}

const sampleReceipt: ReceiptData = {
  id: "rec_abc123",
  assetCode: "CHRONO-SLOT-1",
  title: "1:1 Strategy Session \u00b7 Apr 1, 2026",
  status: "settled",
  settledAt: "Apr 1, 2026 \u00b7 10:04 UTC",
  buyer: {
    name: "Alice Chen",
    role: "Product Manager",
    address: "GA7QY...V6KX",
  },
  seller: {
    name: "Dr. Sarah Jenkins",
    role: "Lead Product Architect",
    address: "GB2SY...W3PL",
  },
  lineItems: [
    { label: "Slot price", value: "180.00 XLM" },
    {
      label: "Network fee",
      value: "0.01 XLM",
      note: "Stellar base fee",
    },
    {
      label: "Platform fee",
      value: "2.80 XLM",
      note: "3 %",
    },
  ],
  total: "182.81 XLM",
  net: "180.00 XLM",
  txHash: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  escrowContract: "SC7QY...V6KX",
  trace: [
    {
      label: "Tokens locked in escrow",
      timestamp: "10:04:01 UTC",
      status: "complete",
    },
    {
      label: "Session completed",
      timestamp: "11:04:01 UTC",
      status: "complete",
    },
    {
      label: "Tokens released to seller",
      timestamp: "11:05:30 UTC",
      status: "complete",
    },
  ],
  explorerBaseUrl: "https://stellar.expert/explorer/public/tx",
};

const sampleProviders: WalletProvider[] = [
  { id: "freighter", name: "Freighter", icon: <span aria-hidden="true">{'\u{1F4B0}'}</span> },
  { id: "albedo", name: "Albedo", icon: <span aria-hidden="true">{'\u{1F319}'}</span> },
  { id: "xbull", name: "xBull", icon: <span aria-hidden="true">{'\u{1F402}'}</span> },
];

const OVERLAYS: OverlayEntry[] = [
  {
    id: "focus-trap-direct",
    name: "FocusTrap Direct",
    description:
      "The <FocusTrap> component wrapping four buttons and a link. Verifies Tab cycling through raw focusable elements.",
    group: "focus-trap",
    getTrapContainer: () =>
      document.querySelector<HTMLElement>("[data-testid='ft-direct']"),
    render: (onClose) => (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <FocusTrap>
          <div
            data-testid="ft-direct"
            role="dialog"
            aria-modal="true"
            aria-label="Direct focus trap test"
            className="rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl w-80 space-y-3"
          >
            <p className="text-sm font-semibold text-white">
              FocusTrap Direct Test
            </p>
            <button
              type="button"
              className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Button A
            </button>
            <button
              type="button"
              className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Button B
            </button>
            <button
              type="button"
              className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Button C
            </button>
            <a
              href="#"
              className="block text-center text-sm text-cyan-400 hover:text-cyan-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 rounded"
              onClick={(e) => e.preventDefault()}
            >
              Link D
            </a>
            <button
              type="button"
              onClick={onClose}
              className="block w-full rounded-full bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Close
            </button>
          </div>
        </FocusTrap>
      </div>
    ),
  },
  {
    id: "receipt-modal",
    name: "ReceiptModal",
    description:
      "On-chain receipt dialog with print, share, and copy affordances. Wrapped in <FocusTrap>.",
    group: "focus-trap",
    getTrapContainer: () =>
      document.querySelector<HTMLElement>(
        '[role="dialog"][aria-modal="true"]'
      ),
    render: (onClose) => (
      <ReceiptModal
        isOpen={true}
        onClose={onClose}
        receipt={sampleReceipt}
      />
    ),
  },
  {
    id: "wallet-connect-modal",
    name: "WalletConnectModal",
    description:
      "Wallet connection picker with idle/pending/success/error states. Wrapped in <FocusTrap>.",
    group: "focus-trap",
    getTrapContainer: () =>
      document.querySelector<HTMLElement>(
        '[role="dialog"][aria-modal="true"]'
      ),
    render: (onClose) => (
      <WalletConnectModal
        isOpen={true}
        onClose={onClose}
        providers={sampleProviders}
        status="idle"
        onConnect={() => {}}
      />
    ),
  },
  {
    id: "help-popover",
    name: "HelpPopover",
    description:
      "Inline glossary popover with an inline tab trap via React synthetic event handler. Non-modal (aria-modal=false).",
    group: "inline",
    note: "Uses inline onKeyDown handler (not FocusTrap component).",
    getTrapContainer: () =>
      document.querySelector<HTMLElement>(
        '[role="dialog"][aria-modal="false"]'
      ),
    render: () => (
      <div className="inline-flex items-center gap-2 p-4 border border-white/10 rounded-xl bg-white/5">
        <span className="text-sm text-slate-300">
          Glossary term with help popover:
        </span>
        <HelpPopover
          term={{
            title: "Focus trap test",
            body: "This popover exercises the inline tab trap on the close button and learn-more link.",
            learnMoreHref: "#",
            learnMoreLabel: "Example link \u2192",
          }}
        />
      </div>
    ),
    onBeforeTest: async () => {
      const trigger = document.querySelector<HTMLButtonElement>(
        'button[aria-expanded]'
      );
      trigger?.click();
      await new Promise((r) => setTimeout(r, 100));
    },
  },
  {
    id: "mobile-drawer",
    name: "Mobile Drawer",
    description:
      "Navigation drawer with manual focus trap via document-level keydown listener.",
    group: "inline",
    note: "Uses document.addEventListener for trap (not FocusTrap component).",
    getTrapContainer: () =>
      document.querySelector<HTMLElement>("[data-testid='ft-drawer']"),
    render: (onClose) => <DrawerTrap onClose={onClose} />,
  },
  {
    id: "toast-no-trap",
    name: "Toast (no trap)",
    description:
      "Non-blocking notification. Does NOT trap focus by design.",
    group: "no-trap",
    note: "Focus must NOT be trapped. Listed for completeness.",
    getTrapContainer: () => null,
    render: () => null,
  },
  {
    id: "tooltip-no-trap",
    name: "Tooltip (no trap)",
    description:
      "Lightweight hover/focus tooltip. Does NOT trap focus by design.",
    group: "no-trap",
    note: "Focus must NOT be trapped. Listed for completeness.",
    getTrapContainer: () => null,
    render: () => null,
  },
];

const GROUP_LABELS: Record<OverlayGroup, string> = {
  "focus-trap": "FocusTrap component",
  inline: "Inline tab trap",
  "no-trap": "No trap (intentional)",
};

const GROUP_COLORS: Record<OverlayGroup, string> = {
  "focus-trap":
    "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  inline: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  "no-trap": "text-slate-500 border-slate-500/30 bg-slate-500/10",
};

function DrawerTrap({ onClose }: { onClose: () => void }) {
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const focusable =
      drawerRef.current?.querySelectorAll<HTMLElement>(
        "a[href], button:not([disabled])"
      );
    const first = focusable?.[0];
    const last = focusable?.[focusable.length - 1];
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !focusable) return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handleTab);
    first?.focus();
    return () => document.removeEventListener("keydown", handleTab);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex">
      <div
        className="flex-1 cursor-default bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        role="presentation"
      />
      <div
        ref={drawerRef}
        data-testid="ft-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation drawer"
        className="w-64 h-full bg-slate-900 p-4 shadow-2xl border-l border-white/10"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation drawer"
          className="mb-4 rounded-md p-2 text-slate-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="block rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {"\u{1F3E0}"} Home
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="block rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {"\u{1F6D2}"} Marketplace
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="block rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {"\u{1F4C6}"} Calendar
          </a>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="block rounded-md px-3 py-2 text-sm text-slate-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            {"\u{1F558}"} History
          </a>
        </nav>
      </div>
    </div>
  );
}

function ResultDisplay({ result }: { result: FocusTrapTestResult }) {
  if (result.totalFocusableElements === 0) {
    return (
      <div className="text-xs text-slate-500 italic">
        No focusable elements found (expected for non-trapped overlays).
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
            result.pass
              ? "bg-emerald-400/15 text-emerald-300 border-emerald-400/30"
              : "bg-rose-400/15 text-rose-300 border-rose-400/30"
          }`}
        >
          {result.pass ? "PASS" : "FAIL"}
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          {result.totalFocusableElements} focusable element
          {result.totalFocusableElements !== 1 ? "s" : ""} \u00b7{" "}
          {result.steps.length} check{result.steps.length !== 1 ? "s" : ""}
        </span>
      </div>

      {result.firstOffendingElement && (
        <div className="text-[11px] text-rose-300 bg-rose-400/10 rounded-lg px-3 py-1.5 border border-rose-400/20">
          First offense: {result.firstOffendingElement}
        </div>
      )}

      <details>
        <summary className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">
          Step details ({result.steps.length})
        </summary>
        <ol className="mt-2 space-y-1">
          {result.steps.map((step) => (
            <li
              key={step.step}
              className={`text-[10px] font-mono flex items-start gap-2 ${
                step.status === "pass" ? "text-slate-500" : "text-rose-300"
              }`}
            >
              <span
                className={`shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] font-bold border ${
                  step.status === "pass"
                    ? "border-emerald-400/40 text-emerald-300 bg-emerald-400/10"
                    : "border-rose-400/40 text-rose-300 bg-rose-400/10"
                }`}
              >
                {step.status === "pass" ? "\u2713" : "\u2717"}
              </span>
              <span>
                <span className="font-semibold">{step.action}</span>
                {step.action === "initial-focus"
                  ? ` \u2192 ${step.toLabel ?? "(none)"}`
                  : `: ${step.fromLabel} \u2192 ${step.toLabel ?? "(none)"}`}
                <span
                  className={`ml-1.5 ${
                    step.status === "pass"
                      ? "text-emerald-400/60"
                      : "text-rose-300"
                  }`}
                >
                  [{step.status}]
                </span>
              </span>
            </li>
          ))}
        </ol>
      </details>
    </div>
  );
}

function OverlayCard({ entry }: { entry: OverlayEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<FocusTrapTestResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const testRunRef = useRef(false);

  const handleOpenTest = () => {
    setIsTesting(true);
    testRunRef.current = false;
    setResult(null);
    setIsOpen(true);
  };

  useEffect(() => {
    if (!isOpen || testRunRef.current) return;
    testRunRef.current = true;

    const run = async () => {
      if (entry.onBeforeTest) {
        await entry.onBeforeTest();
      }

      await new Promise((r) => setTimeout(r, 150));

      let trapContainer: HTMLElement | null = null;

      if (entry.group !== "no-trap") {
        trapContainer = entry.getTrapContainer();
      }

      if (trapContainer) {
        const testResult = testFocusTrap(trapContainer);
        setResult(testResult);
      } else {
        setResult({
          pass: true,
          totalFocusableElements: 0,
          steps: [],
        });
      }

      setIsOpen(false);
      setIsTesting(false);
    };

    const timer = setTimeout(run, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <div
      ref={cardRef}
      className="rounded-2xl border border-white/[0.08] bg-slate-900/50 p-5 space-y-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white">
              {entry.name}
            </h3>
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${GROUP_COLORS[entry.group]}`}
            >
              {GROUP_LABELS[entry.group]}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {entry.description}
          </p>
          {entry.note && (
            <p className="text-[11px] text-amber-300/80 flex items-center gap-1">
              <span aria-hidden="true" className="text-amber-400/60">\u24D8</span>
              {entry.note}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {entry.group !== "no-trap" ? (
          <button
            type="button"
            onClick={handleOpenTest}
            disabled={isTesting}
            className="inline-flex items-center gap-1.5 rounded-full bg-cyan-300 px-4 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isTesting ? (
              <>
                <svg
                  className="h-3.5 w-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Testing...
              </>
            ) : (
              <>
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Open + Test
              </>
            )}
          </button>
        ) : (
          <span className="text-[11px] text-slate-500 italic">
            No focus trap \u2014 listed for reference
          </span>
        )}
      </div>

      {result && (
        <div className="pt-2 border-t border-white/5">
          <ResultDisplay result={result} />
        </div>
      )}

      {isOpen && entry.render(() => setIsOpen(false))}
    </div>
  );
}

export default function FocusTrapTesterPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center font-bold text-slate-900">
              C
            </div>
            <span className="font-semibold tracking-tight">
              Focus Trap Tester
            </span>
          </div>
          <Link
            href="/design-review"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            \u2190 Back to Design Review
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-16 space-y-10">
        <section className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Focus Trap Tester Harness
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Automates tab-cycle checks for every modal and overlay in the app.
            Each entry opens the component, runs a focus trap audit, and reports
            pass/fail with the first offending element.
          </p>
        </section>

        <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4 text-xs text-slate-400 space-y-2">
          <p className="font-medium text-slate-300">How to use</p>
          <ol className="space-y-1 list-decimal list-inside text-slate-500">
            <li>
              Click <strong className="text-cyan-300">&ldquo;Open + Test&rdquo;</strong> to open the
              overlay and run the automated tab-cycle check.
            </li>
            <li>
              The overlay closes automatically when the test completes.
            </li>
            <li>
              A <strong className="text-emerald-300">PASS</strong> or{" "}
              <strong className="text-rose-300">FAIL</strong> result is
              displayed with step details.
            </li>
            <li>
              The first offending element (if any) is reported to help locate
              the issue.
            </li>
            <li>
              Use each overlay&rsquo;s native controls (Tab/Shift+Tab/Escape) to
              validate behavior interactively.
            </li>
          </ol>
          <p className="text-[11px] text-slate-600 italic pt-1">
            Every trapped overlay is tested against the same criteria: initial
            focus, sequential Tab, Tab wrap-around, and Shift+Tab wrap-around.
            Non-trapped overlays are listed for reference only.
          </p>
        </div>

        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Overlays
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OVERLAYS.map((entry) => (
              <OverlayCard key={entry.id} entry={entry} />
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-white/5 bg-slate-900/30 p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Edge Cases &amp; Accessibility Notes
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.03] space-y-2">
              <h3 className="font-medium text-slate-300">
                Nested traps
              </h3>
              <p>
                When one modal opens another (e.g., ReceiptModal from a booking
                flow), each dialog must trap focus independently. The inner
                dialog&rsquo;s Escape handler calls{" "}
                <code className="text-cyan-300">e.stopPropagation()</code> to
                prevent closing the parent. This harness tests single traps;
                nested scenarios should be validated manually.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.03] space-y-2">
              <h3 className="font-medium text-slate-300">Dark mode</h3>
              <p>
                The tester uses the same theme tokens as the main app. Toggle
                dark/light mode via the ThemeSwitcher in the dashboard header.
                All overlays use CSS custom properties and adapt automatically.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.03] space-y-2">
              <h3 className="font-medium text-slate-300">
                Keyboard + screen reader
              </h3>
              <p>
                Every modal uses{" "}
                <code className="text-cyan-300">role=&quot;dialog&quot;</code> and{" "}
                <code className="text-cyan-300">aria-modal=&quot;true&quot;</code>.
                Escape closes the dialog. Focus returns to the trigger on close.
                LiveRegion announces state changes to assistive technology.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-white/5 bg-white/[0.03] space-y-2">
              <h3 className="font-medium text-slate-300">
                Reduced motion
              </h3>
              <p>
                All overlays respect{" "}
                <code className="text-cyan-300">prefers-reduced-motion</code>.
                Framer-motion animations are disabled when the user has requested
                reduced motion. The tester itself uses no animation.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
