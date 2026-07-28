# Recently Viewed Rail Component

## Overview

The `RecentlyViewedRail` component is a horizontally scrollable rail that displays recently viewed marketplace items, allowing buyers to quickly return to items they've previously browsed. It includes a "Clear history" affordance with confirmation.

## Features

- **Horizontal scroll with snap**: Smooth scrolling with CSS scroll snap for touch-friendly navigation
- **Keyboard navigation**: Full roving tabindex support with Arrow keys, Home, and End
- **Persistent storage**: Uses localStorage to maintain history across sessions
- **Clear history**: Two-step confirmation to prevent accidental deletion
- **Accessibility**: WCAG 2.1 AA compliant with proper ARIA labels and roles
- **Responsive**: Adapts to different screen sizes
- **Dark mode support**: Inherits theme from parent context

## Installation

The component is located at `src/app/marketplace/components/recently-viewed-rail.tsx`.

## Usage

### Basic Usage

```tsx
import { RecentlyViewedRail } from "./components/recently-viewed-rail";

export default function Marketplace() {
  return (
    <div>
      <RecentlyViewedRail />
      {/* Rest of marketplace content */}
    </div>
  );
}
```

### Adding Items to History

Use the `useRecentlyViewed` hook to add items to the recently viewed history from anywhere in your app:

```tsx
import { useRecentlyViewed } from "@/app/marketplace/components/recently-viewed-rail";

function TimeSlotCard({ slot }) {
  const { addItem } = useRecentlyViewed();

  const handleClick = () => {
    // Add to recently viewed when user clicks on a slot
    addItem({
      id: slot.id,
      title: slot.title,
      price: slot.price,
      href: `/marketplace/${slot.id}`,
      image: slot.image,
    });
  };

  return <button onClick={handleClick}>View Slot</button>;
}
```

## API

### RecentlyViewedRail Component

**Props**: None (reads from localStorage)

**Behavior**:
- Renders nothing if no items are in history
- Displays up to 10 most recently viewed items
- Shows items in reverse chronological order (most recent first)
- Automatically updates when items are added via the hook

### useRecentlyViewed Hook

**Returns**:
```typescript
{
  addItem: (item: Omit<RecentlyViewedItem, "viewedAt">) => void;
}
```

**RecentlyViewedItem Type**:
```typescript
interface RecentlyViewedItem {
  id: string;           // Unique identifier for the item
  title: string;        // Display title
  price: string;        // Price display (e.g., "50 XLM")
  image?: string;       // Optional image URL
  href: string;         // Link to the item
  viewedAt: number;     // Timestamp (auto-added by hook)
}
```

## Accessibility

### WCAG 2.1 AA Compliance

The component meets WCAG 2.1 AA requirements:

- **Keyboard Navigation**: Full keyboard support with roving tabindex
  - `ArrowRight`/`ArrowDown`: Move to next item
  - `ArrowLeft`/`ArrowUp`: Move to previous item
  - `Home`: Jump to first item
  - `End`: Jump to last item
  - Focus outlines survive scroll operations

- **ARIA Attributes**:
  - `role="region"` with `aria-label="Recently viewed items"` on the container
  - `aria-label` on each item link describing the item
  - `aria-label` on clear button that changes based on state

- **Focus Management**:
  - Only one item has `tabIndex="0"` at a time (roving tabindex)
  - Focus is automatically scrolled into view when changed
  - Focus rings use the design system's `focus-ring-white` class

- **Screen Reader Support**:
  - Section has proper heading structure
  - Interactive elements have descriptive labels
  - State changes are announced via toast notifications

### Reduced Motion

The component respects `prefers-reduced-motion` by:
- Using CSS transitions that can be disabled
- Avoiding unnecessary animations when reduced motion is preferred

## Responsive Design

### Breakpoints

- **Mobile (< 640px)**: Full-width rail with touch scroll
- **Tablet (640px - 1024px)**: Optimized card spacing
- **Desktop (> 1024px)**: Maximum 6 cards visible before scrolling

### Touch Support

- Native touch scrolling on mobile devices
- CSS scroll snap for predictable scroll stops
- Hidden scrollbars for cleaner appearance (with fallback for older browsers)

## Storage

### localStorage Key

- **Key**: `chronopay-recently-viewed`
- **Format**: JSON array of `RecentlyViewedItem` objects
- **Max Items**: 10 (oldest items are automatically removed)

### Data Structure

```json
[
  {
    "id": "slot-123",
    "title": "1 Hour Consultation",
    "price": "50 XLM",
    "image": "https://example.com/image.jpg",
    "href": "/marketplace/slot-123",
    "viewedAt": 1704067200000
  }
]
```

## Edge Cases

### Empty State

- Component renders nothing when history is empty
- No visual clutter for first-time users

### Duplicate Items

- When an item is viewed again, it moves to the front
- Prevents duplicate entries in the rail

### Storage Errors

- Gracefully handles localStorage quota exceeded
- Silently fails without breaking the UI
- Logs errors to console for debugging

### RTL Support

- Component is RTL-aware through CSS logical properties
- Horizontal scroll direction adapts to text direction

## Testing

Run tests with:

```bash
npm run test:unit recently-viewed-rail.test.tsx
```

### Test Coverage

The test suite covers:
- Empty state rendering
- localStorage persistence
- Clear history confirmation flow
- Keyboard navigation (Arrow keys, Home, End)
- ARIA attributes and roles
- Item limit enforcement (MAX_ITEMS)
- Hook functionality (addItem, event dispatching)

## Design System Integration### CSS Classes Used

- `.card`: Base card styling
- `.card--interactive`: Hover and active states
- `.focus-ring-white`: Focus outline for accessibility
- Design tokens from `globals.css` for colors and spacing

### Theme Support

The component uses CSS custom properties that automatically adapt to:
- Dark mode (default)
- Light mode (when `[data-theme="light"]` is set)
- System preference (via `@media (prefers-color-scheme)`)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS scroll snap: Supported in all modern browsers
- localStorage: Supported in all modern browsers
- Fallback for older browsers: Basic functionality maintained

## Future Enhancements

Potential improvements for future iterations:
- Add filtering by category or date range
- Implement "View all history" modal
- Add analytics tracking for viewed items
- Support for custom sorting options
- Integration with backend sync for cross-device history

## Troubleshooting

### Items not appearing

1. Check browser console for localStorage errors
2. Verify localStorage is not disabled in browser settings
3. Check that items are being added with correct structure

### Keyboard navigation not working

1. Ensure the component has focus
2. Check that items exist in the rail
3. Verify no other elements are capturing keyboard events

### Scroll not working on mobile

1. Verify touch events are not blocked by parent elements
2. Check that `overflow-x-auto` class is applied
3. Test on actual device (some desktop browsers don't simulate touch correctly)
