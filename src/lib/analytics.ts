/**
 * Pluggable analytics module.
 *
 * Usage:
 *   // Replace the default sink (e.g. in tests or at app bootstrap)
 *   setAnalyticsSink((event, props) => myAnalytics.track(event, props));
 *
 *   // Fire an event
 *   track("did_you_mean_click", { original: "teh", suggested: "the" });
 */

export type AnalyticsSink = (event: string, props: Record<string, unknown>) => void;

/** Default sink: log in development, no-op in production. */
const defaultSink: AnalyticsSink = (event, props) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`[analytics] ${event}`, props); // eslint-disable-line no-console
  }
};

let currentSink: AnalyticsSink = defaultSink;

/**
 * Replace the active analytics sink.
 * Pass `null` to restore the default sink.
 */
export function setAnalyticsSink(sink: AnalyticsSink | null): void {
  currentSink = sink ?? defaultSink;
}

/**
 * Fire an analytics event through the current sink.
 */
export function track(event: string, props: Record<string, unknown>): void {
  currentSink(event, props);
}

// ─── Did-you-mean tracking ────────────────────────────────────────────────────

/**
 * Track a did-you-mean suggestion click-through.
 * Rejects when either term is empty.
 */
export function trackDidYouMeanClick(
  original: string,
  suggested: string,
): Promise<boolean> {
  if (!original || !suggested) {
    return Promise.reject(
      new Error(
        "Both original and suggested terms are required for analytics tracking.",
      ),
    );
  }

  track("did_you_mean_click", { original, suggested });
  return Promise.resolve(true);
}
