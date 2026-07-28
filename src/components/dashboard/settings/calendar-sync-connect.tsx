"use client";

import { useState, useCallback, useId } from "react";
import { clsx } from "clsx";
import { Loader2, AlertCircle, X, ChevronDown } from "lucide-react";
import { StatusChip } from "@/components/dashboard/status-chip";
import { calendarSyncOptions, calendarSyncProviders, sampleCalendars } from "@/components/dashboard/dashboard-data";
import type {
  CalendarDefinition,
  CalendarSyncProvider,
  SyncDirection,
  AuthorizationState,
} from "../types";

type SyncCalendarsState = Record<string, SyncDirection>;

interface CalendarSyncConnectProps {
  providers?: CalendarSyncProvider[];
  calendars?: CalendarDefinition[];
  syncOptions?: { value: SyncDirection; label: string; description: string }[];
  className?: string;
  onSyncChange?: (providerId: string, calendarId: string, direction: SyncDirection) => void;
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function ProviderIcon({ name, className }: { name: string; className?: string }) {
  const initial = name.charAt(0).toUpperCase();
  const bgColor =
    name === "Google Calendar"
      ? "bg-white/10 border-white/20"
      : name === "Outlook Calendar"
        ? "bg-blue-400/10 border-blue-400/20"
        : "bg-slate-400/10 border-slate-400/20";
  return (
    <div
      className={clsx(
        "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold",
        bgColor,
        className
      )}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

function ScopeRow({
  scope,
  status,
}: {
  scope: string;
  status: "approved" | "denied" | "pending";
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-lg border border-white/6 bg-white/4 px-3 py-2.5">
      <span className="truncate font-mono text-xs text-slate-200">{scope}</span>
      <span
        className={clsx(
          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest",
          status === "approved" && "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
          status === "denied" && "border border-rose-400/30 bg-rose-400/10 text-rose-200",
          status === "pending" && "border border-amber-400/30 bg-amber-400/10 text-amber-200"
        )}
      >
        {status === "approved" && "Granted"}
        {status === "denied" && "Denied"}
        {status === "pending" && "Pending"}
      </span>
    </li>
  );
}

function DirectionRadioGroup({
  value,
  onChange,
  name,
  disabled,
  options,
}: {
  value: SyncDirection;
  onChange: (value: SyncDirection) => void;
  name: string;
  disabled?: boolean;
  options: { value: SyncDirection; label: string; description: string }[];
}) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const checked = value === opt.value;
        return (
          <label
            key={opt.value}
            className={clsx(
              "flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors",
              checked
                ? "border-cyan-300/40 bg-cyan-300/10 text-cyan-100"
                : "border-white/6 bg-white/4 text-slate-300 hover:border-white/16",
              disabled && "pointer-events-none opacity-50"
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              disabled={disabled}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            <span className="sr-only">{opt.label}</span>
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

function ProviderCard({
  provider,
  onConnect,
  disabled,
}: {
  provider: CalendarSyncProvider;
  onConnect: (providerId: string) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onConnect(provider.id)}
      disabled={disabled}
      aria-label={`Connect ${provider.name}`}
      className="card card--interactive flex w-full flex-col gap-4 p-5 text-left sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProviderIcon
            name={provider.name}
            className="h-12 w-12 text-base"
          />
          <div>
            <h3 className="text-sm font-semibold text-white sm:text-base">{provider.name}</h3>
            <p className="helper-text helper-text--muted mt-0.5 line-clamp-2 max-w-[18rem]">
              {provider.description}
            </p>
          </div>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-slate-300">
          Connect
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {provider.scopes.slice(0, 3).map((scope) => (
          <span
            key={scope}
            className="rounded-full border border-white/6 bg-white/4 px-2 py-1 font-mono text-[10px] text-slate-300"
          >
            {scope.split("/").pop()?.replace("?", "") || scope}
          </span>
        ))}
        {provider.scopes.length > 3 && (
          <span className="rounded-full border border-white/6 bg-white/4 px-2 py-1 text-[10px] text-slate-400">
            +{provider.scopes.length - 3}
          </span>
        )}
      </div>
    </button>
  );
}

function PermissionsPreview({
  provider,
  onApprove,
  onDeny,
  disabled,
}: {
  provider: CalendarSyncProvider;
  onApprove: () => void;
  onDeny: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200/70">
          Permissions preview
        </p>
        <p className="helper-text helper-text--muted">
          Review the access requested by {provider.name}. Allowing these scopes lets ChronoPay read or write
          events, depending on the per-calendar setting you choose next.
        </p>
      </div>
      <ul className="space-y-2" aria-label="Requested permissions">
        {provider.scopes.map((scope) => (
          <ScopeRow key={scope} scope={scope} status="pending" />
        ))}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onDeny}
          disabled={disabled}
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-rose-300/30 hover:bg-rose-400/10 focus-ring-cyan"
        >
          Deny
        </button>
        <button
          type="button"
          onClick={onApprove}
          disabled={disabled}
          className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-cyan-200 shadow-[0_16px_34px_rgba(34,211,238,0.22)] focus-ring-cyan"
        >
          Approve
        </button>
      </div>
    </div>
  );
}

function DeniedState({
  provider,
  deniedScopes,
  error,
  onRetry,
  onBack,
}: {
  provider: CalendarSyncProvider;
  deniedScopes: string[];
  error: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-300">
            Authorization denied
          </p>
          <p className="helper-text helper-text--emphasis">{error}</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-3 py-2 text-xs font-medium text-slate-200 hover:border-white/20 focus-ring-cyan"
        >
          <X aria-hidden="true" className="mr-1.5 h-3.5 w-3.5" />
          Start over
        </button>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-slate-300">The following scopes were denied by {provider.name}:</p>
      </div>
      <ul className="space-y-2" aria-label="Denied permissions">
        {deniedScopes.map((scope) => (
          <li
            key={scope}
            className="flex items-center gap-3 rounded-lg border border-rose-400/20 bg-rose-400/8 px-3 py-2.5"
          >
            <AlertCircle aria-hidden="true" className="h-4 w-4 shrink-0 text-rose-300" />
            <span className="truncate font-mono text-xs text-slate-200">{scope}</span>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-white/20 focus-ring-cyan"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-cyan-200 shadow-[0_16px_34px_rgba(34,211,238,0.22)] focus-ring-cyan"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function ConnectedHeader({ provider }: { provider: CalendarSyncProvider }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <ProviderIcon name={provider.name} className="h-10 w-10 text-sm" />
        <div>
          <p className="text-sm font-semibold text-white">{provider.name} connected</p>
          <p className="helper-text helper-text--muted">
            Pick a sync direction for each calendar below.
          </p>
        </div>
      </div>
      <StatusChip tone="positive" className="w-fit">
        <ChevronDown aria-hidden="true" className="mr-1.5 h-3 w-3" />
        Connected
      </StatusChip>
    </div>
  );
}

function CalendarRow({
  calendar,
  direction,
  onDirectionChange,
  disabled,
  options,
}: {
  calendar: CalendarDefinition;
  direction: SyncDirection;
  onDirectionChange: (direction: SyncDirection) => void;
  disabled?: boolean;
  options: { value: SyncDirection; label: string; description: string }[];
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/6 bg-white/4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-center gap-3">
        <span
          className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20"
          style={{ backgroundColor: calendar.color }}
          aria-hidden="true"
        />
        <div>
          <p className="text-sm font-medium text-white">{calendar.title}</p>
          <p className="helper-text helper-text--muted">{calendar.description}</p>
        </div>
      </div>
      <div className="sm:w-[280px]">
        <DirectionRadioGroup
          name={`sync-direction-${calendar.id}`}
          value={direction}
          onChange={onDirectionChange}
          disabled={disabled}
          options={options}
        />
      </div>
    </div>
  );
}

export function CalendarSyncConnect({
  providers = calendarSyncProviders,
  calendars = sampleCalendars,
  syncOptions = calendarSyncOptions,
  className = "",
  onSyncChange,
}: CalendarSyncConnectProps) {
  const [authState, setAuthState] = useState<AuthorizationState>({ status: "idle" });
  const [syncDirections, setSyncDirections] = useState<SyncCalendarsState>({});
  const [isSaving, setIsSaving] = useState(false);
  const [savedProviderId, setSavedProviderId] = useState<string | null>(null);

  const statusId = useId();
  const titleId = useId();

  const handleProviderConnect = useCallback(
    async (providerId: string) => {
      setAuthState({ status: "connecting", providerId });
      await delay(900);

      setAuthState({ status: "authorizing", providerId });
    },
    []
  );

  const handleApprove = useCallback(() => {
    if (authState.status !== "authorizing") return;
    const providerId = authState.providerId;
    const providerCalendars = calendars.filter((c) => c.providerId === providerId);
    const authorizedState: AuthorizationState = {
      status: "authorized",
      providerId,
      calendars: providerCalendars,
    };
    setAuthState(authorizedState);
    setSyncDirections((prev) => {
      const next = { ...prev };
      providerCalendars.forEach((c) => {
        if (!next[c.id]) next[c.id] = "off";
      });
      return next;
    });
    setSavedProviderId(null);
  }, [authState, calendars]);

  const handleDeny = useCallback(() => {
    if (authState.status !== "authorizing") return;
    const providerId = authState.providerId;
    const provider = providers.find((p) => p.id === providerId);
    const deniedState: AuthorizationState = {
      status: "denied",
      providerId,
      deniedScopes: provider?.scopes ?? [],
      error: `${provider?.name ?? "Provider"} authorization was denied.`,
    };
    setAuthState(deniedState);
  }, [authState, providers]);

  const handleDirectionChange = useCallback(
    (calendarId: string, direction: SyncDirection) => {
      setSyncDirections((prev) => ({ ...prev, [calendarId]: direction }));
      onSyncChange?.(authState.status === "authorized" ? authState.providerId : "", calendarId, direction);
    },
    [onSyncChange, authState]
  );

  const handleSave = useCallback(async () => {
    if (authState.status !== "authorized") return;
    setIsSaving(true);
    await delay(200);
    setIsSaving(false);
    setSavedProviderId(authState.providerId);
    onSyncChange?.(authState.providerId, "all-saved", Object.keys(syncDirections)[0] as SyncDirection);
    setTimeout(() => setSavedProviderId((prev) => (prev === authState.providerId ? null : prev)), 3000);
  }, [authState, syncDirections, onSyncChange]);

  const handleRetry = useCallback(() => {
    if (authState.status !== "denied") return;
    setAuthState({ status: "connecting", providerId: authState.providerId });
    delay(900).then(() => {
      setAuthState({ status: "authorizing", providerId: authState.providerId });
    });
  }, [authState]);

  const handleGoBack = useCallback(() => {
    setAuthState({ status: "idle" });
    setSavedProviderId(null);
  }, []);

  const currentProvider =
    authState.status !== "idle"
      ? providers.find((p) => {
        if ("providerId" in authState) return p.id === authState.providerId;
        return false;
      }) ?? null
      : null;

  const renderPrimaryContent = () => {
    switch (authState.status) {
      case "idle":
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                onConnect={handleProviderConnect}
                disabled={false}
              />
            ))}
          </div>
        );
      case "connecting":
        return (
          <div className="flex flex-col items-center gap-4 py-12" role="status" aria-live="polite">
            <Loader2 aria-hidden="true" className="h-10 w-10 animate-spin text-cyan-300" />
            <p className="text-sm text-slate-300">
              Connecting to {currentProvider?.name ?? "provider"}…
            </p>
          </div>
        );
      case "authorizing":
        if (!currentProvider) return null;
        return (
          <PermissionsPreview
            provider={currentProvider}
            onApprove={handleApprove}
            onDeny={handleDeny}
            disabled={false}
          />
        );
      case "authorized": {
        const provider = currentProvider;
        if (!provider) return null;
        const providerCalendars = calendars.filter((c) => c.providerId === provider.id);
        return (
          <div className="space-y-6">
            <ConnectedHeader provider={provider} />
            <div className="space-y-2" aria-label="Calendar sync directions">
              {providerCalendars.map((calendar) => (
                <CalendarRow
                  key={calendar.id}
                  calendar={calendar}
                  direction={syncDirections[calendar.id] ?? "off"}
                  onDirectionChange={(dir) => handleDirectionChange(calendar.id, dir)}
                  disabled={isSaving}
                  options={syncOptions}
                />
              ))}
              {providerCalendars.length === 0 && (
                <p className="helper-text helper-text--muted">No calendars available for this provider.</p>
              )}
            </div>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div aria-live="polite" aria-atomic="true" className="min-h-[1.5rem]">
                {savedProviderId === provider.id && (
                  <StatusChip tone="positive">Saved</StatusChip>
                )}
                {isSaving && (
                  <span className="inline-flex items-center gap-2 text-xs text-slate-300">
                    <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                    Saving…
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleGoBack}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/6 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-white/20 focus-ring-cyan disabled:opacity-60"
                >
                  Back to providers
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-4 py-2.5 text-sm font-medium text-slate-950 hover:bg-cyan-200 shadow-[0_16px_34px_rgba(34,211,238,0.22)] focus-ring-cyan disabled:opacity-60"
                  aria-describedby={statusId}
                >
                  {isSaving ? "Saving…" : "Save preferences"}
                </button>
              </div>
            </div>
            <span id={statusId} className="sr-only" aria-live="polite">
              {isSaving ? "Saving preferences" : savedProviderId === provider.id ? "Preferences saved" : ""}
            </span>
          </div>
        );
      }
      case "denied":
        if (!currentProvider) return null;
        return (
          <DeniedState
            provider={currentProvider}
            deniedScopes={authState.deniedScopes}
            error={authState.error}
            onRetry={handleRetry}
            onBack={handleGoBack}
        />
      );
      default:
        return null;
    }
  };

  return (
    <div
      className={clsx("space-y-6", className)}
      aria-labelledby={titleId}
      aria-describedby={`${statusId}-desc`}
    >
      <div className="space-y-1">
        <h2 id={titleId} className="text-xl font-semibold text-white">
          Calendar sync
        </h2>
        <p id={`${statusId}-desc`} className="helper-text helper-text--muted">
          Connect a provider to keep your bookings and availability in sync.
        </p>
      </div>
      <div className="card card--panel p-4 sm:p-5 xl:p-6" role="region" aria-label="Calendar sync connect">
        <div
          id={`${statusId}-status`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
          aria-label="Sync status"
          className="sr-only"
        >
          {authState.status === "idle" && "Select a calendar provider to connect."}
          {authState.status === "connecting" && `Connecting to ${currentProvider?.name ?? "provider"}.`}
          {authState.status === "authorizing" && "Review permissions and approve or deny."}
          {authState.status === "authorized" &&
            `Connected to ${currentProvider?.name ?? "provider"}. Configure your calendar sync directions.`}
          {authState.status === "denied" &&
            `Authorization denied for ${currentProvider?.name ?? "provider"}. You can retry or cancel.`}
        </div>
        {renderPrimaryContent()}
      </div>
    </div>
  );
}
