"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  readStoredValue,
  scanStoredEntries,
  writeStoredValue,
} from "@/hooks/use-stored-state";
import { STORAGE_KEYS, receiptNoteKey } from "@/lib/storage-keys";

const AUTOSAVE_DELAY_MS = 1500;
const STORAGE_PREFIX = STORAGE_KEYS.receiptNotes.key;

export type SaveStatus = "saved" | "saving" | "unsaved" | "error";

/**
 * Receipt notes are stored as plain text under the registry prefix
 * `STORAGE_KEYS.receiptNotes` (one key per receipt). Reads and writes go
 * through the storage primitives so this module never touches Web Storage
 * directly; `searchReceiptNotes` scans the same prefix.
 */

function loadNotes(receiptId: string): string {
  return (
    readStoredValue<string>(receiptNoteKey(receiptId), {
      parse: (raw) => raw,
    }) ?? ""
  );
}

function persistNotes(receiptId: string, text: string): boolean {
  return writeStoredValue<string>(receiptNoteKey(receiptId), text, {
    serialize: (value) => value,
  });
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

  // Syncing external (stored) state into React when receiptId changes
  // is a legitimate synchronization pattern. eslint rule is too strict here.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    receiptIdRef.current = receiptId;
    const saved = loadNotes(receiptId);
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
  for (const { key, value } of scanStoredEntries("localStorage", STORAGE_PREFIX)) {
    const matchIndex = value.toLowerCase().indexOf(lowerQuery);
    if (matchIndex !== -1) {
      const receiptId = key.slice(STORAGE_PREFIX.length);
      const previewLength = Math.max(80, lowerQuery.length + 20);
      const previewStart = Math.max(
        0,
        Math.min(matchIndex - 20, value.length - previewLength),
      );
      const previewEnd = Math.min(value.length, previewStart + previewLength);
      const preview = `${previewStart > 0 ? "…" : ""}${value.slice(
        previewStart,
        previewEnd,
      )}${previewEnd < value.length ? "…" : ""}`;
      results.push({ receiptId, preview });
    }
  }
  return results;
}
