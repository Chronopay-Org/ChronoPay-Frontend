import type { DraftStatus, Tone } from "../types";

export type PayoutCurrency = "XLM" | "USDC" | "EURC";

export type PayoutDestinationType = "connected_wallet" | "stellar_address";

export interface PayoutConsent {
  accepted: boolean;
  acceptedAt: Date | null;
}

export interface PayoutPreview {
  walletAddress: string;
  walletLabel: string;
  network: string;
}

export type PayoutStepStatus = "idle" | "pending" | "success" | "error";

export interface PayoutDraft {
  destinationType: PayoutDestinationType;
  currency: PayoutCurrency;
  customAddress: string;
  memo: string;
}

export interface PayoutStepProps {
  preview?: PayoutPreview | null;
  onSave: (currency: PayoutCurrency, consent: PayoutConsent) => Promise<void>;
  onBack?: () => void;
  /** Called when the user advances past the payout step after a successful save. */
  onNext?: () => void;
  status?: PayoutStepStatus;
  errorMessage?: string;
  onRetry?: () => void;
  initialCurrency?: PayoutCurrency;
  initialDestinationType?: PayoutDestinationType;
  initialAddress?: string;
  initialMemo?: string;
  /** sessionStorage key for persisting in-progress payout form state. Set to `null` to disable persistence. */
  storageKey?: string | null;
  draftStatus?: DraftStatus;
  lastSavedLabel?: string;
}

/** Ordered onboarding steps; the payout step is followed by review. */
export const PAYOUT_STEPS = ["payout", "review"] as const;

export const CURRENCIES: {
  value: PayoutCurrency;
  label: string;
  network: string;
  description: string;
}[] = [
  {
    value: "XLM",
    label: "XLM (Lumens)",
    network: "Stellar",
    description: "Native Stellar asset — low fees, fast settlement.",
  },
  {
    value: "USDC",
    label: "USDC",
    network: "Stellar",
    description: "USD-pegged stablecoin on the Stellar network.",
  },
  {
    value: "EURC",
    label: "EURC",
    network: "Stellar",
    description: "EUR-pegged stablecoin on the Stellar network.",
  },
];

export const DESTINATION_TYPES: {
  value: PayoutDestinationType;
  label: string;
  description: string;
}[] = [
  {
    value: "connected_wallet",
    label: "Connected wallet",
    description: "Send payouts directly to your connected Stellar wallet.",
  },
  {
    value: "stellar_address",
    label: "Custom Stellar address",
    description: "Enter a Stellar G-address and optional memo for exchanges or custody.",
  },
];

export const STATUS_TONE: Record<DraftStatus, Tone> = {
  saved: "positive",
  saving: "warning",
  offline: "neutral",
};

export const STATUS_LABEL: Record<DraftStatus, string> = {
  saved: "Saved as draft",
  saving: "Saving…",
  offline: "Offline — changes local only",
};

export const CONSENT_TEXT =
  "I authorise ChronoPay to send payout funds to the connected wallet address using the selected currency. I understand that payout timing depends on network conditions and that I can update my payout settings at any time from my account settings.";

export function truncateAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 3) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
