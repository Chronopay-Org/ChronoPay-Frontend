# Availability Strip Component

## Overview

The `AvailabilityStrip` component displays a horizontal strip of the next 7 days with time-slot counts and quick-book functionality. It enables users to quickly book available slots without deep-linking into the calendar view.

## Features

- **7-Day Preview**: Shows availability for the next 7 days in a responsive grid layout
- **Quick-Book CTAs**: Per-day "Book" buttons for available and limited availability days
- **Slot Picker Integration**: Links to slot picker with preselected date via URL parameter
- **Empty State Handling**: Graceful placeholder when no availability data exists
- **Keyboard Navigation**: Full keyboard support for navigation buttons
- **Responsive Design**: Adapts from 1-4 columns based on screen size
- **WCAG 2.1 AA Compliant**: Meets accessibility standards

## Accessibility

### WCAG 2.1 AA Compliance

The component implements the following accessibility features:

- **Semantic HTML**: Uses proper `<section>`, `<article>`, and list roles
- **ARIA Labels**: All interactive elements have descriptive labels
- **Keyboard Navigation**: Navigation buttons support Enter and Space keys
- **Focus Management**: Visible focus rings using `focus-ring-cyan` class
- **Screen Reader Support**: Proper `aria-labelledby`, `aria-describedby`, and `aria-live` attributes
- **Color Contrast**: All text meets 4.5:1 contrast ratio minimum
- **Disabled States**: Proper `aria-disabled` and `tabIndex` management

### Keyboard Interactions

- **Tab**: Navigate between interactive elements
- **Enter/Space**: Activate navigation buttons
- **Arrow Keys**: Navigate through day cards (when focused)

### Screen Reader Announcements

- Empty state uses `aria-live="polite"` for non-intrusive announcements
- Status changes are announced via ARIA labels
- Navigation state is communicated through button states

## Responsive Behavior

The component uses a responsive grid system:

- **Mobile (< 640px)**: Single column layout
- **Small Tablets (640px - 1024px)**: 2 columns
- **Large Tablets (1024px - 1280px)**: 3 columns
- **Desktop (≥ 1280px)**: 4 columns

## API Reference

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `days` | `DayAvailability[]` | Yes | - | Array of day availability data |
| `onBook` | `(date: Date) => void` | No | - | Callback when book button is clicked |
| `className` | `string` | No | `""` | Additional CSS classes |

### DayAvailability Type

```typescript
type DayAvailability = {
  date: Date;
  dayName: string;
  dateLabel: string;
  slotCount: number;
  status: "available" | "limited" | "full" | "none";
};
```

### Status Types

- **`available`**: 4+ slots available, green status chip
- **`limited`**: 1-3 slots available, amber status chip
- **`full`**: 0 slots but fully booked, red status chip
- **`none`**: No slots available, gray status chip

## Usage Example

```tsx
import { AvailabilityStrip } from "@/components/dashboard";
import { availabilityDays } from "@/components/dashboard";

function Dashboard() {
  return (
    <AvailabilityStrip 
      days={availabilityDays}
      onBook={(date) => console.log("Book for:", date)}
    />
  );
}
```

## Integration with Slot Picker

The component integrates with the slot picker via URL parameters:

```tsx
<ButtonLink
  href={`/dashboard/slots?date=${day.date.toISOString()}`}
  aria-label={`Book slots for ${day.dateLabel}`}
  onClick={() => onBook?.(day.date)}
>
  Book
</ButtonLink>
```

The slot picker page should read the `date` parameter to preselect the appropriate day.

## Edge Cases Handled

### Empty Week
When no availability data is provided, the component displays:
- Calendar icon with empty state message
- "No availability data available" text
- Proper ARIA live region for screen readers

### Single Day
When only one day is available:
- No navigation buttons displayed
- Single day card centered in layout

### Exactly 7 Days
When exactly 7 days are provided:
- No navigation buttons displayed
- All days visible in grid
- No pagination indicator

### More Than 7 Days
When more than 7 days are provided:
- Navigation buttons appear
- Pagination indicator shows range (e.g., "Showing 1-7 of 14 days")
- Scroll functionality enabled

## Design Tokens

The component uses the following design tokens from the global CSS:

- **Border Radius**: `var(--radius-md)` (24px)
- **Border**: `var(--border-subtle)` (rgba(148, 163, 184, 0.14))
- **Background**: `rgba(255, 255, 255, 0.03)` for cards
- **Focus Ring**: Custom cyan focus ring with 2px offset

## Testing

The component includes comprehensive unit tests covering:

- Rendering with various data states
- Book button interactions
- Navigation functionality
- Keyboard navigation
- ARIA attributes and accessibility
- Responsive design classes
- Edge cases (empty, single day, full week)

Run tests with:
```bash
npm run test:unit
```

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Mobile

## Performance Considerations

- Uses React state for navigation (minimal re-renders)
- Virtual scrolling not needed for 7-day limit
- CSS Grid for performant responsive layouts
- Lazy loading of day data (if implementing API integration)

## Future Enhancements

Potential improvements for future iterations:

- **Swipe Gestures**: Add touch swipe for mobile navigation
- **Date Range Picker**: Allow selecting custom date ranges
- **Filter by Status**: Filter days by availability status
- **Animation**: Subtle transitions when scrolling between days
- **RTL Support**: Full right-to-left language support
- **Dark Mode**: Enhanced dark mode contrast adjustments
