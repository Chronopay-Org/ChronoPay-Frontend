"use client";

import dynamic from "next/dynamic";

// The settings panel touches `document` while rendering, so load it client-side only.
const SettingsPanel = dynamic(() => import("@/components/dashboard/settings/page"), {
  ssr: false,
  loading: () => <p className="text-sm text-slate-400">Loading settings…</p>,
});

export default function SettingsClient() {
  return <SettingsPanel />;
}
