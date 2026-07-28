'use client';

import { useState, useCallback } from 'react';
import TwoFactorEnroll from '@/components/dashboard/two-factor-enroll';
import { CalendarSyncConnect } from '@/components/dashboard/settings/calendar-sync-connect';
import { CalendarSyncConflictModal } from '@/components/dashboard/settings/calendar-sync-conflict-modal';
import { DeveloperSettings } from '@/components/dashboard/settings/developer-settings';
import { DensitySwitcher } from '@/app/components/ui/density-switcher';
import { PasswordStrengthMeter } from '@/app/components/password-strength-meter';
import type { SyncConflict, ConflictResolution } from '@/components/dashboard/settings/conflict-mock-data';
import { sampleConflicts } from '@/components/dashboard/settings/conflict-mock-data';

export default function SettingsPage() {
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  const handleSyncWithConflicts = useCallback(() => {
    setConflicts(sampleConflicts);
  }, []);

  const handleResolveConflicts = useCallback((resolutions: ConflictResolution[]) => {
    setConflicts([]);
  }, []);

  const handleCloseConflicts = useCallback(() => {
    setConflicts([]);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account security and preferences.</p>
        </div>

        <section aria-label="Calendar sync" className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur sm:p-5 xl:p-6">
          <div className="space-y-1 pb-4 sm:pb-6">
            <h2 className="text-xl font-semibold text-white">Calendar sync</h2>
            <p className="text-sm leading-6 text-slate-300">
              Connect your preferred calendar provider and choose a sync direction for each calendar.
            </p>
          </div>
          <CalendarSyncConnect />
        </section>

        <CalendarSyncConflictModal
          conflicts={conflicts}
          onResolve={handleResolveConflicts}
          onClose={handleCloseConflicts}
        />

        <div className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur sm:p-5 xl:p-6">
          <h2 className="text-xl font-semibold text-white pb-4 sm:pb-6">Security</h2>
          <TwoFactorEnroll onComplete={() => window.location.reload()} />

          <div className='mt-10 border-t border-slate-700 pt-10'>
            <h3 className='text-lg font-medium text-white mb-4'>Change Password</h3>
            <div className='max-w-md'>
              <PasswordStrengthMeter value='' onChange={() => {}} />
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-10 mt-8">
          <h2 className="text-2xl font-semibold mb-4">Display density</h2>
          <p className="text-slate-400 mb-6">
            Choose how much spacing you want in your dashboard. Your preference
            is stored locally in your browser and reapplied on every visit.
          </p>
          <DensitySwitcher />
        </div>

        <section aria-label="Developer and advanced options" className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur sm:p-5 xl:p-6">
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
