"use client";

import { useState } from "react";
import { CalendarSyncConnect } from "@/components/dashboard/settings/calendar-sync-connect";
import { CalendarSyncConflictModal } from "@/components/dashboard/settings/calendar-sync-conflict-modal";
import { DangerZone } from "@/components/dashboard/settings/danger-zone";
import { DeveloperSettings } from "@/components/dashboard/settings/developer-settings";
import { NotificationPreferencesPanel } from "@/components/dashboard/settings/notification-preferences-panel";
import { DensitySwitcher } from "@/app/components/ui/density-switcher";
import { PasswordStrengthMeter } from "@/app/components/password-strength-meter";
import TwoFactorEnroll from "@/components/dashboard/two-factor-enroll";
import type { SyncConflict } from "@/components/dashboard/settings/conflict-mock-data";
import { sampleConflicts } from "@/components/dashboard/settings/conflict-mock-data";

type TabId = "account" | "security" | "notifications" | "appearance" | "wallets";

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "account", label: "Account" },
  { id: "security", label: "Security" },
  { id: "notifications", label: "Notifications" },
  { id: "appearance", label: "Appearance" },
  { id: "wallets", label: "Wallets" },
];

const sectionClass =
  "rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur sm:p-5 xl:p-6";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("account");
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  const handleSyncWithConflicts = () => {
    setConflicts(sampleConflicts);
  };

  const handleResolveConflicts = () => setConflicts([]);
  const handleCloseConflicts = () => setConflicts([]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">
            Manage your account security, notification channels, and dashboard preferences.
          </p>
        </div>

        <div role="tablist" aria-label="Settings sections" className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`panel-${tab.id}`}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onClick={() => setActiveTab(tab.id)}
              className={[
                "inline-flex min-h-11 items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
                activeTab === tab.id
                  ? "bg-cyan-400/10 text-cyan-300"
                  : "text-slate-400 hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div role="tabpanel" id="panel-account" aria-labelledby="tab-account" hidden={activeTab !== "account"} className="focus-visible:outline-none">
          <div className="space-y-8">
            <section className={sectionClass}>
              <h2 className="text-xl font-semibold text-white">Account</h2>
              <p className="mt-2 text-sm text-slate-300">
                Signed in as <strong className="text-white">user@example.com</strong>
              </p>
            </section>

            <DeveloperSettings />
            <DangerZone />
          </div>
        </div>

        <div role="tabpanel" id="panel-security" aria-labelledby="tab-security" hidden={activeTab !== "security"} className="focus-visible:outline-none">
          <section className={sectionClass}>
            <h2 className="pb-4 text-xl font-semibold text-white sm:pb-6">Security</h2>
            <TwoFactorEnroll onComplete={() => window.location.reload()} />

            <div className="mt-10 border-t border-slate-700 pt-10">
              <h3 className="mb-4 text-lg font-medium text-white">Change password</h3>
              <div className="max-w-md">
                <PasswordStrengthMeter value="" onChange={() => {}} />
              </div>
            </div>
          </section>
        </div>

        <div role="tabpanel" id="panel-notifications" aria-labelledby="tab-notifications" hidden={activeTab !== "notifications"} className="focus-visible:outline-none">
          <div className="space-y-8">
            <NotificationPreferencesPanel />
            <section aria-label="Calendar sync" className={sectionClass}>
              <div className="space-y-1 pb-4 sm:pb-6">
                <h2 className="text-xl font-semibold text-white">Calendar sync</h2>
                <p className="text-sm leading-6 text-slate-300">
                  Connect your preferred calendar provider and choose a sync direction for each calendar.
                </p>
              </div>
              <CalendarSyncConnect />
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleSyncWithConflicts}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                >
                  Review sample sync conflicts
                </button>
              </div>
            </section>
          </div>
        </div>

        <div role="tabpanel" id="panel-appearance" aria-labelledby="tab-appearance" hidden={activeTab !== "appearance"} className="focus-visible:outline-none">
          <section className={sectionClass}>
            <h2 className="mb-4 text-2xl font-semibold text-white">Display density</h2>
            <p className="mb-6 text-slate-400">
              Choose how much spacing you want in your dashboard. Your preference is stored locally and reapplied on every visit.
            </p>
            <DensitySwitcher />
          </section>
        </div>

        <div role="tabpanel" id="panel-wallets" aria-labelledby="tab-wallets" hidden={activeTab !== "wallets"} className="focus-visible:outline-none">
          <section className={sectionClass}>
            <h2 className="text-xl font-semibold text-white">Wallets</h2>
            <p className="mt-2 text-sm text-slate-300">
              Connect a wallet to manage payouts and linked addresses.
            </p>
            <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-slate-900/50 p-8 text-center">
              <p className="text-slate-400">No wallets connected yet.</p>
              <button
                type="button"
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-white/20 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Connect wallet
              </button>
            </div>
          </section>
        </div>

        <CalendarSyncConflictModal
          conflicts={conflicts}
          onResolve={handleResolveConflicts}
          onClose={handleCloseConflicts}
        />
      </div>
    </div>
  );
}
