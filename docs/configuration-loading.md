# Retry-safe configuration loading

ChronoPay's Developer settings persist experimental feature flags in browser `localStorage` under `chronopay-experiments`.

## Loading behavior

Configuration reads are bounded and deterministic:

- A normal stored configuration is loaded on the first read.
- Transient storage-access failures are retried up to three times.
- Missing configuration is treated as an empty configuration and all experiments remain disabled by default.
- Malformed JSON, a non-object payload, or a non-boolean value for a known experiment is treated as invalid configuration. Invalid data is not retried because repeating the same parse cannot recover it.
- If all storage reads fail, the UI falls back to disabled experiment defaults and reports an actionable `unavailable` result to the caller rather than applying partial state.

The loader never applies a partially parsed configuration. Unknown keys are ignored so older/newer clients can coexist without breaking supported feature flags.

## Why retries are bounded

Browser storage can fail transiently because of privacy controls, sandboxing, or temporary access restrictions. Retrying a small fixed number of times allows a transient failure to recover while avoiding an unbounded render or request loop. Persistent failures remain safe because the Developer settings still render with default values.

## Validation

Focused unit coverage lives in `src/components/dashboard/settings/experimental-feature-config.test.ts` and covers the normal load path, transient recovery, exhausted retries, malformed persisted data, invalid known values, and missing configuration.
