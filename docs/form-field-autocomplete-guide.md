# FormField Autocomplete & Password Manager Guide

## Overview

The `FormField` component (`src/app/components/ui/form-field.tsx`) is a primitive that enforces proper `autocomplete`, `name`, and `inputMode` attributes for password manager and autofill compatibility. This ensures 1Password, Bitwarden, and browser autofill work without friction while maintaining WCAG 2.1 AA accessibility compliance.

## Why This Matters

Password managers rely on specific HTML attributes to identify and fill form fields correctly:
- **`autocomplete`**: Tells the password manager what type of data the field expects
- **`name`**: Provides a fallback identifier that should align with the autocomplete value
- **`inputMode`**: Optimizes mobile keyboard for the expected input type

Without these attributes, users must manually copy-paste credentials, creating friction and security risks.

## Usage

### Basic Example

```tsx
import { FormField } from '@/app/components/ui/form-field';

<FormField
  label="Email address"
  autoComplete="email"
  name="email"
  inputMode="email"
  type="email"
  required
  helperText="We'll never share your email"
/>
```

### Authentication Fields

```tsx
{/* Login form */}
<FormField
  label="Email or username"
  autoComplete="username"
  name="username"
  type="text"
  required
/>

<FormField
  label="Password"
  autoComplete="current-password"
  name="current-password"
  type="password"
  required
/>

{/* Registration form */}
<FormField
  label="Create password"
  autoComplete="new-password"
  name="new-password"
  type="password"
  required
  helperText="Must be at least 12 characters"
/>
```

### Two-Factor Authentication

```tsx
<FormField
  label="Verification code"
  autoComplete="one-time-code"
  name="verification-code"
  inputMode="numeric"
  type="text"
  maxLength={6}
  required
/>
```

### Personal Information

```tsx
<FormField
  label="Full name"
  autoComplete="name"
  name="full-name"
  type="text"
/>

<FormField
  label="Phone number"
  autoComplete="tel"
  name="phone"
  inputMode="tel"
  type="tel"
/>
```

### Address Fields

```tsx
<FormField
  label="Street address"
  autoComplete="street-address"
  name="street-address"
  type="text"
/>

<FormField
  label="City"
  autoComplete="address-level2"
  name="city"
  type="text"
/>

<FormField
  label="Postal code"
  autoComplete="postal-code"
  name="postal-code"
  inputMode="numeric"
  type="text"
/>
```

## Autocomplete Values Reference

The component supports all standard HTML5 autocomplete values:

### Identity
- `name` - Full name
- `given-name` - First name
- `family-name` - Last name
- `username` - Username/login
- `email` - Email address

### Authentication
- `current-password` - Existing password (login)
- `new-password` - New password (registration/change)
- `one-time-code` - 2FA/OTP codes

### Contact
- `tel` - Phone number
- `tel-country-code` - Country code
- `tel-national` - National number
- `url` - Website URL

### Address
- `street-address` - Street address
- `address-line1` - Address line 1
- `address-line2` - Address line 2
- `address-level1` - State/region
- `address-level2` - City
- `postal-code` - ZIP/postal code
- `country` - Country
- `country-name` - Country name

### Payment
- `cc-name` - Cardholder name
- `cc-number` - Card number
- `cc-exp` - Expiration date
- `cc-csc` - Security code

## InputMode Values

Optimize mobile keyboards with these `inputMode` values:

- `text` - Default text keyboard
- `email` - Email keyboard with @ symbol
- `tel` - Phone number keypad
- `numeric` - Numeric keypad (for codes, PINs)
- `decimal` - Numeric with decimal point
- `url` - URL keyboard with / and .com
- `search` - Search keyboard with go button
- `none` - No virtual keyboard

## Name Attribute Guidelines

The `name` attribute should align with the `autocomplete` value for maximum compatibility:

| Autocomplete | Recommended Name |
|-------------|------------------|
| `email` | `email` or `email-address` |
| `username` | `username` or `user` |
| `current-password` | `current-password` or `password` |
| `new-password` | `new-password` or `password` |
| `one-time-code` | `verification-code` or `otp-code` |
| `tel` | `phone` or `telephone` |

The component validates this in development mode and warns if the pair is incompatible.

## Accessibility Features

The FormField component includes WCAG 2.1 AA accessibility features:

- **Label association**: Labels are properly linked via `htmlFor`/`id`
- **ARIA descriptions**: Helper text and errors linked via `aria-describedby`
- **Error states**: Errors use `role="alert"` and `aria-invalid="true"`
- **Required indicators**: Visual asterisk + `required` attribute
- **Focus management**: High-contrast focus rings (cyan)
- **Keyboard navigation**: Full keyboard support

### Error Handling

```tsx
<FormField
  label="Email"
  autoComplete="email"
  name="email"
  error="Invalid email address"
  type="email"
/>
```

### Helper Text

```tsx
<FormField
  label="Password"
  autoComplete="new-password"
  name="new-password"
  type="password"
  helperText="Must be at least 12 characters with 1 number"
/>
```

## Styling

The component uses Tailwind CSS with the design system tokens:

- **Default**: Slate-950 background, slate-700 border
- **Focus**: Cyan-400 border and ring
- **Error**: Rose-400 border and ring
- **Disabled**: Reduced opacity, not-allowed cursor

Custom classes can be applied via the `className` prop:

```tsx
<FormField
  label="Email"
  autoComplete="email"
  name="email"
  className="max-w-md"
/>
```

## Testing

The component includes comprehensive tests in `form-field.test.tsx`:

- Rendering and attribute application
- Autocomplete and inputMode validation
- Error and helper text display
- ARIA attribute correctness
- Keyboard navigation
- User input handling

Run tests with:
```bash
npm run test:unit
```

## Migration Checklist

When migrating existing forms to use FormField:

1. **Import the component**
   ```tsx
   import { FormField } from '@/app/components/ui/form-field';
   ```

2. **Replace `<input>` elements** with FormField
3. **Add required props**: `label`, `autoComplete`, `name`
4. **Set appropriate `inputMode`** for mobile optimization
5. **Add `type`** if different from default "text"
6. **Migrate helper text** to the `helperText` prop
7. **Migrate error states** to the `error` prop
8. **Test with password managers** (1Password, Bitwarden, browser autofill)

## Browser Support

The component works in all modern browsers that support:
- HTML5 autocomplete attributes (IE10+)
- inputMode attribute (iOS 12+, Android Chrome 66+)
- CSS custom properties and modern layout

## Resources

- [HTML5 Autocomplete Specification](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill-detail-tokens)
- [WebAuthn and Autofill](https://www.w3.org/TR/webauthn/)
- [WCAG 2.1 AA Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [1Password Integration Guide](https://developer.1password.com/docs/web/autofill/)
