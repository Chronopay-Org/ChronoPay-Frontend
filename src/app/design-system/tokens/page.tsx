import Link from "next/link";
import { SemanticTokenMap } from "@/app/components/semantic-token-map";

export default function DesignSystemTokensPage() {
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
            Semantic Token Map
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Inspect how each semantic token maps to its primitive value across themes.
            Use this to pick the right level of abstraction when building components.
          </p>
        </section>

        <section className="space-y-8">
          <SemanticTokenMap />
        </section>
      </main>
    </div>
  );
}
