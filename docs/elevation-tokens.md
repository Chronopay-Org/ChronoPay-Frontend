# Elevation tokens

ChronoPay uses a five-step shadow scale to communicate stacking without relying on harsh black shadows. Dark mode combines cyan and blue ambient light with each surface; light mode uses a quieter slate and cyan treatment.

| Level | Utility | Use |
| --- | --- | --- |
| 1 | `elevation-1` | Resting cards and glass surfaces |
| 2 | `elevation-2` | Raised panels and tooltips |
| 3 | `elevation-3` | Popovers and floating controls |
| 4 | `elevation-4` | Dialogs and modal sheets |
| 5 | `elevation-5` | Exceptional overlays above another overlay |

Use the lowest level that makes the stacking order clear. Adjacent surfaces should normally differ by no more than one level; reserve level 5 for nested overlays so the hierarchy does not become noisy.

## Accessibility

Shadows are supplemental and must never carry text, focus, or status meaning. Every elevated surface still needs a visible boundary and WCAG 2.1 AA-compliant foreground contrast. Keep existing borders when a surface can overlap a similarly colored background. Focus rings remain independent of the elevation scale.

When changing a component, test both explicit and system-selected light and dark themes. Also check narrow viewports, overlapping panels, nested popovers, and scroll containers where a shadow can be clipped.
