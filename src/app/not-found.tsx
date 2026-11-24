import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center"
    >
      <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">
        404
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-100">
        Page not found
      </h1>
      <p className="mt-4 text-zinc-400">
        The page you are looking for does not exist or has moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-200"
        >
          Back to home
        </Link>
        <Link
          href="/marketplace"
          className="rounded-full border border-white/15 px-5 py-2 text-sm font-medium text-zinc-200 hover:border-white/30"
        >
          Browse marketplace
        </Link>
      </div>
    </main>
  );
}
