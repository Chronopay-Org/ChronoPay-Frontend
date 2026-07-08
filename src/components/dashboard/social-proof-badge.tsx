import type { SocialProofBadgeEntry, Tone } from "./types";
import { Tooltip } from "@/app/components/ui/tooltip";
import * as Icons from "lucide-react";

const toneClasses: Record<Tone, string> = {
  neutral: "border-sky-400/30 bg-sky-400/10 text-sky-100",
  positive: "border-emerald-400/30 bg-emerald-400/10 text-emerald-100",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-100",
  critical: "border-rose-400/30 bg-rose-400/10 text-rose-100",
};

export function SocialProofBadge({
  badge,
  className = "",
}: {
  badge: SocialProofBadgeEntry;
  className?: string;
}) {
  const IconComponent = Icons[badge.icon as keyof typeof Icons] as
    | React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
    | undefined;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${toneClasses[badge.tone]} ${className}`}
      aria-label={`${badge.label}: ${badge.criterion}`}
    >
      {IconComponent ? (
        <IconComponent className="h-3 w-3 shrink-0" aria-hidden="true" />
      ) : null}
      <span className="truncate">{badge.label}</span>
      <Tooltip content={badge.criterion} />
    </span>
  );
}

export const BADGE_PRESETS: Record<
  SocialProofBadgeEntry["type"],
  Omit<SocialProofBadgeEntry, "type">
> = {
  topRated: {
    label: "Top 5% rated",
    tone: "positive",
    icon: "Star",
    criterion:
      "Rated in the top 5% of all sellers based on buyer reviews from the last 90 days.",
  },
  highPayouts: {
    label: "200+ payouts",
    tone: "positive",
    icon: "Banknote",
    criterion:
      "Completed over 200 successful payouts with no disputes or chargebacks.",
  },
  repeatBuyers: {
    label: "12 repeat buyers",
    tone: "positive",
    icon: "Users",
    criterion:
      "Has 12 buyers who booked more than one time slot in the past 6 months.",
  },
  fastResponse: {
    label: "Fast response",
    tone: "positive",
    icon: "Zap",
    criterion:
      "Responds to booking requests within 15 minutes on average during active hours.",
  },
  verified: {
    label: "Verified",
    tone: "neutral",
    icon: "BadgeCheck",
    criterion:
      "Identity verified through Stellar account authentication and KYC review.",
  },
  earlyAdopter: {
    label: "Early adopter",
    tone: "warning",
    icon: "Award",
    criterion:
      "One of the first 100 sellers to join the ChronoPay platform.",
  },
};
