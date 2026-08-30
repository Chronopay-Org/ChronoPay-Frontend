"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";
import TwoFactorEnroll from "@/components/dashboard/two-factor-enroll";
import { CalendarSyncConnect } from "@/components/dashboard/settings/calendar-sync-connect";
import { CalendarSyncConflictModal } from "@/components/dashboard/settings/calendar-sync-conflict-modal";
import { DeveloperSettings } from "@/components/dashboard/settings/developer-settings";
import { DangerZone } from "@/components/dashboard/settings/danger-zone";
import { NotificationPreferencesPanel } from "@/components/dashboard/settings/notification-preferences-panel";
import { DensitySwitcher } from "@/app/components/ui/density-switcher";
import { PasswordStrengthMeter } from "@/app/components/password-strength-meter";
import { sampleConflicts } from "@/components/dashboard/settings/conflict-mock-data";

type TabId = "account" | "security" | "notifications" | "appearance" | "wallets";

const TAB_IDS: TabId[] = [
  "account",
  "security",
  "notifications",
  "appearance",
  "wallets",
];

const TABS: Array<{ id: TabId; label: string }> = [
  { id: "account", label: "Account" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Appearance" },
  { id: "wallets", label: "Wallets" },
];

type SyncConflict = (typeof sampleConflicts)[number];

const TAB_PATTERN = /[?#&]tb=(account|security|notifications|appearance|wallets)/;

function getTabFromHash(): TabId {
  if (typeof window === "undefined") return "account";
  const match = window.location.hash.match(TAB_PATTERN);
  if (!match) return "account";
  return TAB_IDS.includes(match[1] as TabId) ? (match[1] as TabId) : "account";
}

const sectionClass =
  "rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur sm:p-5 xl:p-6";

const tabButtonClass = (active: boolean) =>
  [
    "inline-flex min-h-11 items-center justify-center rounded-pm px-4 py-2 font-medium transition-colors",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
    active
      ? "border-transparent bg-cyan-400/10 text-cyan-300"
      : "border-transparent text-slate-400 hover:text-white hover:bg-white/5",
  ].join(" ");

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>(() => getTabFromHash());
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [walletMessage, setWalletMessage] = useState("");
  const { resetTour } = useOnboardingTour();
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

  const selectTab = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    tabRefs.current[tabId]?.focus();
    if (typeof window !== "undefined") {
      window.location.hash = `tb=${tabId}`;
    }
  }, []);

  const handleTabKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, tabId: TabId) => {
      const index = TAB_IDS.indexOf(tabId);
      let next: TabId | null = null;
      if (event.key === "ArrowRight") {
        next = TAB_IDS[(index + 1) % TAB_IDS.length];
      } else if (event.key === "ArrowLeft") {
        next = TAB_IDS[(index - 1 + TAB_IDS.length) % TAB_IDS.length];
      } else if (event.key === "Home") {
        next = TAB_IDS[0];
      } else if (event.key === "End") {
        next = TAB_IDS[TAB_IDS.length - 1];
      }
      if (next) {
        event.preventDefault();
        selectTab(next);
      }
    },
    [selectTab],
  );

  const handleSyncWithConflicts = useCallback(() => {
    setConflicts(sampleConflicts);
  }, []);

  const handleClearConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">
            Manage your account security, notification channels, and dashboard
            preferences.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Settings sections"
          className="flex flex-wrap gap-2 border-b border-white/10 pb-4"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabRefs.current[tab.id] = el;
                }}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={active}
                aria-controls={`panel-${tab.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => selectTab(tab.id)}
                onKeyDown={(event) => handleTabKeyDown(event, tab.id)}
                className={tabButtonClass(active)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div
          role="tabpanel"
          id="panel-account"
          aria-labelledby="tab-account"
          tabIndex={0}
          hidden={activeTab !== "account"}
          className="focus:outline-none"
        >
          <div className="space-y-8">
            <section className={sectionClass} aria-label="Account summary">
              <h2 className="text-xl font-semibold text-white">Account</h2>
              <p className="mt-2 text-sm text-slate-300">
                Signed in as <strong className="text-white">user@example.com</strong>
              </p>
            </section>
            <DeveloperSettings />
            <DangerZone />
          </div>
        </div>

        <div
          role="tabpanel"
          id="panel-security"
          aria-labelledby="tab-security"
          tabIndex={0}
          hidden={activeTab !== "security"}
          className="focus:outline-none"
        >
          <section className={sectionClass} aria-label="Security settings">
            <h2 className="pb-4 text-xl font-semibold text-white sm:pb-6">
              Security
            </h2>
            <TwoFactorEnroll onComplete={() => window.location.reload()} />

            <div className="mt-10 border-t border-slate-700 pt-10">
              <h3 className="mb-4 text-lg font-medium text-white">
                Change password
              </h3>
              <div className="max-w-md">
                <PasswordStrengthMeter value="" onChange={() => {}} />
              </div>
            </div>
          </section>
        </div>

        <div
          role="tabpanel"
          id="panel-notifications"
          aria-labelledby="tab-notifications"
          tabIndex={0}
          hidden={activeTab !== "notifications"}
          className="focus:outline-none"
        >
          <div className="space-y-8">
            <NotificationPreferencesPanel />
            <section aria-label="Calendar sync" className={sectionClass}>
              <div className="space-y-1 pb-4 sm:pb-6">
                <h2 className="text-xl font-semibold text-white">
                  Calendar sync
                </h2>
                <p className="text-sm leading-6 text-slate-300">
                  Connect your preferred calendar provider and choose a sync
                  direction for each calendar.
                </p>
              </div>
              <CalendarSyncConnect />
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleSyncWithConflicts}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Review sample sync conflicts
                </button>
              </div>
            </section>
          </div>
        </div>

        <div
          role="tabpanel"
          id="panel-appearance"
          aria-labelledby="tab-appearance"
          tabIndex={0}
          hidden={activeTab !== "appearance"}
          className="focus:outline-none"
        >
          <div className="space-y-8">
            <section className={sectionClass} aria-label="Display density">
              <h2 className="mb-4 text-2xl font-semibold text-white">
                Display density
              </h2>
              <p className="mb-6 text-sm text-slate-400">
                Choose how much spacing you want in your dashboard. Your
                preference is stored locally and reapplied on every visit.
              </p>
              <DensitySwitcher />
            </section>
            <section className={sectionClass} aria-label="Onboarding">
              <h2 className="mb-4 text-2xl font-semibold text-white">
                Onboarding
              </h2>
              <p className="mb-6 text-sm text-slate-400">
                Replay the guided tour to learn about key dashboard features.
              </p>
              <button
                type="button"
                onClick={resetTour}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-6 py-2 text-sm font-medium text-cyan-300 transition hover:border-cyan-500/50 hover:bg-cyan-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Replay tour
              </button>
            </section>
          </div>
        </div>

        <div
          role="tabpanel"
          id="panel-wallets"
          aria-labelledby="tab-wallets"
          tabIndex={0}
          hidden={activeTab !== "wallets"}
          className="focus:outline-none"
        >
          <section className={sectionClass} aria-label="Wallet connections">
            <h2 className="text-xl font-semibold text-white">Wallets</h2>
            <p className="mt-2 text-sm text-slate-300">
              Connect a wallet to manage payouts and linked addresses.
            </p>
            <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-slate-900/50 p-8 text-center">
              <p className="text-slate-400">No wallets connected yet.</p>
              {walletMessage ? (
                <p className="mt-2 text-sm text-cyan-300">{walletMessage}</p>
              ) : null}
              <button
                type="button"
                onClick={() => setWalletMessage("Wallet connection coming soon.")}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Connect wallet
              </button>
            </div>
          </section>
        </div>

        <CalendarSyncConflictModal
          conflicts={conflicts}
          onResolve={handleClearConflicts}
          onClose={handleClearConflicts}
        />
      </div>
    </div>
  );
}