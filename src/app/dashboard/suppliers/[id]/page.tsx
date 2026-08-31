"use client";
import { useEffect, useState } from "react";
import { DashboardShell } from "../../../components/dashboard-shell";
import { PanelShell } from "@/components/dashboard/panel-shell";
import { AvailabilityStrip, type DayAvailability } from "@/components/dashboard/availability-strip";
import { ReviewsPanel } from "@/components/dashboard/reviews-panel";
import { SupplierPolicies } from "@/components/dashboard/supplier-policies";
import { ButtonLink } from "@/app/components/ui/button-link";
import { BadgeCheck, CalendarDays, MapPin, MessageSquare, ShieldCheck, Star, User, Clock } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { id: "overview", label: "Overview", icon: <User className="h-4 w-4" aria-hidden="true" /> },
  { id: "availability", label: "Availability", icon: <CalendarDays className="h-4 w-4" aria-hidden="true" /> },
  { id: "reviews", label: "Reviews", icon: <MessageSquare className="h-4 w-4" aria-hidden="true" /> },
  { id: "policies", label: "Policies", icon: <ShieldCheck className="h-4 w-4" aria-hidden="true" /> },
];

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getDays(): DayAvailability[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const status = i % 4 === 0 ? ("full" as const) : i % 3 === 0 ? ("limited" as const) : ("available" as const);
    return {
      date,
      dayName: DAY_NAMES[date.getDay()],
      dateLabel: `${MONTHS[date.getMonth()]} ${date.getDate()}`,
      slotCount: status === "full" ? 0 : status === "limited" ? 2 : 5,
      status,
    };
  });
}

export default function Page({ params }: { params: { id: string } }) {
  const [active, setActive] = useState("overview");
  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.slice(1);
      if (TABS.some((t) => t.id === h)) setActive(h);
    };
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const days = getDays();
  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cyan-400/20 text-2xl font-bold text-cyan-100 ring-1 ring-white/10" aria-hidden="true">AR</div>
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                Alex Rivera
                <BadgeCheck className="h-5 w-5 text-cyan-400" aria-label="Verified" />
              </h1>
              <p className="text-sm text-slate-400">Stellar Ecosystem Consultant</p>
              <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><MapPin className="h-4 w-4" aria-hidden="true" /> Remote · GMT-5</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200"><Star className="h-4 w-4 text-amber-400" aria-hidden="true" /> 4.6 (42)</span>
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200"><Clock className="h-4 w-4 text-emerald-400" aria-hidden="true" /> ~1h</span>
            <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-200"><ShieldCheck className="h-4 w-4 text-blue-400" aria-hidden="true" /> 98%</span>
          </div>
        </header>

        <nav className="sticky top-0 z-30 -mx-4 border-b border-white/10 bg-[#0a0a0f]/90 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8" aria-label="Supplier profile sections">
          <ul className="flex gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <li key={tab.id}>
                <a href={`#${tab.id}`} onClick={() => setActive(tab.id)} aria-current={active === tab.id ? "page" : undefined}
                   className={clsx("inline-flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors", active === tab.id ? "border-cyan-400 text-cyan-100" : "border-transparent text-slate-400 hover:text-white")}>
                  {tab.icon}{tab.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-12">
          <section id="overview" className="scroll-mt-28" aria-labelledby="overview-heading">
            <h2 id="overview-heading" className="sr-only">Overview</h2>
            <PanelShell title="About" description="Supplier bio and expertise">
              <p className="text-sm leading-relaxed text-slate-300">Specializes in Stellar smart contracts, tokenization, and DeFi integrations. Let&apos;s build the future of payments.</p>
            </PanelShell>
          </section>

          <section id="availability" className="scroll-mt-28" aria-labelledby="availability-heading">
            <h2 id="availability-heading" className="sr-only">Availability</h2>
            <AvailabilityStrip days={days} />
            <div className="mt-4 flex justify-end">
              <ButtonLink href={`/dashboard/slots?supplier=${params.id}`} variant="secondary" size="sm"><CalendarDays className="mr-2 h-4 w-4" aria-hidden="true" />View full calendar</ButtonLink>
            </div>
          </section>

          <section id="reviews" className="scroll-mt-28" aria-labelledby="reviews-heading">
            <h2 id="reviews-heading" className="sr-only">Reviews</h2>
            <ReviewsPanel />
          </section>

          <section id="policies" className="scroll-mt-28" aria-labelledby="policies-heading">
            <h2 id="policies-heading" className="sr-only">Policies</h2>
            <SupplierPolicies />
          </section>
        </div>
      </div>
    </DashboardShell>
  );
}
