import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip } from "./tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "UI/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Accessible tooltip primitive featuring standard lightweight text cues and a padded long-form variant supporting multi-line markup, inline anchors, aria-describedby promotion, and hover-intent.",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Standard: Story = {
  args: {
    content: "Standard single-line tooltip cue for quick info.",
    variant: "standard",
  },
};

export const LongformWithInlineAnchors: Story = {
  args: {
    variant: "longform",
    ariaLabel: "Detailed explanation for Stellar network transaction settlement",
    content: (
      <div className="space-y-2">
        <h4 className="font-semibold text-white">Stellar Transaction Settlement</h4>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Payments and payouts are recorded as native Stellar operations.
          Settlement completes in 3–5 seconds with minimal network fees.
        </p>
        <div className="pt-1 border-t border-zinc-700/60">
          <a
            href="https://stellar.org"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
          >
            Learn more on Stellar.org →
          </a>
        </div>
      </div>
    ),
  },
};

export const MultiLineDenseText: Story = {
  args: {
    variant: "longform",
    content: (
      <div className="space-y-1.5 text-xs text-zinc-200">
        <p className="font-medium text-white">Escrow Release Policy:</p>
        <p className="leading-normal">
          Time tokens remain locked in smart contract escrow until session
          fulfillment is acknowledged by both buyer and seller or until auto-release
          window expires after 72 hours.
        </p>
      </div>
    ),
  },
};

export const CustomTriggerNode: Story = {
  args: {
    variant: "longform",
    trigger: (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-cyan-400/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-400/20 cursor-pointer">
        Escrow Info
      </span>
    ),
    content: (
      <div className="space-y-1 text-xs text-zinc-200">
        <p className="font-semibold text-white">Escrow Account</p>
        <p>Tokens are held safely in a multi-sig escrow contract during booking.</p>
      </div>
    ),
  },
};

export const DarkModeContext: Story = {
  render: () => (
    <div className="p-8 bg-slate-950 rounded-2xl border border-slate-800">
      <Tooltip
        variant="longform"
        content={
          <div className="space-y-2 text-xs">
            <span className="font-semibold text-emerald-300">
              Verified Payout Destination
            </span>
            <p className="text-zinc-300">
              Your wallet address is active and verified for automated XLM
              transfers.
            </p>
          </div>
        }
      />
    </div>
  ),
};

export const RTLSupport: Story = {
  render: () => (
    <div dir="rtl" className="p-6 font-sans">
      <Tooltip
        variant="longform"
        ariaLabel="تعليمات سداد الرصيد"
        content={
          <div className="space-y-1.5 text-xs text-zinc-100">
            <h4 className="font-semibold text-white">تسوية مدفوعات ستيلار</h4>
            <p className="leading-relaxed">
              تتم معالجة المدفوعات تلقائياً عبر شبكة ستيلار مع حماية الضمان المحمي.
            </p>
            <a
              href="/docs/ar/stellar"
              className="text-cyan-400 underline font-medium text-xs block pt-1"
            >
              اقرأ المزيد عن التسوية ←
            </a>
          </div>
        }
      />
    </div>
  ),
};
