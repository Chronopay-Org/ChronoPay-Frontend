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

## Storage key registry

To unify scattered `localStorage`/`sessionStorage` access behind a single, versioned accessor, all persisted keys are registered centrally in `src/lib/storage-keys.ts`. New code should read key names from this registry rather than hard-coding strings.

The registry exports:

- `STORAGE_KEYS` — keys owned by `useStoredState` and therefore versioned where a structured shape requires it. Each entry records the `key`/prefix, the `owner` hook, the `area` (`localStorage`, `sessionStorage`, or `cookie`), and the storage `format`.
- `REGISTERED_STORAGE_KEYS` — the remaining application keys that are still written outside `useStoredState`; recorded here for auditability so they can be migrated incrementally.
- `ALL_STORAGE_KEYS` — the union of both lists, for exhaustiveness checks.
- `receiptNoteKey(id)`, `timezoneModeKey(id)`, `scrollRestorationKey(listId)` — helpers for prefixed/keyed entries.

### Version envelope

`useStoredState` supports optional `version` and `migrate` options. When a `version` is supplied, values are persisted as a JSON envelope:

```json
{ "v": 1, "data": "<serialized payload>" }
```

Reading is backwards compatible:

- An un-enveloped legacy value is handed to `migrate(raw, 0)` when a `migrate` function is provided, otherwise parsed directly. This keeps pre-migration data alive.
- An envelope written by a newer version (`v` greater than the hook's `version`) is ignored in favor of the default.
- Corrupt JSON or blocked storage never throws; it falls back to the default value.

Keys that store plain scalar values (e.g. `"true"`/`"false"` flags) intentionally omit `version` and keep their legacy byte format, so no rewrite or migration is required to adopt `useStoredState`.
