import { Sun, Moon, Clock } from 'lucide-react';
import { useThemeSchedule } from '@/app/hooks/use-theme-schedule';
import { ThemePreviewStrip } from './theme-preview-strip';

export const ThemeSwitcher = () => {
  const { config, updateConfig } = useThemeSchedule();

  return (
    <div className="p-4 space-y-4 rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <label htmlFor="enable-schedule" className="text-sm font-medium">
          Schedule Theme
        </label>
        <input 
          id="enable-schedule"
          type="checkbox"
          checked={config.type !== 'none'}
          onChange={(e) => updateConfig({ type: e.target.checked ? 'custom' : 'none' })}
          className="h-4 w-4 rounded"
        />
      </div>

      {config.type !== 'none' && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 flex items-center gap-1">
                <Sun size={12} /> Light Mode
              </label>
              <input 
                type="time"
                value={config.lightTime}
                onChange={(e) => updateConfig({ lightTime: e.target.value })}
                className="w-full bg-transparent border rounded p-1 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-slate-500 flex items-center gap-1">
                <Moon size={12} /> Dark Mode
              </label>
              <input 
                type="time"
                value={config.darkTime}
                onChange={(e) => updateConfig({ darkTime: e.target.value })}
                className="w-full bg-transparent border rounded p-1 text-sm"
              />
            </div>
          </div>
          
          <div className="space-y-1">
             <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Daylight Preview</span>
             <ThemePreviewStrip lightTime={config.lightTime} darkTime={config.darkTime} />
          </div>
        </div>
      )}
    </div>
  );
};
