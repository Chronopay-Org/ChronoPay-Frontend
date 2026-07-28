import { useId, useCallback } from "react";
import clsx from "clsx";
import type { NotificationItem as NotificationItemType } from "./types";

const toneBorder: Record<string, string> = {
  info: "border-l-cyan-400/40",
  success: "border-l-emerald-400/40",
  warning: "border-l-amber-400/40",
  error: "border-l-rose-400/40",
};

const toneBg: Record<string, string> = {
  info: "bg-cyan-950/10",
  success: "bg-emerald-950/10",
  warning: "bg-amber-950/10",
  error: "bg-rose-950/10",
};

const toneSelectedBg: Record<string, string> = {
  info: "bg-cyan-950/25",
  success: "bg-emerald-950/25",
  warning: "bg-amber-950/25",
  error: "bg-rose-950/25",
};

export function NotificationItem({
  notification,
  isSelected,
  onToggle,
  index,
  onFocusIndex,
}: {
  notification: NotificationItemType;
  isSelected: boolean;
  onToggle: (id: string) => void;
  index: number;
  onFocusIndex: (index: number) => void;
}) {
  const checkboxId = useId();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        onToggle(notification.id);
      }
    },
    [notification.id, onToggle],
  );

  return (
    <li
      role="option"
      aria-selected={isSelected}
      data-index={index}
      tabIndex={0}
      onFocus={() => onFocusIndex(index)}
      onKeyDown={handleKeyDown}
      className={clsx(
        "flex items-start gap-3 rounded-xl border border-white/8 p-3 transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950",
        "cursor-pointer",
        "border-l-2",
        toneBorder[notification.tone],
        isSelected ? toneSelectedBg[notification.tone] : toneBg[notification.tone],
        isSelected && "ring-1 ring-inset ring-white/10",
      )}
      onClick={() => onToggle(notification.id)}
    >
      <label
        htmlFor={checkboxId}
        className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          id={checkboxId}
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(notification.id)}
          className="peer sr-only"
          aria-label={`Select notification: ${notification.title}`}
        />
        <span
          className={clsx(
            "inline-flex h-5 w-5 items-center justify-center rounded-md border transition-colors",
            isSelected
              ? "border-cyan-300 bg-cyan-300 text-slate-950"
              : "border-white/20 bg-white/5",
            "peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-300 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-slate-950",
          )}
          aria-hidden="true"
        >
          {isSelected ? (
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : null}
        </span>
      </label>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={clsx(
              "text-sm leading-5",
              notification.read ? "text-slate-300" : "font-semibold text-white",
            )}
          >
            {notification.title}
          </p>
          <span className="shrink-0 text-xs leading-5 text-slate-500">
            {notification.timestamp}
          </span>
        </div>
        {notification.description ? (
          <p className="mt-0.5 text-sm leading-5 text-slate-400">
            {notification.description}
          </p>
        ) : null}
      </div>
    </li>
  );
}
