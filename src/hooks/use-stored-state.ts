import { useCallback, useRef, useSyncExternalStore } from "react";

export type StorageArea = "localStorage" | "sessionStorage" | "cookie";

/**
 * Options shared by `useStoredState` and the standalone storage primitives
 * (`readStoredValue`, `writeStoredValue`, `scanStoredEntries`). Keeping every
 * raw Web Storage access behind these helpers is what allows the key registry
 * in `src/lib/storage-keys.ts` to stay the single source of truth.
 */
export interface StoredValueOptions<T> {
  /** Storage area to read from and write to. Defaults to `localStorage`. */
  area?: StorageArea;
  /** Parse and validate the raw string. Return `undefined` to fall back to the default. */
  parse?: (raw: string) => T | undefined;
  /** Serialise the value before writing. Defaults to `JSON.stringify`. */
  serialize?: (value: T) => string;
  /**
   * Schema version for the stored value. When provided, writes are wrapped in
   * a version envelope (`{"v": version, "data": <serialised>}`) so future
   * readers can migrate older shapes forward. When omitted, the serialised
   * value is stored as-is, which keeps plain-string consumers (e.g. `"true"`)
   * byte-for-byte compatible with their legacy format.
   */
  version?: number;
  /**
   * Migrate a stored value written by an older schema version — or an
   * un-enveloped legacy value, reported as `fromVersion: 0` — into the current
   * shape. Receives the raw stored string. Return `undefined` to fall back to
   * the default value.
   */
  migrate?: (raw: string, fromVersion: number) => T | undefined;
}

export interface UseStoredStateOptions<T> extends StoredValueOptions<T> {
  /** Value returned when nothing is stored or the stored value is invalid. */
  defaultValue: T;
}

export interface UseStoredStateResult<T> {
  value: T;
  setValue: (next: T | ((prev: T) => T)) => void;
  remove: () => void;
  /** True once the client has resolved the stored value (always false during SSR and the first client render). */
  hydrated: boolean;
}

/** Listeners notified after a same-tab write so every hook instance re-reads storage. */
const localListeners = new Set<() => void>();

function notifyLocalListeners(): void {
  for (const listener of Array.from(localListeners)) listener();
}

const noopSubscribe = () => () => {};

type SnapshotCache<T> = {
  raw: string | null;
  value: T;
};

function getStorage(area: StorageArea): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    if (area === "sessionStorage") return window.sessionStorage;
    if (area === "cookie") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function readCookie(key: string): string | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${key}=`));
    if (!match) return null;
    return decodeURIComponent(match.slice(key.length + 1));
  } catch {
    return null;
  }
}

function writeCookie(key: string, value: string): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // ignore
  }
}

function removeCookie(key: string): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${key}=; path=/; max-age=0; samesite=lax`;
  } catch {
    // ignore
  }
}

function readRaw(area: StorageArea, key: string): string | null {
  if (area === "cookie") return readCookie(key);
  const storage = getStorage(area);
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function defaultSerialize<T>(value: T): string {
  return JSON.stringify(value);
}

function defaultParse<T>(raw: string): T | undefined {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/** Shape of a versioned stored value: `{"v": <version>, "data": <serialised>}`. */
interface VersionEnvelope {
  v: number;
  data: string;
}

/**
 * Returns the envelope when `raw` is a versioned value, or `null` when it is
 * an un-enveloped legacy value. A value only counts as an envelope when it is
 * a JSON object with a numeric `v` and a string `data`, so ordinary JSON
 * payloads (objects, arrays, primitives) are never mistaken for one.
 */
function tryParseEnvelope(raw: string): VersionEnvelope | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return null;
  }
  const candidate = parsed as Record<string, unknown>;
  if (typeof candidate.v !== "number" || typeof candidate.data !== "string") {
    return null;
  }
  return { v: candidate.v, data: candidate.data };
}

function encode<T>(
  value: T,
  serialize: (value: T) => string,
  version?: number,
): string {
  const data = serialize(value);
  if (version === undefined) return data;
  return JSON.stringify({ v: version, data });
}

/**
 * Decodes a raw stored string into a value, honouring the version envelope:
 * current-version envelopes are parsed, older envelopes and un-enveloped
 * legacy values (reported as version 0) are routed through `migrate` when one
 * is provided, and values written by a newer client than this one fall back
 * to the default. Returns `undefined` when nothing usable is stored.
 */
function decode<T>(
  raw: string | null,
  parse: (raw: string) => T | undefined,
  version?: number,
  migrate?: (raw: string, fromVersion: number) => T | undefined,
): T | undefined {
  if (raw === null) return undefined;

  if (version !== undefined) {
    const envelope = tryParseEnvelope(raw);
    if (envelope) {
      if (envelope.v > version) return undefined;
      if (envelope.v < version && migrate) {
        return migrate(envelope.data, envelope.v);
      }
      return parse(envelope.data);
    }
    // Un-enveloped legacy value (pre-versioning schema, reported as version 0).
    if (migrate) return migrate(raw, 0);
  }

  return parse(raw);
}

/**
 * Reads and decodes a single stored value without subscribing to changes.
 * For non-hook callers (plain helpers such as `loadRecents` or the timezone
 * getters) that still need registry-backed, version-aware reads. Returns
 * `undefined` when nothing is stored or the stored value cannot be decoded.
 */
export function readStoredValue<T>(
  key: string,
  options: StoredValueOptions<T> = {},
): T | undefined {
  const { area = "localStorage", version, migrate } = options;
  const parse = options.parse ?? (defaultParse as (raw: string) => T | undefined);
  return decode(readRaw(area, key), parse, version, migrate);
}

/**
 * Encodes and writes a single stored value. Never throws: a failing or
 * quota-exceeded storage is reported by returning `false` so persistence can
 * never break rendering, while callers that surface save errors (e.g. the
 * receipt-notes autosave) can still react to the failure.
 */
export function writeStoredValue<T>(
  key: string,
  value: T,
  options: StoredValueOptions<T> = {},
): boolean {
  const { area = "localStorage", version } = options;
  const serialize = options.serialize ?? defaultSerialize;
  const encoded = encode(value, serialize, version);
  if (area === "cookie") {
    writeCookie(key, encoded);
    return true;
  }
  const storage = getStorage(area);
  if (!storage) return false;
  try {
    storage.setItem(key, encoded);
    return true;
  } catch {
    // Quota exceeded or storage disabled.
    return false;
  }
}

/** Removes a single stored value. Never throws. */
export function removeStoredValue(
  key: string,
  area: StorageArea = "localStorage",
): void {
  if (area === "cookie") {
    removeCookie(key);
    return;
  }
  const storage = getStorage(area);
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
}

export interface StoredEntry {
  key: string;
  value: string;
}

/**
 * Lists every stored entry whose key starts with `prefix`. Used by callers
 * that address values by a key prefix rather than a single key (e.g.
 * per-receipt notes). Cookies cannot be enumerated, so the cookie area
 * always yields an empty list.
 */
export function scanStoredEntries(
  area: StorageArea,
  prefix: string,
): StoredEntry[] {
  if (area === "cookie") return [];
  const storage = getStorage(area);
  if (!storage) return [];
  const entries: StoredEntry[] = [];
  try {
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      entries.push({ key, value: storage.getItem(key) ?? "" });
    }
  } catch {
    // Storage may be unavailable (private browsing, sandboxing).
  }
  return entries;
}

/**
 * Hydration-safe persistent state hook built on `useSyncExternalStore`.
 *
 * The server snapshot and the first client snapshot are always `defaultValue`, so SSR and
 * hydration produce identical markup. Once hydrated, the store is re-read from storage
 * and kept in sync across tabs via the `storage` event. Writes are guarded so a
 * failing/quota-exceeded storage never throws into the renderer.
 *
 * Pass `version` to store values in a version envelope; older envelopes and
 * un-enveloped legacy values are then upgraded through `migrate` on read.
 */
export function useStoredState<T>(
  key: string,
  options: UseStoredStateOptions<T>,
): UseStoredStateResult<T> {
  const { area = "localStorage", defaultValue } = options;
  const parse = options.parse ?? (defaultParse as (raw: string) => T | undefined);
  const serialize = options.serialize ?? defaultSerialize;

  const parseRef = useRef(parse);
  parseRef.current = parse;
  const migrateRef = useRef(options.migrate);
  migrateRef.current = options.migrate;
  const versionRef = useRef(options.version);
  versionRef.current = options.version;
  const defaultRef = useRef(defaultValue);
  defaultRef.current = defaultValue;

  const cacheRef = useRef<SnapshotCache<T> | null>(null);
  // Last value written while the storage object itself was unavailable
  // (e.g. storage disabled). Lets the hook keep working in-memory instead of
  // silently reverting to the default. Unused when storage is reachable.
  const memoryRef = useRef<T | undefined>(undefined);

  const getSnapshot = useCallback((): T => {
    if (area !== "cookie" && !getStorage(area)) {
      return memoryRef.current === undefined
        ? defaultRef.current
        : memoryRef.current;
    }
    const raw = readRaw(area, key);
    const cache = cacheRef.current;
    if (cache && cache.raw === raw) return cache.value;
    const decoded = decode(
      raw,
      parseRef.current,
      versionRef.current,
      migrateRef.current,
    );
    const value = decoded === undefined ? defaultRef.current : decoded;
    cacheRef.current = { raw, value };
    return value;
  }, [area, key]);

  const getServerSnapshot = useCallback((): T => defaultRef.current, []);

  // Subscribe to same-tab writes (via `localListeners`) and cross-tab `storage` events.
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      localListeners.add(onStoreChange);
      if (typeof window === "undefined") {
        return () => {
          localListeners.delete(onStoreChange);
        };
      }
      const handleStorage = (event: StorageEvent) => {
        if (event.key !== null && event.key !== key) return;
        if (event.storageArea && event.storageArea !== getStorage(area)) {
          return;
        }
        onStoreChange();
      };
      window.addEventListener("storage", handleStorage);
      return () => {
        localListeners.delete(onStoreChange);
        window.removeEventListener("storage", handleStorage);
      };
    },
    [area, key],
  );

  const value = useSyncExternalStore<T>(subscribe, getSnapshot, getServerSnapshot);

  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  const forceRender = notifyLocalListeners;

  const write = useCallback(
    (next: T) => {
      const encoded = encode(next, serialize, versionRef.current);
      if (area === "cookie") {
        writeCookie(key, encoded);
        forceRender();
        return;
      }
      const storage = getStorage(area);
      if (!storage) {
        // No storage object at all: keep the value in memory so the hook
        // still reflects writes for this session.
        memoryRef.current = next;
        forceRender();
        return;
      }
      try {
        storage.setItem(key, encoded);
      } catch {
        // Quota exceeded: storage stays the source of truth, do not throw.
      }
      forceRender();
    },
    [area, key, serialize],
  );

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved =
        typeof next === "function"
          ? (next as (prev: T) => T)(getSnapshot())
          : next;
      write(resolved);
    },
    [getSnapshot, write],
  );

  const remove = useCallback(() => {
    memoryRef.current = undefined;
    if (area === "cookie") {
      removeCookie(key);
      forceRender();
      return;
    }
    const storage = getStorage(area);
    if (storage) {
      try {
        storage.removeItem(key);
      } catch {
        // ignore
      }
    }
    forceRender();
  }, [area, key]);

  return { value, setValue, remove, hydrated };
}

export default useStoredState;
