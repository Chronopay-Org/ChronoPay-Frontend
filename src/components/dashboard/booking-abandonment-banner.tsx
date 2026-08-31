import { useEffect, useRef } from "react";
import { CheckCircle2, RotateCcw, Trash2, Eye } from "lucide-react";

interface BookingAbandonmentBannerProps {
  onResume: () => void;
  onDiscard: () => void;
  onViewDetails: () => void;
}

export function BookingAbandonmentBanner({
  onResume,
  onDiscard,
  onViewDetails,
}: BookingAbandonmentBannerProps) {
  const resumeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Focus the primary action on load for accessibility
    if (resumeBtnRef.current) {
      resumeBtnRef.current.focus();
    }
  }, []);

  return (
    <section
      className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 p-4 mb-6 shadow-sm backdrop-blur-md animate-in fade-in zoom-in duration-300"
      role="region"
      aria-labelledby="abandonment-banner-title"
    >
      {/* Polite live region for screen readers */}
      <div className="sr-only" aria-live="polite">
        You have an incomplete booking draft. You can resume, discard, or view details.
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-300">
          <RotateCcw className="h-5 w-5" />
        </div>
        <div>
          <h2 id="abandonment-banner-title" className="text-sm font-bold text-indigo-100">
            Incomplete Booking Draft
          </h2>
          <p className="text-xs text-indigo-300/80 mt-0.5">
            You started booking a slot but didn&apos;t finish. Drafts expire in 24 hours.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
        <button
          type="button"
          onClick={onDiscard}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300 border border-white/10 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition-colors"
          aria-label="Discard booking draft"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Discard
        </button>
        <button
          type="button"
          onClick={onViewDetails}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300 border border-white/10 hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition-colors"
          aria-label="View draft details"
        >
          <Eye className="h-3.5 w-3.5" />
          Details
        </button>
        <button
          ref={resumeBtnRef}
          type="button"
          onClick={onResume}
          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-4 py-1.5 text-xs font-bold text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/30 hover:text-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 transition-colors"
          aria-label="Resume booking"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Resume
        </button>
      </div>
    </section>
  );
}
