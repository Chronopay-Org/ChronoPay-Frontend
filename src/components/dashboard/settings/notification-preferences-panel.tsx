"use client";

import { useId, useState } from "react";

type NotificationChannel = "email" | "push" | "sms";

type PreferenceCategory = {
  id: string;
  label: string;
  description: string;
  channels: Record<NotificationChannel, boolean>;
};

const STORAGE_KEY = "chronopay:notification-preferences";

const CHANNELS: { id: NotificationChannel; label: string; shortLabel: string }[] = [
  { id: "email", label: "Email", shortLabel: "Email" },
  { id: "push", label: "Push", shortLabel: "Push" },
  { id: "sms", label: "SMS", shortLabel: "SMS" },
];

const DEFAULT_CATEGORIES: PreferenceCategory[] = [
  {
    id: "disputes",
    label: "Disputes",
    description: "Mediator assignments, evidence requests, and resolution updates.",
    channels: { email: true, push: true, sms: true },
  },
  {
    id: "bookings",
    label: "Bookings",
    description: "Booking confirmations, reschedules, and supplier responses.",
    channels: { email: true, push: true, sms: false },
  },
  {
    id: "payouts",
    label: "Payouts",
    description: "Escrow releases, payout settlements, and failed transfers.",
    channels: { email: true, push: false, sms: false },
  },
  {
    id: "product",
    label: "Product updates",
    description: "New features, maintenance notices, and policy changes.",
    channels: { email: true, push: false, sms: false },
  },
];

function readStoredPreferences() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as {
      categories: PreferenceCategory[];
      quietHoursEnabled: boolean;
      quietHoursStart: string;
      quietHoursEnd: string;
    }) : null;
  } catch {
    return null;
  }
}

export function NotificationPreferencesPanel() {
  const storedPreferences = readStoredPreferences();
  const [categories, setCategories] = useState<PreferenceCategory[]>(
    storedPreferences?.categories ?? DEFAULT_CATEGORIES,
  );
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(
    storedPreferences?.quietHoursEnabled ?? true,
  );
  const [quietHoursStart, setQuietHoursStart] = useState(
    storedPreferences?.quietHoursStart ?? "22:00",
  );
  const [quietHoursEnd, setQuietHoursEnd] = useState(
    storedPreferences?.quietHoursEnd ?? "07:00",
  );
  const [announcement, setAnnouncement] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const titleId = useId();

  const toggleChannel = (categoryId: string, channel: NotificationChannel) => {
    setCategories((current) =>
      current.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              channels: {
                ...category.channels,
                [channel]: !category.channels[channel],
              },
            }
          : category,
      ),
    );
  };

  const savePreferences = () => {
    const payload = {
      categories,
      quietHoursEnabled,
      quietHoursStart,
      quietHoursEnd,
    };

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      const stamp = new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      });
      setSavedAt(stamp);
      setAnnouncement(`Notification preferences saved at ${stamp}`);
    } catch {
      setAnnouncement("Notification preferences could not be saved");
    }
  };

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-[28px] border border-white/10 bg-slate-950/70 p-4 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur sm:p-5 xl:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 id={titleId} className="text-xl font-semibold text-white">
            Notification preferences
          </h2>
          <p className="text-sm leading-6 text-slate-300">
            Fine-tune which updates reach each channel. Dispute alerts stay
            visible across channels so mediator deadlines are harder to miss.
          </p>
        </div>
        <p className="text-xs text-slate-400">
          {savedAt ? `Last saved ${savedAt}` : "Changes are stored locally for review"}
        </p>
      </div>

      <div className="mt-6 hidden overflow-hidden rounded-3xl border border-white/10 md:block">
        <table className="w-full border-collapse" dir="ltr">
          <thead className="bg-white/5 text-left">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Category
              </th>
              {CHANNELS.map((channel) => (
                <th
                  key={channel.id}
                  className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
                >
                  {channel.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className="border-t border-white/10">
                <th scope="row" className="px-4 py-4 text-left align-top">
                  <p className="text-sm font-semibold text-white">{category.label}</p>
                  <p className="mt-1 max-w-sm text-sm leading-6 text-slate-400">
                    {category.description}
                  </p>
                </th>
                {CHANNELS.map((channel) => (
                  <td key={channel.id} className="px-4 py-4 align-top">
                    <SwitchButton
                      checked={category.channels[channel.id]}
                      onToggle={() => toggleChannel(category.id, channel.id)}
                      label={`${category.label} notifications via ${channel.label}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-3 md:hidden">
        {categories.map((category) => (
          <article
            key={category.id}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-4"
          >
            <h3 className="text-sm font-semibold text-white">{category.label}</h3>
            <p className="mt-1 text-sm leading-6 text-slate-400">
              {category.description}
            </p>
            <div className="mt-4 grid gap-3">
              {CHANNELS.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/60 px-3 py-2"
                >
                  <span className="text-sm text-slate-200">{channel.shortLabel}</span>
                  <SwitchButton
                    checked={category.channels[channel.id]}
                    onToggle={() => toggleChannel(category.id, channel.id)}
                    label={`${category.label} notifications via ${channel.label}`}
                  />
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-200">
              Quiet hours
            </h3>
            <p className="max-w-xl text-sm leading-6 text-slate-400">
              Silence non-critical alerts overnight. Dispute escalations and
              security notices can still break through if they require action.
            </p>
          </div>
          <SwitchButton
            checked={quietHoursEnabled}
            onToggle={() => setQuietHoursEnabled((current) => !current)}
            label="Enable quiet hours"
          />
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">Start time</span>
            <input
              type="time"
              value={quietHoursStart}
              onChange={(event) => setQuietHoursStart(event.target.value)}
              disabled={!quietHoursEnabled}
              className="min-h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-200">End time</span>
            <input
              type="time"
              value={quietHoursEnd}
              onChange={(event) => setQuietHoursEnd(event.target.value)}
              disabled={!quietHoursEnabled}
              className="min-h-11 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-400">
          Matrix stays keyboard-accessible on desktop and collapses into channel rows on mobile.
        </p>
        <button
          type="button"
          onClick={savePreferences}
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
        >
          Save preferences
        </button>
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
    </section>
  );
}

function SwitchButton({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onToggle}
      className={[
        "relative inline-flex h-7 w-12 items-center rounded-full transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
        checked ? "bg-cyan-400" : "bg-white/10",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className={[
          "inline-block h-5 w-5 rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}
