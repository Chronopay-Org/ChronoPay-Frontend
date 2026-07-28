# Skeleton loading motion

Use the shared `skeleton` class for placeholder shapes. It provides a theme-aware base tint and a shimmer for users who have not requested reduced motion. Under `prefers-reduced-motion: reduce`, the shimmer is removed completely and the same layout remains visible as a static tint.

## Usage

- Put `skeleton` on each placeholder shape and add size and radius utilities separately.
- Give the loading region `role="status"`, `aria-busy="true"`, and a concise accessible label or visually hidden status message.
- Mark decorative placeholder shapes `aria-hidden="true"` through their nearest wrapper. Do not announce each bar individually.
- Preserve the final layout dimensions to prevent content shift during long loads.

Do not add `animate-pulse` or a component-specific shimmer. A single motion policy keeps dashboard, hydration, and future loading states consistent.

## Review checklist

Test explicit and system-selected light and dark themes, narrow and wide viewports, long-running loads, RTL direction, and a screen reader. Toggle the operating system's reduced-motion preference and confirm that no highlight travels across a placeholder. The static tint must remain distinguishable from its surface without being mistaken for interactive content.
