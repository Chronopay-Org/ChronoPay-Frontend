'use client';

import { useId, useState, useMemo } from 'react';
import { Eye, EyeOff, Check, X } from 'lucide-react';

interface PasswordStrengthMeterProps {
  value: string;
  onChange?: (value: string) => void;
  showToggle?: boolean;
}

interface Criteria {
  label: string;
  met: boolean;
}

const LEVELS = [
  { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-400', minScore: 0 },
  { label: 'Fair', color: 'bg-orange-500', textColor: 'text-orange-400', minScore: 1 },
  { label: 'Good', color: 'bg-yellow-500', textColor: 'text-yellow-400', minScore: 2 },
  { label: 'Strong', color: 'bg-lime-500', textColor: 'text-lime-400', minScore: 3 },
  { label: 'Very Strong', color: 'bg-emerald-500', textColor: 'text-emerald-400', minScore: 4 },
] as const;

export function PasswordStrengthMeter({ value, onChange, showToggle = true }: PasswordStrengthMeterProps) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();
  const meterId = useId();
  const liveId = useId();

  const criteria = useMemo<Criteria[]>(() => {
    const lengthOk = value.length >= 8;
    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasDigit = /[0-9]/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);
    const notCommon = !['password', '123456', 'qwerty', 'letmein', 'admin', 'welcome'].includes(value.toLowerCase());

    return [
      { label: 'At least 8 characters', met: lengthOk },
      { label: 'Contains uppercase letter', met: hasUpper },
      { label: 'Contains lowercase letter', met: hasLower },
      { label: 'Contains digit', met: hasDigit },
      { label: 'Contains special character', met: hasSpecial },
      { label: 'Not a common password', met: notCommon || value.length === 0 },
    ];
  }, [value]);

  const score = useMemo(() => criteria.filter(c => c.met).length, [criteria]);
  const level = LEVELS.slice().reverse().find(l => score >= l.minScore) ?? LEVELS[0];
  const strengthPercent = Math.round((score / criteria.length) * 100);

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-300">
        Password
      </label>

      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder="Enter a strong password"
          className="w-full rounded-lg border border-white/10 bg-white/6 px-3 py-2 pr-10 text-sm text-white placeholder:text-slate-500 focus:border-cyan-300/40 focus:outline-none focus:ring-2 focus:ring-cyan-300/30 transition-colors"
          aria-describedby={meterId}
          aria-live="polite"
        />
        {showToggle && value && (
          <button
            type="button"
            onClick={() => setVisible(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-300 transition-colors"
            aria-label={visible ? 'Hide password' : 'Show password'}
          >
            {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        )}
      </div>

      <div id={meterId} role="progressbar" aria-valuenow={strengthPercent} aria-valuemin={0} aria-valuemax={100} aria-label={`Password strength: ${level.label}`}>
        <div className="flex gap-1">
          {LEVELS.map((l, i) => (
            <div
              key={l.label}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                i < level.minScore ? l.color : 'bg-white/10'
              }`}
            />
          ))}
        </div>
        <p className={`mt-1 text-xs font-medium ${level.textColor}`}>
          {level.label}
        </p>
      </div>

      <ul className="space-y-1" aria-label="Password criteria">
        {criteria.map(c => (
          <li key={c.label} className="flex items-center gap-2 text-xs text-slate-400">
            {c.met ? (
              <Check className="h-3 w-3 text-emerald-400 shrink-0" aria-hidden />
            ) : (
              <X className="h-3 w-3 text-slate-500 shrink-0" aria-hidden />
            )}
            <span className={c.met ? 'text-slate-300' : ''}>{c.label}</span>
          </li>
        ))}
      </ul>

      <div id={liveId} aria-live="polite" className="sr-only" role="status">
        Password strength: {level.label}. {score} of {criteria.length} criteria met.
      </div>
    </div>
  );
}
