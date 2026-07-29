# Wallet holdings tabs

## Summary

The wallet card now splits holdings into three tabs:

- Available
- Escrowed
- Redeemed

Each tab shows a distinct empty state, the current count of holdings, and maintains the active selection and scroll position across visits using local storage.

## Accessibility

- Tabs use a proper tablist/tab pattern with `role="tablist"`, `role="tab"`, and `aria-selected`.
- The active panel is connected through `aria-controls` and `aria-labelledby`.
- Keyboard support includes arrow keys, Home, End, Enter, and Space.
- The panel remains focusable for screen-reader and keyboard navigation.

## Responsive behavior

- Tabs wrap on smaller viewports and the content panel remains scrollable when the list is long.
- Empty states provide a clear next-action message that adapts to the selected tab.
