import { useState, useEffect } from 'react';
import { reportError } from "@/app/dashboard/reportError";

export interface Action {
  id: string;
  label: string;
  icon?: string;
}

export function useCommandPaletteStorage() {
  const [pinned, setPinned] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try {
      const savedPinned = localStorage.getItem('cp-pinned');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedPinned) setPinned(JSON.parse(savedPinned));
    } catch (e) {
      reportError(e, 'Failed to parse cp-pinned from localStorage');
    }

    try {
      const savedRecent = localStorage.getItem('cp-recent');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (savedRecent) setRecent(JSON.parse(savedRecent));
    } catch (e) {
      reportError(e, 'Failed to parse cp-recent from localStorage');
    }
  }, []);

  const togglePin = (id: string) => {
    const next = pinned.includes(id) ? pinned.filter(p => p !== id) : [...pinned, id];
    setPinned(next);
    try {
      localStorage.setItem('cp-pinned', JSON.stringify(next));
    } catch (e) {
      reportError(e, 'Failed to save cp-pinned to localStorage');
    }
  };

  const trackUsage = (id: string) => {
    const filtered = recent.filter(r => r !== id);
    const next = [id, ...filtered].slice(0, 5); // Keep last 5
    setRecent(next);
    try {
      localStorage.setItem('cp-recent', JSON.stringify(next));
    } catch (e) {
      reportError(e, 'Failed to save cp-recent to localStorage');
    }
  };

  return { pinned, recent, togglePin, trackUsage };
}
