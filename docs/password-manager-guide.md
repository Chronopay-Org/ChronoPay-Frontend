# Password Manager Annotation Guide

## Overview

This guide documents the exact HTML `autocomplete` tokens used across ChronoPay authentication forms. Consistent annotations help password managers, autofill engines, and assistive technologies understand each field's purpose, reducing user friction and improving accessibility.

**Scope:** Login, sign-up, password reset, two-factor authentication, and passkey/WebAuthn flows.

## Design Goals

- **Accessibility (WCAG 2.1 AA):** Ensure form fields expose correct semantics so screen readers and password managers can assist users.
- **Consistency:** Use a single source of truth for every auth input type.
- **Security:** Avoid leaking sensitive values via autocomplete where unnecessary.
- **Responsive:** Patterns work identically on mobile and desktop.

## Autocomplete Token Reference

| Field Type | Token | Use Case | Notes |
|---|---|---|---|
| Current password | `current-password` | Login, password change, account recovery | Use on existing-password inputs only. |
| New password | `new-password` | Sign-up, password reset, password change | Use on new-password inputs; do not pair with `current-password` on the same input. |
| One-time code | `one-time-code` | SMS/email/TOTP verification (e.g., 2FA) | iOS and Android password managers surface a quick‑fill bar. |
| WebAuthn / passkey | `webauthn` | Passkey enrollment or assertion | Triggers platform authenticator UI where supported. |

### Token Details

#### 1. `current-password`
Use for the user's existing password during authentication or update flows.

```tsx
<input
  type="password"
  autoComplete="current-password"
  aria-label="Password"
/>
```

**When to use:**
- Login form password field
- "Change password" current password field

**When NOT to use:**
- New password creation (use `new-password` instead)
- Non-auth fields (e.g., API keys, secret notes)

#### 2. `new-password`
Use for a password the user is creating for the first time.

```tsx
<input
  type="password"
  autoComplete="new-password"
  aria-label="Create password"
/>
```

**When to use:**
- Sign-up password field
- Password reset / forgot-password flow
- Password change new-password field

**When NOT to use:**
- Existing password verification
- Confirmation password field (omit `autocomplete` on confirmation inputs to avoid duplicate autofill entries)

#### 3. `one-time-code`
Use for numeric one-time codes from SMS, email, or TOTP apps.

```tsx
<input
  type="text"
  inputMode="numeric"
  autoComplete="one-time-code"
  aria-label="Enter 6-digit code"
/>
```

**When to use:**
- Two-factor authentication verification
- Email/SMS verification codes

**When NOT to use:**
- PIN codes used for repeated authentication (use `current-password` for device PINs in some contexts)
- Non-numeric codes without a time-limit (use standard `text` input with custom autocomplete)

**Platform behavior:**
- iOS/iPadOS: Shows a quick‑fill bar above the keyboard Safari-wide.
- Android Chrome: Shows autofill suggestion from SMS retrieval API.
- Desktop: May offer to store the code temporarily for the session.

#### 4. `webauthn`
Use for WebAuthn registration and authentication (passkeys).

```tsx
<input
  type="text"
  autoComplete="webauthn"
  aria-label="Passkey"
  style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}
/>
```

**When to use:**
- Passkey enrollment flows
- Conditional WebAuthn assertions that rely on autofill

**When NOT to use:**
- Standard password fields
- Recovery code inputs

**Platform behavior:**
- iOS/iPadOS/macOS: Triggers Face ID / Touch ID from the keyboard bar.
- Windows: Triggers Windows Hello.
- Android: Triggers biometric or screen-lock credential prompt.

## Form Field Audit

### Existing Components

| Component | Input | Current `autocomplete` | Status |
|---|---|---|---|
| `src/components/dashboard/two-factor-enroll.tsx` | TOTP code (line 68) | `none` | **Needs `one-time-code`** |

### Recommended Additions

```tsx
// src/components/dashboard/two-factor-enroll.tsx (line 68)
<input
  type="text"
  autoComplete="one-time-code"
  inputMode="numeric"
  maxLength={6}
  value={code}
  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
  className="w-full text-center text-4xl font-mono tracking-[0.5em] bg-slate-950 border border-slate-700 rounded-xl py-6 focus:border-cyan-400 focus:outline-none"
  placeholder="000000"
/>
```

## Cross-Reference to Form Components

ChronoPay uses the following input patterns. When adding new auth forms, map each field to the table above before merging.

- **Two-factor enrollment:** `src/components/dashboard/two-factor-enroll.tsx`
- **Settings:** `src/components/dashboard/settings/page.tsx`
- **Dashboard shell:** `src/app/components/dashboard-shell.tsx`

## Browser Test Matrix

| Browser / Platform | `current-password` | `new-password` | `one-time-code` | `webauthn` |
|---|---|---|---|---|
| Chrome 120+ (Desktop) | Autofill, password manager integration | Generates password prompt | Autofill from SMS | Passkey autofill |
| Chrome 120+ (Android) | Autofill, Google Password Manager | Generates password prompt | SMS retrieval autofill | Play Services passkey |
| Safari 17+ (iOS/iPadOS) | iCloud Keychain autofill | iCloud Keychain suggests strong password | Quick‑fill bar above keyboard | Face ID / Touch ID autofill |
| Safari 17+ (macOS) | iCloud Keychain autofill | iCloud Keychain suggests strong password | Quick‑fill bar | Touch ID autofill |
| Firefox 120+ (Desktop) | Firefox Lockwise autofill | Password generator integration | Limited autofill (experimental) | WebAuthn (platform + roaming) |
| Firefox 120+ (Android) | Firefox Lockwise autofill | Password generator integration | Limited autofill (experimental) | WebAuthn |
| Edge 120+ (Desktop) | Microsoft Passwords autofill | Password generator integration | Autofill from SMS | Windows Hello passkey |

### Known Limitations

| Limitation | Browser | Workaround |
|---|---|---|
| `one-time-code` autofill requires SMS Retriever API or user copy/paste on Firefox | Firefox | Display code in UI, add explicit "Copy" affordance. |
| `webauthn` autofill only appears when a `hidden` input is present | Safari, Chrome | Include a visually hidden but focusable input with `autocomplete="webauthn"`. |
| Some password managers fill `new-password` into `current-password` fields | Cross-browser | Ensure distinct field types and labels; test with target password managers. |

## Accessibility Notes

### WCAG 2.1 AA Alignment
- **1.3.5 Identify Input Purpose:** Correct `autocomplete` tokens allow assistive technologies to identify the purpose of each input.
- **2.1.1 Keyboard:** Password manager suggestions must be dismissible via keyboard; do not trap focus inside the autofill bar.
- **2.4.6 Headings and Labels:** Every input must have an associated `<label>` or `aria-label`. Do not rely on placeholder text.
- **3.3.2 Labels or Instructions:** Include helper text for password requirements and OTP length expectations.

### Screen Reader Behavior
- **VoiceOver (iOS/macOS):** Reads `current-password` as "Password" and `new-password` as "New password."
- **NVDA / JAWS (Windows):** Reads the field type as "Edit, Password" and labels the autocomplete hint where supported.
- **TalkBack (Android):** Announces the field type; does not expose autocomplete token directly.

### Reduced Motion & Animation
- Do not animate password visibility toggles or autofill bars unless respecting `prefers-reduced-motion`.

## Implementation Checklist

### Before Merging Auth Forms
- [ ] Every password input uses `current-password` or `new-password` (not both).
- [ ] TOTP / OTP inputs use `one-time-code` and `inputMode="numeric"`.
- [ ] WebAuthn / passkey inputs use `webauthn` with a visually hidden input where required.
- [ ] Non-password secret fields (API keys, recovery codes) omit autocomplete or set `autocomplete="off"`.
- [ ] Screen reader labels present and tested with VoiceOver / NVDA / TalkBack.
- [ ] RTL layout tested (Cairo, Arabic, Hebrew locales).
- [ ] Dark mode contrast verified (4.5:1 minimum for text).
- [ ] Keyboard-only flow tested (Tab order, autofill bar dismissal).

### Cross-Browser Validation
- [ ] Chrome Desktop
- [ ] Chrome Android
- [ ] Safari iOS/iPadOS
- [ ] Safari macOS
- [ ] Firefox Desktop
- [ ] Firefox Android
- [ ] Edge

## Dark Mode

All ChronoPay forms are built on the existing dark theme tokens. When designing auth forms:

- **Background:** `bg-slate-950` with `border-slate-700`
- **Input text:** `text-white` or `text-slate-100`
- **Placeholder:** `placeholder:text-slate-500`
- **Focus ring:** `focus:ring-cyan-300`

Do not introduce new color tokens solely for auth forms.

## RTL Support

ChronoPay auth forms must render correctly in right-to-left layouts:
- Use logical CSS properties (`margin-inline-start`, `padding-inline-end`) where possible.
- Ensure label-to-input spacing flips naturally.
- Verify password manager autofill bars appear in the correct visual column.

## Migration Guide

### From Unannotated Inputs

Before adding this guide, auth inputs in ChronoPay did not consistently expose autocomplete tokens.

```tsx
// Before
<input type="password" aria-label="Password" />

// After
<input type="password" autoComplete="current-password" aria-label="Password" />
```

```tsx
// Before
<input type="text" maxLength={6} aria-label="Code" />

// After
<input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} aria-label="6-digit code" />
```

## Related Documentation

- [Copy Button Standard](./copy-button-standard.md)
- [Overlay & Modal Checklist](./overlay-checklist.md)
- [Design Review Checklist](./design-review-checklist.md)
- [Toast Feedback System](./toast-feedback-system.md)

## References

- HTML Standard - autocomplete: https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
- MDN - autocomplete attribute: https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/autocomplete
- WCAG 2.1 AA: https://www.w3.org/WAI/WCAG21/quickref/
- Apple - Autofill (one-time-code): https://developer.apple.com/documentation/security/password_autofill/setting_up_a_passkey_fallback_url
- Google - SMS Retriever API: https://developers.google.com/identity/sms-retriever/verify
- WebAuthn: https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API
