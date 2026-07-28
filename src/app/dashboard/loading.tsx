import { DashboardShell } from "../components/dashboard-shell";

export default function DashboardLoading() {
  return (
    <DashboardShell>
      <div
        className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
        role="status"
        aria-busy="true"
        aria-live="polite"
        aria-label="Loading dashboard overview"
      >
        {[0, 1].map((item) => (
          <section
            key={item}
            className="glass-panel rounded-[2rem] p-6 sm:p-8"
            aria-hidden={true}
          >
            <div className="skeleton h-6 w-28 rounded-full" />
            <div className="skeleton mt-5 h-10 max-w-xl rounded-2xl" />
            <div className="skeleton mt-3 h-5 max-w-2xl rounded-full" />
            <div className="mt-8 grid gap-3">
              <div className="skeleton h-12 rounded-2xl" />
              <div className="skeleton h-12 rounded-2xl" />
              <div className="skeleton h-12 rounded-2xl" />
            </div>
          </section>
        ))}
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="skeleton glass-panel h-40 rounded-[1.5rem]"
            aria-hidden="true"
          />
        ))}
      </div>
    </DashboardShell>
  );
}
