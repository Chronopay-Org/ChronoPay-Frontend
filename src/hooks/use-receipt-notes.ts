"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const AUTOSAVE_DELAY_MS = 1500;
const STORAGE_PREFIX = "chronopay:receipt-notes:";

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

function loadNotes(receiptId: string): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(`${STORAGE_PREFIX}${receiptId}`) ?? "";
  } catch {
    return "";
  }
}

function persistNotes(receiptId: string, text: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${receiptId}`, text);
    return true;
  } catch {
    return false;
  }
}

export interface UseReceiptNotesReturn {
  text: string;
  setText: (value: string) => void;
  saveStatus: SaveStatus;
  forceSave: () => void;
}

export function useReceiptNotes(receiptId: string): UseReceiptNotesReturn {
  const [text, setTextRaw] = useState(() => loadNotes(receiptId));
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef(text);
  const receiptIdRef = useRef(receiptId);

  // Syncing external (localStorage) state into React when receiptId changes
  // is a legitimate synchronization pattern. eslint rule is too strict here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    receiptIdRef.current = receiptId;
    const saved = loadNotes(receiptId);
    setTextRaw(saved);
    latestRef.current = saved;
    setSaveStatus("saved");
  }, [receiptId]);

  const commit = useCallback(() => {
    const current = latestRef.current;
    const ok = persistNotes(receiptIdRef.current, current);
    setSaveStatus(ok ? "saved" : "error");
  }, []);

  const setText = useCallback(
    (value: string) => {
      setTextRaw(value);
      latestRef.current = value;
      setSaveStatus("unsaved");

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setSaveStatus("saving");
        commit();
      }, AUTOSAVE_DELAY_MS);
    },
    [commit],
  );

  const forceSave = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveStatus("saving");
    commit();
  }, [commit]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { text, setText, saveStatus, forceSave };
}

export function searchReceiptNotes(query: string): Array<{ receiptId: string; preview: string }> {
  if (typeof window === "undefined" || !query.trim()) return [];
  const results: Array<{ receiptId: string; preview: string }> = [];
  const lowerQuery = query.toLowerCase().trim();
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_PREFIX)) continue;
      const value = window.localStorage.getItem(key) ?? "";
      if (value.toLowerCase().includes(lowerQuery)) {
        const receiptId = key.slice(STORAGE_PREFIX.length);
        const preview = value.length > 80 ? `${value.slice(0, 80)}…` : value;
        results.push({ receiptId, preview });
      }
    }
  } catch {
    // localStorage may be unavailable
  }
  return results;
}
