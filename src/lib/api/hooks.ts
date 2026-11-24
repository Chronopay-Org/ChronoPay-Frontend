"use client";

import { useCallback, useEffect, useState } from "react";
import type { AdminUser } from "@/components/dashboard/admin-user-types";
import type { MarketplaceListing } from "@/app/marketplace/catalogue";
import type { NotificationItem } from "@/components/dashboard/notifications/types";
import { useApiSources } from "./provider";

type SourceLoader<T> = (signal: AbortSignal) => Promise<T>;

type SourceState<T> = {
  data: T | undefined;
  loading: boolean;
  error: Error | undefined;
};

type SourceResult<T> = {
  load: SourceLoader<T>;
  data?: T;
  error?: Error;
};

function useSourceData<T>(
  load: SourceLoader<T>,
  enabled = true,
): SourceState<T> {
  const [result, setResult] = useState<SourceResult<T>>();

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    load(controller.signal).then(
      (data) => setResult({ load, data }),
      (error: unknown) => {
        if (!controller.signal.aborted) {
          setResult({
            load,
            error: error instanceof Error ? error : new Error(String(error)),
          });
        }
      },
    );

    return () => controller.abort();
  }, [enabled, load]);

  if (!enabled) {
    return { data: undefined, loading: false, error: undefined };
  }
  if (!result || result.load !== load) {
    return { data: undefined, loading: true, error: undefined };
  }
  return { data: result.data, loading: false, error: result.error };
}

export function useListings(): SourceState<MarketplaceListing[]> {
  const { listings } = useApiSources();
  const load = useCallback(
    (signal: AbortSignal) => listings.list({ signal }),
    [listings],
  );
  return useSourceData(load);
}

export function useAdminUsers(): SourceState<AdminUser[]> {
  const { users } = useApiSources();
  const load = useCallback(
    (signal: AbortSignal) => users.list({ signal }),
    [users],
  );
  return useSourceData(load);
}

export function useNotifications(enabled = true): SourceState<NotificationItem[]> {
  const { notifications } = useApiSources();
  const load = useCallback(
    (signal: AbortSignal) => notifications.list({ signal }),
    [notifications],
  );
  return useSourceData(load, enabled);
}
