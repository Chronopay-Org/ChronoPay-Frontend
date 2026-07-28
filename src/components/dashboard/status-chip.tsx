/**
 * Re-exports the unified StatusChip from the UI component library.
 *
 * Previously this was a separate implementation with a different tone scale
 * (`positive | warning | critical | neutral`). Those values are still valid
 * — the unified chip accepts both the dashboard scale and the UI scale.
 *
 * Import from either path:
 *   import { StatusChip } from "@/components/dashboard/status-chip";
 *   import { StatusChip } from "@/app/components/ui/status-chip";
 */
export { StatusChip, type StatusChipProps, type StatusChipTone } from "@/app/components/ui/status-chip";

/**
 * Tone alias kept for backwards compatibility with code that imports the
 * `Tone` type from this module. New code should import `StatusChipTone`
 * from "@/app/components/ui/status-chip" or use the dashboard `Tone` type
 * from "@/components/dashboard/types".
 */
export type { Tone } from "./types";
