import type { Meta, StoryObj } from "@storybook/react";
import { SocialProofBadge, BADGE_PRESETS } from "./social-proof-badge";
import { SocialProofBadges } from "./social-proof-badges";
import { Card, SupplierCardHeader } from "./card";
import type { SocialProofBadgeEntry } from "./types";

const verifiedPayoutsBadge: SocialProofBadgeEntry = {
  type: "verifiedPayouts",
  ...BADGE_PRESETS.verifiedPayouts,
};

const meta: Meta<typeof SocialProofBadge> = {
  title: "Dashboard/SupplierVerifiedPayoutsBadge",
  component: SocialProofBadge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Compact, accessible, non-color-only badge indicating a supplier payout account is verified on Stellar, featuring tooltip criteria and an explainer popover trigger.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof SocialProofBadge>;

export const Default: Story = {
  args: {
    badge: verifiedPayoutsBadge,
  },
};

export const CustomClass: Story = {
  args: {
    badge: verifiedPayoutsBadge,
    className: "shadow-md ring-1 ring-emerald-400/50",
  },
};

export const InBadgeList: StoryObj<typeof SocialProofBadges> = {
  render: () => (
    <SocialProofBadges
      badges={[
        verifiedPayoutsBadge,
        { type: "topRated", ...BADGE_PRESETS.topRated },
        { type: "fastResponse", ...BADGE_PRESETS.fastResponse },
        { type: "verified", ...BADGE_PRESETS.verified },
      ]}
      maxVisible={3}
    />
  ),
};

export const InCardHeader: StoryObj<typeof Card> = {
  render: () => (
    <Card className="w-[420px] p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      <SupplierCardHeader
        name="Alex Rivera"
        title="Senior Product Strategist"
        badges={[
          verifiedPayoutsBadge,
          { type: "topRated", ...BADGE_PRESETS.topRated },
        ]}
      />
    </Card>
  ),
};

export const LongSupplierName: StoryObj<typeof Card> = {
  render: () => (
    <Card className="w-[360px] p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
      <SupplierCardHeader
        name="Dr. Alexandria Montgomery-Wellington III"
        title="Global Blockchain & Decentralized Finance Systems Lead Architect"
        badges={[
          verifiedPayoutsBadge,
          { type: "topRated", ...BADGE_PRESETS.topRated },
          { type: "highPayouts", ...BADGE_PRESETS.highPayouts },
        ]}
        maxBadgesVisible={2}
      />
    </Card>
  ),
};

export const RTLSupport: StoryObj<typeof Card> = {
  render: () => (
    <div dir="rtl" className="font-sans">
      <Card className="w-[380px] p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
        <SupplierCardHeader
          name="أحمد الرشيد"
          title="مستشار الاستراتيجية المالي"
          badges={[
            verifiedPayoutsBadge,
            { type: "verified", ...BADGE_PRESETS.verified },
          ]}
        />
      </Card>
    </div>
  ),
};
