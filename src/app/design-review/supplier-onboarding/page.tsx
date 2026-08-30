import { SupplierOnboardingWizardShowcase } from "@/components/design/supplier-onboarding-wizard-showcase";
import Link from "next/link";

export default function SupplierOnboardingDesignReviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center font-bold text-slate-900">
              C
            </div>
            <span className="font-semibold tracking-tight">
              Design System — Supplier Onboarding Wizard
            </span>
          </div>
          <Link
            href="/design-review"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            ← Back to Review
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-16 space-y-8">
        <section className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            Supplier Onboarding Wizard
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            A multi-step wizard for supplier onboarding with a persistent side
            rail, per-step validation, and a skippable-later toggle for
            optional sections. Progress persists to sessionStorage so a
            reload resumes at the same step.
          </p>
          <ul className="text-sm text-slate-400 max-w-2xl list-inside list-disc space-y-1">
            <li>Try leaving the first step blank and clicking Next — inline validation appears.</li>
            <li>Complete the first three steps, then use the Skip toggle on Storefront branding.</li>
            <li>Reload the page — your progress and skip choice are restored.</li>
          </ul>
        </section>

        <SupplierOnboardingWizardShowcase />
      </main>
    </div>
  );
}
