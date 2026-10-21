# i18n String Registry

> **Closes #638** — Scaffold internationalisation for UI strings with a documented locale registry.

## Overview

ChronoPay uses a lightweight, provider-agnostic i18n scaffolding. There is no runtime dependency on `next-intl`, `react-i18next`, or any third-party i18n framework — just a typed JSON registry, a React context, and standard `Intl` APIs.

### Key files

| File | Purpose |
|---|---|
| `messages/en.json` | English string registry (source of truth for all keys) |
| `src/lib/i18n.tsx` | React context, `useMessages()` hook, and `Intl` formatter hooks |
| `src/lib/i18n.test.tsx` | Unit tests (33 cases) |
| `src/app/layout.tsx` | Wraps the app with `<I18nProvider>` |
| `src/app/dashboard/page.tsx` | Pilot migration using `t("key")` calls |
| `docs/i18n-formatters.md` | Standalone `Intl` formatter reference |

---

## Architecture

```
messages/en.json         ← flat dot-key registry
        │
        ▼
src/lib/i18n.tsx
  ├── flatten()          ← converts nested JSON → { "dashboard.title": "Dashboard" }
  ├── getMessages(locale) ← returns flat map, falls back to 'en'
  ├── resolveKey(map, key) ← resolves a dot key against a map
  ├── I18nProvider        ← React context with locale, dir, messages
  ├── useMessages()       ← typed hook: const t = useMessages(); t("dashboard.title")
  ├── useLocale()         ← { locale, dir }
  ├── useNumberFormatter() ← locale-aware Intl.NumberFormat
  ├── useCurrencyFormatter() ← locale-aware currency formatting
  └── useDateFormatter()  ← locale-aware Intl.DateTimeFormat
```

---

## Usage

### In components

```tsx
"use client";
import { useMessages } from "@/lib/i18n";

export function DashboardHeader() {
  const t = useMessages();

  return (
    <div>
      <h1>{t("dashboard.title")}</h1>
      <p>{t("dashboard.subtitle")}</p>
    </div>
  );
}
```

### With Intl formatters

```tsx
import { useCurrencyFormatter, useDateFormatter } from "@/lib/i18n";

export function PriceDisplay({ amount }: { amount: number }) {
  const fmtCurrency = useCurrencyFormatter("USD");
  const fmtDate = useDateFormatter({ dateStyle: "medium" });

  return (
    <div>
      <span>{fmtCurrency(amount)}</span>
      <time>{fmtDate(new Date())}</time>
    </div>
  );
}
```

### Outside React (standalone formatters)

```ts
import { formatNumberStandalone, formatCurrencyStandalone } from "@/lib/i18n";

formatNumberStandalone(1234.56, "en");   // "1,234.56"
formatNumberStandalone(1234.56, "de");   // "1.234,56"
formatCurrencyStandalone(99.99, "EUR");  // "€99.99"
```

---

## Adding a new locale

1. Create `messages/<code>.json` following the same structure as `messages/en.json`.
2. Import it in `src/lib/i18n.tsx` and add it to the `registry`:
   ```ts
   import frMessages from "../../messages/fr.json";
   const frFlat = flatten(frMessages);
   registry["fr"] = frFlat;
   ```
3. Add the locale code to `SUPPORTED_LOCALES`, `LOCALE_DIR`, and `LOCALE_LABELS`.
4. Run `bunx vitest run src/lib/i18n.test.tsx` to verify.

---

## Adding new strings

1. Add the key to `messages/en.json` under the appropriate namespace.
2. Use the key in your component via `useMessages()`.
3. The TypeScript `MessageKey` type is auto-derived from `en.json` — no manual type updates needed.

### Namespace conventions

| Namespace | Scope |
|---|---|
| `common` | Loading, error, empty states, shared UI |
| `nav` | Navigation links |
| `home` | Landing page |
| `dashboard` | Dashboard page headings and states |
| `wallet` | Wallet card |
| `metrics` | Metric card labels |
| `bookings` | Booking progress and checklist |
| `security` | Security settings |
| `ratings` | Rating breakdown |
| `pricing` | Fee calculator |
| `quickActions` | Quick action cards |
| `slots` | Time slot list |
| `trust` | Trust metrics |
| `onboarding` | Onboarding widget and tour |
| `kyc` | Identity verification |
| `mfa` | Two-factor authentication |
| `export` | Export history |
| `a11y` | Accessibility helpers |

---

## Contributing guide

### Rules

1. **Never hardcode user-facing strings in components.** Use `t("namespace.key")` instead.
2. **Keep messages concise.** Titles ≤ 6 words, descriptions ≤ 2 sentences.
3. **Use interpolation sparingly.** If a string needs dynamic values, include a `{variable}` placeholder and document it in the key's JSON comment.
4. **RTL-awareness.** The `I18nProvider` sets `dir="rtl"` for Arabic/Hebrew. Test layouts with RTL locales before merging.
5. **Accessibility.** All i18n'd text must remain readable by screen readers. Use semantic HTML (`<time>`, `<span>`, etc.) for formatted values.
6. **No third-party i18n libraries.** This project intentionally uses vanilla `Intl` APIs to avoid lock-in.

### Testing checklist

- [ ] `bunx vitest run src/lib/i18n.test.tsx` passes (33+ tests)
- [ ] `bun tsc -b --noEmit` passes (no type errors in your changed files)
- [ ] No hardcoded strings remain in migrated components
- [ ] RTL layout renders correctly (test with `locale="ar"`)
- [ ] `useMessages()` returns the key string for any missing translation

---

## Migration status

| Component / Page | Status |
|---|---|
| `src/app/dashboard/page.tsx` | ✅ Migrated (pilot) |
| `src/app/page.tsx` | 🔲 Pending |
| `src/app/components/Header.tsx` | 🔲 Pending |
| `src/components/dashboard/panel-shell.tsx` | 🔲 Pending |
| `src/components/dashboard/wallet-card.tsx` | 🔲 Pending |
| `src/components/dashboard/metric-card.tsx` | 🔲 Pending |

---

## Security & failure handling

- **Missing key fallback:** `useMessages()` returns the raw key string (e.g. `"dashboard.title"`) when a key is missing. In development, a `console.warn` is emitted. In production, no warning is logged.
- **Unknown locale fallback:** `getMessages(locale)` always returns the `en` map if the requested locale is not in the registry.
- **Provider-less rendering:** Components that call `useMessages()` without a wrapping `<I18nProvider>` receive the `en` default context, so they degrade gracefully.

---

## Related docs

- [i18n Formatters](./i18n-formatters.md) — Standalone `Intl` API reference
- [Accessibility Testing Checklist](./accessibility-testing-checklist.md)
- [Design Tokens](./design-tokens.md)
