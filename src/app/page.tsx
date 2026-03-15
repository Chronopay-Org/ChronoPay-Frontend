export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <main className="mx-auto max-w-3xl px-6 py-24">
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
          <a
            href="/dashboard"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors"
          >
            Dashboard
          </a>
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-zinc-600 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:border-zinc-500 hover:bg-zinc-800/50 transition-colors"
          >
            Stellar
          </a>
        </div>
      </main>
    </div>
  );
}
