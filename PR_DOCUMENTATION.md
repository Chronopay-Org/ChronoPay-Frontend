# Pull Request: Wallet Export History Modal

Closes #460

## Summary

This PR adds a fully accessible, three-step export modal (`ExportHistoryModal`) that allows users to download their transaction history as CSV or PDF. The modal provides configurable date ranges, column selection, and privacy masking toggles — reusing existing `maskName()` and `truncateHash()` helpers from the receipt module.

---

## What was done

### New files

| File | Purpose |
|---|---|
| `src/components/dashboard/export-history-modal.tsx` | Main component — 3-step flow: Configure → Generating → Complete |
| `src/components/dashboard/export-history-modal.test.tsx` | 28 unit tests covering all states, interactions, and accessibility |
| `docs/export-history-modal-design-system.md` | Full design system documentation |

### Modified files

| File | Change |
|---|---|
| `src/components/dashboard/index.ts` | Added `export * from "./export-history-modal"` |

---

## Features

### 1. Export format — CSV or PDF
- Radio-style toggle buttons with icons (`FileSpreadsheet` / `FileText`)
- Default: CSV
- PDF opens a formatted print view via `window.print()`

### 2. Date range picker
- Preset buttons: Last 7 days, Last 30 days, Last 90 days, This year, All time
- Custom range: inline `<input type="date">` with min/max constraints
- Radio-group semantics (`role="radio"`, `aria-checked`)

### 3. Columns picker
- 6 checkboxes: Date, Description, Amount, Status, Transaction ID, Counterparty
- All selected by default; export button disabled when none selected
- Native checkboxes with `accentColor` styling

### 4. Privacy toggles
- **Mask counterparty names** — uses `maskName()` from receipt/masking
- **Mask transaction IDs** — uses `truncateHash()` from receipt/masking
- Switch controls with `role="switch"` and `aria-checked`
- Privacy summary shown in the complete step with masked examples

### 5. Three-step flow
1. **Configure** — all settings in a scrollable form with `fieldset`/`legend` grouping
2. **Generating** — `Spinner` + progress bar (`role="progressbar"`) with animated fill
3. **Complete** — success check, download buttons, back button, privacy summary

---

## Accessibility (WCAG 2.1 AA)

| Requirement | Implementation |
|---|---|
| `role="dialog"` with `aria-modal="true"` | Dialog container |
| Focus trap | `FocusTrap` component wraps dialog |
| Escape to dismiss | `keydown` listener on document (blocked during generation) |
| Screen reader announcements | `LiveRegion` with conditional `aria-live="assertive"` on completion |
| Radio semantics | `role="radio"` + `aria-checked` on format and date range buttons |
| Switch semantics | `role="switch"` + `aria-checked` on privacy toggles |
| Progress bar | `role="progressbar"` with `aria-valuenow/min/max` |
| Focus indicators | `focus-visible:ring-2 focus-visible:ring-cyan-300` on all interactive elements |
| Reduced motion | `motion-reduce:transition-none` on progress bar animation |

---

## Test results

```
 ✓ src/components/dashboard/export-history-modal.test.tsx (28 tests) 1383ms

 Test Files  1 passed (1)
      Tests  28 passed (28)
```

Test coverage includes:
- Visibility (open/closed)
- ARIA attributes (dialog, radio, switch, checkbox, progressbar)
- Format switching (CSV ↔ PDF)
- Date range presets and custom range reveal
- Column selection (check all, uncheck, disable button on none)
- Privacy toggle interaction
- Close button and Escape key
- Generating step transition
- Escape blocked during generation
- Custom `onExport` handler (called with config, rejection recovery)
- Complete step (success state, download button, back button, privacy summary)
- State reset on modal re-open

---

## Responsive design

- Mobile (<640px): single-column layout, full-width modal
- Tablet (640px+): `max-w-lg`, two-column grids for format/columns
- All interactive elements have minimum 44px touch targets

---

## Design system compliance

- Uses `elevation-4`, `border-white/12`, `rounded-3xl` pattern (consistent with `ReceiptModal`, `RefundConfirmationModal`)
- Reuses `FocusTrap`, `LiveRegion`, `Spinner` from common/ui components
- Reuses `maskName()`, `truncateHash()` from receipt module
- Dark/light theme support via CSS custom properties
- RTL-compatible with `icon-directional` class on chevron

---

## Design Review Checklist

### ♿ Accessibility
- [x] Contrast ratios meet WCAG 2.1 AA (4.5:1)
- [x] Keyboard navigation is logical and focus rings are visible
- [x] Semantic HTML and ARIA labels are used correctly
- [x] Screen reader announcements via LiveRegion

### 📱 Responsive
- [x] Layout is mobile-first and works on all breakpoints
- [x] Touch targets ≥ 44px

### ⚙️ States & Tokens
- [x] Loading / generating / complete / error states handled
- [x] Design tokens (elevation, border, spacing) followed
- [x] Reduced motion supported

---

## How to test

1. Navigate to any page and render `<ExportHistoryModal isOpen={true} onClose={() => {}} />`
2. Try switching between CSV and PDF formats
3. Select different date range presets, try custom range
4. Toggle columns on/off — verify export button disables when none selected
5. Toggle privacy switches on/off
6. Click export — observe the generating step with progress bar
7. Verify the complete step shows download buttons and privacy summary
8. Test keyboard navigation: Tab through all controls, Escape to close
9. Test with screen reader active
10. Resize to mobile viewport — verify responsive layout
