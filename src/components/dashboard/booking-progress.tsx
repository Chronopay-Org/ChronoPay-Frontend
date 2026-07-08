"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle, Trash2, WifiOff } from "lucide-react";
import { LiveRegion } from "../common/LiveRegion";
import type { BookingStage } from "./types";

type DraftStatus = "saved" | "saving" | "offline";

type DraftEntry = {
  id: string;
  title: string;
  lastEdited: string;
  detail: string;
  progress: string;
};

const defaultDrafts: DraftEntry[] = [
  {
    id: "mint",
    title: "Mint time tokens",
    lastEdited: "12 min ago",
    detail: "Confirm wallet details and collateral before the next step.",
    progress: "Step 2 of 4",
  },
  {
    id: "dispute",
    title: "Dispute resolution",
    lastEdited: "41 min ago",
    detail: "Resume the submitted evidence package for the supplier case.",
    progress: "Step 1 of 3",
  },
];

const draftStatusConfig: Record<
  DraftStatus,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  saved: {
    label: "Saved",
    className: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200",
    Icon: CheckCircle2,
  },
  saving: {
    label: "Saving",
    className: "border-cyan-400/25 bg-cyan-500/10 text-cyan-100",
    Icon: LoaderCircle,
  },
  offline: {
    label: "Offline",
    className: "border-amber-400/30 bg-amber-500/10 text-amber-100",
    Icon: WifiOff,
  },
};

export function BookingProgress({
  stages,
  draftEntries = defaultDrafts,
}: {
  stages: BookingStage[];
  draftEntries?: DraftEntry[];
}) {
  const maxValue = Math.max(...stages.map((stage) => stage.value), 1);
  const [drafts, setDrafts] = useState<DraftEntry[]>(draftEntries);
  const [draftStatus, setDraftStatus] = useState<DraftStatus>("saved");
  const [announcement, setAnnouncement] = useState(
    "Drafts are saved automatically and ready to resume."
  );
  const [selectedDraftId, setSelectedDraftId] = useState(draftEntries[0]?.id ?? "");
  const [draftToDiscardId, setDraftToDiscardId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const announcementTimer = useRef<number | null>(null);
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();

  useEffect(() => {
    setDrafts(draftEntries);
    if (!selectedDraftId && draftEntries[0]) {
      setSelectedDraftId(draftEntries[0].id);
    }
  }, [draftEntries, selectedDraftId]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncDraftStatus = () => {
      setDraftStatus(window.navigator.onLine ? "saved" : "offline");
    };

    syncDraftStatus();
    const handleOnline = () => {
      setDraftStatus("saving");
      scheduleAnnouncement("Connection restored. Saving draft updates.");
      window.setTimeout(() => setDraftStatus("saved"), 800);
    };
    const handleOffline = () => {
      setDraftStatus("offline");
      scheduleAnnouncement("You are offline. Draft changes will sync when the connection returns.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!isDialogOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsDialogOpen(false);
        setDraftToDiscardId(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDialogOpen]);

  useEffect(() => {
    return () => {
      if (announcementTimer.current) {
        window.clearTimeout(announcementTimer.current);
      }
    };
  }, []);

  const scheduleAnnouncement = (message: string) => {
    if (announcementTimer.current) {
      window.clearTimeout(announcementTimer.current);
    }

    announcementTimer.current = window.setTimeout(() => {
      setAnnouncement(message);
    }, 220);
  };

  const handleResumeDraft = (draftId: string) => {
    const selectedDraft = drafts.find((draft) => draft.id === draftId);
    setSelectedDraftId(draftId);
    setDraftStatus("saving");
    scheduleAnnouncement(
      `${selectedDraft?.title ?? "Draft"} is ready to resume. Saving your recent progress.`
    );

    window.setTimeout(() => setDraftStatus("saved"), 700);
  };

  const handleDiscardDraft = () => {
    if (!draftToDiscardId) return;

    setDrafts((currentDrafts) => currentDrafts.filter((draft) => draft.id !== draftToDiscardId));
    setDraftToDiscardId(null);
    setIsDialogOpen(false);
    setSelectedDraftId((currentId) => (currentId === draftToDiscardId ? "" : currentId));
    setDraftStatus("saving");
    scheduleAnnouncement("Draft discarded. You can still resume the remaining drafts.");
    window.setTimeout(() => setDraftStatus("saved"), 700);
  };

  const selectedDraft = drafts.find((draft) => draft.id === selectedDraftId) ?? drafts[0];
  const statusDetails = draftStatusConfig[draftStatus];
  const StatusIcon = statusDetails.Icon;
  const hasDrafts = drafts.length > 0;

  return (
    <div className="space-y-5">
      <div className="rounded-[24px] border border-white/10 bg-slate-900/80 p-4 shadow-[0_20px_60px_-38px_rgba(15,23,42,0.95)] sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-white">Save and resume drafts</h3>
              <span
                className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium ${statusDetails.className}`}
                aria-label={`Draft status: ${statusDetails.label}`}
              >
                <StatusIcon className={`h-3.5 w-3.5 ${draftStatus === "saving" ? "animate-spin" : ""}`} aria-hidden="true" />
                <span>{statusDetails.label}</span>
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Keep long flows moving across minting, disputes, and onboarding without losing progress.
            </p>
          </div>
          <div className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-cyan-100">
            {selectedDraft?.title ?? "No draft selected"}
          </div>
        </div>

        <LiveRegion>{announcement}</LiveRegion>

        <div className="mt-4 space-y-3" role="list" aria-label="Drafts ready to resume">
          {hasDrafts ? (
            drafts.map((draft) => {
              const isActive = draft.id === selectedDraftId;
              return (
                <article
                  key={draft.id}
                  className={`rounded-2xl border p-4 transition-colors ${isActive ? "border-cyan-400/30 bg-cyan-500/10" : "border-white/10 bg-slate-950/70"}`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-white">{draft.title}</h4>
                        {isActive ? (
                          <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-100">
                            Active
                          </span>
                        ) : null}
                      </div>
                      <p className="text-sm text-slate-400">{draft.detail}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-500">{draft.progress}</p>
                      <p className="text-xs text-slate-500">Last edited {draft.lastEdited}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleResumeDraft(draft.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                      >
                        Resume
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDraftToDiscardId(draft.id);
                          setIsDialogOpen(true);
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Discard
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/50 p-4 text-sm text-slate-400">
              All draft entries have been cleared. Start a new flow to create a fresh draft.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {stages.map((stage, index) => {
          const labelId = `booking-label-${index}`;
          const valueId = `booking-value-${index}`;
          return (
            <div
              key={`${stage.label}-${index}`}
              role="listitem"
              aria-labelledby={labelId}
              aria-describedby={valueId}
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p id={labelId} className="text-sm font-medium text-white">
                  {stage.label}
                </p>
                <p id={valueId} className="text-sm text-slate-300" aria-atomic="true">
                  {stage.value} bookings
                </p>
              </div>
              <div className="h-2.5 rounded-full bg-white/10" aria-hidden="true">
                <div
                  className="h-2.5 rounded-full bg-[linear-gradient(90deg,#67e8f9,#22c55e)]"
                  style={{ width: `${(stage.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {isDialogOpen && draftToDiscardId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            aria-describedby={dialogDescriptionId}
            className="w-full max-w-md rounded-[28px] border border-white/10 bg-slate-900 p-6 shadow-[0_24px_90px_-30px_rgba(2,6,23,0.95)]"
          >
            <h4 id={dialogTitleId} className="text-lg font-semibold text-white">
              Discard this draft?
            </h4>
            <p id={dialogDescriptionId} className="mt-2 text-sm leading-6 text-slate-400">
              Removing this draft will clear the saved progress from the dashboard. This action cannot be undone.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsDialogOpen(false);
                  setDraftToDiscardId(null);
                }}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="rounded-full bg-rose-500/90 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-rose-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Discard draft
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
