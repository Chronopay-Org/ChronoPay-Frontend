# Copy Button Standard

## Overview

The `CopyButton` component provides a standardized, accessible copy-to-clipboard affordance for ChronoPay. It replaces ad-hoc copy implementations with a single, well-tested primitive that ensures consistency in placement, feedback, and accessibility across the application.

**Component location:** `src/app/components/ui/copy-button.tsx`

## Design Goals

- **Consistency:** Single primitive for all copy actions (addresses, codes, transaction hashes, etc.)
- **Accessibility:** WCAG 2.1 AA compliant with keyboard navigation and screen-reader support
- **Feedback:** Brief, non-intrusive "Copied" cue that respects user motion preferences
- **Responsive:** Adapts sizing and padding for mobile and desktop contexts

## Component API

### Props

```tsx
interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;

  /** Display variant: "icon" for icon-only, "text" for icon+text */
  variant?: "icon" | "text";  // default: "icon"

  /** Label for accessibility and tooltip. Defaults to "Copy" */
  label?: string;

  /** Additional CSS classes */
  className?: string;

  /** Callback fired after successful copy */
  onCopied?: () => void;
}
```

### Variants

#### Icon-Only (`variant="icon"`)
- **Use case:** Inline with text where space is constrained (wallet addresses, short codes)
- **Size:** 18px icon on desktop, adapts to 16px on smaller screens
- **Padding:** `p-1.5 sm:p-2` for touch-safe targets
- **Appearance:** Minimal, with hover/focus states for discoverability

**Example:**
```tsx
<CopyButton
  text="0x1234567890abcdef"
  variant="icon"
  label="Copy address"
/>
```

#### Icon + Text (`variant="text"`)
- **Use case:** Standalone buttons or high-priority actions
- **Size:** 16px icon with text label
- **Padding:** `px-3 py-2` for button-like appearance
- **Appearance:** Bordered, secondary-button style

**Example:**
```tsx
<CopyButton
  text="INVOICE_CODE_2024_001"
  variant="text"
  label="Copy code"
/>
```

## Accessibility Features

### Keyboard Navigation
- **Tab:** Focus the button normally
- **Enter / Space:** Trigger copy action
- **Escape:** (If implemented via modal) Dismiss any related dialog

### Screen Reader Support
- **aria-label:** Updated dynamically to "Copy: Copied!" when successful
- **aria-describedby:** Links to a hidden status region
- **role="status" + aria-live="polite":** Non-intrusive live region announces "Copied!"
- **aria-hidden="true":** Icons marked as decorative

### Visual Indicators
- **Focus ring:** `ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-950`
- **Hover state:** Elevated background color
- **Copied state:** Icon and text turn emerald-400 for 1500ms

### Motion Preferences
The component respects `prefers-reduced-motion: reduce` by disabling CSS transitions when the preference is set.

## Behavior

### Copy Action
1. User clicks the button (or presses Enter/Space when focused)
2. Text is copied to clipboard via the modern Clipboard API (with fallback)
3. Button visually indicates success (icon → ✓, emerald-400 color)
4. Screen readers announce "Copied!" via aria-live="polite"
5. State resets after 1500ms (or immediately if user copies again)

### Error Handling
- **Silent failure:** If copy fails (e.g., denied clipboard access), the component silently fails
- **Fallback:** Uses `document.execCommand("copy")` for older browsers
- **Toast feedback:** Integrate with `useToast()` for explicit error handling (optional)

## Usage Examples

### Wallet Address Display
```tsx
import { CopyButton } from "@/app/components/ui/copy-button";
import { useToast } from "@/hooks/use-toast";

export function WalletCard({ address }: { address: string }) {
  const { toast } = useToast();

  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-sm">{address.slice(0, 8)}…{address.slice(-6)}</span>
      <CopyButton
        text={address}
        variant="icon"
        label="Copy address"
        onCopied={() => {
          toast({
            variant: "success",
            title: "Copied",
            description: "Wallet address copied to clipboard.",
            duration: 2000,
          });
        }}
      />
    </div>
  );
}
```

### Invoice or Transaction Code
```tsx
<CopyButton
  text="INVOICE_2024_001_ABC123"
  variant="text"
  label="Copy invoice code"
  className="my-4"
/>
```

### Transaction Hash
```tsx
<div className="flex items-center justify-between">
  <span className="text-sm text-slate-500">Transaction Hash</span>
  <div className="flex items-center gap-2">
    <code className="text-xs text-slate-300">
      {txHash.slice(0, 10)}…{txHash.slice(-8)}
    </code>
    <CopyButton
      text={txHash}
      variant="icon"
      label="Copy transaction hash"
    />
  </div>
</div>
```

## Styling & Theming

### Dark Mode
The component is designed for the existing dark theme and uses Tailwind color tokens:
- **Primary text:** `text-slate-100` / `text-slate-300`
- **Hover:** `hover:bg-white/10`
- **Focus ring:** `ring-cyan-300`
- **Success state:** `text-emerald-400`

### Responsive
- **Desktop:** Icon 18px, padding adjusts via `sm:` breakpoint
- **Mobile:** Padding ensures 44px+ minimum touch target

## Testing Checklist

### Functional
- [ ] Copy action works in Chrome, Firefox, Safari, Edge
- [ ] Fallback clipboard API works in older browsers
- [ ] State resets after 1500ms
- [ ] `onCopied()` callback fires

### Accessibility
- [ ] Keyboard navigation (Tab, Enter, Space)
- [ ] Screen reader announces "Copied!" via aria-live
- [ ] Focus ring visible and properly positioned
- [ ] Contrast ratios meet WCAG AA (4.5:1 for text)
- [ ] axe DevTools reports no issues

### Responsive
- [ ] Touch targets >= 44px on mobile
- [ ] Icon sizing adapts (`sm:` breakpoints)
- [ ] Layout doesn't break on small screens

### Motion
- [ ] respects `prefers-reduced-motion: reduce`
- [ ] Transitions disabled when preference set
- [ ] Animations remain smooth for users without preference

### Edge Cases
- [ ] Very long text (1000+ chars)
- [ ] Empty text (gracefully handles)
- [ ] Rapid clicking (debounced or state-managed)
- [ ] Dark mode and light mode (if added)

## Migration Guide

### From Ad-Hoc Copy Buttons
**Before:**
```tsx
<button onClick={() => {
  navigator.clipboard.writeText(address);
  // Manually show some feedback
}}>
  Copy
</button>
```

**After:**
```tsx
<CopyButton text={address} variant="text" />
```

## Related Components

- [Button Link](./button-link.tsx) — Navigation button primitive
- [Status Chip](./status-chip.tsx) — Status indicator chip
- [Tooltip](./tooltip.tsx) — Help text on hover

## References

- WCAG 2.1 Level AA: https://www.w3.org/WAI/WCAG21/quickref/
- MDN: Clipboard API https://developer.mozilla.org/en-US/docs/Web/API/Clipboard
- Inclusive Components: Copy to Clipboard https://inclusive-components.design/
