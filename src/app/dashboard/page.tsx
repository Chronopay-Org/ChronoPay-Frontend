import Link from "next/link";
import DesignChecklist from "@/components/design/DesignChecklist";

export default function Dashboard() {
  // Simulated states (for QA requirement)
  const loading = false;
  const error = false;
  const hasData = true;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        Something went wrong.
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="min-h-screen flex items-center justify-center text-zinc-400">
        No data available.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <nav className="flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/" className="text-lg font-semibold">
            ChronoPay
          </Link>
          <div className="flex gap-4 text-sm text-zinc-400">
            <Link href="/" className="hover:text-zinc-200">
              Home
            </Link>
          </div>
        </nav>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-16 space-y-10">
        
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-2 text-zinc-400">
            Connect your Stellar wallet to mint and trade time tokens.
          </p>
        </div>

        {/* Wallet Card */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold mb-2">Wallet Status</h2>
          <p className="text-sm text-zinc-400">
            Not connected
          </p>
          <button className="mt-4 px-4 py-2 text-sm rounded-lg bg-white text-black hover:bg-zinc-200 transition">
            Connect Wallet
          </button>
        </div>

        {/* Time Slots Section */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Available Time Slots</h2>
          <p className="text-sm text-zinc-500">
            No time slots listed yet.
          </p>
        </div>

        {/* Design QA Checklist (IMPORTANT FOR ISSUE) */}
        <DesignChecklist />

      </main>
    </div>
  );
}