"use client";

import { useState, useId } from "react";
import { FileText, Eye, Loader2, Check, AlertCircle } from "lucide-react";
import { useReceiptNotes, type SaveStatus } from "@/hooks/use-receipt-notes";
import { renderMarkdown } from "@/lib/markdown";

type NotesEditorProps = {
  receiptId: string;
};

const STATUS_CONFIG: Record<SaveStatus, { icon: React.ReactNode; label: string; className: string }> = {
  saved: { icon: <Check className="h-3 w-3" aria-hidden="true" />, label: "Saved", className: "text-emerald-400" },
  saving: { icon: <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />, label: "Saving…", className: "text-cyan-400" },
  unsaved: { icon: <AlertCircle className="h-3 w-3" aria-hidden="true" />, label: "Unsaved changes", className: "text-amber-400" },
  error: { icon: <AlertCircle className="h-3 w-3" aria-hidden="true" />, label: "Save failed", className: "text-rose-400" },
};

export function NotesEditor({ receiptId }: NotesEditorProps) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const { text, setText, saveStatus, forceSave } = useReceiptNotes(receiptId);
  const editorId = useId();
  const previewId = useId();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "s") {
      e.preventDefault();
      forceSave();
    }
  };

  return (
    <section
      aria-labelledby={`${editorId}-heading`}
      className="border-t border-white/10 pt-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id={`${editorId}-heading`} className="text-xs font-bold uppercase tracking-wider text-slate-400">
          <FileText className="mr-1.5 inline h-3.5 w-3.5 align-text-top" aria-hidden="true" />
          Notes
        </h3>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${STATUS_CONFIG[saveStatus].className}`}>
            {STATUS_CONFIG[saveStatus].icon}
            {STATUS_CONFIG[saveStatus].label}
          </span>
          <div className="flex rounded-lg border border-white/10 p-0.5" role="tablist" aria-label="Notes view mode">
            <button
              role="tab"
              aria-selected={mode === "edit"}
              aria-controls={`${editorId}-editor`}
              onClick={() => setMode("edit")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "edit" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Edit
            </button>
            <button
              role="tab"
              aria-selected={mode === "preview"}
              aria-controls={`${editorId}-preview`}
              onClick={() => setMode("preview")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === "preview" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <Eye className="mr-1 inline h-3 w-3" aria-hidden="true" />
              Preview
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3">
        {mode === "edit" ? (
          <textarea
            id={`${editorId}-editor`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add private notes in markdown…"
            rows={4}
            className="min-h-[100px] w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 font-mono text-sm text-slate-200 placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none focus:ring-1 focus:ring-cyan-400/20"
            aria-describedby={`${editorId}-hint`}
          />
        ) : (
          <div
            id={`${editorId}-preview`}
            role="tabpanel"
            className="notes-preview min-h-[100px] rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-200"
          >
            {text.trim() ? (
              <div dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }} />
            ) : (
              <p className="text-slate-500 italic">No notes yet.</p>
            )}
          </div>
        )}
      </div>

      <p id={`${editorId}-hint`} className="mt-1.5 text-[11px] text-slate-500">
        Supports **bold**, *italic*, `code`, ~~strikethrough~~, [links](url), lists, and headers. Private to you.
      </p>
    </section>
  );
}
