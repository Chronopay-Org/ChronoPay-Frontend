import Link from "next/link";
import { MiniCalendarNavigator } from "@/components/dashboard/mini-calendar-navigator";
import { CalendarViewToggle } from "@/components/dashboard/calendar-view-toggle";
import { CalendarAgendaView } from "@/components/dashboard/calendar-agenda-view";
import { AvailabilityLegend } from "@/components/dashboard/availability-legend";
import { ReviewComposer } from "@/components/dashboard/review-composer";
import { useState } from "react";

export default function DesignSystemComponentsPage() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<"month" | "week" | "day" | "agenda">("month");

  // Sample data for demo purposes
  const sampleAvailabilityData = new Map(
    Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      return [dateStr, Math.floor(Math.random() * 10)];
    })
  );

  const sampleDays = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const slotCount = Math.floor(Math.random() * 10);
    let status: "available" | "limited" | "full" | "none" = "available";
    if (slotCount === 0) status = "none";
    else if (slotCount <= 3) status = "limited";
    else if (slotCount <= 6) status = "full";
    return {
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      slotCount,
      status,
    };
  });

  const reviewCriteria = [
    { id: "responsiveness", label: "Responsiveness", description: "How quickly did they respond?" },
    { id: "quality", label: "Quality of Work", description: "Was the work high quality?" },
    { id: "communication", label: "Communication", description: "Was communication clear?" },
    { id: "value", label: "Value for Money", description: "Was it worth the cost?" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-500 shadow-lg shadow-cyan-500/20 flex items-center justify-center font-bold text-slate-900">
              C
            </div>
            <span className="font-semibold tracking-tight">Design System</span>
          </div>
          <Link
            href="/"
            className="text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            ← Back to App
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-16 space-y-16">
        <section className="space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-white">
            UI Components
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl leading-relaxed">
            Accessible, responsive components following WCAG 2.1 AA guidelines with color-blind-safe design patterns.
          </p>
        </section>

        {/* Mini Calendar Navigator */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Mini Calendar Navigator</h2>
            <p className="text-slate-400">
              Compact month navigator for quick date jumping with availability density indicators.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium">Accessible</span>
              <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">Responsive</span>
              <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium">WCAG 2.1 AA</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
            <MiniCalendarNavigator
              currentDate={calendarDate}
              onDateSelect={setCalendarDate}
              availabilityData={sampleAvailabilityData}
            />
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <h3 className="text-lg font-semibold text-white">Features</h3>
            <ul className="space-y-1 text-slate-400">
              <li>• Month navigation with keyboard support</li>
              <li>• Selected day highlighting</li>
              <li>• Availability density indicators (low/medium/high)</li>
              <li>• Today indicator</li>
              <li>• Full ARIA labels for screen readers</li>
            </ul>
          </div>
        </section>

        {/* Calendar View Toggle */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Calendar View Toggle</h2>
            <p className="text-slate-400">
              Switch between month, week, day, and agenda views with accessible tab navigation.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium">Accessible</span>
              <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">Keyboard Nav</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
            <CalendarViewToggle
              currentMode={calendarView}
              onModeChange={setCalendarView}
            />
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <h3 className="text-lg font-semibold text-white">Features</h3>
            <ul className="space-y-1 text-slate-400">
              <li>• Four view modes: Month, Week, Day, Agenda</li>
              <li>• Keyboard navigation (arrow keys)</li>
              <li>• Screen reader friendly with ARIA roles</li>
              <li>• Responsive icon-only mode on mobile</li>
              <li>• Visual feedback for active state</li>
            </ul>
          </div>
        </section>

        {/* Calendar Agenda View */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Calendar Agenda View</h2>
            <p className="text-slate-400">
              Chronological list view grouped by month, optimized for screen readers and mobile.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium">Screen Reader</span>
              <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">Mobile First</span>
              <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium">WCAG 2.1 AA</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
            <CalendarAgendaView
              days={sampleDays}
              onBook={(date) => console.log('Book:', date)}
            />
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <h3 className="text-lg font-semibold text-white">Features</h3>
            <ul className="space-y-1 text-slate-400">
              <li>• Grouped by month for easy scanning</li>
              <li>• Linear list layout for screen readers</li>
              <li>• Status chips with color coding</li>
              <li>• Slot count display</li>
              <li>• Book action buttons</li>
            </ul>
          </div>
        </section>

        {/* Availability Legend */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Availability Legend</h2>
            <p className="text-slate-400">
              Color-blind-safe legend with dual encoding (color + pattern + icon).
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium">Color Blind Safe</span>
              <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">Dual Encoding</span>
              <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium">WCAG 2.1 AA</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
            <div className="space-y-4">
              <AvailabilityLegend variant="horizontal" />
              <AvailabilityLegend variant="vertical" />
            </div>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <h3 className="text-lg font-semibold text-white">Features</h3>
            <ul className="space-y-1 text-slate-400">
              <li>• Four states: Open, Held, Sold, Blocked</li>
              <li>• Dual encoding: color + pattern + icon</li>
              <li>• Horizontal and vertical variants</li>
              <li>• Unique patterns for each state</li>
              <li>• Descriptive labels for accessibility</li>
            </ul>
          </div>
        </section>

        {/* Review Composer */}
        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Review Composer</h2>
            <p className="text-slate-400">
              Full-featured review submission with star ratings, photo uploads, and alt-text requirements.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-medium">Accessible</span>
              <span className="px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">Drag & Drop</span>
              <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-medium">Alt Text Required</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-slate-900/50 p-6">
            <ReviewComposer
              criteria={reviewCriteria}
              onSubmit={(data) => console.log('Submit:', data)}
              onSaveDraft={(data) => console.log('Draft:', data)}
              maxPhotos={5}
              maxCommentLength={500}
            />
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <h3 className="text-lg font-semibold text-white">Features</h3>
            <ul className="space-y-1 text-slate-400">
              <li>• Per-criterion star ratings (1-5)</li>
              <li>• Character-limited comment with counter</li>
              <li>• Drag-and-drop photo uploads</li>
              <li>• Required alt-text for all photos</li>
              <li>• Photo preview with removal option</li>
              <li>• Save as draft functionality</li>
              <li>• Form validation before submit</li>
              <li>• Full keyboard navigation</li>
            </ul>
          </div>
        </section>

        <section className="border-t border-white/10 pt-8">
          <h2 className="text-xl font-bold text-white mb-4">Accessibility Compliance</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white mb-2">WCAG 2.1 AA</h3>
              <p className="text-sm text-slate-400">
                All components meet WCAG 2.1 AA standards for color contrast, keyboard navigation, and screen reader support.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white mb-2">Color Blind Safe</h3>
              <p className="text-sm text-slate-400">
                Dual encoding (color + pattern + icon) ensures information is conveyed regardless of color vision.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white mb-2">Responsive</h3>
              <p className="text-sm text-slate-400">
                Mobile-first design with touch-friendly targets and adaptive layouts for all screen sizes.
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-white mb-2">Keyboard Navigation</h3>
              <p className="text-sm text-slate-400">
                Full keyboard support with visible focus states and logical tab order throughout.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
