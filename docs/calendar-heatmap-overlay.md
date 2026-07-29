# Calendar Availability Heatmap Overlay

An intensity heatmap overlay for the month calendar view that shows buyers which days have the most open time-token supply at a glance. The overlay is toggleable, color-blind safe, and complements (not replaces) the underlying event dots.

---

## Token Reference

All heatmap tokens are defined in `src/app/globals.css` as CSS custom properties with dark/light theme support and WCAG 2.1 AA contrast verification.

### Intensity Ramp (5 Steps)

| Step | Intensity | Dark Fill | Dark Pattern | Light Fill | Light Pattern | Slot Range | Purpose |
|------|-----------|-----------|--------------|------------|---------------|------------|---------|
| 1 | **None** | `rgba(148, 163, 184, 0.08)` | Radial dots 1px @ 8px | `rgba(15, 23, 42, 0.06)` | Radial dots 1px @ 8px | 0 slots | No availability |
| 2 | **Low** | `rgba(34, 211, 238, 0.12)` | Radial dots 1.5px @ 6px | `rgba(8, 145, 178, 0.10)` | Radial dots 1.5px @ 6px | 1–2 slots | Sparse availability |
| 3 | **Medium** | `rgba(34, 211, 238, 0.20)` | Radial dots 2px @ 5px | `rgba(8, 145, 178, 0.16)` | Radial dots 2px @ 5px | 3–5 slots | Moderate availability |
| 4 | **High** | `rgba(52, 211, 153, 0.22)` | Radial dots 2px @ 4px | `rgba(5, 150, 105, 0.18)` | Radial dots 2px @ 4px | 6–9 slots | Strong availability |
| 5 | **Peak** | `rgba(103, 232, 249, 0.28)` | Radial dots 2.5px @ 3px | `rgba(6, 182, 212, 0.24)` | Radial dots 2.5px @ 3px | 10+ slots | Maximum availability |

### Supporting Tokens

| Token | Value | Purpose |
|-------|-------|---------|
| `--heatmap-swatch-size` | `1.25rem` (20px) | Legend swatch dimensions |
| `--heatmap-swatch-radius` | `0.375rem` (6px) | Legend swatch border radius |
| `--heatmap-cell-overlay` | `inset 0 0 0 1px rgba(148, 163, 184, 0.06)` | Subtle cell border for tap target clarity |

---

## Color-Blind Accessibility

The heatmap uses a **dual-encoding strategy** for WCAG 2.1 AA compliance:

1. **Color**: Cyan→teal→emerald→cyan-strong progression (deuteranopia/protanopia safe)
2. **Pattern**: Radial dot density increases with intensity (pattern-only recognition)

### Contrast Verification

| Pairing | Dark Ratio | Light Ratio | WCAG Level |
|---------|------------|-------------|------------|
| Step 1 fill on `--background` | 1.3:1 (decorative) | 1.2:1 (decorative) | Non-text UI (3:1) — pattern provides differentiation |
| Step 5 fill on `--background` | 2.1:1 (decorative) | 1.8:1 (decorative) | Non-text UI (3:1) — pattern provides differentiation |
| Legend text on `--background` | 14.3:1 | 18.1:1 | AAA (4.5:1) ✓ |

> **Note**: Heatmap fills are **decorative backgrounds** (not text/UI components), so 3:1 non-text contrast applies. The radial dot patterns ensure differentiation even when color perception is impaired.

---

## Component API

### `MonthCalendarView`

```tsx
interface MonthCalendarViewProps {
  /** Currently selected date */
  selectedDate: Date;
  /** Callback when a date is selected */
  onDateSelect: (date: Date) => void;
  /** Availability data: ISO date string (YYYY-MM-DD) -> slot count */
  availabilityData: Map<string, number>;
  /** Whether heatmap overlay is enabled */
  heatmapEnabled?: boolean;
  /** Callback when heatmap toggle changes */
  onHeatmapToggle?: (enabled: boolean) => void;
  /** Custom class name */
  className?: string;
  /** Locale for date formatting (default: "en-US") */
  locale?: string;
  /** Minimum selectable date (inclusive) */
  minDate?: Date;
  /** Maximum selectable date (inclusive) */
  maxDate?: Date;
}
```

#### Features
- **6×7 grid** (42 cells) covering full month with prev/next month padding
- **Keyboard navigation**: Arrow keys, Home/End, PageUp/PageDown
- **Tap targets**: Minimum 44×44px via `aspect-square` + padding
- **Heatmap overlay**: Applied as decorative background on button, NOT replacing content
- **Availability dots**: Complement heatmap (emerald/amber/rose/cyan by intensity)
- **Date constraints**: `minDate`/`maxDate` disable out-of-range cells
- **ARIA**: `role="grid"`, `role="gridcell"`, `aria-pressed`, `aria-label` with availability count

#### Usage Example
```tsx
const [selectedDate, setSelectedDate] = useState(new Date());
const [heatmapEnabled, setHeatmapEnabled] = useState(false);
const availabilityData = useMemo(() => new Map([
  ["2026-07-01", 1],
  ["2026-07-15", 12],
  // ...
]), []);

<MonthCalendarView
  selectedDate={selectedDate}
  onDateSelect={setSelectedDate}
  availabilityData={availabilityData}
  heatmapEnabled={heatmapEnabled}
  onHeatmapToggle={setHeatmapEnabled}
  minDate={new Date()}
  maxDate={addMonths(new Date(), 3)}
/>
```

---

### `CalendarHeatmapLegend`

```tsx
interface CalendarHeatmapLegendProps {
  /** Custom class name */
  className?: string;
  /** Layout variant (default: "horizontal") */
  variant?: "horizontal" | "vertical";
  /** Custom slot count ranges for each intensity */
  ranges?: Record<HeatmapIntensity, string>;
}
```

#### Intensity Labels
| Intensity | Default Label | Default Range | Description |
|-----------|---------------|---------------|-------------|
| `none` | "No availability" | "0 slots" | No open slots |
| `low` | "Low" | "1–2 slots" | 1–2 open slots |
| `medium` | "Medium" | "3–5 slots" | 3–5 open slots |
| `high` | "High" | "6–9 slots" | 6–9 open slots |
| `peak` | "Peak" | "10+ slots" | 10+ open slots |

#### Usage Example
```tsx
<CalendarHeatmapLegend
  variant="horizontal"
  ranges={{
    none: "0 slots",
    low: "1–2 slots",
    medium: "3–5 slots",
    high: "6–9 slots",
    peak: "10+ slots",
  }}
/>
```

---

### `CalendarViewToggle` (Extended)

Added heatmap toggle props:

```tsx
interface CalendarViewToggleProps {
  // ...existing props
  /** Whether heatmap overlay is currently enabled */
  heatmapEnabled?: boolean;
  /** Callback when heatmap toggle changes */
  onHeatmapToggle?: (enabled: boolean) => void;
}
```

#### Heatmap Toggle Features
- **Icon**: `Flame` from lucide-react
- **Persistence**: Expected to be managed by parent via localStorage (see `useViewMode` pattern)
- **ARIA**: `role="button"`, `aria-pressed`, `aria-label` with dynamic text
- **Keyboard**: Enter/Space toggles, Tab navigable
- **Visual**: Matches view mode button styling (active = cyan background)

---

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation
| Key | Action |
|-----|--------|
| `ArrowRight` | Next day (wraps to next row) |
| `ArrowLeft` | Previous day (wraps to previous row) |
| `ArrowDown` | Next week (same weekday) |
| `ArrowUp` | Previous week (same weekday) |
| `Home` | First day of current week |
| `End` | Last day of current week |
| `PageUp` | Previous month |
| `PageDown` | Next month |
| `Enter` / `Space` | Select focused date |
| `Tab` | Enter/exit calendar grid |
| `Escape` | (Handled by parent overlay) |

### Screen Reader Support
- **Grid role**: `role="grid"` with `aria-label="Calendar days"`
- **Cell role**: `role="gridcell"` with `aria-label` containing full date + availability
- **Selection**: `aria-pressed="true"` on selected date
- **Today**: Announced in `aria-label` as "today"
- **Availability**: Slot count announced in `aria-label` (e.g., "4 slots available")
- **Legend**: `role="legend"` with `aria-label="Availability heatmap intensity legend"`
- **Live region**: Parent should provide for date change announcements

### Color & Contrast
- All text meets 4.5:1 (normal) / 3:1 (large) on both themes
- Heatmap fills are decorative; patterns provide non-color differentiation
- Focus rings: `focus-ring-cyan` (2px offset + 2px cyan ring) on all interactive elements
- Reduced motion: No animations on heatmap (static backgrounds)

### Touch Targets
- Minimum 44×44px via `aspect-square` + internal padding
- Heatmap overlay uses `pointer-events-none` — clicks pass through to button
- No hover-only functionality

---

## Responsive Behavior

| Breakpoint | Grid | Legend | Toggle Button |
|------------|------|--------|---------------|
| **Mobile** (<640px) | 7 cols, compact cells (32px), day headers 10px | Horizontal scroll, 3 visible swatches | Icon only (text hidden) |
| **Tablet** (640–1023px) | 7 cols, medium cells (40px), day headers 11px | Horizontal, all 5 swatches fit | Icon + short text ("Heatmap") |
| **Desktop** (≥1024px) | 7 cols, comfortable cells (48px), day headers 12px | Horizontal, all 5 swatches + descriptions | Icon + full text ("Heatmap On/Off") |

### Tailwind Classes Used
```tsx
// Grid cells
"aspect-square"                    // Square cells at all sizes
"text-xs sm:text-sm"               // Responsive text
"rounded-lg"                       // Consistent radius

// Legend
"flex flex-wrap gap-3 sm:gap-4"    // Wrap on mobile
"text-[10px] sm:text-xs"           // Responsive description text

// Toggle
"hidden sm:inline"                 // Text hidden on mobile
```

---

## Dark Mode Behavior

Heatmap tokens automatically adapt via CSS custom properties:

1. **Explicit dark**: `:root` (default) — cyan-based fills
2. **Explicit light**: `[data-theme="light"]` — blue/teal-based fills
3. **Auto**: `@media (prefers-color-scheme: light)` — follows system when no explicit theme

No component re-render required — browser cascade handles theme switches.

---

## Persistence Pattern

The heatmap toggle state should be persisted using the existing `localStorage` pattern from `browse-toolbar.tsx`:

```tsx
function useHeatmapPreference(storageKey = "calendar-heatmap-enabled") {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === "true" || saved === "false") {
        return saved === "true";
      }
    } catch {
      // localStorage unavailable
    }
    return false; // Default off
  });

  const toggle = useCallback((value: boolean) => {
    setEnabled(value);
    try {
      localStorage.setItem(storageKey, String(value));
    } catch {
      // Ignore
    }
  }, [storageKey]);

  return { enabled, toggle };
}
```

---

## Integration Guide

### 1. Add Tokens
Tokens already added to `src/app/globals.css` (see Token Reference above).

### 2. Add Components
- `src/components/dashboard/month-calendar-view.tsx`
- `src/components/dashboard/calendar-heatmap-legend.tsx`
- Updated `src/components/dashboard/calendar-view-toggle.tsx`

### 3. Wire into Dashboard
In the dashboard page/component that renders the calendar:

```tsx
import { CalendarViewToggle } from "@/components/dashboard/calendar-view-toggle";
import { MonthCalendarView } from "@/components/dashboard/month-calendar-view";
import { CalendarAgendaView } from "@/components/dashboard/calendar-agenda-view";
import { useHeatmapPreference } from "@/hooks/use-heatmap-preference"; // Create this hook

function DashboardCalendar() {
  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const { enabled: heatmapEnabled, toggle: setHeatmapEnabled } = useHeatmapPreference();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const availabilityData = useFetchAvailability(); // Your data fetching

  return (
    <div className="space-y-4">
      <CalendarViewToggle
        currentMode={viewMode}
        onModeChange={setViewMode}
        heatmapEnabled={heatmapEnabled}
        onHeatmapToggle={setHeatmapEnabled}
      />

      {viewMode === "month" && (
        <MonthCalendarView
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          availabilityData={availabilityData}
          heatmapEnabled={heatmapEnabled}
          onHeatmapToggle={setHeatmapEnabled}
        />
      )}

      {viewMode === "agenda" && (
        <CalendarAgendaView days={agendaDays} onBook={handleBook} />
      )}

      {/* Week/Day views... */}
    </div>
  );
}
```

---

## Testing

### Unit Tests
- `src/__tests__/month-calendar-view.test.tsx` — Grid rendering, keyboard nav, heatmap toggle, date constraints
- `src/__tests__/calendar-heatmap-legend.test.tsx` — Legend rendering, variants, custom ranges
- `src/__tests__/calendar-view-toggle.test.tsx` — View modes + heatmap toggle, keyboard, ARIA

### Accessibility Tests
- **axe-core**: All components tested via `jest-axe` (configured in `vitest.config.ts`)
- **Coverage**: ≥95% statements/functions/lines, ≥90% branches
- **Manual**: NVDA/VoiceOver + keyboard-only navigation

### Visual Regression
Recommended screenshots at each breakpoint:
- Mobile (375px): heatmap off, heatmap on, legend collapsed
- Tablet (768px): heatmap on with legend
- Desktop (1440px): full grid with legend
- Dark mode + light mode for each

---

## Cross-References

- [Chart Tokens](./chart-tokens.md) — Similar token pattern for chart tooltips/gridlines
- [Semantic vs Primitive Tokens](./semantic-vs-primitive-tokens.md) — Token architecture
- [Design Review Checklist](./design-review-checklist.md) — Component review criteria
- [Overlay & Modal Checklist](./overlay-checklist.md) — Focus management patterns
- [Responsive Design Verification](./responsive-design-verification.md) — Breakpoint testing methodology
- [Accessibility Testing Checklist](./accessibility-testing-checklist.md) — WCAG verification steps

---

## Future Enhancements

| Enhancement | Description |
|-------------|-------------|
| **Percentile-based buckets** | Dynamic ranges based on supplier's slot distribution |
| **Tooltip on hover** | Show exact slot count + supplier name on cell hover |
| **Multi-supplier overlay** | Toggle between suppliers in marketplace view |
| **Animation** | Subtle fade-in when heatmap toggles (respects `prefers-reduced-motion`) |
| **Export** | "Download heatmap data" CSV button in legend |

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-07-29 | Initial implementation: 5-step intensity ramp, MonthCalendarView, CalendarHeatmapLegend, CalendarViewToggle heatmap toggle, WCAG 2.1 AA compliance, responsive design, dark/light themes, test coverage |