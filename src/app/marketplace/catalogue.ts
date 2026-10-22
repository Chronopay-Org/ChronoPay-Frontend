/**
 * Shared marketplace fixture used by the listing grid (`/marketplace`) and the
 * listing detail route (`/marketplace/[id]`).
 */

export type MarketplaceListing = {
  id: string;
  title: string;
  price: string;
  image: string;
  href: string;
};

// Demo marketplace items — the original 4 are kept for the RecentlyViewed
// seeding so developers can see the rail populate on first visit. A larger
// catalogue is generated for the grid to make the per-page selector
// (12 / 24 / 48) visually meaningful.
export const seedItems: MarketplaceListing[] = [
  {
    id: "demo-1",
    title: "1 Hour Technical Consultation",
    price: "50 XLM",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop",
    href: "/marketplace/demo-1",
  },
  {
    id: "demo-2",
    title: "30 Minute Design Review",
    price: "25 XLM",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop",
    href: "/marketplace/demo-2",
  },
  {
    id: "demo-3",
    title: "2 Hour Strategy Session",
    price: "100 XLM",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
    href: "/marketplace/demo-3",
  },
  {
    id: "demo-4",
    title: "15 Minute Quick Call",
    price: "15 XLM",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop",
    href: "/marketplace/demo-4",
  },
];

const SERVICE_TITLES = [
  "Quick Brand Identity Audit",
  "Async Code Review",
  "Architecture Diagram Cleanup",
  "30 Minute UX Critique",
  "Hourly Rate Negotiation",
  "Stellar Wallet Setup Walkthrough",
  "Resume Polish",
  "Speed-reading Workshop",
  "Discord Community AMA",
  "1:1 Founder Office Hours",
  "Pitch Deck Storytelling",
  "Smart-Contract Audit (Sample)",
  "Pricing Strategy Consultation",
  "Quarterly Planning Helper",
  "Lead-Magnet Feedback",
  "Landing Page Conversion Review",
  "Async Translation Pass",
  "AI Prompt Iteration Session",
  "Personal Finance Tune-up",
  "Demo Day Prep Coaching",
];
const PRICE_BAND = ["10 XLM", "20 XLM", "25 XLM", "35 XLM", "50 XLM", "75 XLM", "100 XLM"];

// Larger simulated catalogue — 50 items so the 12 / 24 / 48 options all
// produce visibly different pages.
export function buildCatalogue(): MarketplaceListing[] {
  const out = [...seedItems];
  for (let i = 0; i < 46; i++) {
    out.push({
      id: `svc-${i + 1}`,
      title: SERVICE_TITLES[i % SERVICE_TITLES.length],
      price: PRICE_BAND[i % PRICE_BAND.length],
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop",
      href: `/marketplace/svc-${i + 1}`,
    });
  }
  return out;
}

/** Resolve a single listing by id, or `undefined` when it does not exist. */
export function getListingById(id: string): MarketplaceListing | undefined {
  return buildCatalogue().find((item) => item.id === id);
}
