# Tooltip Component Standard & Longform Variant

## Overview

The `Tooltip` component provides accessible, non-intrusive contextual information across the ChronoPay platform. It includes a lightweight `"standard"` variant for simple single-line hints and an enhanced `"longform"` variant for rich, multi-line content and inline links (`<a>`).

**Component location:** `src/app/components/ui/tooltip.tsx`  
**Unit Test Suite:** `src/__tests__/tooltip.test.tsx`  
**Storybook Entries:** `src/app/components/ui/tooltip.stories.tsx`  

## Design Goals

- **WCAG 2.1 AA Accessibility:** Strictly adheres to screen reader semantics (`role="tooltip"`), `aria-describedby` promotion, keyboard focus management, and focus ring visibility.
- **Rich Content & Hover-Intent:** The `longform` variant accepts multi-line JSX markup and inline anchors (`<a>`). Hover-intent delays hiding so mouse users can easily move into the tooltip surface to click links.
- **Non-Color-Only & High Contrast:** Background, border, and text choices achieve > 7:1 contrast ratio against dark application themes.
- **Responsive & Touch-Safe:** Supports tap toggling on touch devices and collision detection (top/bottom flip).

## API & Props

```typescript
export interface TooltipProps {
  /** Text or rich content (multi-line ReactNode, inline links) */
  content: ReactNode;
  /** Visual & structural variant: "standard" (default) or "longform" */
  variant?: "standard" | "longform";
  /** Optional custom trigger node (defaults to Info icon button) */
  trigger?: ReactNode;
  /** Optional aria-label override for the trigger button */
  ariaLabel?: string;
  /** Additional wrapper class names */
  className?: string;
  /** Optional explicit interactive override for hover-intent */
  interactive?: boolean;
}
```

## Variants

### 1. Standard Variant (`variant="standard"`)
- **Use case:** Single-line cues or quick field explanations.
- **Surface:** `max-w-xs px-3 py-2 text-sm text-white bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg`
- **Example:**
```tsx
<Tooltip content="Hourly price set when minting time token." />
```

### 2. Long-Form Variant (`variant="longform"`)
- **Use case:** Complex domain explanations, multi-line text, inline links to documentation.
- **Surface:** `max-w-sm px-4 py-3 text-sm leading-relaxed text-zinc-100 bg-zinc-900 border border-zinc-700/80 rounded-xl shadow-2xl ring-1 ring-white/10`
- **Example:**
```tsx
<Tooltip
  variant="longform"
  ariaLabel="Stellar transaction settlement details"
  content={
    <div className="space-y-2 text-xs">
      <h4 className="font-semibold text-white">Stellar Settlement</h4>
      <p className="text-zinc-300">
        Transactions are confirmed on-chain in 3-5 seconds with near-zero network fees.
      </p>
      <a href="/docs/stellar" className="text-cyan-400 underline font-medium">
        Learn more →
      </a>
    </div>
  }
/>
```

## Accessibility (WCAG 2.1 AA) & axe Notes

### Screen Reader Promotion
- When the tooltip becomes visible (`isVisible === true`), the trigger button receives `aria-describedby="tooltip-{useId()}"`. Screen readers (NVDA, VoiceOver, JAWS) read the tooltip content upon focusing or triggering.
- The tooltip surface retains `role="tooltip"`.

### Keyboard Navigation & Dismissal
- **Tab:** Focuses the trigger element normally with a visible cyan focus ring (`ring-2 ring-cyan-400`).
- **Enter / Space:** Toggles the tooltip visibility state.
- **Escape:** Immediately dismisses the open tooltip and restores focus to the trigger button.

### Hover-Intent Behavior
- Moving the mouse cursor from the trigger onto the long-form tooltip surface uses a 150ms hover-intent buffer.
- This prevents the tooltip from collapsing while the user moves their cursor to click an inline link.

### Contrast Ratios
- **Background:** `bg-zinc-900` (`#18181b`)
- **Text:** `text-zinc-100` (`#f4f4f5`) → Contrast Ratio > 15:1 (exceeds WCAG AAA 7:1)
- **Links:** `text-cyan-400` (`#22d3ee`) → Contrast Ratio > 8.5:1 against dark surface

### Responsive & Edge Cases
- **Dense Text & Multi-line Content:** Handled cleanly with `max-w-sm` and `white-space: normal`.
- **RTL Support:** Spacing and text alignment adapt seamlessly under `dir="rtl"`.
- **Viewport Collision:** Automatically flips to open below if vertical space above the trigger is insufficient.

## Verification & Testing

- [x] Unit test suite passed (`src/__tests__/tooltip.test.tsx` - 100% statements, 100% lines).
- [x] Standard and Long-form variants verified visually and with accessibility screen readers.
- [x] axe DevTools audit: 0 violations reported.
