/**
 * Centralized error reporting for client-side code and error boundaries.
 * Currently logs to the console; swap in a real telemetry sink here.
 *
 * This is the only place in `src/` allowed to call `console` directly
 * (see the `no-console` rule in eslint.config.mjs). Pass `context` to say what
 * was being attempted, e.g. `reportError(err, "Failed to copy to clipboard")`.
 */
export function reportError(error: unknown, context?: string): void {
  const err: Error & { digest?: string } =
    error instanceof Error ? error : new Error(String(error));

  if (err.digest) {
    const prefix = context ? `[ChronoPay] ${context}:` : "[ChronoPay]";
    console.error(`${prefix} ${err.message} (digest: ${err.digest})`, err);
    return;
  }
  if (context) {
    console.error(`[ChronoPay] ${context}: ${err.message}`, err);
    return;
  }
  console.error(err);
}
