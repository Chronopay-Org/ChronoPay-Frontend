import Link from "next/link";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <header className="border-b border-zinc-800 px-6 py-4">
        <nav className="flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/" className="text-lg font-semibold">
            ChronoPay
          </Link>
          <div className="flex gap-4 text-sm text-zinc-400">
            <Link href="/" className="hover:text-zinc-200">Home</Link>
          </div>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-2 text-zinc-400">
          Connect your Stellar wallet to mint and trade time tokens.
        </p>
        <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <p className="text-zinc-500 text-sm">
            Wallet integration and time slot listing will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
