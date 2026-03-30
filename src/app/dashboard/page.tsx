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
            <Link href="/" className="hover:text-zinc-200">
              Home
            </Link>
          </div>
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-2xl font-bold">Booking Dashboard</h1>
        <p className="mt-2 text-zinc-400 max-w-2xl">
          Check wallet status, review available time slots, and confirm bookings
          with confidence.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <section
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            aria-labelledby="wallet-status"
          >
            <h2
              id="wallet-status"
              className="text-sm font-semibold text-zinc-200"
            >
              Wallet
            </h2>
            <p className="mt-3 text-sm text-zinc-300">
              Connect your wallet to continue.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              You can browse available time slots first, then connect your
              wallet when you&apos;re ready to confirm your booking.
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              You won&apos;t be charged until your booking is confirmed.
            </p>
            <button
              type="button"
              className="mt-4 rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              Connect Wallet
            </button>
          </section>

          <section
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            aria-labelledby="time-slots"
          >
            <h2 id="time-slots" className="text-sm font-semibold text-zinc-200">
              Available Time Slots
            </h2>
            <p
              className="mt-3 text-sm text-zinc-400"
              role="status"
              aria-live="polite"
            >
              Loading available time slots...
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              No time slots available right now. Try selecting a different date.
            </p>
          </section>

          <section
            className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
            aria-labelledby="booking-progress"
          >
            <h2
              id="booking-progress"
              className="text-sm font-semibold text-zinc-200"
            >
              Booking Progress
            </h2>
            <p className="mt-3 text-sm text-zinc-300">No bookings yet.</p>
            <p className="mt-2 text-xs text-zinc-500">
              Your confirmed bookings will appear here once you make one.
            </p>
            <a
              href="#"
              className="mt-4 inline-flex text-sm font-medium text-zinc-200 underline decoration-zinc-500 underline-offset-2 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              View booking details
            </a>
          </section>
        </div>
      </main>
    </div>
  );
}
