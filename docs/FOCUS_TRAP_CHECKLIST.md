# Focus Trap & Overlay Checklist

How every modal, dialog, alert dialog, drawer, lightbox, tour, and notification
overlay in ChronoPay must behave for keyboard and assistive-technology users.

The single shared implementation lives in
[`src/components/common/FocusTrap.tsx`](../src/components/common/FocusTrap.tsx).
All overlays should reuse it — there is **no excuse for a second, inline
Tab-handler implementation** (the onboarding walkthrough was the last one and is
now standardized on `FocusTrap`).

## Non-negotiable contract

For **every** overlay that appears on top of the page:

1. **Focus enters.** The first focusable element inside the dialog receives
   focus when the overlay opens. If the overlay is decorative with no
   focusables, `FocusTrap` focuses the container itself (transient
   `tabindex="-1"`) so focus is never lost.
2. **Focus returns.** On close, focus returns to the element that had it before
   the overlay opened. If that element was removed from the DOM, focus lands on
   `[data-focus-fallback]`, then `main`, then `document.body`.
3. **Focus never escapes.** Tab / Shift+Tab cycle within the overlay, and any
   attempt to focus something outside (click, `autofocus`, `focusout`) is
   **reclaimed** by the top-most open `FocusTrap` while it is mounted.
4. **Modal semantics.** The overlay uses `role="dialog"` (or
   `role="alertdialog"` for critical actions) with `aria-modal="true"` and is
   **labeled by a heading** via `aria-labelledby`.
5. **Dismissible via Escape** where the flow is cancellable, returning focus to
   the trigger (handled by the component, not `FocusTrap`, which deliberately
   does not own escape semantics).

Run the automated harness at
[`src/app/design-review/focus-trap/page.tsx`](../src/app/design-review/focus-trap/page.tsx)
(`FocusTrapTester`) to verify Tab cycle, Shift+Tab cycle, and focus-on-mount for
every enumerated overlay.

## Overlay inventory

| Overlay | File | Focus trap | Modal semantics |
| --- | --- | --- | --- |
| Base `FocusTrap` | `src/components/common/FocusTrap.tsx` | Shared component | n/a |
| Wallet connect | `src/components/dashboard/WalletConnectModal.tsx` | `FocusTrap` | yes |
| Lightbox | `src/components/dashboard/lightbox.tsx` | `FocusTrap` | yes |
| Refund confirm | `src/components/dashboard/refund-confirmation-modal.tsx` | `FocusTrap` | yes |
| Export history | `src/components/dashboard/export-history-modal.tsx` | `FocusTrap` | yes |
| Calendar sync conflict | `src/components/dashboard/settings/calendar-sync-conflict-modal.tsx` | `FocusTrap` | yes |
| Moderation flag | `src/components/dashboard/review-moderation-flag-modal.tsx` | `FocusTrap` | yes |
| Receive token | `src/components/dashboard/receive-token-panel.tsx` | `FocusTrap` | yes |
| Order summary drawer | `src/components/dashboard/order-summary-drawer.tsx` | `FocusTrap` | yes |
| Onboarding walkthrough | `src/components/dashboard/onboarding-walkthrough.tsx` | `FocusTrap` | yes |
| Onboarding tour | `src/components/dashboard/onboarding-tour.tsx` | `FocusTrap` | yes |
| Bottom nav overflow | `src/app/components/navigation/BottomNavOverflow.tsx` | `FocusTrap` | yes |
| Keyboard shortcuts | `src/app/components/keyboard-shortcuts-overlay.tsx` | `FocusTrap` | yes |
| Receipt | `src/components/receipt/ReceiptModal.tsx` | `FocusTrap` | yes |
| Help popover | `src/app/components/ui/help-popover.tsx` | `FocusTrap` | yes |
| Command palette | `src/app/components/command-palette.tsx` | `FocusTrap` | yes |
| Offline queue | `src/app/components/offline-queue-indicator.tsx` | `FocusTrap` | yes |
| Availability template picker | `src/components/dashboard/availability-template-picker.tsx` | `FocusTrap` | yes |
| Supplier follow control | `src/components/dashboard/supplier-follow-control.tsx` | `FocusTrap` | yes |

> **Note on coverage:** the inventory above reflects overlays already wired to
> `FocusTrap`. When adding a new overlay, wrap it in `FocusTrap`, set
> `role="dialog"` + `aria-modal="true"` + `aria-labelledby`, and add it to the
> `FocusTrapTester` `overlayEntries` list so it is covered by the automated
> harness.

## Toasts are intentionally *not* modal traps

Toasts are **non-modal** live regions. They must **not** trap focus or steal it
on arrival, or keyboard users would be pulled out of their current task. The
contract:

- Use `role="status"` (polite) for informational/success, `role="alert"`
  (assertive) for warnings/errors — already handled by `src/app/components/ui/toast.tsx`.
- If a toast hosts an action (e.g. **Undo**), focus may land there, and Tab
  should cycle within the toast only while it **has** focus (existing
  behavior). On dismiss, focus returns to wherever it was before.
- Never wrap a toast in `FocusTrap` while a modal is open — stack ordering is
  preserved by the trap registry (an inner focused element inside any mounted
  trap is left alone).

## Adding a new overlay — 30-second checklist

1. Wrap the overlay panel in `<FocusTrap>`.
2. `role="dialog"` (+ `role="alertdialog"` for destructive confirmations),
   `aria-modal="true"`, `aria-labelledby` pointing to a real heading.
3. Escape closes (if cancellable) and returns focus to the trigger.
4. Open the `FocusTrapTester` page and verify **Tab cycle**, **Shift+Tab
   cycle**, and **focus on mount** all pass.
5. Add the overlay to the inventory table and the tester `overlayEntries`.

## Verification commands

```bash
# Lint the changed files (repo-wide lint/typecheck currently carry pre-existing
# baseline debt tracked in CI; scoped runs are below).
npx eslint src/components/common/FocusTrap.tsx src/components/common/FocusTrap.test.tsx \
  src/components/dashboard/onboarding-walkthrough.tsx \
  src/components/dashboard/onboarding-walkthrough.test.tsx \
  src/components/design/focus-trap-tester.tsx src/__tests__/focus-trap-tester.test.tsx

# Focused unit tests
npx vitest run src/components/common/FocusTrap.test.tsx \
  src/components/dashboard/onboarding-walkthrough.test.tsx \
  src/__tests__/focus-trap-tester.test.tsx
```