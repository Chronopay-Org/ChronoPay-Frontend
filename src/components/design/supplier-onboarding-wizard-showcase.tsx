"use client";

import { useMemo, useState } from "react";
import {
  SupplierOnboardingWizard,
  type SupplierOnboardingStep,
} from "@/components/dashboard/supplier-onboarding-wizard";

const CATEGORY_OPTIONS = ["Photography", "Catering", "Venues", "Entertainment"];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold text-slate-300">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300";

export function SupplierOnboardingWizardShowcase() {
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState("");
  const [docsConfirmed, setDocsConfirmed] = useState(false);
  const [payoutAccount, setPayoutAccount] = useState("");
  const [tagline, setTagline] = useState("");

  const steps: SupplierOnboardingStep[] = useMemo(
    () => [
      {
        id: "business-profile",
        title: "Business profile",
        description: "Tell buyers who you are and what you offer.",
        isComplete: businessName.trim().length > 0 && category.length > 0,
        errorMessage: "Add a business name and category to continue.",
        content: (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business name">
              <input
                type="text"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="e.g. Lagos Frame Studio"
                className={inputClass}
              />
            </Field>
            <Field label="Category">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className={inputClass}
              >
                <option value="">Select a category</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ),
      },
      {
        id: "verification",
        title: "Identity verification",
        description: "Upload a government ID so buyers can trust your listings.",
        isComplete: docsConfirmed,
        errorMessage: "Confirm your uploaded documents before continuing.",
        content: (
          <div className="space-y-3">
            <div className="rounded-xl border border-dashed border-white/15 bg-white/5 px-4 py-6 text-center text-sm text-slate-400">
              Drag a document here, or{" "}
              <span className="text-cyan-300 underline underline-offset-2">browse files</span>
            </div>
            <label className="flex items-start gap-2.5 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={docsConfirmed}
                onChange={(event) => setDocsConfirmed(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-slate-900 text-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              />
              I confirm the uploaded documents are accurate and current.
            </label>
          </div>
        ),
      },
      {
        id: "payout-details",
        title: "Payout details",
        description: "Where should we send your earnings?",
        isComplete: payoutAccount.trim().length > 0,
        errorMessage: "Add a payout account to continue.",
        content: (
          <Field label="Wallet address or bank account">
            <input
              type="text"
              value={payoutAccount}
              onChange={(event) => setPayoutAccount(event.target.value)}
              placeholder="GBS43E6X4Q3K7Z5N2F6T8H9J0K1L2M3N4P5Q6R7S8T9U0V1W2X3Y4Z5"
              className={`${inputClass} font-mono`}
            />
          </Field>
        ),
      },
      {
        id: "storefront-branding",
        title: "Storefront branding",
        description: "Add a tagline to personalize your public profile.",
        optional: true,
        isComplete: tagline.trim().length > 0,
        content: (
          <Field label="Tagline">
            <input
              type="text"
              value={tagline}
              onChange={(event) => setTagline(event.target.value)}
              placeholder="e.g. Timeless photography for modern moments"
              className={inputClass}
            />
          </Field>
        ),
      },
      {
        id: "review",
        title: "Review & submit",
        description: "Confirm your details before submitting your application.",
        isComplete: true,
        content: (
          <dl className="grid gap-3 rounded-xl border border-white/10 bg-white/5 p-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Business name</dt>
              <dd className="text-slate-200">{businessName || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Category</dt>
              <dd className="text-slate-200">{category || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Payout account</dt>
              <dd className="truncate font-mono text-slate-200">{payoutAccount || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Tagline</dt>
              <dd className="text-slate-200">{tagline || "Skipped for now"}</dd>
            </div>
          </dl>
        ),
      },
    ],
    [businessName, category, docsConfirmed, payoutAccount, tagline],
  );

  return (
    <SupplierOnboardingWizard
      steps={steps}
      storageKey="design-review-supplier-onboarding"
      heading="Supplier onboarding"
      onComplete={() => {
        // Design showcase only — a real integration would submit the application here.
      }}
    />
  );
}
