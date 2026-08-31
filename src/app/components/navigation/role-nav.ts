/**
 * role-nav.ts
 *
 * Single source of truth for role definitions, per-role navigation inventories,
 * and shared nav primitives used across the ChronoPay dashboard shell.
 *
 * Design constraints
 * ──────────────────
 * • Role indicator always conveys state with text + icon, never colour alone
 *   (WCAG 1.4.1 Use of Color, 2.1 AA).
 * • Shared primitives (Home, Stellar link) appear for all roles so navigation
 *   is predictable regardless of context.
 * • Each role exposes a primary CTA href that surfaces the most important
 *   destination above the fold.
 */

// ─── Role enum ───────────────────────────────────────────────────────────────

export type UserRole = "supplier" | "buyer" | "admin";

export const ALL_ROLES: UserRole[] = ["supplier", "buyer", "admin"];

// ─── Nav item shape ───────────────────────────────────────────────────────────

export type NavBadge =
  | { type: "dot" }
  | { type: "count"; value: number };

export interface NavItem {
  /** Route href */
  href: string;
  /** Display label */
  label: string;
  /**
   * Unicode/emoji icon rendered with aria-hidden={true}.
   * A text label is ALWAYS shown alongside the icon so colour / shape is never
   * the only differentiator (WCAG 1.4.1).
   */
  icon: string;
  /** aria-label override for screen readers when label alone is ambiguous */
  ariaLabel?: string;
  /** Optional badge indicator (dot or count) */
  badge?: NavBadge;
}

/**
 * Formats a badge count for visual display, capping at "99+".
 */
export function formatBadgeCount(value: number): string {
  return value > 99 ? "99+" : value.toString();
}

/**
 * Generates an accessible screen reader announcement for the badge.
 */
export function getBadgeAriaLabel(badge: NavBadge): string {
  if (badge.type === "dot") {
    return "New updates available";
  }
  return `${badge.value} new ${badge.value === 1 ? "update" : "updates"}`;
}

// ─── Shared primitives (common to every role) ─────────────────────────────────

export const SHARED_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Home", icon: "🏠", ariaLabel: "Dashboard home" },
];

// ─── Per-role nav inventories ─────────────────────────────────────────────────

/**
 * Supplier — provides time tokens, manages availability, tracks earnings.
 * Primary destinations: Availability, Earnings, History.
 * Primary CTA: List a time slot.
 */
const SUPPLIER_NAV: NavItem[] = [
  ...SHARED_NAV_ITEMS,
  { href: "/dashboard/availability", label: "Availability", icon: "📅", ariaLabel: "Manage your availability" },
  { href: "/dashboard/earnings",     label: "Earnings",     icon: "💰", ariaLabel: "View your earnings" },
  { href: "/dashboard/history",      label: "History",      icon: "🕘", ariaLabel: "Transaction history" },
];

/**
 * Buyer — browses marketplace, books time slots, tracks spend and bookings.
 * Primary destinations: Marketplace, My Bookings, History.
 * Primary CTA: Browse marketplace.
 */
const BUYER_NAV: NavItem[] = [
  ...SHARED_NAV_ITEMS,
  { href: "/marketplace",            label: "Marketplace",  icon: "🛒", ariaLabel: "Browse the time marketplace" },
  { href: "/dashboard/bookings",     label: "My Bookings",  icon: "📋", ariaLabel: "View your bookings" },
  { href: "/dashboard/calendar",     label: "Calendar",     icon: "📆", ariaLabel: "Booking calendar" },
  { href: "/dashboard/history",      label: "History",      icon: "🕘", ariaLabel: "Transaction history" },
];

/**
 * Admin — oversees platform health, user management, and system settings.
 * Primary destinations: Users, Analytics, Settings.
 * Primary CTA: Admin panel.
 */
const ADMIN_NAV: NavItem[] = [
  ...SHARED_NAV_ITEMS,
  { href: "/admin/users",      label: "Users",      icon: "👥", ariaLabel: "Manage users" },
  { href: "/admin/analytics",  label: "Analytics",  icon: "📊", ariaLabel: "Platform analytics" },
  { href: "/admin/settings",   label: "Settings",   icon: "⚙️",  ariaLabel: "System settings" },
];

// ─── Role metadata (label, icon, tone) ────────────────────────────────────────

export interface RoleMeta {
  role: UserRole;
  /** Human-readable display label */
  label: string;
  /**
   * Icon conveying role identity.
   * Must accompany text — never used alone (WCAG 1.4.1).
   */
  icon: string;
  /**
   * StatusChip tone — used as a visual hint only.
   * The text+icon combination always carries the primary meaning.
   */
  tone: "info" | "warning" | "success" | "neutral";
  /** Short description for the role switcher tooltip / aria-describedby */
  description: string;
  /** href of the primary CTA for this role */
  primaryCta: { href: string; label: string };
}

export const ROLE_META: Record<UserRole, RoleMeta> = {
  supplier: {
    role: "supplier",
    label: "Supplier",
    icon: "⏱️",
    tone: "success",
    description: "You are managing and listing your available time slots.",
    primaryCta: { href: "/dashboard/availability", label: "List a slot" },
  },
  buyer: {
    role: "buyer",
    label: "Buyer",
    icon: "🛒",
    tone: "info",
    description: "You are browsing and booking time slots from suppliers.",
    primaryCta: { href: "/marketplace", label: "Browse marketplace" },
  },
  admin: {
    role: "admin",
    label: "Admin",
    icon: "🛡️",
    tone: "warning",
    description: "You have full platform administration access.",
    primaryCta: { href: "/admin/users", label: "Admin panel" },
  },
};

// ─── Navigation lookup ────────────────────────────────────────────────────────

export const ROLE_NAV: Record<UserRole, NavItem[]> = {
  supplier: SUPPLIER_NAV,
  buyer: BUYER_NAV,
  admin: ADMIN_NAV,
};

/**
 * Returns the nav items for the given role.
 * Falls back to buyer nav for unknown roles.
 */
export function getNavForRole(role: UserRole): NavItem[] {
  return ROLE_NAV[role] ?? BUYER_NAV;
}

// ─── Bottom-nav overflow ──────────────────────────────────────────────────────

/**
 * Maximum number of items visible directly in the bottom bar (including the
 * "More" trigger when overflow is active). Keep ≤ 5 so each tap target
 * satisfies WCAG 2.5.5 (44 × 44 px minimum) on a 375 px viewport.
 */
export const BOTTOM_NAV_MAX_VISIBLE = 4;

/** Maximum viewport width (px) below which the bottom navigation is shown. */
export const BOTTOM_NAV_BREAKPOINT_PX = 640;

/** CSS padding value that accounts for the iOS home indicator. */
export const BOTTOM_NAV_SAFE_AREA_PADDING = "env(safe-area-inset-bottom)";

/** localStorage key that stores an ordered array of pinned hrefs per role. */
export const PINNED_NAV_STORAGE_KEY = "chronopay:pinnedNav";

/**
 * Reads pinned hrefs for a given role from localStorage.
 * Returns an empty array on error or when nothing is stored yet.
 */
export function readPinnedHrefs(role: UserRole): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PINNED_NAV_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Partial<Record<UserRole, string[]>>;
    return Array.isArray(parsed[role]) ? (parsed[role] as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * Writes pinned hrefs for a given role to localStorage.
 */
export function writePinnedHrefs(role: UserRole, hrefs: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(PINNED_NAV_STORAGE_KEY);
    const parsed: Partial<Record<UserRole, string[]>> = raw
      ? (JSON.parse(raw) as Partial<Record<UserRole, string[]>>)
      : {};
    parsed[role] = hrefs;
    window.localStorage.setItem(PINNED_NAV_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore write failures
  }
}

/**
 * Given a full nav list and a set of pinned hrefs, returns items sorted so
 * pinned items come first (in pin order), followed by the rest in original
 * order.  The first `BOTTOM_NAV_MAX_VISIBLE` of the result are shown directly;
 * the remainder appear in the overflow sheet.
 */
export function sortNavByPins(items: NavItem[], pinnedHrefs: string[]): NavItem[] {
  const pinSet = new Set(pinnedHrefs);
  const pinIndex = (href: string) => {
    const i = pinnedHrefs.indexOf(href);
    return i === -1 ? Infinity : i;
  };
  return [...items].sort((a, b) => {
    const aPinned = pinSet.has(a.href);
    const bPinned = pinSet.has(b.href);
    if (aPinned && bPinned) return pinIndex(a.href) - pinIndex(b.href);
    if (aPinned) return -1;
    if (bPinned) return 1;
    return 0; // preserve original relative order
  });
}

export interface BottomNavPartition {
  visible: NavItem[];
  overflow: NavItem[];
}

/**
 * Partitions sorted nav items into the items shown directly in the bottom bar
 * and the items that belong in the overflow sheet. When overflow is active,
 * one slot is reserved for the "More" trigger.
 */
export function partitionBottomNavItems(
  items: NavItem[],
  pinnedHrefs: string[] = [],
): BottomNavPartition {
  const sorted = sortNavByPins(items, pinnedHrefs);
  const hasOverflow = sorted.length > BOTTOM_NAV_MAX_VISIBLE;
  const visibleCount = hasOverflow
    ? BOTTOM_NAV_MAX_VISIBLE - 1
    : BOTTOM_NAV_MAX_VISIBLE;

  return {
    visible: sorted.slice(0, visibleCount),
    overflow: sorted.slice(visibleCount),
  };
}

/**
 * Returns the partitioned bottom navigation for a role.
 */
export function getBottomNavPartition(
  role: UserRole,
  pinnedHrefs: string[] = [],
): BottomNavPartition {
  return partitionBottomNavItems(getNavForRole(role), pinnedHrefs);
}

/**
 * Determines whether a nav item should be marked active for a given pathname.
 * The dashboard home item is only active on the exact dashboard route so it
 * does not stay highlighted while browsing child destinations.
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  const normalize = (value: string) =>
    value.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  const itemPath = normalize(item.href);
  const currentPath = normalize(pathname);

  if (itemPath === "/dashboard") {
    return currentPath === itemPath;
  }

  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`);
}
