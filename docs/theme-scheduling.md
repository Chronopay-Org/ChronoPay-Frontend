# Theme Scheduling System

## Overview
The application unifies theme selection and automated theme scheduling into a single theme store (`src/hooks/use-theme.ts`) and switcher (`src/components/dashboard/theme-switcher.tsx`) to reduce eye strain and match natural light cycles without flash-of-unstyled-content (FOUC) on reload.

## Modes
- **Light (`light`)**: Explicitly forces the light theme.
- **Dark (`dark`)**: Explicitly forces the dark theme.
- **Auto (`auto`)**: Follows the system `prefers-color-scheme` preference at runtime.
- **Scheduled (`scheduled`)**: Automatically switches between light and dark themes at user-configured boundary times (backed by `src/app/hooks/use-theme-schedule.ts`), supporting both custom time intervals and sun schedule defaults (`06:00` light / `18:00` dark).

## Performance & Persistence
- Theme mode is persisted in `localStorage` under `chronopay:theme` (automatically migrating the legacy `chronopay-theme` key).
- Schedule configuration (`type`, `lightTime`, `darkTime`) is stored in `localStorage` under `theme-schedule`.
- The inline `themeInitScript` in `src/app/layout.tsx` evaluates `chronopay:theme` (including `scheduled` mode and `theme-schedule` boundaries) before React hydration to prevent theme flashing on reload.
- In `scheduled` mode, a background observer checks the time every 60 seconds to transition `data-theme` on `<html>` at boundary times if the tab remains open.

## Accessibility
- The unified `ThemeSwitcher` uses an accessible WAI-ARIA `radiogroup` with roving `tabIndex` and keyboard navigation (`ArrowRight`/`ArrowDown`, `ArrowLeft`/`ArrowUp`, `Home`, `End`).
- Schedule controls appear when `Scheduled` mode is active and use native `<input type="time">` controls paired with explicit labels for screen reader compatibility.
- `ThemePreviewStrip` provides a visual daylight preview strip for the configured transition interval.
