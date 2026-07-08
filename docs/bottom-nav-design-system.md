# Mobile Bottom Navigation Design System

## Overview

The mobile bottom navigation provides quick access to primary app sections with an elevated center FAB (Floating Action Button) for the main contextual action (Mint/Book).

## Component Structure

```
┌─────────────────────────────────────┐
│         Mobile Bottom Nav           │
├──────┬──────┬──────┬──────┬────────┤
│ Home │Mktpl│Calndr│Histry│  [FAB] │
│  🏠  │  🛒 │  📅  │  🕘  │   [+]  │
└──────┴──────┴──────┴──────┴────────┘
         ↑ Elevated Center FAB
```

## Accessibility (WCAG 2.1 AA)

### Touch Targets
- **Minimum hit area**: 44x44px for all interactive elements
- **FAB**: 56x56px visual size with 44x44px minimum touch target
- **Tab items**: 64px minimum width with adequate padding

### Keyboard Navigation
- All interactive elements are focusable via `Tab` key
- Focus indicators use `focus-ring-*` utility classes
- FAB has descriptive `aria-label`: "Mint or Book new item"
- Navigation uses semantic `<nav>` with `aria-label`

### Screen Reader Support
- Navigation landmark: `aria-label="Mobile bottom navigation"`
- Current page indicator: `aria-current="page"` on active tab
- Decorative icons marked with `aria-hidden="true"`
- FAB includes both `aria-label` and `title` attributes

### Color Contrast
- Text on dark background: White (#FFFFFF) on slate-900 (#0f172a)
- Active indicator: Cyan-400 (#22d3ee) on slate-900
- FAB: Cyan gradient with white icon
- All combinations meet WCAG AA (4.5:1 minimum)

### Reduced Motion
- Respects `prefers-reduced-motion` via Framer Motion's `useReducedMotion()`
- Animations disabled when user preference is set
- No animation duration when reduced motion is preferred

## Responsive Behavior

### Breakpoints
- **Mobile** (< 768px): Bottom navigation visible
- **Desktop** (≥ 768px): Bottom navigation hidden, inline nav in header

### Layout
- Fixed position at bottom of viewport
- Full-width bar with evenly distributed tabs
- FAB elevated above the bar with negative margin

## Animation Specifications

### Active Tab Indicator
```typescript
const tabIndicatorVariants = {
  inactive: {
    scale: 0.8,
    opacity: 0,
    transition: { duration: shouldReduceMotion ? 0 : 0.2 }
  },
  active: {
    scale: 1,
    opacity: 1,
    transition: { 
      duration: shouldReduceMotion ? 0 : 0.3,
      ease: "easeOut"
    }
  }
};
```

**Behavior**:
- Morphs from scale 0.8 to 1.0
- Fades in from opacity 0 to 1
- Smooth easeOut curve
- Disabled when `prefers-reduced-motion` is set

### FAB Press Animation
```typescript
const fabVariants = {
  idle: {
    scale: 1,
    y: 0,
    transition: { duration: shouldReduceMotion ? 0 : 0.2 }
  },
  pressed: {
    scale: 0.95,
    y: 2,
    transition: { 
      duration: shouldReduceMotion ? 0 : 0.1 
    }
  }
};
```

**Behavior**:
- Scales down to 0.95 on press
- Shifts down 2px for tactile feedback
- Quick 100ms transition
- Disabled when `prefers-reduced-motion` is set

## Shadow & Elevation

### Default State
- Background: `bg-slate-900` (solid)
- No shadow

### Scrolled State
- Background: `bg-slate-900/95` (95% opacity)
- Backdrop blur: `backdrop-blur-lg`
- Inset shadow: `shadow-[0_-4px_20px_rgba(0,0,0,0.3)]`
- Triggered when `window.scrollY > 10`

**Purpose**: Creates visual separation from content and adds depth when user scrolls.

## Visual Design Tokens

### Colors
- **Background**: `slate-900` (#0f172a)
- **Text**: `slate-50` (#f8fafc)
- **Active Indicator**: `cyan-400` (#22d3ee)
- **FAB Gradient**: `from-cyan-500 to-cyan-600`
- **FAB Hover**: `from-cyan-400 to-cyan-500`
- **FAB Shadow**: `shadow-cyan-500/50`

### Spacing
- Nav padding: `py-2`
- Tab minimum width: `64px`
- FAB size: `56px` (w-14 h-14)
- FAB elevation: `-mt-8` (negative margin)
- Content bottom padding: `pb-20` (mobile), `pb-0` (desktop)

### Typography
- Tab labels: `text-xs`
- Tab icons: `text-lg`

## State Management

### Scroll Detection
```typescript
const [isScrolled, setIsScrolled] = useState(false);

useEffect(() => {
  const handleScroll = () => {
    setIsScrolled(window.scrollY > 10);
  };
  window.addEventListener("scroll", handleScroll, { passive: true });
  return () => window.removeEventListener("scroll", handleScroll);
}, []);
```

### Drawer State
- Mobile drawer for additional navigation
- Closes on Escape key
- Focus trap implementation
- Click outside to close

## Edge Cases

### Empty/Loading/Error States
- Navigation remains visible and functional
- FAB action should handle loading state internally
- Error states should not break navigation

### Keyboard Navigation
- Tab order: Tabs → FAB → Drawer toggle
- Focus trap in drawer when open
- Escape closes drawer

### Screen Reader
- Announces navigation landmark
- Announces current page
- Announces FAB action
- Decorative icons hidden from screen readers

### Dark Mode
- Component designed for dark theme
- Uses slate-900 as base
- Cyan accents for interactive elements
- No light mode variant currently implemented

## Testing Checklist

### Accessibility
- [ ] Keyboard navigation (Tab, Shift+Tab, Escape)
- [ ] Screen reader testing (NVDA, JAWS, VoiceOver)
- [ ] Color contrast verification (axe DevTools)
- [ ] Touch target size validation (44x44px minimum)
- [ ] Focus indicator visibility

### Responsive
- [ ] Mobile viewport (320px - 767px)
- [ ] Tablet viewport (768px - 1023px)
- [ ] Desktop viewport (1024px+)
- [ ] Orientation changes (portrait/landscape)

### Animation
- [ ] Reduced motion preference respected
- [ ] Smooth transitions on tab switch
- [ ] FAB press feedback
- [ ] Performance on low-end devices

### States
- [ ] Default (not scrolled)
- [ ] Scrolled (shadow appears)
- [ ] Drawer open/closed
- [ ] Active tab indicator
- [ ] FAB hover/active states

## Implementation Notes

### Dependencies
- `framer-motion`: Animation library with reduced motion support
- `lucide-react`: Icon library (Plus icon for FAB)
- `next/link`: Routing
- `react`: Core framework

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Backdrop blur supported in all modern browsers
- CSS gradients supported in all modern browsers

### Performance
- Passive scroll listener
- Minimal re-renders with proper state management
- CSS-based animations where possible
- Framer Motion for complex animations only

## Migration Guide

### From Previous Version
The previous bottom nav was a simple flex container with text labels. The new version includes:

1. **Active tab indicator**: Animated cyan bar above active tab
2. **Elevated FAB**: Center button for primary action
3. **Scroll-based shadow**: Dynamic shadow on scroll
4. **Improved accessibility**: Better ARIA labels and focus management
5. **Reduced motion support**: Respects user preferences

### Breaking Changes
- None - component maintains same API
- Additional props can be added for customization

## Future Enhancements

- [ ] Badge support for notification counts
- [ ] Customizable FAB action per route
- [ ] Haptic feedback on mobile
- [ ] Swipe gestures for tab switching
- [ ] Custom icon support per route
- [ ] Light mode variant
- [ ] Configurable animation timing
- [ ] A/B testing support for different layouts

## Related Components

- `DashboardShell`: Main container component
- Mobile drawer navigation
- Desktop header navigation

## References

- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design FAB Guidelines](https://m3.material.io/components/extended-fab)
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Next.js Documentation](https://nextjs.org/docs)