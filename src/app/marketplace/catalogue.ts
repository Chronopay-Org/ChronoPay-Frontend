/**
 * Shared marketplace fixture used by the listing grid (`/marketplace`) and the
 * listing detail route (`/marketplace/[id]`).
 */

export type MarketplaceCategory =
  | "engineering"
  | "design"
  | "strategy"
  | "coaching";

export type MarketplaceDuration = "15m" | "30m" | "60m" | "120m";

export type MarketplacePriceTier = "under-25" | "25-50" | "over-50";

export const MARKETPLACE_CATEGORIES: ReadonlyArray<{
  id: MarketplaceCategory;
  label: string;
}> = [
  { id: "engineering", label: "Engineering" },
  { id: "design", label: "Design" },
  { id: "strategy", label: "Strategy" },
  { id: "coaching", label: "Coaching" },
];

export const MARKETPLACE_DURATIONS: ReadonlyArray<{
  id: MarketplaceDuration;
  label: string;
}> = [
  { id: "15m", label: "15 minutes" },
  { id: "30m", label: "30 minutes" },
  { id: "60m", label: "1 hour" },
  { id: "120m", label: "2 hours" },
];

export const MARKETPLACE_PRICE_TIERS: ReadonlyArray<{
  id: MarketplacePriceTier;
  label: string;
}> = [
  { id: "under-25", label: "Under 25 XLM" },
  { id: "25-50", label: "25–50 XLM" },
  { id: "over-50", label: "Over 50 XLM" },
];

export function getPriceTier(priceAmount: number): MarketplacePriceTier {
  if (priceAmount < 25) return "under-25";
  if (priceAmount <= 50) return "25-50";
  return "over-50";
}

export type MarketplaceListing = {
  id: string;
  title: string;
  price: string;
  priceAmount: number;
  category: MarketplaceCategory;
  duration: MarketplaceDuration;
  createdAt: string;
  availableAt: string;
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
    priceAmount: 50,
    category: "engineering",
    duration: "60m",
    createdAt: "2026-04-04T12:00:00Z",
    availableAt: "2026-04-05T10:00:00Z",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop",
    href: "/marketplace/demo-1",
  },
  {
    id: "demo-2",
    title: "30 Minute Design Review",
    price: "25 XLM",
    priceAmount: 25,
    category: "design",
    duration: "30m",
    createdAt: "2026-04-03T12:00:00Z",
    availableAt: "2026-04-05T09:00:00Z",
    image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop",
    href: "/marketplace/demo-2",
  },
  {
    id: "demo-3",
    title: "2 Hour Strategy Session",
    price: "100 XLM",
    priceAmount: 100,
    category: "strategy",
    duration: "120m",
    createdAt: "2026-04-02T12:00:00Z",
    availableAt: "2026-04-06T14:00:00Z",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop",
    href: "/marketplace/demo-3",
  },
  {
    id: "demo-4",
    title: "15 Minute Quick Call",
    price: "15 XLM",
    priceAmount: 15,
    category: "coaching",
    duration: "15m",
    createdAt: "2026-04-01T12:00:00Z",
    availableAt: "2026-04-05T08:00:00Z",
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
export const PRICE_BAND = ["10 XLM", "20 XLM", "25 XLM", "35 XLM", "50 XLM", "75 XLM", "100 XLM"];
const CATEGORY_BAND: MarketplaceCategory[] = [
  "design",
  "engineering",
  "engineering",
  "design",
  "strategy",
  "engineering",
  "coaching",
  "coaching",
  "strategy",
  "coaching",
  "strategy",
  "engineering",
  "strategy",
  "strategy",
  "design",
  "design",
  "coaching",
  "engineering",
  "coaching",
  "coaching",
];
const DURATION_BAND: MarketplaceDuration[] = ["15m", "30m", "60m", "120m"];

// Larger simulated catalogue — 50 items so the 12 / 24 / 48 options all
// produce visibly different pages.
function buildGeneratedItems(): MarketplaceListing[] {
  const out: MarketplaceListing[] = [];
  const baseCreated = Date.parse("2026-03-31T12:00:00Z");
  const baseAvailable = Date.parse("2026-04-05T12:00:00Z");

  for (let i = 0; i < 46; i++) {
    const price = PRICE_BAND[i % PRICE_BAND.length];
    const priceAmount = Number.parseInt(price.replace(/[^0-9]/g, ""), 10);
    out.push({
      id: `svc-${i + 1}`,
      title: SERVICE_TITLES[i % SERVICE_TITLES.length],
      price,
      priceAmount,
      category: CATEGORY_BAND[i % CATEGORY_BAND.length],
      duration: DURATION_BAND[i % DURATION_BAND.length],
      createdAt: new Date(baseCreated - i * 3_600_000).toISOString(),
      availableAt: new Date(baseAvailable + ((i * 7) % 48) * 3_600_000).toISOString(),
      image: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=300&fit=crop",
      href: `/marketplace/svc-${i + 1}`,
    });
  }
  return out;
}

const CATALOGUE: MarketplaceListing[] = [...seedItems, ...buildGeneratedItems()];

const CATALOGUE_BY_ID = new Map<string, MarketplaceListing>(
  CATALOGUE.map((item) => [item.id, item]),
);

export function buildCatalogue(): MarketplaceListing[] {
  return CATALOGUE;
}

/** Resolve a single listing by id, or `undefined` when it does not exist. */
export function getListingById(id: string): MarketplaceListing | undefined {
  return CATALOGUE_BY_ID.get(id);
}
