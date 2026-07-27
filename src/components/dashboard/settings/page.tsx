"use client";

import TwoFactorEnroll from "@/components/dashboard/two-factor-enroll";
import { DensitySwitcher } from "@/app/components/ui/density-switcher";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-10">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Settings</h1>
        <p className="text-slate-400 mb-10">
          Manage your account security and preferences.
        </p>

        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-10">
          <h2 className="text-2xl font-semibold mb-8">Security</h2>
          <TwoFactorEnroll onComplete={() => window.location.reload()} />
        </div>

        <div className="bg-slate-900 border border-slate-700 rounded-3xl p-10 mt-8">
          <h2 className="text-2xl font-semibold mb-4">Display density</h2>
          <p className="text-slate-400 mb-6">
            Choose how much spacing you want in your dashboard. Your preference
            is stored locally in your browser and reapplied on every visit.
          </p>
          <DensitySwitcher />
        </div>
      </div>
    </div>
  );
}
