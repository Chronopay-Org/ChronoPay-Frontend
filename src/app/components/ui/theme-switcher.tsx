'use client';

import { useEffect, useState } from 'react';
import { Monitor, Sun, Moon, type LucideIcon } from 'lucide-react';

type Theme = 'auto' | 'light' | 'dark';

const STORAGE_KEY = 'chronopay-theme';

const OPTIONS: { value: Theme; label: string; Icon: LucideIcon }[] = [
  { value: 'auto', label: 'Auto', Icon: Monitor },
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
];

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark' || theme === 'light') {
    root.setAttribute('data-theme', theme);
  } else {
    root.removeAttribute('data-theme');
  }
}

export function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('auto');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = (localStorage.getItem(STORAGE_KEY) ?? 'auto') as Theme;
    setTheme(stored);
    setMounted(true);
  }, []);

  function handleChange(next: Theme) {
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* noop */
    }
    applyTheme(next);
  }

  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className="h-8 w-[116px] rounded-full border border-white/10 bg-white/5"
      />
    );
  }

  return (
    <div
      role="group"
      aria-label="Color theme"
      className="flex items-center rounded-full border border-white/10 bg-white/5 p-0.5"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            aria-pressed={active}
            aria-label={`${label} theme`}
            title={`${label} theme`}
            onClick={() => handleChange(value)}
            className={[
              'flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors focus-ring-white',
              active
                ? 'bg-white/15 text-white'
                : 'text-slate-400 hover:text-slate-200',
            ].join(' ')}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
