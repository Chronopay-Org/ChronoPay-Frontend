import React from 'react';

interface Props {
  lightTime: string;
  darkTime: string;
}

export const ThemePreviewStrip = ({ lightTime, darkTime }: Props) => {
  // Simple visual calculation: 24h as 100%
  const timeToPct = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return ((h * 60 + m) / 1440) * 100;
  };

  const start = timeToPct(lightTime);
  const end = timeToPct(darkTime);

  return (
    <div 
      className="h-2 w-full rounded-full bg-slate-800 overflow-hidden relative mt-2 border border-slate-200 dark:border-slate-700"
      aria-hidden="true"
    >
      <div 
        className="absolute h-full bg-orange-400 transition-all"
        style={{ left: `${start}%`, width: `${end - start}%` }}
      />
    </div>
  );
};
