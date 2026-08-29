import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';

export type ScheduleType = 'none' | 'sun' | 'custom';

export function useThemeSchedule() {
  const { setTheme } = useTheme();
  const [config, setConfig] = useState({
    type: 'none' as ScheduleType,
    lightTime: '06:00',
    darkTime: '18:00',
  });

  useEffect(() => {
    const saved = localStorage.getItem('theme-schedule');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved) setConfig(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (config.type === 'none') return;

    const checkSchedule = () => {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      const isDarkTime = currentTime >= config.darkTime || currentTime < config.lightTime;
      setTheme(isDarkTime ? 'dark' : 'light');
    };

    checkSchedule();
    const interval = setInterval(checkSchedule, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [config, setTheme]);

  const updateConfig = (newConfig: Partial<typeof config>) => {
    const next = { ...config, ...newConfig };
    setConfig(next);
    localStorage.setItem('theme-schedule', JSON.stringify(next));
  };

  return { config, updateConfig };
}
