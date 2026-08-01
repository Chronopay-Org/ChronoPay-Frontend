"use client";

import React, { useCallback, useId, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlotList } from "./slot-list";
import { LiveRegion } from "@/components/common/LiveRegion";
import { suppliers as defaultSuppliers } from "./dashboard-data";
import type { Slot, Supplier } from "./types";

interface SlotPickerCompareProps {
  suppliers?: Supplier[];
  slotsBySupplier?: Record<string, Slot[]>;
  onBook?: (supplierId: string) => void;
  className?: string;
}

const PARAM_A = "compareA";
const PARAM_B = "compareB";

/**
 * Side-by-side comparison of two suppliers' slot pickers, with an optional
 * synchronized-scroll mode and a "book this one" action per pane. Falls back
 * to a stacked single-column layout below the `md` breakpoint.
 */
export const SlotPickerCompare = ({
  suppliers = defaultSuppliers,
  slotsBySupplier,
  onBook,
  className = "",
}: SlotPickerCompareProps) => {
  const groupId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fallbackA = suppliers[0]?.id ?? "";
  const fallbackB = suppliers[1]?.id ?? suppliers[0]?.id ?? "";

  const supplierAId = searchParams.get(PARAM_A) ?? fallbackA;
  const supplierBId = searchParams.get(PARAM_B) ?? fallbackB;

  const [syncScroll, setSyncScroll] = useState(true);
  const [announcement, setAnnouncement] = useState("");
  const paneARef = useRef<HTMLDivElement>(null);
  const paneBRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  const setCompared = useCallback(
    (paneAId: string, paneBId: string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set(PARAM_A, paneAId);
      next.set(PARAM_B, paneBId);
      const qs = next.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const handleSelectSupplier = (pane: "a" | "b", supplierId: string) => {
    const nextA = pane === "a" ? supplierId : supplierAId;
    const nextB = pane === "b" ? supplierId : supplierBId;
    setCompared(nextA, nextB);
    const supplierName = suppliers.find((s) => s.id === supplierId)?.name ?? supplierId;
    setAnnouncement(`Pane ${pane === "a" ? "A" : "B"} now comparing ${supplierName}.`);
  };

  const handlePaneScroll = (source: "a" | "b") => (e: React.UIEvent<HTMLDivElement>) => {
    if (!syncScroll || isSyncingRef.current) return;
    const target = source === "a" ? paneBRef.current : paneARef.current;
    if (!target) return;
    const origin = e.currentTarget;
    const ratio =
      origin.scrollHeight === origin.clientHeight
        ? 0
        : origin.scrollTop / (origin.scrollHeight - origin.clientHeight);

    isSyncingRef.current = true;
    target.scrollTop = ratio * (target.scrollHeight - target.clientHeight);
    isSyncingRef.current = false;
  };

  // Ctrl/Cmd + ArrowLeft/ArrowRight jumps focus between panes, so keyboard
  // users can switch sides without tabbing through every slot row.
  const handlePaneKeyDown = (pane: "a" | "b") => (e: React.KeyboardEvent<HTMLDivElement>) => {
    const isSwitch = (e.metaKey || e.ctrlKey) && (e.key === "ArrowRight" || e.key === "ArrowLeft");
    if (!isSwitch) return;
    e.preventDefault();
    const target = pane === "a" ? paneBRef.current : paneARef.current;
    target?.focus();
  };

  const renderPane = (pane: "a" | "b") => {
    const supplierId = pane === "a" ? supplierAId : supplierBId;
    const supplier = suppliers.find((s) => s.id === supplierId);
    const paneSlots = slotsBySupplier?.[supplierId];
    const ref = pane === "a" ? paneARef : paneBRef;
    const labelId = `${groupId}-pane-${pane}-label`;

    return (
      <section
        aria-labelledby={labelId}
        className="min-w-0 rounded-[1.75rem] border border-white/10 bg-white/[0.02] p-4 sm:p-5"
      >
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              Pane {pane === "a" ? "A" : "B"}
            </span>
            <label className="block">
              <span id={labelId} className="sr-only">
                Supplier for pane {pane === "a" ? "A" : "B"}
              </span>
              <select
                value={supplierId}
                onChange={(e) => handleSelectSupplier(pane, e.target.value)}
                className="focus-ring-cyan mt-0.5 max-w-full truncate rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-lg font-semibold text-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id} className="text-slate-900">
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            {supplier?.title ? (
              <p className="truncate text-sm text-slate-300">{supplier.title}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onBook?.(supplierId)}
            className="focus-ring-cyan shrink-0 rounded-full bg-cyan-300 px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-cyan-200"
          >
            Book this one
          </button>
        </div>

        <div
          ref={ref}
          tabIndex={0}
          onScroll={handlePaneScroll(pane)}
          onKeyDown={handlePaneKeyDown(pane)}
          className="focus-ring-cyan max-h-[32rem] overflow-y-auto rounded-2xl outline-none"
          aria-label={`${supplier?.name ?? "Supplier"} slot list, use Ctrl+Arrow to switch panes`}
        >
          <SlotList
            slots={paneSlots}
            supplierId={supplierId}
            supplierName={supplier?.name}
          />
        </div>
      </section>
    );
  };

  return (
    <div className={`space-y-3 ${className}`} dir="auto">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">Compare suppliers</h2>
        <label className="focus-ring-cyan flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200">
          <input
            type="checkbox"
            checked={syncScroll}
            onChange={(e) => setSyncScroll(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-transparent accent-cyan-300"
          />
          Synced scroll
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderPane("a")}
        {renderPane("b")}
      </div>

      <LiveRegion>{announcement}</LiveRegion>
    </div>
  );
};
