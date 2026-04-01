export function PanelShell({
  title,
  eyebrow,
  description,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-slate-950/70 p-5 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.95)] backdrop-blur xl:p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
              {eyebrow}
            </p>
          ) : null}
          <div>
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            {description ? (
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-300">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
      <div className="pt-5">{children}</div>
    </section>
  );
}
