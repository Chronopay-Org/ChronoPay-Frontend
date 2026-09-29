export const EXPERIMENTAL_FEATURE_STORAGE_KEY = "chronopay-experiments";
export const CONFIG_LOAD_MAX_ATTEMPTS = 3;

export type ConfigLoadStatus = "loaded" | "empty" | "invalid" | "unavailable";

export interface ExperimentalFeatureConfigLoadResult {
  states: Record<string, boolean>;
  status: ConfigLoadStatus;
  attempts: number;
  error?: string;
}

type ConfigReader = () => string | null;

type ParseResult =
  | { ok: true; states: Record<string, boolean> }
  | { ok: false; error: string };

function readBrowserConfig(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(EXPERIMENTAL_FEATURE_STORAGE_KEY);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseStoredStates(
  raw: string,
  featureIds: readonly string[],
): ParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      error: "Stored experimental feature configuration is not valid JSON.",
    };
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return {
      ok: false,
      error: "Stored experimental feature configuration must be an object.",
    };
  }

  const candidate = parsed as Record<string, unknown>;
  const states: Record<string, boolean> = {};

  for (const featureId of featureIds) {
    const value = candidate[featureId];
    if (value === undefined) {
      continue;
    }
    if (typeof value !== "boolean") {
      return {
        ok: false,
        error: `Stored value for experimental feature "${featureId}" must be boolean.`,
      };
    }
    states[featureId] = value;
  }

  return { ok: true, states };
}

/**
 * Loads persisted experimental-feature configuration with bounded retries.
 *
 * Storage access failures can be transient (for example a temporarily blocked
 * localStorage implementation), so reads are retried up to maxAttempts. Invalid
 * persisted data is deterministic and is therefore rejected immediately rather
 * than repeatedly parsed. Callers can inspect status/error while safely falling
 * back to disabled feature defaults.
 */
export function loadExperimentalFeatureConfig(
  featureIds: readonly string[],
  reader: ConfigReader = readBrowserConfig,
  maxAttempts = CONFIG_LOAD_MAX_ATTEMPTS,
): ExperimentalFeatureConfigLoadResult {
  const attemptsLimit = Number.isFinite(maxAttempts)
    ? Math.max(1, Math.floor(maxAttempts))
    : CONFIG_LOAD_MAX_ATTEMPTS;
  let lastReadError: unknown;

  for (let attempt = 1; attempt <= attemptsLimit; attempt += 1) {
    let raw: string | null;

    try {
      raw = reader();
    } catch (error) {
      lastReadError = error;
      continue;
    }

    if (raw === null) {
      return { states: {}, status: "empty", attempts: attempt };
    }

    const parsed = parseStoredStates(raw, featureIds);
    if (!parsed.ok) {
      return {
        states: {},
        status: "invalid",
        attempts: attempt,
        error: parsed.error,
      };
    }

    return { states: parsed.states, status: "loaded", attempts: attempt };
  }

  return {
    states: {},
    status: "unavailable",
    attempts: attemptsLimit,
    error: `Unable to read experimental feature configuration after ${attemptsLimit} attempt${attemptsLimit === 1 ? "" : "s"}: ${errorMessage(lastReadError)}`,
  };
}
