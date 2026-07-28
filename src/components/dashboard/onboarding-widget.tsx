import { useState, useId } from "react";
import { PanelShell } from "./panel-shell";

type Task = {
  id: string;
  label: string;
  completed: boolean;
  href: string;
};

export function OnboardingWidget() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "wallet", label: "Connect wallet", completed: true, href: "#wallet" },
    { id: "availability", label: "Add availability", completed: false, href: "#available-time-slots" },
    { id: "booking", label: "First booking", completed: false, href: "#quick-actions" },
  ]);

  const [dismissed, setDismissed] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const progress = (completedCount / totalCount) * 100;
  const isComplete = completedCount === totalCount;
  const widgetId = useId();
  const progressId = `${widgetId}-progress`;

  if (dismissed) return null;

  return (
    <PanelShell title="Setup Guide" id="onboarding-widget" eyebrow="Getting Started">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
        {/* Progress Ring */}
        <div 
          className="relative flex h-24 w-24 shrink-0 items-center justify-center" 
          role="progressbar" 
          aria-valuenow={Math.round(progress)} 
          aria-valuemin={0} 
          aria-valuemax={100} 
          aria-labelledby={progressId}
        >
          <span id={progressId} className="sr-only">
            {completedCount} of {totalCount} tasks completed
          </span>
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              className="text-white/10"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
            <circle
              className="text-cyan-400 transition-all duration-500 ease-in-out"
              strokeWidth="8"
              strokeDasharray={251.2}
              strokeDashoffset={251.2 - (251.2 * progress) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="40"
              cx="50"
              cy="50"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold text-white">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 space-y-3 w-full">
          {tasks.map((task, index) => (
            <div 
              key={task.id} 
              className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10 transition-colors hover:bg-white/10"
            >
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="peer h-5 w-5 cursor-pointer rounded border-white/20 bg-white/5 text-cyan-400 focus:ring-cyan-400 focus:ring-offset-slate-950 focus:ring-2 focus-visible:outline-none focus:outline-none transition-all"
                  checked={task.completed}
                  onChange={(e) => {
                    const newTasks = [...tasks];
                    newTasks[index].completed = e.target.checked;
                    setTasks(newTasks);
                  }}
                  aria-label={`Mark ${task.label} as complete`}
                />
                <span className={`text-sm font-medium transition-colors ${task.completed ? 'text-slate-400 line-through' : 'text-slate-200 peer-hover:text-white'}`}>
                  {task.label}
                </span>
              </label>
              <a
                href={task.href}
                className="text-xs font-semibold uppercase tracking-wider text-cyan-400 hover:text-cyan-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 rounded px-2 py-1"
                aria-label={`Jump to ${task.label}`}
              >
                Jump
              </a>
            </div>
          ))}
        </div>
      </div>

      {isComplete && (
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 rounded-full bg-white/5 hover:bg-white/10"
            >
              Dismiss Widget
            </button>
          ) : (
            <div className="flex items-center gap-3" role="alertdialog" aria-labelledby={`${widgetId}-confirm`}>
              <span id={`${widgetId}-confirm`} className="text-sm font-medium text-slate-300">Are you sure?</span>
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 rounded-full"
              >
                Cancel
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-4 py-2 text-sm font-medium text-slate-900 bg-cyan-400 hover:bg-cyan-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 rounded-full"
              >
                Confirm Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </PanelShell>
  );
}
