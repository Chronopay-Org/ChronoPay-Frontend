# AccountSwitcher Component API

The `AccountSwitcher` component provides a dropdown menu in the dashboard header for switching between Stellar wallet accounts. It includes a typeahead search input, a recent-accounts list, and pins the current active account at the top.

## Overview

```
┌─────────────────────────────────────┐
│  [Avatar] Primary          ▼       │  ← Trigger button in header
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  Switch account                [×] │
│  ┌─────────────────────────────┐   │
│  │ 🔍 Search accounts...      │   │  ← Typeahead search input
│  └─────────────────────────────┘   │
│  Current account                   │
│  ┌─────────────────────────────┐   │
│  │ [PR] Primary    [Active]    │   │  ← Pinned active account
│  │     GAAZI4…OCCWN            │   │
│  │                    freighter│   │
│  └─────────────────────────────┘   │
│  ───────────────────────────────── │
│  Recent     🕐                     │
│  ┌─────────────────────────────┐   │
│  │ [SA] Savings                │   │  ← Recently used accounts
│  │     GD6WNT…YOYZK            │   │
│  │                    albedo   │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ [BU] Business               │   │
│  │     GCLRFH…MG5JR            │   │
│  │                    freighter│   │
│  └─────────────────────────────┘   │
│  ───────────────────────────────── │
│  [+ Add account]                   │  ← Add account action
│  ───────────────────────────────── │
│  ↑↓ navigate · Enter switch       │
│  · Esc close                       │
└─────────────────────────────────────┘
```

## Props

| Prop | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `className` | `string` | No | `""` | Additional CSS class names for the wrapper element. |

The component consumes the `useAccounts` hook internally and does not require any external state management.

## Features

### Typeahead Search
- Filters accounts by label, address (partial matches), and wallet provider.
- Matches are highlighted with cyan `<mark>` styling.
- Empty state shown when no accounts match the query.

### Recent Accounts
- Tracks recently used accounts (up to `MAX_RECENTS = 5`) with `localStorage` persistence.
- Recent accounts are shown below the active account in the default view.
- When searching, only matching accounts are shown (recents hidden).

### Pinned Active Account
- The current active account is always pinned at the top of the list with an "Active" badge.
- Clicking the active account closes the dropdown without switching.

### Add Account
- The "Add account" button at the bottom allows adding a new account.
- Adds a mock account in the demo; in production this would open the `WalletConnectModal`.

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
| :--- | :--- |
| **Keyboard navigation** | Arrow keys (↑↓) navigate items, Enter selects, Escape closes/clears search, Tab closes. |
| **Focus management** | Focus moves to search input when dropdown opens; returns to trigger when closed. |
| **ARIA roles** | `role="combobox"` on search input, `role="listbox"` on account list, `role="option"` on items. |
| **aria-expanded** | Trigger button has `aria-expanded` reflecting dropdown state. |
| **aria-current** | Active account item has `aria-current="true"`. |
| **aria-selected** | Focused list item has `aria-selected="true"`. |
| **aria-live** | Account switches are announced via `role="status"` with `aria-live="polite"`. |
| **Focus rings** | All interactive elements have visible `focus-visible:ring-2` cyan focus rings. |
| **Click-outside** | Clicking outside the dropdown closes it without disrupting other interactions. |
| **Screen reader** | Trigger has descriptive `aria-label` including current account name. |

## Architecture & Data Flow

```
┌─────────────────────────────────────┐
│         Dashboard Shell             │
│  ┌───────────────────────────────┐  │
│  │     AccountSwitcher           │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   useAccounts() hook    │  │  │
│  │  │   - accounts[]          │  │  │
│  │  │   - activeAddress       │  │  │
│  │  │   - recentAddresses[]   │  │  │
│  │  │   - switchAccount()     │  │  │
│  │  │   - addAccount()        │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

The `recentAddresses` array is persisted in `localStorage` under the key `chronopay:recent-accounts` and is updated whenever:
- An account is switched (`SET_ACTIVE` action)
- An account is added (`ADD_ACCOUNT` action)
- An account is removed (`REMOVE_ACCOUNT` cleans up the recent list)

## Usage Example

```tsx
import { AccountSwitcher } from "@/app/components/account-switcher";

// In the dashboard header:
<nav aria-label="Dashboard navigation">
  <AccountSwitcher />
  <ThemeSwitcher />
  <HeaderSearch />
</nav>
```

## Edge Cases

| Scenario | Behavior |
| :--- | :--- |
| **Single account** | Recent accounts section hidden (nothing to show below active). |
| **No accounts** | Trigger shows "No account" text; dropdown still allows adding. |
| **Empty search** | "No accounts matching" empty state with suggestion to try different query. |
| **Dark mode** | Uses Tailwind dark theme classes consistent with dashboard (slate-950 backgrounds, white/10 borders). |
| **RTL** | The component uses `right-0` positioning on the dropdown which assumes LTR. For RTL support, use `left-0` instead. The toggle thumb is not directional so it works in both. |
| **Keyboard** | Full keyboard navigation with Arrow keys, Enter, Escape, Tab. |
| **Click-outside** | Closes without triggering account switch. |
| **Focus trap** | Focus moves to search input on open; Tab closes the dropdown. |

## Related Components

- `useAccounts` hook (`src/hooks/use-accounts.ts`) — state management for accounts and recents
- `ThemeSwitcher` — adjacent header control with similar dropdown pattern
- `HeaderSearch` — search affordance with combobox pattern (reference for ARIA implementation)
- `WalletConnectModal` — modal for connecting new wallet providers (would be triggered by "Add account" in production)
