# Breadcrumb overflow menu

## Purpose

Use a breadcrumb overflow menu on narrow screens when a route trail becomes too long to fit comfortably in a single row. The pattern preserves the root and current-page segments while collapsing the middle steps into an accessible overflow trigger.

## Behavior

- Keep the first and last breadcrumb items visible on mobile.
- Collapse intermediate items into an overflow button that opens a menu.
- Use the ARIA breadcrumb pattern: a navigation landmark labeled "Breadcrumb" with a list of links or text items.
- Focus the first overflow menu item when the menu opens.
- Support keyboard dismissal with Escape.
- Announce the menu expansion via a polite live region.

## Accessibility notes

- The overflow trigger uses a button with `aria-haspopup="menu"` and `aria-expanded`.
- The menu uses `role="menu"` and each item uses `role="menuitem"` when interactive.
- Maintain visible focus indicators and sufficient color contrast.
- Ensure the menu does not trap focus beyond the open state.

## Responsive guidance

- Show the full breadcrumb trail on wider screens.
- Collapse to the overflow pattern on screens narrower than 640px.
- Keep the current page visible as the terminal breadcrumb item.
