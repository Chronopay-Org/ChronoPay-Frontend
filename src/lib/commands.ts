/**
 * commands.ts
 *
 * Single source of truth for command palette commands and per-route ranking.
 *
 * # Ranking algorithm
 *
 * When a query is typed:
 *   1. Filter — keep commands whose label OR any keyword includes the query
 *      (case-insensitive).
 *   2. Score each surviving command:
 *      - Label match        → +10 base
 *      - Label starts-with  → +5  precision bonus
 *      - Keyword-only match → +5  base
 *      - Route boost        → multiply score by the matching boost factor
 *        (only when global mode is OFF).
 *   3. Sort descending by score.
 *
 * When the query is empty every command is shown, ordered by route boost only
 * so the most contextually relevant items appear at the top.
 *
 * Route boost schema:
 *   Key   — pathname pattern ("/exact/match" or "/prefix/*")
 *   boost — multiplier applied to the base score (≥ 1; no boost = 1)
 *   reason — human-readable explanation shown in the "Why this?" tooltip
 *
 * The global toggle in the palette footer sets all boosts to 1 so commands
 * appear in a flat alphabetical order regardless of the current route.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommandRouteBoost {
  /**
   * Score multiplier when the current pathname matches this pattern.
   * Higher values push the command higher in the results list.
   */
  boost: number;
  /**
   * Human-readable explanation for the "Why this?" tooltip.
   * Example: "Quick action from Wallet"
   */
  reason: string;
}

export interface Command {
  /** Unique identifier */
  id: string;
  /** Display label shown in the results list */
  label: string;
  /** Short description shown below the label */
  description: string;
  /** Navigation href — used when the user activates the command */
  href: string;
  /**
   * Lucide icon name.  Mapped to the actual component in command-palette.tsx
   * via ICON_MAP.  Use kebab-case matching the Lucide export name.
   */
  icon: string;
  /**
   * Alternative search terms so the command is findable even when the user
   * doesn't know the exact label.
   */
  keywords: string[];
  /**
   * Per-route boost configuration.
   * Each key is a pathname pattern (see matchRoute for semantics).
   * Commands without a matching boost get a multiplier of 1 (no boost).
   */
  routeBoosts: Record<string, CommandRouteBoost>;
  /**
   * Optional keyboard shortcut hint displayed in the result
   * (informational only — not wired).
   */
  shortcut?: string;
}

export interface RankedCommand extends Command {
  /** Computed relevance score — higher is more relevant */
  score: number;
  /** The boost factor that was applied (1 if no route boost matched) */
  appliedBoost: number;
  /** Human-readable reason shown in the "Why this?" tooltip, if boosted */
  boostReason?: string;
}

// ─── Route matching ───────────────────────────────────────────────────────────

/**
 * Checks whether a pathname matches a route pattern.
 *
 * Pattern syntax:
 *   "/exact/match"  — only matches that exact pathname
 *   "/prefix/*"     — matches the prefix and any child route
 *
 * Examples:
 *   matchRoute("/dashboard/wallet", "/dashboard/wallet")       → true
 *   matchRoute("/dashboard/wallet/transfer", "/dashboard/wallet/*") → true
 *   matchRoute("/dashboard",            "/dashboard/*")        → true
 *   matchRoute("/marketplace",          "/dashboard/*")        → false
 */
export function matchRoute(pathname: string, pattern: string): boolean {
  if (pattern.endsWith("/*")) {
    const prefix = pattern.slice(0, -2);
    return pathname === prefix || pathname.startsWith(prefix + "/");
  }
  return pathname === pattern;
}

// ─── Command catalogue ────────────────────────────────────────────────────────

/**
 * All available commands.
 *
 * When adding a new command:
 *   1. Give it a unique `id`
 *   2. Add `routeBoosts` for every route where it should appear higher
 *   3. Document the boost `reason` clearly so users understand the ranking
 */
export const COMMANDS: Command[] = [
  // ── Dashboard ────────────────────────────────────────────────────────────
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Go to your dashboard overview",
    href: "/dashboard",
    icon: "LayoutDashboard",
    keywords: ["home", "overview", "main", "start"],
    routeBoosts: {
      "/dashboard": { boost: 3, reason: "You're on the Dashboard" },
    },
  },

  // ── Marketplace ────────────────────────────────────────────────────────────
  {
    id: "marketplace",
    label: "Marketplace",
    description: "Browse the time marketplace",
    href: "/marketplace",
    icon: "ShoppingCart",
    keywords: ["browse", "shop", "buy", "explore", "services"],
    routeBoosts: {
      "/marketplace": { boost: 3, reason: "You're on the Marketplace" },
    },
  },

  // ── Calendar ────────────────────────────────────────────────────────────────
  {
    id: "calendar",
    label: "Calendar",
    description: "View your schedule and availability",
    href: "/dashboard/calendar",
    icon: "Calendar",
    keywords: ["schedule", "availability", "dates", "appointments"],
    routeBoosts: {
      "/dashboard/calendar": { boost: 3, reason: "You're on the Calendar" },
    },
  },

  // ── History ──────────────────────────────────────────────────────────────────
  {
    id: "history",
    label: "History",
    description: "View your transaction history",
    href: "/dashboard/history",
    icon: "History",
    keywords: ["transactions", "past", "activity", "log"],
    routeBoosts: {
      "/dashboard/history": { boost: 3, reason: "You're on the History page" },
    },
  },

  // ── Wallet ───────────────────────────────────────────────────────────────────
  {
    id: "wallet",
    label: "Wallet",
    description: "View your token balance and transactions",
    href: "/dashboard/wallet",
    icon: "Wallet",
    keywords: ["balance", "tokens", "funds", "account"],
    routeBoosts: {
      "/dashboard/wallet": { boost: 3, reason: "You're on the Wallet page" },
    },
  },

  // ── Transfer ─────────────────────────────────────────────────────────────────
  {
    id: "transfer",
    label: "Transfer",
    description: "Send tokens to another account",
    href: "/dashboard/wallet/transfer",
    icon: "ArrowRightLeft",
    keywords: ["send", "pay", "move", "funds", "tokens"],
    routeBoosts: {
      // Boosted aggressively on wallet routes so it tops the list
      "/dashboard/wallet":     { boost: 5, reason: "Quick action from Wallet" },
      "/dashboard/wallet/*":   { boost: 5, reason: "Quick action from Wallet" },
    },
  },

  // ── Create Availability ──────────────────────────────────────────────────────
  {
    id: "create-availability",
    label: "Create Availability",
    description: "List a new time slot for bookings",
    href: "/dashboard/availability",
    icon: "PlusCircle",
    keywords: ["add", "new", "slot", "time", "list", "create"],
    routeBoosts: {
      // Boosted aggressively on calendar routes so it tops the list
      "/dashboard/calendar":   { boost: 5, reason: "Quick action from Calendar" },
    },
  },

  // ── My Bookings ──────────────────────────────────────────────────────────────
  {
    id: "bookings",
    label: "My Bookings",
    description: "View your active and past bookings",
    href: "/dashboard/bookings",
    icon: "CalendarCheck",
    keywords: ["booked", "reservations", "slots", "scheduled"],
    routeBoosts: {
      "/dashboard/bookings": { boost: 3, reason: "You're on the Bookings page" },
    },
  },

  // ── Earnings ─────────────────────────────────────────────────────────────────
  {
    id: "earnings",
    label: "Earnings",
    description: "View your earnings and revenue",
    href: "/dashboard/earnings",
    icon: "TrendingUp",
    keywords: ["revenue", "income", "payouts", "money"],
    routeBoosts: {
      "/dashboard/earnings": { boost: 3, reason: "You're on the Earnings page" },
    },
  },

  // ── Settings ─────────────────────────────────────────────────────────────────
  {
    id: "settings",
    label: "Settings",
    description: "Configure your dashboard preferences",
    href: "/dashboard/settings",
    icon: "Settings",
    keywords: ["preferences", "configure", "options", "profile"],
    routeBoosts: {
      "/dashboard/settings": { boost: 3, reason: "You're on the Settings page" },
    },
  },

  // ── Browse (alternate marketplace entry) ────────────────────────────────────
  {
    id: "browse",
    label: "Browse Marketplace",
    description: "Discover available time slots from suppliers",
    href: "/marketplace",
    icon: "Search",
    keywords: ["find", "discover", "search", "explore"],
    routeBoosts: {
      "/marketplace": { boost: 3, reason: "You're on the Marketplace" },
    },
  },

  // ── View Transactions ───────────────────────────────────────────────────────
  {
    id: "transactions",
    label: "View Transactions",
    description: "Review all your token transfers and payments",
    href: "/dashboard/history",
    icon: "Receipt",
    keywords: ["payments", "receipts", "transfers", "activity"],
    routeBoosts: {
      "/dashboard/history": { boost: 3, reason: "You're on the History page" },
    },
  },

  // ── Admin: Users ─────────────────────────────────────────────────────────────
  {
    id: "admin-users",
    label: "Manage Users",
    description: "View and manage platform users",
    href: "/admin/users",
    icon: "Users",
    keywords: ["admin", "people", "accounts", "profiles"],
    routeBoosts: {
      "/admin/users": { boost: 3, reason: "You're on the Users page" },
    },
  },

  // ── Admin: Analytics ─────────────────────────────────────────────────────────
  {
    id: "admin-analytics",
    label: "Analytics",
    description: "View platform analytics and metrics",
    href: "/admin/analytics",
    icon: "BarChart3",
    keywords: ["admin", "metrics", "reports", "data", "statistics"],
    routeBoosts: {
      "/admin/analytics": { boost: 3, reason: "You're on the Analytics page" },
    },
  },

  // ── Admin: System Settings ──────────────────────────────────────────────────
  {
    id: "admin-settings",
    label: "System Settings",
    description: "Configure system-wide settings",
    href: "/admin/settings",
    icon: "Cog",
    keywords: ["admin", "configure", "options", "preferences", "system"],
    routeBoosts: {
      "/admin/settings": { boost: 3, reason: "You're on the System Settings page" },
    },
  },
];

// ─── Ranking ───────────────────────────────────────────────────────────────────

/**
 * Rank commands by relevance to the current query and route.
 *
 * Algorithm (documented at the top of this file):
 * 1. Filter by query (label or keyword match)
 * 2. Score: label=10/15, keyword=5, multiplied by route boost
 * 3. Sort descending
 *
 * When `isGlobal` is true, all route boosts are set to 1 so results are
 * purely alphabetical (by label) — no contextual ranking.
 */
export function rankCommands(
  commands: Command[],
  query: string,
  pathname: string,
  isGlobal: boolean,
): RankedCommand[] {
  const trimmed = query.trim().toLowerCase();

  // ── No query → show everything, route-ordered (unless global) ──────────
  if (!trimmed) {
    return commands
      .map((cmd) => {
        const { boost, reason } = getRouteBoost(cmd, pathname);
        const score = isGlobal ? 0 : boost;
        return {
          ...cmd,
          score,
          appliedBoost: isGlobal ? 1 : boost,
          boostReason: isGlobal ? undefined : reason,
        };
      })
      .sort((a, b) => b.score - a.score);
  }

  // ── With query → filter, score, sort ───────────────────────────────────
  return commands
    .map((cmd): RankedCommand | null => {
      const labelMatch = cmd.label.toLowerCase().includes(trimmed);
      const keywordMatch = cmd.keywords.some((k) =>
        k.toLowerCase().includes(trimmed),
      );
      if (!labelMatch && !keywordMatch) return null;

      let score = 0;

      if (labelMatch) {
        score += 10;
        // Precision bonus: query appears at the very start of the label
        if (cmd.label.toLowerCase().startsWith(trimmed)) score += 5;
      } else {
        // Keyword-only match is less relevant
        score += 5;
      }

      const { boost, reason } = getRouteBoost(cmd, pathname);
      const finalBoost = isGlobal ? 1 : boost;
      score *= finalBoost;

      return {
        ...cmd,
        score,
        appliedBoost: finalBoost,
        boostReason: isGlobal ? undefined : reason,
      };
    })
    .filter((c): c is RankedCommand => c !== null)
    .sort((a, b) => b.score - a.score);
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Look up the route boost for a command on the given pathname.
 * Returns { boost: 1 } when no pattern matches (no boost).
 */
function getRouteBoost(
  command: Command,
  pathname: string,
): { boost: number; reason?: string } {
  for (const [pattern, { boost, reason }] of Object.entries(
    command.routeBoosts,
  )) {
    if (matchRoute(pathname, pattern)) {
      return { boost, reason };
    }
  }
  return { boost: 1 };
}