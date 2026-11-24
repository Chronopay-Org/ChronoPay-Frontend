/**
 * Centralized error reporting for client-side error boundaries.
 * Currently logs to the console; swap in a real telemetry sink here.
 */
export function reportError(error: Error & { digest?: string }): void {
  if (error.digest) {
    console.error(`[ChronoPay] ${error.message} (digest: ${error.digest})`, error);
    return;
  }
  console.error(error);
}
