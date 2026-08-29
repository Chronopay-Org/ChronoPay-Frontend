import { useState, useEffect } from 'react';

export interface Action {
  id: string;
  label: string;
  icon?: string;
}

export function useCommandPaletteStorage() {
  const [pinned, setPinned] = useState<string[]>([]);
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const savedPinned = localStorage.getItem('cp-pinned');
    const savedRecent = localStorage.getItem('cp-recent');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (savedPinned) setPinned(JSON.parse(savedPinned));
    if (savedRecent) setRecent(JSON.parse(savedRecent));
  }, []);

  const togglePin = (id: string) => {
    const next = pinned.includes(id) ? pinned.filter(p => p !== id) : [...pinned, id];
    setPinned(next);
    localStorage.setItem('cp-pinned', JSON.stringify(next));
  };

  const trackUsage = (id: string) => {
    const filtered = recent.filter(r => r !== id);
    const next = [id, ...filtered].slice(0, 5); // Keep last 5
    setRecent(next);
    localStorage.setItem('cp-recent', JSON.stringify(next));
  };

  return { pinned, recent, togglePin, trackUsage };
}
