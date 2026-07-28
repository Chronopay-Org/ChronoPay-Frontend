import { PayoutStep } from "@/components/dashboard/payout-step";
import type { PayoutCurrency, PayoutConsent } from "@/components/dashboard/payout-step";

function DemoShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <header className="border-b border-white/5 bg-slate-900/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-lg font-semibold text-white">ChronoPay</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Supplier onboarding demo — Payout step
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
    </div>
  );
}

const demoPreview = {
  walletAddress: "GBS43E6X4Q3K7Z5N2F6T8H9J0K1L2M3N4P5Q6R7S8T9U0V1W2X3Y4Z5A6B7",
  walletLabel: "Freighter Wallet",
  network: "Stellar",
};

export default function PayoutOnboardingPage() {
  const handleSave = async (currency: PayoutCurrency, consent: PayoutConsent) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Saved payout settings", { currency, consent });
  };

  return (
    <DemoShell>
      <div className="mx-auto max-w-4xl space-y-6 p-5 sm:p-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-200/70">
            Supplier onboarding
          </p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Payout account
          </h1>
          <p className="text-sm text-slate-300">
            Configure how and where you receive payouts. Choose your preferred
            currency, review the destination, and confirm consent.
          </p>
        </header>

        <PayoutStep
          preview={demoPreview}
          onSave={handleSave}
          draftStatus="saved"
          lastSavedLabel="a few seconds ago"
        />
      </div>
    </DemoShell>
  );
}
