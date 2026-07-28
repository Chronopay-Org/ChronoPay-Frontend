"use client";

import { useEffect } from "react";
import { RecentlyViewedRail, useRecentlyViewed } from "./components/recently-viewed-rail";
import { PanelShell } from "@/components/dashboard/panel-shell";

// Demo marketplace items
const demoItems = [
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

export default function Marketplace() {
  const { addItem } = useRecentlyViewed();

  // Populate demo data on first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem("chronopay-marketplace-visited");
    if (!hasVisited) {
      demoItems.forEach((item, index) => {
        setTimeout(() => {
          addItem(item);
        }, index * 100);
      });
      localStorage.setItem("chronopay-marketplace-visited", "true");
    }
  }, [addItem]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      <main id="main-content" className="mx-auto max-w-6xl px-5 py-8 sm:px-6 md:py-12">
        {/* Recently Viewed Rail */}
        <RecentlyViewedRail />

        {/* Marketplace Content */}
        <div className="mt-8">
          <PanelShell
            title="Marketplace"
            description="Browse and book time slots from suppliers worldwide"
          >
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {demoItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => addItem(item)}
                  className="card card--interactive group"
                >
                  {item.image && (
                    <div
                      className="aspect-video w-full bg-zinc-800 rounded-t-lg overflow-hidden"
                      aria-hidden="true"
                    >
                      <img
                        src={item.image}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-base font-medium text-white line-clamp-2">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-zinc-400">{item.price}</p>
                  </div>
                </a>
              ))}
            </div>
          </PanelShell>
        </div>
      </main>
    </div>
  );
}
