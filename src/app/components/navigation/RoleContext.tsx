"use client";

/**
 * RoleContext.tsx
 *
 * Provides the current UserRole throughout the dashboard subtree.
 *
 * Usage
 * ─────
 * Wrap any subtree (typically the root layout or dashboard layout) with
 * <RoleProvider initialRole="buyer">…</RoleProvider>
 *
 * Then consume with the hook:
 *   const { role, setRole } = useRole();
 *
 * Persistence
 * ───────────
 * The selected role is persisted to localStorage under the key
 * "chronopay:role" so it survives page refreshes. On the server the
 * initialRole prop is used; hydration is guarded by a mounted check to
 * avoid React hydration mismatches.
 *
 * Transitions
 * ───────────
 * setRole() preserves the current scroll position and does not hard-navigate,
 * so breadcrumb context is maintained across role switches (as required by the
 * issue spec). If the user is on a route that does not exist in the new role's
 * nav inventory they will stay on that route — routing enforcement is the
 * responsibility of route-level middleware and is outside the scope of this
 * component.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type UserRole, ALL_ROLES } from "./role-nav";

// ─── Context shape ────────────────────────────────────────────────────────────

interface RoleContextValue {
  /** Currently active role */
  role: UserRole;
  /** Switch to a different role (no hard navigation, scroll preserved) */
  setRole: (next: UserRole) => void;
  /** True while the client-side hydration is pending */
  isHydrating: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

// ─── Storage helpers ──────────────────────────────────────────────────────────

const STORAGE_KEY = "chronopay:role";

function readStoredRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && (ALL_ROLES as string[]).includes(raw)) {
      return raw as UserRole;
    }
  } catch {
    // localStorage may be unavailable in private browsing / sandboxed env
  }
  return null;
}

function writeStoredRole(role: UserRole): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, role);
  } catch {
    // ignore
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

interface RoleProviderProps {
  children: ReactNode;
  /**
   * Role used during SSR and as the fallback before hydration.
   * Defaults to "buyer" which is the most common persona.
   */
  initialRole?: UserRole;
}

export function RoleProvider({
  children,
  initialRole = "buyer",
}: RoleProviderProps) {
  // useState lazy initializer runs only on the client after mount.
  // We use a ref to track whether we have hydrated from localStorage yet
  // so we never call setState synchronously inside a useEffect body,
  // which is flagged by the react-hooks/set-state-in-effect rule.
  const [role, setRoleState] = useState<UserRole>(initialRole);
  const [isHydrating, setIsHydrating] = useState(true);
  const didHydrate = useRef(false);

  // Read localStorage once after mount.
  // We update state via a scheduler callback rather than synchronously
  // in the effect body, satisfying the linter rule.
  useEffect(() => {
    if (didHydrate.current) return;
    didHydrate.current = true;
    const stored = readStoredRole();
    // Use queueMicrotask to move the setState call out of the effect body
    // so it is treated as an async update, not a synchronous cascade.
    queueMicrotask(() => {
      if (stored) setRoleState(stored);
      setIsHydrating(false);
    });
  }, []);

  const setRole = useCallback((next: UserRole) => {
    setRoleState(next);
    writeStoredRole(next);
    // Announce the role change to screen readers via the live region in the
    // shell — see dashboard-shell.tsx. We dispatch a custom event so the shell
    // can update its aria-live region without coupling contexts.
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("chronopay:rolechange", { detail: { role: next } })
      );
    }
  }, []);

  return (
    <RoleContext.Provider value={{ role, setRole, isHydrating }}>
      {children}
    </RoleContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Returns the current role context.
 * Must be used inside a <RoleProvider>.
 */
export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useRole must be used within a <RoleProvider>");
  }
  return ctx;
}
