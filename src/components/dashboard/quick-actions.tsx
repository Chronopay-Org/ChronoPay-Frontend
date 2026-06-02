import { ButtonLink } from "@/app/components/ui/button-link";
import { StatusChip } from "./status-chip";
import { Card, CardHeader, CardFooter } from "./card";
import type { QuickAction, Tone } from "./types";
import * as Icons from "lucide-react";

const toneLabels: Record<Tone, string> = {
  neutral: "Available",
  positive: "Ready",
  warning: "Needs review",
  critical: "Needs attention",
};

// Icon background colors based on tone
const toneIconClasses: Record<Tone, string> = {
  neutral: "bg-sky-400/10 text-sky-300 border-sky-400/20",
  positive: "bg-emerald-400/10 text-emerald-300 border-emerald-400/20",
  warning: "bg-amber-400/10 text-amber-300 border-amber-400/20",
  critical: "bg-rose-400/10 text-rose-300 border-rose-400/20",
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {actions.map((action) => {
        // Dynamically get the icon component
        const IconComponent = Icons[action.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>;
        
        return (
          <div
            key={action.title}
            className="group rounded-[24px] border border-white/10 bg-slate-900/80 p-6 motion-safe:transition hover:border-cyan-300/40 hover:bg-slate-900 flex flex-col justify-between min-h-[180px]"
          >
            <div className="flex flex-col gap-4">
              {/* Icon and Status Row */}
              <div className="flex items-start justify-between">
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl border ${toneIconClasses[action.tone]}`}>
                  <IconComponent 
                    className="w-6 h-6" 
                    aria-hidden="true"
                  />
                </div>
                <StatusChip tone={action.tone}>{toneLabels[action.tone]}</StatusChip>
              </div>
              
              {/* Content Hierarchy */}
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2 leading-tight">
                  {action.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {action.description}
                </p>
              </div>
            </div>
            
            {/* Primary Action */}
            <div className="mt-6 flex justify-end">
              <ButtonLink 
                href={action.href} 
                variant="secondary" 
                size="md"
                className="group-hover:border-cyan-200/50 group-hover:bg-white/15 transition-all"
              >
                View {action.title}
              </ButtonLink>
            </div>
          </div>
        );
      })}
    </div>
  );
}
