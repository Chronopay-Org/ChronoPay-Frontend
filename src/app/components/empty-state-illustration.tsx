type EmptyStateIllustrationProps = {
  accentLabel: string;
};

export function EmptyStateIllustration({
  accentLabel,
}: EmptyStateIllustrationProps) {
  return (
    <div
      aria-hidden="true"
      className="relative h-36 w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(110,231,249,0.18),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(6,12,23,0.98))]"
    >
      <div className="absolute left-5 top-5 rounded-full border border-cyan-200/20 bg-cyan-300/12 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-cyan-100">
        {accentLabel}
      </div>
      <div className="absolute inset-x-6 bottom-6 top-14 rounded-[1.5rem] border border-white/10 bg-white/4 p-4">
        <div className="grid h-full grid-cols-[1.35fr,0.8fr] gap-3">
          <div className="rounded-[1.25rem] border border-dashed border-cyan-200/20 bg-slate-950/40 p-3">
            <div className="flex h-full flex-col justify-between rounded-[1rem] border border-white/6 bg-white/4 p-3">
              <div className="h-2.5 w-20 rounded-full bg-cyan-200/25" />
              <div className="space-y-2">
                <div className="h-2 rounded-full bg-white/10" />
                <div className="h-2 w-4/5 rounded-full bg-white/8" />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="rounded-[1.1rem] border border-amber-200/15 bg-amber-300/8 p-3">
              <div className="h-10 rounded-full border border-dashed border-amber-200/20" />
            </div>
            <div className="flex-1 rounded-[1.1rem] border border-white/8 bg-slate-900/70 p-3">
              <div className="space-y-2">
                <div className="h-2 w-14 rounded-full bg-white/12" />
                <div className="h-2 rounded-full bg-cyan-200/18" />
                <div className="h-2 w-3/4 rounded-full bg-white/8" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
