export type Tone = "neutral" | "positive" | "warning" | "critical";

export type AvailabilityLevel = "Healthy" | "Tight" | "Busy";

export type Slot = {
  id: string;
  title: string;
  window: string;
  demand: string;
  rate: string;
  status: AvailabilityLevel;
};

export type QuickAction = {
  title: string;
  description: string;
  href: string;
  tone: Tone;
};

export type Metric = {
  label: string;
  value: string;
  detail: string;
  tone: Tone;
};

export type BookingStage = {
  label: string;
  value: number;
};

export type WalletSnapshot = {
  balance: string;
  pending: string;
  nextPayout: string;
  status: string;
};
