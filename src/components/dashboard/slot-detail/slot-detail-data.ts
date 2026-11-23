import type { Dispute } from "@/app/components/dispute-tracking-panel";
import type { DisputeFormData } from "@/app/components/dispute-filing-form";

export interface SlotSellerMetadata {
  id: string;
  name: string;
  role: string;
  avatarInitials: string;
  avatarGradient: string;
  bio: string;
  stats: { label: string; value: string }[];
}

export interface SlotMetadata {
  durationHours: number;
  description: string;
  seller: SlotSellerMetadata;
}

export interface SlotPricing {
  rateNum: number;
  subtotal: number;
  escrowFee: number;
  stellarFee: number;
  totalCost: number;
}

export const MOCK_WALLET_ADDRESS = "GCDQ7M3F6JH2K4N8Q5RLP9TZB3YH4W8F1S7N6U0X2A5V8E1C";

export function formatDisplayAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-6)}`;
}

export function calculateSlotPricing(rate: string, durationHours: number): SlotPricing {
  const rateNum = parseFloat(rate.replace(/[^0-9.]/g, ""));
  const subtotal = rateNum * durationHours;
  const escrowFee = parseFloat((subtotal * 0.015).toFixed(4));
  const stellarFee = 0.0001;
  const totalCost = subtotal + escrowFee + stellarFee;
  return { rateNum, subtotal, escrowFee, stellarFee, totalCost };
}

export const slotDetailsMap: Record<string, SlotMetadata> = {
  "slot-1": {
    durationHours: 1.5,
    description:
      "Deep dive into your product roadmap, tech stack architecture, and launch strategy. We will review your current product design, identify potential technical bottlenecks on the Stellar network integration, and map out a concrete step-by-step roadmap for your engineering team.",
    seller: {
      id: "sarah-jenkins",
      name: "Dr. Sarah Jenkins",
      role: "Lead Product Architect",
      avatarInitials: "SJ",
      avatarGradient: "from-cyan-500 to-blue-600",
      bio: "Former MIT researcher and Stellar Core contributor with 10+ years of experience designing high-scale decentralized architectures.",
      stats: [
        { label: "Tokenized Hours", value: "142h" },
        { label: "Completion Rate", value: "99.4%" },
        { label: "Rating", value: "4.9/5" },
      ],
    },
  },
  "slot-2": {
    durationHours: 1.0,
    description:
      "A comprehensive heuristic evaluation of your web or mobile application interface. We will analyze your layout, user onboarding flow, and transactional friction points to improve conversion and ensure alignment with modern web design guidelines.",
    seller: {
      id: "marcus-vance",
      name: "Marcus Vance",
      role: "Principal UX Designer",
      avatarInitials: "MV",
      avatarGradient: "from-purple-500 to-indigo-600",
      bio: "Award-winning designer passionate about building human-centered financial products. Previously at Stripe and Stellar Development Foundation.",
      stats: [
        { label: "Tokenized Hours", value: "85h" },
        { label: "Completion Rate", value: "100%" },
        { label: "Rating", value: "5.0/5" },
      ],
    },
  },
  "slot-3": {
    durationHours: 1.0,
    description:
      "Open office hours for early-stage web3 founders. Bring your hardest questions about fundraising, go-to-market strategies, community building, and structuring secure, compliant token economies.",
    seller: {
      id: "elena-rostova",
      name: "Elena Rostova",
      role: "Managing Partner, Zenith Capital",
      avatarInitials: "ER",
      avatarGradient: "from-amber-500 to-rose-600",
      bio: "Venture capitalist and ecosystem growth advisor. Helps web3 startups bootstrap from inception to series A and scale their protocols.",
      stats: [
        { label: "Tokenized Hours", value: "210h" },
        { label: "Completion Rate", value: "98.7%" },
        { label: "Rating", value: "4.8/5" },
      ],
    },
  },
};

export function createInitialDisputes(slotId: string): Dispute[] {
  const now = Date.now();
  return [
    {
      id: "disp-12345678",
      slotId,
      category: "quality_mismatch",
      reason: "Service quality did not match expectations",
      description:
        "The delivered consultation was significantly shorter than the agreed 1.5 hours and lacked the depth of technical analysis promised in the description.",
      status: "under_review",
      evidence: [
        {
          id: "ev-1",
          fileName: "chat_transcript.pdf",
          fileSize: 245000,
          fileType: "application/pdf",
          uploadStatus: "completed",
          scanStatus: "clean",
          uploadedAt: new Date(now).toISOString(),
        },
      ],
      createdAt: new Date(now - 86400000).toISOString(),
      updatedAt: new Date(now - 3600000).toISOString(),
      submittedAt: new Date(now - 86400000).toISOString(),
      notes: [
        {
          id: "note-1",
          author: "System",
          authorRole: "system",
          content: "Dispute submitted successfully. Awaiting initial review.",
          createdAt: new Date(now - 86400000).toISOString(),
        },
      ],
      metadata: {
        priority: "medium",
        escalationCount: 0,
        lastActivityAt: new Date(now - 3600000).toISOString(),
      },
    },
  ];
}

export function buildNewDispute(slotId: string, formData: DisputeFormData): Dispute {
  const now = new Date().toISOString();
  return {
    id: `disp-${Date.now()}`,
    slotId,
    category: formData.category,
    reason: formData.reason,
    description: formData.description,
    status: "submitted",
    evidence: formData.evidence.map((file, index) => ({
      id: `ev-${Date.now()}-${index}`,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadStatus: "completed" as const,
      scanStatus: "clean" as const,
      uploadedAt: now,
    })),
    createdAt: now,
    updatedAt: now,
    submittedAt: now,
    notes: [
      {
        id: "note-1",
        author: "System",
        authorRole: "system",
        content: "Dispute submitted successfully. Awaiting initial review.",
        createdAt: now,
      },
    ],
    metadata: {
      priority: "medium",
      escalationCount: 0,
      lastActivityAt: now,
    },
  };
}
