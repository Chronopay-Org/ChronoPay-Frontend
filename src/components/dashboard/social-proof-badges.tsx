import type { SocialProofBadgeEntry } from "./types";
import { SocialProofBadge } from "./social-proof-badge";
import { Tooltip } from "@/app/components/ui/tooltip";

export function SocialProofBadges({
  badges,
  maxVisible = 3,
  className = "",
}: {
  badges: SocialProofBadgeEntry[];
  maxVisible?: number;
  className?: string;
}) {
  if (badges.length === 0) {
    return null;
  }

  const visible = badges.slice(0, maxVisible);
  const overflow = badges.slice(maxVisible);

  return (
    <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
      {visible.map((badge) => (
        <SocialProofBadge key={badge.type} badge={badge} />
      ))}
      {overflow.length > 0 ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/6 px-2.5 py-1 text-xs font-semibold text-slate-300">
          <span>+{overflow.length}</span>
          <Tooltip
            content={overflow.map((b) => `${b.label}: ${b.criterion}`).join("; ")}
          />
        </span>
      ) : null}
    </div>
  );
}
