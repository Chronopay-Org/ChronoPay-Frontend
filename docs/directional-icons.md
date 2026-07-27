# Directional icons

ChronoPay mirrors icons whose meaning follows the interface's inline reading direction. Add `icon-directional` to the icon itself; CSS `:dir(rtl)` performs the mirror automatically for the document or any nested RTL region.

```tsx
<ArrowLeft className="icon-directional h-4 w-4" aria-hidden="true" />
```

## Audit

| Pattern | Current locations | RTL behavior |
| --- | --- | --- |
| Back navigation (`ArrowLeft`) | Slot detail and receipt pages | Mirrors automatically |
| Previous/next chevrons | Add `icon-directional` when introduced | Mirrors automatically |
| Progress direction arrows | Add `icon-directional` when direction communicates sequence | Mirrors automatically |
| External links | `HelpPopover` | Never mirror; the symbol means an external destination |
| Playback and status controls | Play, pause, spinner, check, close | Never mirror; meaning is direction-independent |

## Usage rules

- Mirror semantic directions such as back/forward and previous/next.
- Do not mirror media controls, clocks, refresh, download, external-link, close, or status icons.
- Keep the accessible label logical (`Back`, `Next`) rather than describing the icon's physical direction.
- Prefer `aria-hidden="true"` when adjacent text already provides the accessible name.
- Test both `dir="ltr"` and `dir="rtl"`, including nested regions and dark mode.

The utility uses the computed `dir` state instead of a language check, requires no hydration, and does not change layout dimensions.
