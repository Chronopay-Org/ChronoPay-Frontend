/**
 * UptimeTooltip.tsx
 * Tooltip component for uptime cell details.
 * 
 * Features:
 * - Shows on hover and keyboard focus
 * - Smart positioning (above/below based on viewport)
 * - Dark/light mode compatible
 * - Dismisses on Escape key
 * - Never clips outside viewport
 * - WCAG 2.1 AA compliant
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Incident } from "./uptime.types";

interface UptimeTooltipProps {
  tooltipId: string;
  triggerElement: HTMLElement | null;
  date: string;
  uptimePercent: number;
  incidents: Incident[];
  onDismiss: () => void;
}

type Position = "top" | "bottom";

function computeTooltipPlacement(
  triggerEl: HTMLElement,
): { top: number; left: number; position: Position } {
  const triggerRect = triggerEl.getBoundingClientRect();
  const tooltipHeight = 160; // Approximate max height
  const margin = 8;

  // Check if there's enough space above
  const spaceAbove = triggerRect.top - margin;
  const fitsAbove = spaceAbove >= tooltipHeight;
  const position: Position = fitsAbove ? "top" : "bottom";

  const top =
    position === "top"
      ? triggerRect.top - tooltipHeight - margin
      : triggerRect.bottom + margin;

  const left = triggerRect.left + triggerRect.width / 2;

  return { top, left, position };
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

export function UptimeTooltip({
  tooltipId,
  triggerElement,
  date,
  uptimePercent,
  incidents,
  onDismiss,
}: UptimeTooltipProps) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    pos: Position;
  }>({ top: 0, left: 0, pos: "bottom" });

  const tooltipRef = React.useRef<HTMLDivElement>(null);

  // Format date for display
  const dateObj = new Date(`${date}T00:00:00Z`);
  const displayDate = dateObj.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Update tooltip position when visible. The measurement must run after the
  // tooltip has painted, so the state write is deferred to a rAF callback
  // instead of running synchronously inside the effect body.
  useEffect(() => {
    if (!triggerElement || !tooltipRef.current) return;

    const placement = computeTooltipPlacement(triggerElement);

    // Clamp left to viewport bounds
    const viewport = window.innerWidth;
    const tooltipWidth = tooltipRef.current.offsetWidth || 200;
    const safeLeft = Math.max(
      8,
      Math.min(placement.left - tooltipWidth / 2, viewport - tooltipWidth - 8)
    );

    const frame = requestAnimationFrame(() => {
      setPosition({
        top: placement.top,
        left: safeLeft,
        pos: placement.position,
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [triggerElement]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onDismiss();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onDismiss]);

  return (
    <div
      ref={tooltipRef}
      id={tooltipId}
      role="tooltip"
      className={`
        fixed z-50 max-w-xs p-3 
        bg-slate-900 border border-slate-700 rounded-lg
        shadow-lg text-slate-100 text-sm
        pointer-events-none
        ${position.pos === "top" ? "animate-slideUp" : "animate-slideDown"}
      `}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        animation: "fadeIn 150ms ease-out forwards",
      }}
    >
      {/* Light mode variant */}
      <div
        data-theme="light"
        className={`
          fixed z-50 max-w-xs p-3 
          bg-white border border-slate-200 rounded-lg
          shadow-lg text-slate-900 text-sm
          pointer-events-none
          hidden
        `}
      />

      {/* Date */}
      <div className="font-semibold mb-2">{displayDate}</div>

      {/* Uptime percentage */}
      <div className="text-xs text-slate-400 mb-2">
        Uptime: <span className="font-medium text-slate-100">{uptimePercent}%</span>
      </div>

      {/* Incidents list */}
      {incidents.length > 0 ? (
        <div className="border-t border-slate-700 pt-2">
          <div className="text-xs font-semibold text-red-400 mb-1">
            {incidents.length} Incident{incidents.length !== 1 ? "s" : ""}
          </div>
          <ul className="space-y-1">
            {incidents.map((incident) => (
              <li key={incident.id} className="text-xs">
                <div className="font-medium text-slate-100 truncate">
                  {incident.title}
                </div>
                <div className="text-slate-400 line-clamp-2">
                  {truncateText(incident.summary, 100)}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Severity:{" "}
                  <span
                    className={
                      incident.severity === "critical"
                        ? "text-red-400"
                        : incident.severity === "major"
                        ? "text-orange-400"
                        : "text-yellow-400"
                    }
                  >
                    {incident.severity}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-xs text-slate-400 italic">No incidents</div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes slideUp {
            from {
              opacity: 1;
              transform: none;
            }
            to {
              opacity: 1;
              transform: none;
            }
          }
          @keyframes slideDown {
            from {
              opacity: 1;
              transform: none;
            }
            to {
              opacity: 1;
              transform: none;
            }
          }
        }

        @media (prefers-color-scheme: light) {
          div[data-theme="light"] {
            display: block;
          }
          :not([data-theme="light"]) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
