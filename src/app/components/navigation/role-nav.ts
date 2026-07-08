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

export interface NavItem {
  /** Route href */
  href: string;
  /** Display label */
  label: string;
  /**
   * Unicode/emoji icon rendered with aria-hidden="true".
   * A text label is ALWAYS shown alongside the icon so colour / shape is never
   * the only differentiator (WCAG 1.4.1).
   */
  icon: string;
  /** aria-label override for screen readers when label alone is ambiguous */
  ariaLabel?: string;
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
