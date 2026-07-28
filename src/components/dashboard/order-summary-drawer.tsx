"use client";

import { useEffect, useId, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { ChevronUp, X } from "lucide-react";
import { FocusTrap } from "../common/FocusTrap";

type OrderSummaryDrawerProps = {
  title: string;
  description?: string;
  triggerLabel?: string;
  children: ReactNode;
  className?: string;
  panelClassName?: string;
};

const TABLET_QUERY = "(min-width: 768px) and (max-width: 1279px)";

export function OrderSummaryDrawer({
  title,
  description,
  triggerLabel = "Review costs and wallet",
  children,
  className = "",
  panelClassName = "",
}: OrderSummaryDrawerProps) {
  const [isTabletLayout, setIsTabletLayout] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(TABLET_QUERY);
    const handleChange = () => {
      setIsTabletLayout(mediaQuery.matches);
      if (!mediaQuery.matches) {
        setIsOpen(false);
        setDragOffset(0);
      }
    };

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  const closeDrawer = () => {
    setIsOpen(false);
    setDragOffset(0);
    triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const openDrawer = () => {
    setIsOpen(true);
    setDragOffset(0);
  };

  const handlePointerDown = (event: ReactPointerEvent) => {
    dragStartY.current = event.clientY;
  };

  const handlePointerMove = (event: ReactPointerEvent) => {
    if (dragStartY.current === null) {
      return;
    }

    const delta = event.clientY - dragStartY.current;
    if (delta > 0) {
      setDragOffset(delta);
    }
  };

  const handlePointerUp = () => {
    if (dragOffset > 80) {
      closeDrawer();
      return;
    }

    setDragOffset(0);
    dragStartY.current = null;
  };

  if (!isTabletLayout) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Review order"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={openDrawer}
        className="mb-4 flex w-full items-center justify-between rounded-full border border-cyan-400/20 bg-slate-900/80 px-4 py-3 text-left shadow-[0_16px_40px_rgba(2,6,23,0.4)] backdrop-blur transition-colors hover:border-cyan-300/40 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-cyan-300">
            Order summary
          </p>
          <p className="text-sm font-semibold text-white">{triggerLabel}</p>
        </div>
        <div className="flex items-center gap-2 text-cyan-300">
          <span className="text-xs font-medium">Review</span>
          <ChevronUp className="h-4 w-4" />
        </div>
      </button>

      {isOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
            onClick={closeDrawer}
            role="presentation"
          />
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${panelId}-title`}
            aria-describedby={`${panelId}-description`}
            tabIndex={-1}
            className={`fixed inset-x-0 bottom-0 z-50 rounded-t-[2rem] border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-cyan-950/30 transition-transform duration-300 ${panelClassName}`}
            style={{ transform: `translateY(${dragOffset}px)` }}
          >
            <FocusTrap>
              <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-white/20" />
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p id={`${panelId}-title`} className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-300">
                    Order summary
                  </p>
                  <h2 className="text-lg font-semibold text-white">{title}</h2>
                  {description ? (
                    <p
                      id={`${panelId}-description`}
                      className="mt-1 text-sm leading-6 text-slate-300"
                    >
                      {description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  aria-label="Close order summary"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div
                className="mt-5 max-h-[70vh] overflow-y-auto pb-6 pr-1"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                style={{ touchAction: "none" }}
              >
                {children}
              </div>
            </FocusTrap>
          </div>
        </>
      ) : null}
    </div>
  );
}
