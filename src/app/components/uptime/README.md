# Uptime Bar Chart Component

A 90-day historical uptime visualization component with full accessibility support, incident tracking, and responsive design.

## Overview

The Uptime Chart displays 90 days of component health data as a horizontal strip of color-coded cells. Each cell represents one day, with color indicating uptime percentage. Cells with incidents show an additional red border indicator. Users can hover or focus cells to reveal detailed tooltips.

**Key features:**
- 90-day historical visualization
- Color-coded by uptime tier (100%, 99-99.9%, 95-98.9%, <95%)
- Incident indicators and detailed tooltips
- Full keyboard navigation (arrow keys, Escape)
- Responsive (3px min width on mobile, full size on desktop)
- Dark/light mode support via CSS variables
- RTL layout support
- Respects `prefers-reduced-motion`
- WCAG 2.1 AA compliant

## Components

### UptimeChart

Main container component that renders the 90-day chart.

**Props:**
```typescript
interface UptimeChartProps {
  componentName: string;      // Name of the service (e.g., "API Service")
  days: DayData[];            // Array of 90 days of uptime data
  currentUptimePercent: number; // Current uptime % for summary display
}
```

**Example:**
```tsx
<UptimeChart
  componentName="API Service"
  days={uptimeData}
  currentUptimePercent={98.5}
/>
```

**Layout:**
- Section heading: component name + current uptime
- Horizontal strip: 90 cells with time labels ("90 days ago" and "Today")
- Legend: color key for each uptime tier
- Scrollable on small screens

### UptimeCell

Individual day cell component.

**Props:**
```typescript
interface UptimeCellProps {
  date: string;              // ISO date (YYYY-MM-DD)
  uptimePercent: number;     // 0-100
  incidents: Incident[];     // Incidents for this day
}
```

**Features:**
- Color-coded background based on uptime tier
- Red border if incidents present
- Keyboard focusable (tabIndex=0)
- Shows tooltip on hover/focus
- Full aria-label describing the cell

### UptimeTooltip

Tooltip displaying cell details.

**Content:**
- Formatted date (e.g., "Mon, Jul 28, 2026")
- Uptime percentage
- Incident list with title, summary (truncated to 100 chars), and severity

**Positioning:**
- Smart placement (above/below based on viewport space)
- Never clips outside viewport
- Dismissed on Escape key
- Dark/light mode aware

## Types

### DayData
```typescript
interface DayData {
  date: string;           // YYYY-MM-DD
  uptimePercent: number;  // 0-100
  incidents: Incident[];  // Incidents that day
}
```

### Incident
```typescript
interface Incident {
  id: string;
  title: string;
  summary: string;
  severity: 'minor' | 'major' | 'critical';
  startedAt: string;      // ISO 8601
  resolvedAt?: string;    // ISO 8601 (optional)
}
```

## Design Tokens

### Color Mapping

Colors use sequential palette from design system:

| Uptime Range | Color | CSS Class | Token |
|--------------|-------|-----------|-------|
| 100% | Green (emerald-500) | `bg-emerald-500` | `--success` |
| 99-99.9% | Yellow (amber-400) | `bg-amber-400` | Custom |
| 95-98.9% | Orange (orange-400) | `bg-orange-400` | Custom |
| <95% | Red (red-500) | `bg-red-500` | `--danger` |
| No data | Gray (slate-500) | `bg-slate-500` | `--muted` |

### Token Functions

```typescript
// Get color class based on uptime percentage
getUptimeColorClass(uptimePercent: number): string

// Dark mode CSS variable
getUptimeColorVarDark(uptimePercent: number): string

// Light mode CSS variable
getUptimeColorVarLight(uptimePercent: number): string

// Incident severity indicator
getIncidentIndicator(severity: string): string
```

## Accessibility

### WCAG 2.1 AA Compliance

- **Keyboard Navigation:**
  - All cells are focusable with `tabIndex=0`
  - Arrow keys navigate between cells
  - Escape key dismisses tooltips
  - Tab key follows natural flow

- **Screen Reader Support:**
  - `role="img"` on cells with descriptive `aria-label`
  - `role="tooltip"` linked via `aria-describedby`
  - Region role on chart container with descriptive label

- **Color Not Sole Indicator:**
  - Red border indicates incidents (visual pattern + color)
  - Tooltip text provides all information

- **Focus Indicators:**
  - Focus ring: 2px cyan (`focus:ring-cyan-400`)
  - High contrast focus ring with offset

- **Motion Preference:**
  - Smooth transitions only when `prefers-reduced-motion: no-preference`
  - All functionality preserved in reduced motion mode

### Aria Labels

Each cell aria-label follows format:
```
"{Month} {Day}, {Year}: {uptimePercent}% uptime, {N} incident(s)"
```

Example: "July 28, 2026: 97.2% uptime, 1 incident"

## Responsive Design

### Breakpoints

| Device | Cell Width | Layout |
|--------|-----------|--------|
| Mobile (375px) | 3px min | Scrollable |
| Tablet (768px) | 6px | Scrollable |
| Desktop (1200px+) | 8px+ | Full view |

### Layout Behavior

- Cells use `min-w-[3px]` to ensure minimum width
- Container uses `overflow-x-auto` for scrolling
- Gap between cells: `gap-3`
- Labels always visible below cells
- Responsive legend grid (2 cols on mobile, 4 cols on desktop)

## RTL Support

When `document.documentElement.dir="rtl"`:
- Cell order reversed via `flex-direction: row-reverse`
- Layout mirrors automatically
- No additional work needed from consumer

## Dark Mode

Uses CSS variables for theme-aware colors:

```css
:root {
  --success: #34d399;      /* 100% uptime green */
  --danger: #f87171;       /* <95% uptime red */
  --muted: #9fb0c7;        /* no data gray */
}

[data-theme="light"] {
  --success: #059669;      /* lighter green */
  --danger: #dc2626;       /* lighter red */
  --muted: #4a6080;        /* lighter gray */
}
```

Tooltip automatically adapts to theme via `data-theme` attribute.

## Usage Example

```tsx
import { UptimeChart, DayData, Incident } from "@/components/uptime";

// Generate mock data
const incidents: Incident[] = [
  {
    id: "inc-001",
    title: "Database Connection Timeout",
    summary: "Temporary spike in connection pool usage affected API latency for 5 minutes.",
    severity: "major",
    startedAt: "2026-07-28T14:30:00Z",
    resolvedAt: "2026-07-28T14:35:00Z",
  },
];

const uptimeData: DayData[] = Array.from({ length: 90 }, (_, i) => ({
  date: new Date(Date.now() - (90 - i) * 86400000)
    .toISOString()
    .split("T")[0],
  uptimePercent: 99.5 + Math.random() * 0.5,
  incidents: i === 28 ? incidents : [],
}));

export function MyStatusPage() {
  return (
    <UptimeChart
      componentName="API Service"
      days={uptimeData}
      currentUptimePercent={99.7}
    />
  );
}
```

## Testing

Comprehensive test suite with >95% coverage:

```bash
npm run test:unit -- UptimeChart.test.tsx
npm run test:coverage
```

### Test Categories

- **Rendering:** 90 cells, correct colors, labels
- **Color Mapping:** All 5 uptime tiers + no data
- **Tooltip Behavior:** Hover, focus, Escape dismiss
- **Keyboard Navigation:** Arrow keys, bounds checking
- **Dark/Light Mode:** Both themes render correctly
- **Responsive:** 375px, 768px, 1200px viewports
- **RTL Support:** Cell order reversal
- **Prefers Reduced Motion:** Transitions disabled
- **Accessibility:** axe-core scan with no violations
- **Snapshots:** 3 states (standard, incidents, dark)

## Integration

### Import in page/component
```tsx
import { UptimeChart } from "@/components/uptime";
```

### Barrel export available
```tsx
export {
  UptimeChart,
  UptimeCell,
  UptimeTooltip,
  // Types
  DayData,
  Incident,
  UptimeChartProps,
  // Design tokens
  getUptimeColorClass,
  UPTIME_NONE,
} from "@/components/uptime";
```

## Design System Integration

- **Color tokens:** Uses semantic tokens from `globals.css`
- **Typography:** Inherits `font-sans` from design system
- **Spacing:** Tailwind spacing scale (gap-3, p-5, etc.)
- **Elevation:** Uses `elevation-1`, `elevation-2` from design system
- **Focus ring:** `focus-ring-cyan` utility from globals
- **Border radius:** Tailwind `rounded-sm`, `rounded-lg`
- **Dark mode:** Respects `data-theme="dark"` and `prefers-color-scheme`

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features (optional chaining, nullish coalescing)
- CSS Grid and Flexbox
- CSS Variables
- Media queries (prefers-color-scheme, prefers-reduced-motion)

## Performance

- Memoized color functions
- Efficient DOM structure (90 cells, minimal nesting)
- No external chart library overhead
- CSS-based animations (GPU accelerated)
- Lazy tooltip rendering (only when visible)

## Migration Guide

If replacing an existing uptime component:

1. Update imports to new component path
2. Ensure data structure matches `DayData` interface
3. Map incident data to `Incident` interface
4. Pass `componentName` and `currentUptimePercent` props
5. Update any custom styling to use design tokens
6. Run accessibility audit to verify compliance

## Known Limitations

- Maximum 90 days of data (hardcoded for this use case)
- Tooltip positioning based on `getBoundingClientRect()` (won't work in shadow DOM)
- Incident count limited by tooltip height (typically 3-5 incidents before scroll)
- No animation on initial render (respects prefers-reduced-motion from start)

## Future Enhancements

- Custom time period selector (30, 60, 90 days)
- Export chart as image/PDF
- Custom incident severity colors
- Configurable color palette
- Click to filter by severity
- Historical comparison view
