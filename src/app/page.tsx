import { ButtonLink } from "./components/ui/button-link";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <main id="main-content" className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-4xl font-bold tracking-tight">
          ChronoPay
        </h1>
        <p className="mt-2 text-xl text-zinc-400">
          Time Economy
        </p>
        <p className="mt-8 text-zinc-300 leading-relaxed">
          Tokenize your future time slots as tradable digital assets on the Stellar network.
          Buy, sell, reserve, and redeem time globally.
        </p>
        <div className="mt-12 flex gap-4">
            <ButtonLink href="/dashboard" variant="primary">
              Dashboard
            </ButtonLink>
            <ButtonLink href="https://stellar.org" variant="secondary" target="_blank" rel="noopener noreferrer">
              Stellar
            </ButtonLink>
        </div>
      </main>
    </div>
  );
}
