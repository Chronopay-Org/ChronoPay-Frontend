import { describe, it, expect } from "vitest";
import {
  canTransition,
  createInitialBookingState,
  slotBookingReducer,
  type ChargedSnapshot,
} from "./use-slot-booking";

const sampleSnapshot: ChargedSnapshot = {
  subtotal: 180,
  escrowFee: 2.7,
  stellarFee: 0.0001,
  totalCost: 182.7001,
  effectiveTotalCost: 182.7001,
  discountPercent: 0,
  promoCode: "",
};

describe("useSlotBooking reducer", () => {
  it("starts in idle phase with initial disputes and default wallet state", () => {
    const state = createInitialBookingState("slot-1", 182.7001);
    expect(state.phase).toBe("idle");
    expect(state.simWallet).toBe("connected");
    expect(state.simBalance).toBe("sufficient");
    expect(state.existingDisputes).toHaveLength(1);
    expect(state.isModalOpen).toBe(false);
  });

  it("walks through valid hold -> pay -> settled -> redeem -> settled transitions", () => {
    let state = createInitialBookingState("slot-1", 182.7001);

    state = slotBookingReducer(state, { type: "OPEN_HOLD" });
    expect(state.phase).toBe("hold");
    expect(state.isModalOpen).toBe(true);
    expect(state.purchaseStep).toBe("auth");

    state = slotBookingReducer(state, { type: "PROCEED_TO_CONFIRM" });
    expect(state.purchaseStep).toBe("confirm");

    state = slotBookingReducer(state, { type: "START_PAY", snapshot: sampleSnapshot });
    expect(state.phase).toBe("pay");
    expect(state.purchaseStep).toBe("loading");
    expect(state.chargedSnapshot).toEqual(sampleSnapshot);

    state = slotBookingReducer(state, {
      type: "UPDATE_PAY_MESSAGE",
      message: "Locking funds...",
    });
    expect(state.loadingMessage).toBe("Locking funds...");

    state = slotBookingReducer(state, {
      type: "COMPLETE_PAY",
      txHash: "abcdef1234567890...minted",
    });
    expect(state.phase).toBe("settled");
    expect(state.purchaseStep).toBe("success");
    expect(state.txHash).toBe("abcdef1234567890...minted");

    state = slotBookingReducer(state, { type: "OPEN_REDEEM" });
    expect(state.phase).toBe("redeem");
    expect(state.isRedeemModalOpen).toBe(true);

    state = slotBookingReducer(state, { type: "CLOSE_REDEEM" });
    expect(state.phase).toBe("settled");
    expect(state.isRedeemModalOpen).toBe(false);
  });

  it("supports dispute open/close and refund transitions from settled", () => {
    let state = createInitialBookingState("slot-1", 182.7001);
    state = slotBookingReducer(state, { type: "OPEN_DISPUTE" });
    expect(state.phase).toBe("dispute");
    expect(state.isDisputeModalOpen).toBe(true);
    expect(state.disputeView).toBe("tracking");

    state = slotBookingReducer(state, { type: "SET_DISPUTE_VIEW", view: "filing" });
    expect(state.disputeView).toBe("filing");

    state = slotBookingReducer(state, { type: "CLOSE_DISPUTE" });
    expect(state.phase).toBe("idle");
    expect(state.isDisputeModalOpen).toBe(false);

    // Move to settled then request refund
    state = slotBookingReducer(state, { type: "OPEN_HOLD" });
    state = slotBookingReducer(state, { type: "PROCEED_TO_CONFIRM" });
    state = slotBookingReducer(state, { type: "START_PAY", snapshot: sampleSnapshot });
    state = slotBookingReducer(state, { type: "COMPLETE_PAY", txHash: "tx-123" });
    state = slotBookingReducer(state, { type: "REQUEST_REFUND" });
    expect(state.phase).toBe("refund");
  });

  it("rejects invalid phase transitions", () => {
    const idle = createInitialBookingState("slot-1", 182.7001);

    // Cannot pay directly from idle
    expect(slotBookingReducer(idle, { type: "START_PAY", snapshot: sampleSnapshot })).toBe(
      idle,
    );
    // Cannot complete pay from idle
    expect(slotBookingReducer(idle, { type: "COMPLETE_PAY", txHash: "tx-1" })).toBe(idle);
    // Cannot open redeem before settled
    expect(slotBookingReducer(idle, { type: "OPEN_REDEEM" })).toBe(idle);
    // Cannot open receipt before settled
    expect(slotBookingReducer(idle, { type: "OPEN_RECEIPT" })).toBe(idle);
    // Cannot request refund from idle
    expect(slotBookingReducer(idle, { type: "REQUEST_REFUND" })).toBe(idle);
    // Cannot close dispute when not in dispute
    expect(slotBookingReducer(idle, { type: "CLOSE_DISPUTE" })).toBe(idle);

    // Cannot start pay from hold/auth without confirming first
    const holdAuth = slotBookingReducer(idle, { type: "OPEN_HOLD" });
    expect(
      slotBookingReducer(holdAuth, { type: "START_PAY", snapshot: sampleSnapshot }),
    ).toBe(holdAuth);

    // Verify canTransition helper
    expect(canTransition("idle", "pay")).toBe(false);
    expect(canTransition("idle", "redeem")).toBe(false);
    expect(canTransition("hold", "settled")).toBe(false);
    expect(canTransition("settled", "redeem")).toBe(true);
  });

  it("applies and resets promo codes", () => {
    let state = createInitialBookingState("slot-1", 200);
    state = slotBookingReducer(state, {
      type: "APPLY_PROMO",
      code: "CHRONO10",
      percent: 10,
      discountedTotal: 180,
    });
    expect(state.promoCode).toBe("CHRONO10");
    expect(state.discountPercent).toBe(10);
    expect(state.discountedTotal).toBe(180);

    state = slotBookingReducer(state, { type: "RESET_PROMO", totalCost: 200 });
    expect(state.promoCode).toBe("");
    expect(state.discountPercent).toBe(0);
    expect(state.discountedTotal).toBe(200);
  });
});
