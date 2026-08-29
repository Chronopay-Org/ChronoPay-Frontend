# Pricing Strategy Explainer

This document describes the `PricingStrategyExplainer` side panel used in the mint flow to compare pricing strategies for time-tokens.

## Purpose

Provide suppliers an in-app explainer comparing three strategies: Fixed, Tiered, Dynamic. Includes a deterministic preview and examples.

## Files

- `src/components/pricing/PricingStrategyExplainer.tsx` — side panel UI, accessible dialog, loading / retry handling.
- `src/components/pricing/PricingStrategyPreview.tsx` — deterministic mock preview used for inline preview.
- `src/components/dashboard/quick-actions.tsx` — integrated explainer toggle for mint-related quick actions.

## Accessibility

- Uses `role="dialog"` and `aria-modal="true"`.
- Radio inputs are keyboard-focusable. Contrast and focus styles follow existing design tokens.

## Behavior

- The panel loads a deterministic preview (no network calls) and supports a simple retry flow for UI resilience.
- Preview updates immediately when toggling strategies.

## Tests

- Unit tests cover rendering, interaction, invalid input, and basic error/retry flows (see `src/__tests__`).

## Compatibility

- No storage or API migrations required. The explainer is purely client-side and guarded by a toggle in `quick-actions` so existing flows remain unchanged.
