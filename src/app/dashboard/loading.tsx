import { DashboardShell } from "../components/dashboard-shell";

export default function DashboardLoading() {
  return (
    <DashboardShell>
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]" aria-busy="true" aria-live="polite">
        {[0, 1].map((item) => (
          <section key={item} className="glass-panel rounded-[2rem] p-6 sm:p-8">
            <div className="h-6 w-28 rounded-full bg-white/8" />
            <div className="mt-5 h-10 max-w-xl rounded-2xl bg-white/10" />
            <div className="mt-3 h-5 max-w-2xl rounded-full bg-white/6" />
            <div className="mt-8 grid gap-3">
              <div className="h-12 rounded-2xl bg-white/6" />
              <div className="h-12 rounded-2xl bg-white/6" />
              <div className="h-12 rounded-2xl bg-white/6" />
            </div>
          </section>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="glass-panel h-40 rounded-[1.5rem] bg-white/4" />
        ))}
      </div>
    </DashboardShell>
  );
}
