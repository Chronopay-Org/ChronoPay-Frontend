import DesignChecklist from "@/components/design/DesignChecklist";
import Link from "next/link";

export default function DesignReviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center font-bold text-slate-900">
              C
            </div>
            <span className="font-semibold tracking-tight">Design System</span>
          </div>
          <Link
            href="/"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-16 space-y-12">
        <section className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Design Review Guide
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Every feature in ChronoPay must meet our high bar for accessibility,
            responsiveness, and operational reliability. Use this guide to audit
            your work before submitting a PR.
          </p>
        </section>

        <section className="space-y-8">
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                Live Checklist
              </h2>
              <DesignChecklist />
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-slate-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                Operationalizing Quality
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-400">
                <div className="p-5 rounded-xl border border-white/5 bg-white/5 space-y-2">
                  <h3 className="font-medium text-slate-200">PR Template</h3>
                  <p>
                    All contributors should use the standard PR template which
                    includes a subset of this checklist for rapid verification.
                  </p>
                </div>
                <div className="p-5 rounded-xl border border-white/5 bg-white/5 space-y-2">
                  <h3 className="font-medium text-slate-200">Accessibility First</h3>
                  <p>
                    We aim for WCAG 2.1 AA. If you&apos;re unsure about ARIA roles or
                    keyboard patterns, reference the README or ask for a review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
