# i18n Formatters

Our `formatters` library provides accessible, responsive, and easy-to-use wrappers around standard `Intl` APIs for consistent formatting of numbers, currencies, and dates across the ChronoPay app.

## Location
`src/lib/formatters.ts`

## Available Functions

### `formatNumber(value, locale?, options?)`
Formats a numeric value.
```typescript
import { formatNumber } from '@/lib/formatters';

formatNumber(1234567.89, 'en-US'); // "1,234,567.89"
formatNumber(1234567.89, 'en-IN'); // "12,34,567.89"
```

### `formatCurrency(value, currency, locale?, options?)`
Formats a numeric value as currency.
```typescript
import { formatCurrency } from '@/lib/formatters';

formatCurrency(1234567.89, 'USD', 'en-US'); // "$1,234,567.89"
formatCurrency(1234567.89, 'INR', 'en-IN'); // "₹12,34,567.89" (symbol varies by exact runtime)
```

### `formatDate(date, locale?, options?)`
Formats a date object, number, or string.
```typescript
import { formatDate } from '@/lib/formatters';

formatDate(new Date(), 'en-US', { dateStyle: 'full' }); // "Monday, July 28, 2026"
```

## Supported Locales & Edge Cases
The formatters handle various complex edge cases automatically thanks to the underlying `Intl` API. Make sure to pass the appropriate locale code to support these cases:
- **en-IN, hi-IN**: Supports the Indian numbering system grouping (e.g. 12,34,567.89).
- **ar-EG**: Supports Arabic digits and Right-To-Left (RTL) reading order automatically if the DOM text direction is managed.

## Accessibility (a11y) & Visuals
- By default, text output from `Intl` is plain text.
- Ensure the parent container has appropriate `dir="rtl"` attributes when displaying Arabic or other RTL locales.
- For semantic grouping, consider wrapping output in appropriately tagged spans if needed (e.g., `<time datetime="...">` for dates).
- See the [Design Review formatters page](/design-review/formatters) for live, side-by-side visual examples.
