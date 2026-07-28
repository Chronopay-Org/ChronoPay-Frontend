"use client";

import { useCallback, useState } from "react";
import { PasswordStrengthMeter } from "@/app/components/password-strength-meter";
import { DensitySwitcher } from "@/app/components/ui/density-switcher";
import TwoFactorEnroll from "@/components/dashboard/two-factor-enroll";
import { CalendarSyncConnect } from "@/components/dashboard/settings/calendar-sync-connect";
import { CalendarSyncConflictModal } from "@/components/dashboard/settings/calendar-sync-conflict-modal";
import { sampleConflicts } from "@/components/dashboard/settings/conflict-mock-data";
import { DeveloperSettings } from "@/components/dashboard/settings/developer-settings";
import { NotificationPreferencesPanel } from "@/components/dashboard/settings/notification-preferences-panel";
import type { SyncConflict } from "@/components/dashboard/types";

export default function SettingsPage() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  const handleSyncWithConflicts = useCallback(() => {
    setConflicts(sampleConflicts);
  }, []);

  const handleResolveConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  const handleCloseConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-white">Settings</h1>
          <p className="text-slate-400">
            Manage your account security, notification channels, and dashboard preferences.
          </p>
        </div>

        <NotificationPreferencesPanel />

        <section
          aria-label="Calendar sync"
          className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur sm:p-5 xl:p-6"
        >
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

        <CalendarSyncConflictModal
          conflicts={conflicts}
          onResolve={handleResolveConflicts}
          onClose={handleCloseConflicts}
        />

        <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur sm:p-5 xl:p-6">
          <h2 className="pb-4 text-xl font-semibold text-white sm:pb-6">Security</h2>
          <TwoFactorEnroll onComplete={() => window.location.reload()} />

          <div className="mt-10 border-t border-slate-700 pt-10">
            <h3 className="mb-4 text-lg font-medium text-white">Change password</h3>
            <div className="max-w-md">
              <PasswordStrengthMeter value="" onChange={() => {}} />
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-700 bg-slate-900 p-6">
          <h2 className="mb-4 text-2xl font-semibold text-white">Display density</h2>
          <p className="mb-6 text-slate-400">
            Choose how much spacing you want in your dashboard. Your preference is stored locally and reapplied on every visit.
          </p>
          <DensitySwitcher />
        </section>

        <section
          aria-label="Developer and advanced options"
          className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur sm:p-5 xl:p-6"
        >
          <div className="space-y-1 pb-4 sm:pb-6">
            <h2 className="text-xl font-semibold text-white">Developer / Advanced</h2>
            <p className="text-sm leading-6 text-slate-300">
              Enable experimental features, view debug information, and export logs for troubleshooting.
            </p>
          </div>
          <DeveloperSettings />
        </section>
      </div>
    </div>
  );
}
