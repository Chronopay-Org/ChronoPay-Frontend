import type { StorageArea } from "@/hooks/use-stored-state";

/**
 * Central registry of every Web Storage key ChronoPay uses.
 *
 * Key names used to be scattered across hooks as ad-hoc string literals
 * (`chronopay-density`, `chronopay:theme`, `chronopay.onboarding.*`, …),
 * which made it impossible to audit what is persisted, where, or in which
 * format. This module is now the single source of truth: every key lists its
 * owning module, its storage area, and its on-disk format.
 *
 * Rules for new keys:
 * - Add the key here first, then reference the entry from the owning hook.
 * - Prefer `useStoredState` (or the `readStoredValue` / `writeStoredValue` /
 *   `scanStoredEntries` primitives) for all access so raw
 *   `localStorage` / `sessionStorage` calls stay inside
 *   `src/hooks/use-stored-state.ts`. The only other place allowed to touch
 *   storage directly is the pre-hydration scripts in `src/app/layout.tsx`,
 *   which must run before React hydrates.
 * - Structured (JSON) values should be stored with a `version` so they are
 *   written as a version envelope and can be migrated forward. Plain-string
 *   values (flags, modes) stay un-enveloped for backwards compatibility.
 */

export type StorageFormat = "envelope" | "json" | "plain";

export interface StorageKeyEntry {
  /** Exact storage key, or the key prefix for per-entity keys. */
  key: string;
  /** Module or hook that owns this key. */
  owner: string;
  /** Storage area the key lives in. */
  area: StorageArea;
  /**
   * On-disk format: `envelope` for versioned JSON values, `json` for plain
   * JSON values, `plain` for raw strings such as `"true"` or `"viewer"`.
   */
  format: StorageFormat;
  /** Schema version when `format` is `envelope`. */
  version?: number;
  /** Whether access is routed through `useStoredState` / the storage primitives. */
  viaUseStoredState: boolean;
  notes?: string;
}

/**
 * Keys owned by hooks migrated to `useStoredState` in this change. These are
 * the entries the migrated hooks reference directly.
 */
export const STORAGE_KEYS = {
  /**
   * Supplier onboarding wizard progress (current step, furthest step reached,
   * skipped optional steps). The hook is keyed per wizard instance, so this
   * is the default key; callers may pass their own.
   */
  wizardProgress: {
    key: "supplier-onboarding-wizard",
    owner: "src/hooks/use-wizard-progress.ts",
    area: "sessionStorage",
    format: "envelope",
    version: 1,
    viaUseStoredState: true,
    notes:
      "Legacy un-enveloped JSON ({currentIndex, furthestIndex, skippedIds}) is upgraded on read.",
  } satisfies StorageKeyEntry,

  /** Per-receipt free-text notes, addressed by receipt id under a shared prefix. */
  receiptNotes: {
    key: "chronopay:receipt-notes:",
    owner: "src/hooks/use-receipt-notes.ts",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: true,
    notes:
      "Values are raw note text. searchReceiptNotes scans this prefix via scanStoredEntries.",
  } satisfies StorageKeyEntry,

  /** Recent header-search terms (most recent first, capped at MAX_RECENTS). */
  recentSearches: {
    key: "chronopay:recent-searches",
    owner: "src/hooks/use-search.ts",
    area: "localStorage",
    format: "envelope",
    version: 1,
    viaUseStoredState: true,
    notes:
      "Legacy un-enveloped arrays — including pre-object string arrays — are upgraded on read.",
  } satisfies StorageKeyEntry,

  /** Calendar heatmap visibility toggle. The hook accepts a custom key; this is the default. */
  heatmapPreference: {
    key: "calendar-heatmap-enabled",
    owner: "src/hooks/use-heatmap-preference.ts",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: true,
    notes: 'Stored as the plain strings "true" / "false".',
  } satisfies StorageKeyEntry,

  /** Per-supplier calendar timezone display mode, addressed by supplier id. */
  timezoneMode: {
    key: "chronopay_tz_pref_",
    owner: "src/utils/timezone.ts",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: true,
    notes: 'Stored as the plain strings "viewer" / "supplier".',
  } satisfies StorageKeyEntry,

  /** First-visit flag that seeds the marketplace recently-viewed rail once. */
  marketplaceVisited: {
    key: "chronopay-marketplace-visited",
    owner: "src/app/marketplace/page.tsx",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: true,
    notes: 'Stored as the plain string "true".',
  } satisfies StorageKeyEntry,

  /** UI density preference (already on useStoredState). */
  density: {
    key: "chronopay-density",
    owner: "src/app/components/ui/density-switcher.tsx",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: true,
    notes: 'One of "comfortable" / "balanced" / "compact". Also read by the layout pre-hydration script.',
  } satisfies StorageKeyEntry,

  /** In-progress payout draft (already on useStoredState). */
  payoutDraft: {
    key: "chronopay-payout-step-draft",
    owner: "src/components/dashboard/payout-step/use-payout-draft.ts",
    area: "sessionStorage",
    format: "json",
    viaUseStoredState: true,
  } satisfies StorageKeyEntry,
} as const;

/**
 * Other keys the app persists today that have not yet been routed through
 * `useStoredState`. They are registered here so the full key surface is
 * auditable in one place; migrate them opportunistically following the same
 * pattern as the entries above.
 */
export const REGISTERED_STORAGE_KEYS: readonly StorageKeyEntry[] = [
  {
    key: "chronopay:theme",
    owner: "src/hooks/use-theme.ts + src/app/layout.tsx (pre-hydration)",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
    notes: 'One of "light" / "dark" / "auto" / "scheduled". The pre-hydration script must keep reading this key directly.',
  },
  {
    key: "chronopay-theme",
    owner: "src/hooks/use-theme.ts + src/app/layout.tsx (pre-hydration)",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
    notes: "Legacy theme key, migrated to chronopay:theme on read.",
  },
  {
    key: "theme-schedule",
    owner: "src/app/hooks/use-theme-schedule.ts + src/app/layout.tsx (pre-hydration)",
    area: "localStorage",
    format: "json",
    viaUseStoredState: false,
  },
  {
    key: "onboarding-tour-completed",
    owner: "src/hooks/use-onboarding-tour.ts",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
  },
  {
    key: "chronopay.onboarding.samplesCleared",
    owner: "src/hooks/use-onboarding-samples.ts",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
  },
  {
    key: "chronopay.onboarding.tourDismissed",
    owner: "src/hooks/use-onboarding-samples.ts",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
  },
  {
    key: "chronopay-recently-viewed",
    owner: "src/app/marketplace/components/recently-viewed-rail.tsx",
    area: "localStorage",
    format: "json",
    viaUseStoredState: false,
  },
  {
    key: "chronopay-marketplace-page-size",
    owner: "src/components/marketplace/results-per-page-selector.tsx",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
  },
  {
    key: "chronopay-marketplace-view",
    owner: "src/app/marketplace (useMapView)",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
  },
  {
    key: "chronopay:role",
    owner: "src/app/components/navigation/RoleContext.tsx",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
  },
  {
    key: "chronopay:role:selected",
    owner: "src/app/components/navigation/RoleContext.tsx",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
  },
  {
    key: "chronopay:pinnedNav",
    owner: "src/app/components/navigation/role-nav.ts",
    area: "localStorage",
    format: "json",
    viaUseStoredState: false,
  },
  {
    key: "chronopay:notifications",
    owner: "src/components/dashboard/notifications",
    area: "localStorage",
    format: "json",
    viaUseStoredState: false,
  },
  {
    key: "chronopay:notification-preferences",
    owner: "src/components/dashboard/notifications",
    area: "localStorage",
    format: "json",
    viaUseStoredState: false,
  },
  {
    key: "chronopay:recent-accounts",
    owner: "src/hooks/use-accounts.ts",
    area: "localStorage",
    format: "json",
    viaUseStoredState: false,
  },
  {
    key: "chronopay:offline-queue",
    owner: "src/lib/offline-queue.ts",
    area: "localStorage",
    format: "json",
    viaUseStoredState: false,
  },
  {
    key: "chronopay-experiments",
    owner: "src/components/dashboard/settings/experimental-feature-config.ts",
    area: "localStorage",
    format: "json",
    viaUseStoredState: false,
  },
  {
    key: "chronopay:stellar-network",
    owner: "src/components/dashboard/network-selector",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
  },
  {
    key: "chronopay-saved-views",
    owner: "src/components/dashboard (saved views)",
    area: "localStorage",
    format: "json",
    viaUseStoredState: false,
  },
  {
    key: "chronopay.wallet-panel.active-tab",
    owner: "src/components/dashboard (wallet panel)",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
  },
  {
    key: "chronopay.wallet-panel.scroll",
    owner: "src/components/dashboard (wallet panel)",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
  },
  {
    key: "scroll-restoration-",
    owner: "src/hooks/use-scroll-restoration.ts",
    area: "sessionStorage",
    format: "json",
    viaUseStoredState: false,
    notes: "Prefix; the full key appends the list id.",
  },
  {
    key: "cp-pinned",
    owner: "src/app/hooks/use-command-palette-storage.ts",
    area: "localStorage",
    format: "json",
    viaUseStoredState: false,
  },
  {
    key: "cp-recent",
    owner: "src/app/hooks/use-command-palette-storage.ts",
    area: "localStorage",
    format: "json",
    viaUseStoredState: false,
  },
  {
    key: "chronopay-share-subtitle-",
    owner: "src/components/dashboard (share subtitle)",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
    notes: "Prefix; the full key appends an entity id.",
  },
  {
    key: "chronopay-dev-banner-dismissed",
    owner: "src/components/dashboard (dev banner)",
    area: "localStorage",
    format: "plain",
    viaUseStoredState: false,
  },
  {
    key: "locale",
    owner: "src/lib/i18n.tsx",
    area: "cookie",
    format: "plain",
    viaUseStoredState: false,
    notes: "LOCALE_COOKIE_NAME from src/lib/i18n-config.ts.",
  },
];

/** Every registered key, migrated and not yet migrated. */
export const ALL_STORAGE_KEYS: readonly StorageKeyEntry[] = [
  ...Object.values(STORAGE_KEYS),
  ...REGISTERED_STORAGE_KEYS,
];

/** Storage key for a single receipt note. */
export function receiptNoteKey(receiptId: string): string {
  return `${STORAGE_KEYS.receiptNotes.key}${receiptId}`;
}

/** Storage key for a supplier's timezone display mode. */
export function timezoneModeKey(supplierId: string): string {
  return `${STORAGE_KEYS.timezoneMode.key}${supplierId}`;
}

/** Storage key for a scroll-restoration entry. */
export function scrollRestorationKey(listId: string): string {
  return `scroll-restoration-${listId}`;
}
