import Link from "next/link";

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <div className="app-shell min-h-screen text-slate-50">
      <header className="border-b border-white/8 bg-slate-950/40 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6">
          <div>
            <Link href="/" className="text-lg font-semibold tracking-tight text-white">
              ChronoPay
            </Link>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Time economy dashboard
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-300">
            <Link href="/" className="rounded-full px-3 py-2 hover:bg-white/6 hover:text-white">
              Home
            </Link>
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-white/10 px-3 py-2 hover:border-cyan-200/30 hover:bg-white/6 hover:text-white"
            >
              Stellar
            </a>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">{children}</main>
    </div>
  );
}
