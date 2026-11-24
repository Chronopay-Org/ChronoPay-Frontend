"use client";

import { useCallback, useMemo, useState } from "react";
import { useStoredState } from "@/hooks/use-stored-state";
import type {
  PayoutCurrency,
  PayoutDestinationType,
  PayoutDraft,
} from "./types";

const VALID_CURRENCIES = new Set<PayoutCurrency>(["XLM", "USDC", "EURC"]);
const VALID_DESTINATIONS = new Set<PayoutDestinationType>([
  "connected_wallet",
  "stellar_address",
]);

export const DEFAULT_PAYOUT_STORAGE_KEY = "chronopay-payout-step-draft";

function parseDraft(raw: string): PayoutDraft | undefined {
  try {
    const parsed = JSON.parse(raw) as Partial<PayoutDraft>;
    if (!parsed || typeof parsed !== "object") return undefined;

    const destinationType: PayoutDestinationType = VALID_DESTINATIONS.has(
      parsed.destinationType as PayoutDestinationType,
    )
      ? (parsed.destinationType as PayoutDestinationType)
      : "connected_wallet";

    const currency: PayoutCurrency = VALID_CURRENCIES.has(
      parsed.currency as PayoutCurrency,
    )
      ? (parsed.currency as PayoutCurrency)
      : "XLM";

    const customAddress =
      typeof parsed.customAddress === "string" ? parsed.customAddress : "";
    const memo = typeof parsed.memo === "string" ? parsed.memo : "";

    return { destinationType, currency, customAddress, memo };
  } catch {
    return undefined;
  }
}

export interface UsePayoutDraftOptions {
  storageKey?: string | null;
  initialCurrency?: PayoutCurrency;
  initialDestinationType?: PayoutDestinationType;
  initialAddress?: string;
  initialMemo?: string;
}

export function usePayoutDraft({
  storageKey = DEFAULT_PAYOUT_STORAGE_KEY,
  initialCurrency = "XLM",
  initialDestinationType = "connected_wallet",
  initialAddress = "",
  initialMemo = "",
}: UsePayoutDraftOptions) {
  const defaultDraft = useMemo<PayoutDraft>(
    () => ({
      destinationType: initialDestinationType,
      currency: initialCurrency,
      customAddress: initialAddress,
      memo: initialMemo,
    }),
    [initialAddress, initialCurrency, initialDestinationType, initialMemo],
  );

  const persistEnabled = storageKey !== null;
  const effectiveKey = storageKey ?? DEFAULT_PAYOUT_STORAGE_KEY;

  const stored = useStoredState<PayoutDraft>(effectiveKey, {
    area: "sessionStorage",
    defaultValue: defaultDraft,
    parse: parseDraft,
  });

  const [memoryDraft, setMemoryDraft] = useState<PayoutDraft>(defaultDraft);

  const draft = persistEnabled ? stored.value : memoryDraft;

  const updateDraft = useCallback(
    (updater: (prev: PayoutDraft) => PayoutDraft) => {
      if (persistEnabled) {
        stored.setValue(updater);
      } else {
        setMemoryDraft(updater);
      }
    },
    [persistEnabled, stored],
  );

  const setDestinationType = useCallback(
    (destinationType: PayoutDestinationType) => {
      updateDraft((prev) => ({ ...prev, destinationType }));
    },
    [updateDraft],
  );

  const setCurrency = useCallback(
    (currency: PayoutCurrency) => {
      updateDraft((prev) => ({ ...prev, currency }));
    },
    [updateDraft],
  );

  const setCustomAddress = useCallback(
    (customAddress: string) => {
      updateDraft((prev) => ({ ...prev, customAddress }));
    },
    [updateDraft],
  );

  const setMemo = useCallback(
    (memo: string) => {
      updateDraft((prev) => ({ ...prev, memo }));
    },
    [updateDraft],
  );

  const clearDraft = useCallback(() => {
    if (persistEnabled) {
      stored.remove();
    } else {
      setMemoryDraft(defaultDraft);
    }
  }, [defaultDraft, persistEnabled, stored]);

  return {
    draft,
    setDestinationType,
    setCurrency,
    setCustomAddress,
    setMemo,
    clearDraft,
    hydrated: persistEnabled ? stored.hydrated : true,
  };
}
