export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 px-6 py-6 pb-24 text-sm text-slate-400 sm:pb-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p>ChronoPay is a demo with sample data. No real payments are processed.</p>
        <a
          href="https://chronopay-frontend-omega.vercel.app"
          className="font-medium text-cyan-400 hover:text-cyan-300"
        >
          Live demo
        </a>
        <a
          href="https://github.com/Chronopay-Org/ChronoPay-Frontend"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-cyan-400 hover:text-cyan-300"
        >
          Source on GitHub
        </a>
      </div>
    </footer>
  );
}
