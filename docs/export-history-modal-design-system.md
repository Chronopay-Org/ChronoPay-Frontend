# Export History Modal — Design System Documentation

> **Component:** `ExportHistoryModal`
> **Path:** `src/components/dashboard/export-history-modal.tsx`
> **Design Tokens:** `elevation-4`, `border-white/12`, `rounded-3xl`
> **Reusable Dependencies:** `FocusTrap`, `LiveRegion`, `Spinner`, `truncateHash`, `maskName`
> **Status:** WCAG 2.1 AA passed ✓

---

## Overview

The `ExportHistoryModal` provides a guided, three-step workflow for downloading transaction history as CSV or PDF. Users can configure the export format, date range, visible columns, and privacy masking before generating the file.

---

## States & Flow

The modal has three distinct steps that compose a linear workflow:

```
Configure → Generating → Complete
```

### 1. Configure Step

- **Format selection:** Radio-style buttons for CSV (default) and PDF
- **Date range:** Preset buttons (Last 7/30/90 days, This year, All time, Custom range)
  - **Custom range** expands inline date `<input type="date">` fields with min/max constraints
- **Columns picker:** Checkbox grid with 6 columns: Date, Description, Amount, Status, Transaction ID, Counterparty. All are selected by default.
- **Privacy toggles:** Two switch controls — Mask counterparty names (uses `maskName()`), Mask transaction IDs (uses `truncateHash()`)
- **Validation:** Export button is disabled when no columns are selected
- **Edge case:** Large exports — description text says "Processing N transactions for {range}"

### 2. Generating Step

- Shows `Spinner` (size `lg`) with progress text
- Progress bar (`role="progressbar"`) with animated fill
- "Cancel export" link to dismiss
- **Keyboard:** Escape is disabled during generation to prevent accidental closure
- **Accessibility:** `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on the progress bar
- **Reduced motion:** `motion-reduce:transition-none` on the progress bar

### 3. Complete Step

- Success state with green checkmark icon
- Summary card: transaction count, date range, format, column count, masking status
- Privacy summary: details what was masked with visual examples
- Download button (primary CTA):
  - CSV: triggers `Blob` download via a temporary `<a>` element
  - PDF: opens a new window with a styled HTML table and calls `window.print()`
- "Also download as PDF" button shown when CSV format was chosen
- Back button (chevron) to return to configure step
- Close link

---

## Responsive Design

| Breakpoint | Behavior |
|---|---|
| Mobile (<640px) | Full-width modal with `p-4` padding, single-column layouts |
| Tablet (640px+) | `max-w-lg` modal, two-column grids for format/columns |
| Desktop (1024px+) | Same as tablet, uses max-width constraint |

- All interactive elements have minimum 44px touch targets
- Grids collapse to single column on small screens

---

## Accessibility (WCAG 2.1 AA)

### ARIA Roles & Properties

| Element | Attribute | Purpose |
|---|---|---|
| Dialog container | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` | Identifies as modal dialog |
| Format buttons | `role="radio"`, `aria-checked` | Radio group semantics |
| Date range buttons | `role="radio"`, `aria-checked` | Radio group semantics |
| Privacy switches | `role="switch"`, `aria-checked` | Toggle switch semantics |
| Progress bar | `role="progressbar"`, `aria-valuenow/min/max` | Progress indication |
| Column checkboxes | Native `<input type="checkbox">` | Standard checkbox semantics |
| Live region | `aria-live="polite"`, `role="status"` | Screen reader announcements |

### Keyboard Navigation

- **Tab** / **Shift+Tab**: Cycle through focusable elements (FocusTrap)
- **Escape**: Close dialog (disabled during generation)
- **Space / Enter**: Activate buttons, toggles, and radio options

### Focus Management

- Focus is trapped within the dialog using the `FocusTrap` component
- Focus moves to the first focusable element on open
- Focus returns to the trigger element on close

### Screen Reader Announcements

- Step transitions are announced via `LiveRegion`
- Export progress updates are announced
- Download completion is announced

### Color & Contrast

- All text meets WCAG AA 4.5:1 contrast ratio against backgrounds
- Interactive states use `focus-visible:ring-2 focus-visible:ring-cyan-300` focus indicator
- Disabled states: 50% opacity with `cursor-not-allowed`

---

## Reused Utilities

| Utility | Source | Usage |
|---|---|---|
| `truncateHash(value, head, tail)` | `src/components/receipt/masking.ts` | Mask transaction IDs |
| `maskName(name)` | `src/components/receipt/masking.ts` | Mask counterparty names |
| `FocusTrap` | `src/components/common/FocusTrap.tsx` | Trap keyboard focus |
| `LiveRegion` | `src/components/common/LiveRegion.tsx` | Screen reader announcements |
| `Spinner` | `src/app/components/ui/spinner.tsx` | Loading indicator |

---

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `isOpen` | `boolean` | `false` | Controls modal visibility |
| `onClose` | `() => void` | — | Callback when dialog is dismissed |
| `onExport` | `(config: ExportConfig) => Promise<void>` | — | Custom export handler. If omitted, a simulated 3-second export runs |
| `estimatedCount` | `number` | `42` | Transaction count shown during generation |

### ExportConfig

```typescript
type ExportConfig = {
  format: "csv" | "pdf";
  dateRange: "last7" | "last30" | "last90" | "thisYear" | "allTime" | "custom";
  customStartDate: string;   // ISO date string (YYYY-MM-DD)
  customEndDate: string;     // ISO date string (YYYY-MM-DD)
  columns: ("date" | "description" | "amount" | "status" | "transactionId" | "counterparty")[];
  maskNames: boolean;        // Apply maskName() to counterparty names
  maskTransactionIds: boolean; // Apply truncateHash() to transaction IDs
};
```

---

## Edge Cases

| Scenario | Behavior |
|---|---|
| No columns selected | Export button is disabled |
| Custom date range very large | Progress text adjusts dynamically — supports any date span |
| Export fails (custom handler rejects) | Returns to configure step with no data loss |
| Escape during generation | Blocked — prevents accidental cancellation |
| Pop-up blocked for PDF | Fallback message: "Pop-up blocked. Use CSV download instead." |
| Re-opening modal | All state resets to defaults |
| Reduced motion preference | Progress bar uses `motion-reduce:transition-none` |

---

## Usage Example

```tsx
import { useState } from "react";
import { ExportHistoryModal } from "@/components/dashboard";

export function WalletPage() {
  const [isExportOpen, setIsExportOpen] = useState(false);

  const handleExport = async (config: ExportConfig) => {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chronopay-export.${config.format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button onClick={() => setIsExportOpen(true)}>Export history</button>
      <ExportHistoryModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        estimatedCount={142}
      />
    </>
  );
}
```

---

## Design Review Checklist

- [x] WCAG 2.1 AA (role, aria-modal, FocusTrap, LiveRegion)
- [x] Keyboard navigation (Tab, Escape, Enter)
- [x] Focus management (trap, return, initial focus)
- [x] Screen reader announcements (LiveRegion)
- [x] Responsive (mobile → desktop)
- [x] Touch targets (≥44px)
- [x] Dark mode (uses CSS custom properties)
- [x] Light mode (inherits from [data-theme="light"])
- [x] RTL compatibility (uses dir-neutral layout, directional icons)
- [x] Reduced motion (animations disabled with motion-reduce)
- [x] Loading state (spinner + progress bar)
- [x] Empty/disabled state (no columns → export disabled)
- [x] Error handling (custom onExport rejection → back to configure)
- [x] Cancellation (close button, Escape when not generating)
- [x] Reset on re-open
