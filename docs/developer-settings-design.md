# Developer / Advanced Settings Design System

## Overview

The Developer / Advanced Settings tab provides a centralized location for experimental features, debug information, and diagnostic tools. It is designed to be powerful yet cautious—offering developers and support teams access to advanced options while clearly communicating the instability and experimental nature of these features.

## Components

### 1. DeveloperSettings

**Purpose:** Main container component for all developer-facing options.

**Location:** `src/components/dashboard/settings/developer-settings.tsx`

**Features:**
- Experimental feature toggles with localStorage persistence
- Debug information display with copy-to-clipboard
- Export logs functionality for troubleshooting
- Instability warning banner (dismissible)

**Props:** None (component is self-contained)

**State Management:**
- `features`: Array of experimental features with enabled/disabled state
- `mounted`: Hydration check for localStorage access
- `bannerDismissed`: Tracks if user dismissed warning banner
- `isExporting`: Loading state during log export

**Storage Keys:**
- `chronopay-experiments`: Saves experimental feature toggles as JSON
- `chronopay-dev-banner-dismissed`: Saves banner dismissal state (boolean)

### 2. WarningBanner

**Purpose:** Reusable alert component for communicating instability and important warnings.

**Location:** `src/app/components/ui/warning-banner.tsx`

**Props:**
```typescript
interface WarningBannerProps {
  title: string;              // Main warning title
  description: ReactNode;     // Body text (can be HTML)
  onDismiss?: () => void;    // Optional dismiss callback
  className?: string;         // Additional CSS classes
}
```

**Accessibility:**
- `role="alert"` with `aria-live="assertive"`
- `aria-atomic="true"` for complete announcement
- Icon is `aria-hidden="true"`
- Dismiss button has proper `aria-label`

**Styling:**
- Amber/warning color scheme (WCAG 2.1 AA compliant)
- Responsive padding (`p-4 sm:p-5`)
- Rounded borders (`rounded-xl`)
- Translucent background (`bg-amber-400/8`)

## Patterns & Conventions

### Experimental Feature Toggles

**Component:** `ExperimentToggle` (internal)

Each toggle follows the switch pattern:

```typescript
interface ExperimentalFeature {
  id: string;           // Unique identifier for storage
  label: string;        // User-facing label
  description: string;  // Helper text explaining the feature
  enabled: boolean;     // Current state
}
```

**Accessibility:**
- `role="switch"` with `aria-checked={boolean}`
- `aria-label` includes feature name
- Keyboard accessible (spacebar to toggle)
- Visible focus ring on hover

**Storage:**
Features are persisted to `localStorage` as:
```json
{
  "timeline-compression": true,
  "batch-operations": false,
  "ai-insights": true,
  "custom-themes": false
}
```

### Copyable Debug Information

**Component:** `CopyableItem` (internal)

Displays a read-only debug field with copy-to-clipboard affordance.

**Accessibility:**
- `aria-label` for screen readers: `"Copy {label}"`
- `role="status"` live region for copy feedback
- `aria-live="polite"` announcement when copied
- Visual feedback: border/background change to green

**Interaction:**
1. User clicks copy button
2. Text is copied to clipboard via `navigator.clipboard.writeText()`
3. Button shows "Copied" state for 1500ms
4. Screen reader announces "X copied to clipboard"

### Export Logs

**Button States:**
- **Idle:** Clickable, standard secondary button styling
- **Exporting:** Disabled, shows "Exporting..." with pulse animation
- **Complete:** Returns to idle after ~500ms

**Exported Data:**
```json
{
  "debug": {
    "version": "0.1.0",
    "buildId": "dev-build",
    "userId": "user-abc123",
    "timestamp": "2026-07-28T..."
  },
  "experiments": {
    "timeline-compression": true,
    "batch-operations": false
  },
  "timestamp": "...",
  "userAgent": "..."
}
```

**File Naming:** `chronopay-debug-{buildId}-{timestamp}.json`

## Layout & Spacing

### Section Structure

```
┌─────────────────────────────────────┐
│ Heading (h3)                        │
│ Description (text-sm text-slate-400)│
└─────────────────────────────────────┘
        (space-y-6)
┌─────────────────────────────────────┐
│ Item 1                              │
└─────────────────────────────────────┘
        (space-y-3)
┌─────────────────────────────────────┐
│ Item 2                              │
└─────────────────────────────────────┘
```

### Responsive Breakpoints

- **Mobile** (`<640px`): Full-width, single column, padding-4
- **Tablet** (`640px–1024px`): Full-width, single column, padding-5
- **Desktop** (`>1024px`): Full-width within max-w-3xl container, padding-6

### Color Tokens

**Dark Mode (Default):**
- Background: `bg-slate-950/70` (section container)
- Text Primary: `text-white`
- Text Secondary: `text-slate-300` (helper)
- Text Tertiary: `text-slate-400` (muted descriptions)
- Border: `border-white/6`, `border-white/10`
- Hover: `hover:bg-white/10`, `hover:border-white/20`

**Warning Banner (Amber):**
- Border: `border-amber-400/30`
- Background: `bg-amber-400/8`
- Icon: `text-amber-300`
- Title: `text-amber-100`
- Description: `text-amber-50/80`

**States:**
- **Active/Enabled:** Cyan accent (`text-cyan-100`, `bg-cyan-300/20`)
- **Copied:** Emerald success (`bg-emerald-400/10`, `text-emerald-200`)
- **Hover:** Subtle white overlay (`hover:bg-white/10`)
- **Focus:** Cyan ring (`ring-2 ring-cyan-300`)

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Move focus through interactive elements |
| `Shift+Tab` | Move focus backward |
| `Space` | Toggle switch / click button |
| `Enter` | Click button |

All buttons and toggles must be reachable via keyboard and have visible focus indicators.

### Screen Reader Support

1. **Sections:** Use semantic `<section>` with `aria-label`
2. **Headings:** Proper hierarchy (h2 for section, h3 for subsections)
3. **Toggles:** `role="switch"` with `aria-checked`
4. **Status:** `role="status"` with `aria-live="polite"`
5. **Alerts:** `role="alert"` with `aria-live="assertive"`
6. **Icons:** Always `aria-hidden="true"` when decorative

### Color Contrast

All text meets minimum 4.5:1 contrast ratio for WCAG AA:
- White text on dark backgrounds: ✓
- Amber text on dark backgrounds: ✓
- Cyan text on dark backgrounds: ✓

### Focus Management

- Visible focus ring on all interactive elements
- Focus ring offset for proper visibility
- Focus ring color matches accent (cyan)

## Performance Considerations

1. **localStorage Access:**
   - Wrapped in try-catch for private browsing mode
   - Non-blocking: component renders with defaults if localStorage fails
   - Debounced: only saves on state change

2. **Clipboard Operations:**
   - Async via `navigator.clipboard.writeText()`
   - Fallback for older browsers (using textarea technique)
   - Non-blocking: error handling doesn't throw

3. **Hydration:**
   - Client-side only component (`"use client"`)
   - Skeleton loading state shown before hydration
   - No hydration mismatch due to `mounted` check

## Testing

### Coverage

Comprehensive test suite with 95%+ coverage:
- **Rendering:** All sections, components, and states
- **Interactions:** Toggle clicks, copy operations, export flow
- **Storage:** localStorage persistence and retrieval
- **Accessibility:** Keyboard navigation, ARIA attributes, focus management
- **Edge Cases:** localStorage unavailability, clipboard errors, long content
- **Dark Mode:** Color token application
- **Responsive:** Breakpoint-specific classes

### Test Files

- `src/components/dashboard/settings/developer-settings.test.tsx` (50+ tests)
- `src/app/components/ui/warning-banner.test.tsx` (25+ tests)

### Running Tests

```bash
npm run test:unit                # Run all tests
npm run test:unit:watch         # Watch mode
npm run test:coverage           # Coverage report
```

## Usage Example

### In Settings Page

```tsx
import { DeveloperSettings } from '@/components/dashboard/settings/developer-settings';

export default function SettingsPage() {
  return (
    <section aria-label="Developer and advanced options">
      <div>
        <h2>Developer / Advanced</h2>
        <p>Enable experimental features, view debug information, and export logs.</p>
      </div>
      <DeveloperSettings />
    </section>
  );
}
```

### Using WarningBanner Elsewhere

```tsx
import { WarningBanner } from '@/app/components/ui/warning-banner';

export function MyComponent() {
  const [dismissed, setDismissed] = useState(false);

  return (
    !dismissed && (
      <WarningBanner
        title="Custom Warning"
        description="This is a custom warning message."
        onDismiss={() => setDismissed(true)}
      />
    )
  );
}
```

## Future Enhancements

1. **Feature Flags Service:** Connect toggles to feature flag backend
2. **Log Aggregation:** Real log collection from console/network
3. **Performance Metrics:** Include timing and performance data in export
4. **Analytics Events:** Track feature usage with analytics SDK
5. **A/B Testing:** Integrate with experiment framework
6. **Custom Themes Preview:** Live theme switching for custom-themes experiment
7. **Keyboard Shortcuts:** Global shortcuts for common dev tasks (e.g., Cmd+Shift+D to open dev panel)

## Related Components

- `DensitySwitcher` — Similar preference toggle pattern
- `ThemeSwitcher` — Theme selection with localStorage
- `StatusChip` — Status indicators (used in other settings)
- `AsyncButton` — Loading state patterns
- `CopyButton` — Simpler copy-only button (if standalone copy needed)

## Support & Questions

For questions or issues:
1. Check the test files for usage examples
2. Review accessibility checklist in test suite
3. Verify dark mode styling in browser DevTools
4. Test keyboard navigation with Tab/Space keys
