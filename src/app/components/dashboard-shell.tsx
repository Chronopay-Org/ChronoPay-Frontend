type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="app-shell min-h-screen text-slate-50">
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
        {children}
      </main>
    </div>
  );
}
