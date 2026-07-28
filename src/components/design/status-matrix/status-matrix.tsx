"use client";

import { useState, useId } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import { StatusCell } from "./status-cell";
import { StatusLegend } from "./status-legend";
import type { StatusMatrixConfig, CellData } from "./types";

function getOverallStatus(regionId: string, config: StatusMatrixConfig): string {
  const statuses = config.components.map((c) => config.cells[c.id]?.[regionId]?.status);
  if (statuses.some((s) => s === "outage")) return "outage";
  if (statuses.some((s) => s === "degraded")) return "degraded";
  if (statuses.some((s) => s === "unknown")) return "unknown";
  return "operational";
}

const overallDotColor: Record<string, string> = {
  operational: "bg-emerald-500",
  degraded: "bg-amber-500",
  outage: "bg-rose-500",
  unknown: "bg-slate-500",
};

export function StatusMatrix({ config }: { config: StatusMatrixConfig }) {
  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold text-slate-200">Component × Region Health</h3>
      <StatusLegend />
      <div className="hidden md:block">
        <DesktopMatrix config={config} />
      </div>
      <div className="md:hidden">
        <MobileMatrix config={config} />
      </div>
    </div>
  );
}

function DesktopMatrix({ config }: { config: StatusMatrixConfig }) {
  const tableId = useId();

  return (
    <div className="overflow-x-auto" role="region" aria-label="Component region health matrix">
      <div
        role="table"
        aria-label="System health by component and region"
        className="min-w-full"
      >
        <div role="rowgroup">
          <div role="row" className="grid" style={{ gridTemplateColumns: `160px repeat(${config.regions.length}, 1fr)` }}>
            <div role="columnheader" className="pb-3 pr-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Component
            </div>
            {config.regions.map((region) => (
              <div
                key={region.id}
                role="columnheader"
                className="pb-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-500"
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className={clsx(
                      "inline-block h-2 w-2 rounded-full",
                      overallDotColor[getOverallStatus(region.id, config)],
                    )}
                    aria-hidden="true"
                  />
                  {region.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div role="rowgroup">
          {config.components.map((component) => (
            <div
              key={component.id}
              role="row"
              className={clsx(
                "grid rounded-lg transition-colors",
                "hover:bg-white/[0.03]",
              )}
              style={{ gridTemplateColumns: `160px repeat(${config.regions.length}, 1fr)` }}
            >
              <div
                role="rowheader"
                className="flex items-center py-3 pr-3 text-sm font-medium text-slate-300"
              >
                {component.label}
              </div>
              {config.regions.map((region) => {
                const cell = config.cells[component.id]?.[region.id];
                return (
                  <div key={region.id} role="gridcell" className="flex items-center justify-center py-2">
                    {cell ? (
                      <StatusCell cell={cell} region={region} component={component} />
                    ) : (
                      <span className="text-xs text-slate-600">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileMatrix({ config }: { config: StatusMatrixConfig }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-2" role="list" aria-label="Component region health">
      {config.components.map((component) => {
        const isExpanded = expandedId === component.id;
        return (
          <div
            key={component.id}
            className={clsx(
              "rounded-xl border border-white/8 bg-white/[0.03] transition-colors",
              isExpanded && "bg-white/[0.06]",
            )}
            role="listitem"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : component.id)}
              aria-expanded={isExpanded}
              className="flex w-full items-center justify-between px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-300 rounded-xl"
            >
              <span className="text-sm font-medium text-slate-200">{component.label}</span>
              <ChevronDown
                className={clsx(
                  "h-4 w-4 text-slate-500 transition-transform",
                  isExpanded && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>
            {isExpanded && (
              <div className="border-t border-white/8 px-4 py-3 space-y-3">
                {config.regions.map((region) => {
                  const cell = config.cells[component.id]?.[region.id];
                  return (
                    <div key={region.id} className="flex items-center justify-between">
                      <span className="text-sm text-slate-400">{region.label}</span>
                      {cell ? (
                        <StatusCell cell={cell} region={region} component={component} />
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
