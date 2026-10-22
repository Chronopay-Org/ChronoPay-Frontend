import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getListingById } from "../catalogue";

type ListingDetailPageProps = {
  params: Promise<{ id: string }>;
};

/** Demo listings map onto the sample slots so "Book" opens a real checkout. */
function getCheckoutHref(listingId: string): string {
  const match = /^demo-(\d+)$/.exec(listingId);
  return match ? `/dashboard/slots/slot-${match[1]}` : "/dashboard";
}

export default async function ListingDetailPage({ params }: ListingDetailPageProps) {
  const { id } = await params;
  const listing = getListingById(id);
  if (!listing) notFound();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <main id="main-content" className="mx-auto max-w-3xl px-5 py-8 sm:px-6 md:py-12">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:border-cyan-300/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <ArrowLeft className="icon-directional h-4 w-4" aria-hidden="true" />
          Back to Marketplace
        </Link>

        <article className="card mt-6 overflow-hidden" aria-labelledby="listing-title">
          <div className="aspect-video w-full overflow-hidden bg-zinc-800" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={listing.image} alt="" className="h-full w-full object-cover" />
          </div>
          <div className="space-y-4 p-6">
            <h1 id="listing-title" className="text-2xl font-semibold text-white">
              {listing.title}
            </h1>
            <p className="text-lg text-zinc-300">{listing.price}</p>
            <Link
              href={getCheckoutHref(listing.id)}
              className="inline-flex items-center justify-center rounded-full bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              Book
            </Link>
          </div>
        </article>
      </main>
    </div>
  );
}
