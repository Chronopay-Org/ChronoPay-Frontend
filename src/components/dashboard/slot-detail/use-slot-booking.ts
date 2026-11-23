import { useEffect, useReducer, type RefObject } from "react";
import type { GiftDetails } from "@/components/dashboard/gift-purchase-toggle";
import type { Dispute } from "@/app/components/dispute-tracking-panel";
import { createInitialDisputes } from "./slot-detail-data";

export type BookingPhase =
  | "idle"
  | "hold"
  | "pay"
  | "settled"
  | "redeem"
  | "dispute"
  | "refund";

export type WalletStatus = "connected" | "disconnected" | "error";
export type BalanceMode = "sufficient" | "insufficient";
export type PurchaseStep = "auth" | "confirm" | "loading" | "success";
export type DisputeView = "filing" | "tracking";

export interface ChargedSnapshot {
  subtotal: number;
  escrowFee: number;
  stellarFee: number;
  totalCost: number;
  effectiveTotalCost: number;
  discountPercent: number;
  promoCode: string;
}

export interface SlotBookingState {
  phase: BookingPhase;
  previousPhase: BookingPhase;
  simWallet: WalletStatus;
  simBalance: BalanceMode;
  discountPercent: number;
  discountedTotal: number;
  promoCode: string;
  chargedSnapshot: ChargedSnapshot | null;
  isModalOpen: boolean;
  purchaseStep: PurchaseStep;
  loadingMessage: string;
  txHash: string;
  announcement: string;
  giftDetails: GiftDetails | null;
  isRedeemModalOpen: boolean;
  isReceiptOpen: boolean;
  isDisputeModalOpen: boolean;
  disputeView: DisputeView;
  isSubmittingDispute: boolean;
  currentDispute: Dispute | null;
  existingDisputes: Dispute[];
  hasDraft: boolean;
}

export const VALID_PHASE_TRANSITIONS: Record<BookingPhase, readonly BookingPhase[]> = {
  idle: ["hold", "dispute"],
  hold: ["idle", "pay"],
  pay: ["idle", "settled"],
  settled: ["idle", "redeem", "dispute", "refund"],
  redeem: ["settled"],
  dispute: ["idle", "settled", "refund"],
  refund: ["idle", "dispute"],
};

export function canTransition(from: BookingPhase, to: BookingPhase): boolean {
  return VALID_PHASE_TRANSITIONS[from].includes(to);
}

export type SlotBookingAction =
  | { type: "SET_SIM_WALLET"; wallet: WalletStatus }
  | { type: "SET_SIM_BALANCE"; balance: BalanceMode }
  | { type: "CONNECT_WALLET" }
  | { type: "APPLY_PROMO"; code: string; percent: number; discountedTotal: number }
  | { type: "RESET_PROMO"; totalCost: number }
  | { type: "SET_GIFT_DETAILS"; giftDetails: GiftDetails | null }
  | { type: "SET_HAS_DRAFT"; hasDraft: boolean }
  | { type: "ANNOUNCE"; message: string }
  | { type: "OPEN_HOLD" }
  | { type: "PROCEED_TO_CONFIRM" }
  | { type: "START_PAY"; snapshot: ChargedSnapshot }
  | { type: "UPDATE_PAY_MESSAGE"; message: string }
  | { type: "COMPLETE_PAY"; txHash: string }
  | { type: "CLOSE_CHECKOUT" }
  | { type: "OPEN_REDEEM" }
  | { type: "CLOSE_REDEEM" }
  | { type: "OPEN_RECEIPT" }
  | { type: "CLOSE_RECEIPT" }
  | { type: "OPEN_DISPUTE" }
  | { type: "CLOSE_DISPUTE" }
  | { type: "SET_DISPUTE_VIEW"; view: DisputeView }
  | { type: "SUBMIT_DISPUTE_START" }
  | { type: "SUBMIT_DISPUTE_SUCCESS"; dispute: Dispute }
  | { type: "ADD_DISPUTE_NOTE"; note: Dispute["notes"][number]; updatedAt: string }
  | { type: "REQUEST_REFUND" };

export function createInitialBookingState(
  slotId: string,
  totalCost: number,
): SlotBookingState {
  return {
    phase: "idle",
    previousPhase: "idle",
    simWallet: "connected",
    simBalance: "sufficient",
    discountPercent: 0,
    discountedTotal: totalCost,
    promoCode: "",
    chargedSnapshot: null,
    isModalOpen: false,
    purchaseStep: "auth",
    loadingMessage: "",
    txHash: "",
    announcement: "",
    giftDetails: null,
    isRedeemModalOpen: false,
    isReceiptOpen: false,
    isDisputeModalOpen: false,
    disputeView: "filing",
    isSubmittingDispute: false,
    currentDispute: null,
    existingDisputes: createInitialDisputes(slotId),
    hasDraft: false,
  };
}

export function slotBookingReducer(
  state: SlotBookingState,
  action: SlotBookingAction,
): SlotBookingState {
  switch (action.type) {
    case "SET_SIM_WALLET":
      return { ...state, simWallet: action.wallet };

    case "SET_SIM_BALANCE":
      return { ...state, simBalance: action.balance };

    case "CONNECT_WALLET":
      return {
        ...state,
        simWallet: "connected",
        announcement: "Wallet connected successfully.",
      };

    case "APPLY_PROMO":
      return {
        ...state,
        promoCode: action.code,
        discountPercent: action.percent,
        discountedTotal: action.discountedTotal,
      };

    case "RESET_PROMO":
      return {
        ...state,
        promoCode: "",
        discountPercent: 0,
        discountedTotal: action.totalCost,
      };

    case "SET_GIFT_DETAILS":
      return { ...state, giftDetails: action.giftDetails };

    case "SET_HAS_DRAFT":
      return { ...state, hasDraft: action.hasDraft };

    case "ANNOUNCE":
      return { ...state, announcement: action.message };

    case "OPEN_HOLD": {
      if (!canTransition(state.phase, "hold")) return state;
      return {
        ...state,
        phase: "hold",
        isModalOpen: true,
        purchaseStep: "auth",
        hasDraft: false,
      };
    }

    case "PROCEED_TO_CONFIRM": {
      if (state.phase !== "hold" || state.purchaseStep !== "auth") return state;
      return {
        ...state,
        purchaseStep: "confirm",
      };
    }

    case "START_PAY": {
      if (!canTransition(state.phase, "pay") || state.purchaseStep !== "confirm") {
        return state;
      }
      return {
        ...state,
        phase: "pay",
        purchaseStep: "loading",
        chargedSnapshot: action.snapshot,
      };
    }

    case "UPDATE_PAY_MESSAGE": {
      if (state.phase !== "pay") return state;
      return {
        ...state,
        loadingMessage: action.message,
        announcement: action.message,
      };
    }

    case "COMPLETE_PAY": {
      if (!canTransition(state.phase, "settled")) return state;
      return {
        ...state,
        phase: "settled",
        purchaseStep: "success",
        txHash: action.txHash,
        announcement: "Time token purchased successfully. Receipt ready.",
      };
    }

    case "CLOSE_CHECKOUT": {
      if (!state.isModalOpen) return state;
      if (!canTransition(state.phase, "idle")) return state;
      return {
        ...state,
        phase: "idle",
        isModalOpen: false,
        purchaseStep: "auth",
      };
    }

    case "OPEN_REDEEM": {
      if (!canTransition(state.phase, "redeem") || state.txHash === "") {
        return state;
      }
      return {
        ...state,
        phase: "redeem",
        isRedeemModalOpen: true,
      };
    }

    case "CLOSE_REDEEM": {
      if (state.phase !== "redeem") return state;
      return {
        ...state,
        phase: "settled",
        isRedeemModalOpen: false,
      };
    }

    case "OPEN_RECEIPT": {
      if (state.txHash === "") return state;
      return {
        ...state,
        isReceiptOpen: true,
      };
    }

    case "CLOSE_RECEIPT":
      return {
        ...state,
        isReceiptOpen: false,
      };

    case "OPEN_DISPUTE": {
      if (!canTransition(state.phase, "dispute")) return state;
      const hasExisting = state.existingDisputes.length > 0;
      return {
        ...state,
        previousPhase: state.phase,
        phase: "dispute",
        isDisputeModalOpen: true,
        disputeView: hasExisting ? "tracking" : "filing",
        currentDispute: hasExisting ? state.existingDisputes[0] : null,
      };
    }

    case "CLOSE_DISPUTE": {
      if (state.phase !== "dispute") return state;
      const returnPhase = canTransition("dispute", state.previousPhase)
        ? state.previousPhase
        : "idle";
      return {
        ...state,
        phase: returnPhase,
        isDisputeModalOpen: false,
        currentDispute: null,
      };
    }

    case "SET_DISPUTE_VIEW": {
      if (state.phase !== "dispute") return state;
      return {
        ...state,
        disputeView: action.view,
      };
    }

    case "SUBMIT_DISPUTE_START": {
      if (state.phase !== "dispute") return state;
      return {
        ...state,
        isSubmittingDispute: true,
      };
    }

    case "SUBMIT_DISPUTE_SUCCESS": {
      if (state.phase !== "dispute") return state;
      return {
        ...state,
        existingDisputes: [...state.existingDisputes, action.dispute],
        currentDispute: action.dispute,
        disputeView: "tracking",
        isSubmittingDispute: false,
        announcement: "Dispute submitted successfully",
      };
    }

    case "ADD_DISPUTE_NOTE": {
      if (state.phase !== "dispute" || !state.currentDispute) return state;
      const updatedDispute: Dispute = {
        ...state.currentDispute,
        notes: [...state.currentDispute.notes, action.note],
        updatedAt: action.updatedAt,
        metadata: {
          ...state.currentDispute.metadata,
          lastActivityAt: action.updatedAt,
        },
      };
      return {
        ...state,
        currentDispute: updatedDispute,
        existingDisputes: state.existingDisputes.map((d) =>
          d.id === updatedDispute.id ? updatedDispute : d,
        ),
      };
    }

    case "REQUEST_REFUND": {
      if (!canTransition(state.phase, "refund")) return state;
      return {
        ...state,
        phase: "refund",
        isDisputeModalOpen: false,
        announcement: "Refund requested for this booking.",
      };
    }

    default:
      return state;
  }
}

export function useSlotBooking(slotId: string, totalCost: number) {
  const [state, dispatch] = useReducer(
    slotBookingReducer,
    { slotId, totalCost },
    ({ slotId: initialSlotId, totalCost: initialTotalCost }) =>
      createInitialBookingState(initialSlotId, initialTotalCost),
  );

  return { state, dispatch };
}

export function useModalFocus({
  isOpen,
  modalRef,
  lastActiveElementRef,
  openAnnouncement,
  onAnnounce,
}: {
  isOpen: boolean;
  modalRef: RefObject<HTMLDivElement | null>;
  lastActiveElementRef: RefObject<HTMLElement | null>;
  openAnnouncement: string;
  onAnnounce: (message: string) => void;
}) {
  useEffect(() => {
    if (isOpen) {
      if (document.activeElement && !modalRef.current?.contains(document.activeElement)) {
        lastActiveElementRef.current = document.activeElement as HTMLElement;
      }
      if (modalRef.current && !modalRef.current.contains(document.activeElement)) {
        modalRef.current.focus();
      }
      const raf = requestAnimationFrame(() => {
        onAnnounce(openAnnouncement);
      });
      return () => cancelAnimationFrame(raf);
    } else if (
      lastActiveElementRef.current &&
      document.body.contains(lastActiveElementRef.current)
    ) {
      lastActiveElementRef.current.focus();
    }
  }, [isOpen, modalRef, lastActiveElementRef, openAnnouncement, onAnnounce]);
}
