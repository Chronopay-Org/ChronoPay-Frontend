import { CheckCircle2, Layout, Accessibility, Box, Layers } from "lucide-react";

export default function DesignChecklist() {
  const sections = [
    {
      title: "Accessibility (WCAG 2.1 AA)",
      icon: <Accessibility className="w-4 h-4 text-cyan-400" />,
      items: [
        "Contrast ratios meet 4.5:1 for text (3:1 for large text/icons)",
        "Keyboard navigation order is logical (focus-traps avoided)",
        "Visible focus rings on all interactive elements (high-contrast cyan)",
        "ARIA labels and landmarks used correctly (alt text, roles)",
        "Skip to content link implemented and functional",
      ],
    },
    {
      title: "Responsive & Layout",
      icon: <Layout className="w-4 h-4 text-purple-400" />,
      items: [
        "Mobile-first approach (no horizontal scroll on small screens)",
        "Above-the-fold spacing optimized for laptop viewports",
        "Breakpoints (md: 768px, lg: 1024px, xl: 1280px) respected",
        "Consistent spacing tokens used (py-6/8/12, space-y-5/6/8)",
        "Tabular numbers used for data scanning (font-mono)",
      ],
    },
    {
      title: "Operational States",
      icon: <Layers className="w-4 h-4 text-orange-400" />,
      items: [
        "Loading states (skeletons or spinners) avoid layout shifts",
        "Empty states follow guidelines (plain language, clear CTA)",
        "Error states provide actionable recovery steps",
        "Hover/Active/Focus affordances clearly distinguish interactivity",
      ],
    },
    {
      title: "Design Tokens & Patterns",
      icon: <Box className="w-4 h-4 text-green-400" />,
      items: [
        "Standardized helper-text classes used (.helper-text--muted)",
        "Button variants (primary, secondary, ghost) used correctly",
        "Consistent card padding and border-radius patterns",
        "Typography hierarchy followed (no skipping heading levels)",
      ],
    },
  ];

  return (
    <div
      className="max-w-2xl p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-md shadow-2xl space-y-6"
      aria-labelledby="design-review-checklist-title"
    >
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <h2 id="design-review-checklist-title" className="text-xl font-bold text-white flex items-center gap-2">
          <span className="p-1.5 bg-cyan-500/10 rounded-lg text-cyan-400">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          Design Review Checklist
        </h2>
        <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">v2.0.0</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {sections.map((section, idx) => (
          <section key={idx} className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-slate-200 text-sm">
              {section.icon}
              <h3>{section.title}</h3>
            </div>
            <ul className="space-y-2">
              {section.items.map((item, i) => (
                <li key={i} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
                  <span className="mt-0.5 text-cyan-500/50" aria-hidden="true">
                    •
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="pt-4 border-t border-white/5">
        <p className="text-[10px] text-slate-500 text-center uppercase tracking-tighter">
          Operationalizing quality across the ChronoPay design system
        </p>
      </div>
    </div>
  );
}
