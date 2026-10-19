export function SiteFooter() {
  return (
    <footer
      className="mt-auto border-t px-6 py-6 pb-24 text-sm sm:pb-6"
      style={{
        borderColor: "var(--border-subtle)",
        color: "var(--muted)",
      }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p>ChronoPay is a demo with sample data. No real payments are processed.</p>
        <a
          href="https://chronopay-frontend-omega.vercel.app"
          className="font-medium hover:underline"
          style={{ color: "var(--accent)" }}
        >
          Live demo
        </a>
        <a
          href="https://github.com/Chronopay-Org/ChronoPay-Frontend"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium hover:underline"
          style={{ color: "var(--accent)" }}
        >
          Source on GitHub
        </a>
      </div>
    </footer>
  );
}
