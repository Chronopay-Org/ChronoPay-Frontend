import { useCallback, useRef, useSyncExternalStore } from "react";

export type StorageArea = "localStorage" | "sessionStorage" | "cookie";

export interface UseStoredStateOptions<T> {
  /** Storage area to read from and write to. Defaults to `localStorage`. */
  area?: StorageArea;
  /** Value returned when nothing is stored or the stored value is invalid. */
  defaultValue: T;
  /** Parse and validate the raw string. Return `undefined` to fall back to `defaultValue`. */
  parse?: (raw: string) => T | undefined;
  /** Serialise the value before writing. Defaults to `JSON.stringify`. */
  serialize?: (value: T) => string;
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

function decode<T>(
  raw: string | null,
  parse: (raw: string) => T | undefined,
  defaultValue: T,
): T {
  if (raw === null) return defaultValue;
  const parsed = parse(raw);
  return parsed === undefined ? defaultValue : parsed;
}

/**
 * Hydration-safe persistent state hook built on `useSyncExternalStore`.
 *
 * The server snapshot and the first client snapshot are always `defaultValue`, so SSR and
 * hydration produce identical markup. Once hydrated, the store is re-read from storage
 * and kept in sync across tabs via the `storage` event. Writes are guarded so a
 * failing/quota-exceeded storage never throws into the renderer.
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
  const defaultRef = useRef(defaultValue);
  defaultRef.current = defaultValue;

  const cacheRef = useRef<SnapshotCache<T> | null>(null);
  const getSnapshot = useCallback((): T => {
    const raw = readRaw(area, key);
    const cache = cacheRef.current;
    if (cache && cache.raw === raw) return cache.value;
    const value = decode(raw, parseRef.current, defaultRef.current);
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
      if (area === "cookie") {
        writeCookie(key, serialize(next));
        forceRender();
        return;
      }
      const storage = getStorage(area);
      if (!storage) return;
      try {
        storage.setItem(key, serialize(next));
      } catch {
        // Quota exceeded or storage disabled: keep the in-memory value but do not throw.
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
