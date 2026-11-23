"use client";

import { use, useCallback, useEffect, useRef } from "react";
import { DashboardShell } from "@/app/components/dashboard-shell";
import { slots as mockSlots } from "@/components/dashboard/dashboard-data";
import { BookingAbandonmentBanner } from "@/components/dashboard/booking-abandonment-banner";
import type { DisputeFormData } from "@/components/dashboard/dispute-filing-form";
import {
  MOCK_WALLET_ADDRESS,
  SlotActionsSection,
  SlotCheckoutModal,
  SlotDisputeSection,
  SlotHeaderSection,
  SlotHeaderTopBar,
  SlotPricingSection,
  SlotReceiptSection,
  buildNewDispute,
  calculateSlotPricing,
  formatDisplayAddress,
  slotDetailsMap,
  useModalFocus,
  useSlotBooking,
} from "@/components/dashboard/slot-detail";

export default function SlotDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const slot = mockSlots.find((s) => s.id === id) || mockSlots[0];
  const details = slotDetailsMap[slot.id] || slotDetailsMap["slot-1"];
  const { subtotal, escrowFee, stellarFee, totalCost } = calculateSlotPricing(
    slot.rate,
    details.durationHours,
  );

  const { state, dispatch } = useSlotBooking(id, totalCost);

  const displayAddress = formatDisplayAddress(MOCK_WALLET_ADDRESS);
  const availableFunds = state.simBalance === "sufficient" ? 1500 : 50;
  const effectiveTotalCost =
    state.discountPercent > 0 ? state.discountedTotal : totalCost;
  const hasFunds = availableFunds >= effectiveTotalCost;
  const isWalletReady = state.simWallet === "connected";
  const isSettled = state.purchaseStep === "success" && state.txHash !== "";
  const isDialogOpen = state.isModalOpen || state.isDisputeModalOpen;
  const draftKey = `draft-booking-${id}`;

  const modalRef = useRef<HTMLDivElement>(null);
  const disputeModalRef = useRef<HTMLDivElement>(null);
  const purchaseBtnRef = useRef<HTMLButtonElement>(null);
  const disputeBtnRef = useRef<HTMLButtonElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);
  const disputeLastActiveElementRef = useRef<HTMLElement | null>(null);
  const purchaseTimeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearPurchaseTimeouts = useCallback(() => {
    purchaseTimeoutsRef.current.forEach((t) => clearTimeout(t));
    purchaseTimeoutsRef.current = [];
  }, []);

  const announce = useCallback(
    (message: string) => dispatch({ type: "ANNOUNCE", message }),
    [dispatch],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      dispatch({ type: "RESET_PROMO", totalCost });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [id, totalCost, dispatch]);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(draftKey)) {
      const timer = window.setTimeout(
        () => dispatch({ type: "SET_HAS_DRAFT", hasDraft: true }),
        0,
      );
      return () => window.clearTimeout(timer);
    }
  }, [draftKey, dispatch]);

  useEffect(() => {
    if (state.isModalOpen && typeof window !== "undefined") {
      localStorage.setItem(draftKey, "true");
    }
  }, [state.isModalOpen, draftKey]);

  useEffect(() => clearPurchaseTimeouts, [clearPurchaseTimeouts]);

  useModalFocus({
    isOpen: state.isModalOpen,
    modalRef,
    lastActiveElementRef,
    openAnnouncement: "Confirm purchase modal opened. Press Tab to navigate.",
    onAnnounce: announce,
  });

  useModalFocus({
    isOpen: state.isDisputeModalOpen,
    modalRef: disputeModalRef,
    lastActiveElementRef: disputeLastActiveElementRef,
    openAnnouncement: "Dispute modal opened. Press Tab to navigate.",
    onAnnounce: announce,
  });

  const handleOpenModal = useCallback(() => {
    if (!isWalletReady || !hasFunds) return;
    lastActiveElementRef.current = document.activeElement as HTMLElement;
    dispatch({ type: "OPEN_HOLD" });
  }, [isWalletReady, hasFunds, dispatch]);

  const handleCloseModal = useCallback(() => {
    clearPurchaseTimeouts();
    dispatch({ type: "CLOSE_CHECKOUT" });
  }, [clearPurchaseTimeouts, dispatch]);

  const handleOpenDisputeModal = useCallback(() => {
    disputeLastActiveElementRef.current = document.activeElement as HTMLElement;
    dispatch({ type: "OPEN_DISPUTE" });
  }, [dispatch]);

  const handleCloseDisputeModal = useCallback(() => {
    dispatch({ type: "CLOSE_DISPUTE" });
  }, [dispatch]);

  const handleDiscardDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(draftKey);
    }
    dispatch({ type: "SET_HAS_DRAFT", hasDraft: false });
  }, [draftKey, dispatch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (state.isModalOpen) handleCloseModal();
        if (state.isDisputeModalOpen) handleCloseDisputeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isModalOpen, state.isDisputeModalOpen, handleCloseModal, handleCloseDisputeModal]);

  const handleProceedPurchase = () => {
    clearPurchaseTimeouts();
    dispatch({
      type: "START_PAY",
      snapshot: {
        subtotal,
        escrowFee,
        stellarFee,
        totalCost,
        effectiveTotalCost,
        discountPercent: state.discountPercent,
        promoCode: state.promoCode,
      },
    });

    const steps = [
      { text: "Initiating Stellar transaction...", time: 0 },
      { text: "Establishing trustline for CHRONO-SLOT-TIME...", time: 1000 },
      { text: "Locking funds in Multi-Sig Smart Escrow...", time: 2000 },
      { text: "Minting token and finalizing receipt...", time: 3000 },
    ];

    steps.forEach((step) => {
      const timerId = setTimeout(() => {
        dispatch({ type: "UPDATE_PAY_MESSAGE", message: step.text });
      }, step.time);
      purchaseTimeoutsRef.current.push(timerId);
    });

    const completionId = setTimeout(() => {
      const randomHash =
        Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join(
          "",
        ) + "...minted";
      dispatch({ type: "COMPLETE_PAY", txHash: randomHash });
    }, 4000);
    purchaseTimeoutsRef.current.push(completionId);
  };

  const handleSubmitDispute = async (formData: DisputeFormData) => {
    dispatch({ type: "SUBMIT_DISPUTE_START" });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    dispatch({ type: "SUBMIT_DISPUTE_SUCCESS", dispute: buildNewDispute(id, formData) });
  };

  const handleAddDisputeNote = async (content: string) => {
    const now = new Date().toISOString();
    dispatch({
      type: "ADD_DISPUTE_NOTE",
      updatedAt: now,
      note: {
        id: `note-${Date.now()}`,
        author: "You",
        authorRole: "buyer",
        content,
        createdAt: now,
      },
    });
  };

  return (
    <DashboardShell>
      <div className="sr-only" aria-live="assertive" aria-atomic="true">
        {state.announcement}
      </div>

      <div
        className="space-y-6"
        inert={isDialogOpen ? true : undefined}
        aria-hidden={isDialogOpen ? true : undefined}
      >
        {state.hasDraft && (
          <BookingAbandonmentBanner
            onResume={handleOpenModal}
            onDiscard={handleDiscardDraft}
            onViewDetails={handleOpenModal}
          />
        )}

        <SlotHeaderTopBar
          slotId={id}
          simWallet={state.simWallet}
          simBalance={state.simBalance}
          onSimWalletChange={(wallet) => dispatch({ type: "SET_SIM_WALLET", wallet })}
          onSimBalanceChange={(balance) => dispatch({ type: "SET_SIM_BALANCE", balance })}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <SlotHeaderSection slot={slot} details={details} />

          <SlotPricingSection
            rate={slot.rate}
            durationHours={details.durationHours}
            subtotal={subtotal}
            escrowFee={escrowFee}
            stellarFee={stellarFee}
            totalCost={totalCost}
            discountPercent={state.discountPercent}
            discountedTotal={state.discountedTotal}
            effectiveTotalCost={effectiveTotalCost}
            simWallet={state.simWallet}
            isWalletReady={isWalletReady}
            hasFunds={hasFunds}
            availableFunds={availableFunds}
            displayAddress={displayAddress}
            onGiftChange={(giftDetails) =>
              dispatch({ type: "SET_GIFT_DETAILS", giftDetails })
            }
            onDiscountApplied={({ code, percent, discountedTotal }) =>
              dispatch({ type: "APPLY_PROMO", code, percent, discountedTotal })
            }
            actions={
              <SlotActionsSection
                simWallet={state.simWallet}
                isWalletReady={isWalletReady}
                hasFunds={hasFunds}
                existingDisputesCount={state.existingDisputes.length}
                purchaseBtnRef={purchaseBtnRef}
                disputeBtnRef={disputeBtnRef}
                onConnectWallet={() => dispatch({ type: "CONNECT_WALLET" })}
                onRetryConnection={() => dispatch({ type: "CONNECT_WALLET" })}
                onOpenPurchase={handleOpenModal}
                onOpenDispute={handleOpenDisputeModal}
              />
            }
          />
        </div>
      </div>

      <SlotCheckoutModal
        isOpen={state.isModalOpen}
        modalRef={modalRef}
        purchaseStep={state.purchaseStep}
        slotId={slot.id}
        slotTitle={slot.title}
        slotDateLabel={slot.dateLabel}
        sellerName={details.seller.name}
        giftDetails={state.giftDetails}
        escrowFee={escrowFee}
        stellarFee={stellarFee}
        effectiveTotalCost={effectiveTotalCost}
        chargedSnapshot={state.chargedSnapshot}
        loadingMessage={state.loadingMessage}
        txHash={state.txHash}
        onClose={handleCloseModal}
        onProceedToConfirm={() => dispatch({ type: "PROCEED_TO_CONFIRM" })}
        onProceedPurchase={handleProceedPurchase}
        onOpenRedeem={() => dispatch({ type: "OPEN_REDEEM" })}
        onOpenReceipt={() => dispatch({ type: "OPEN_RECEIPT" })}
      />

      <SlotDisputeSection
        isOpen={state.isDisputeModalOpen}
        disputeModalRef={disputeModalRef}
        slotId={id}
        disputeView={state.disputeView}
        existingDisputesCount={state.existingDisputes.length}
        currentDispute={state.currentDispute}
        isSubmittingDispute={state.isSubmittingDispute}
        onClose={handleCloseDisputeModal}
        onViewChange={(view) => dispatch({ type: "SET_DISPUTE_VIEW", view })}
        onSubmitDispute={handleSubmitDispute}
        onAddDisputeNote={handleAddDisputeNote}
      />

      <SlotReceiptSection
        slot={slot}
        seller={details.seller}
        durationHours={details.durationHours}
        subtotal={subtotal}
        escrowFee={escrowFee}
        stellarFee={stellarFee}
        totalCost={totalCost}
        effectiveTotalCost={effectiveTotalCost}
        discountPercent={state.discountPercent}
        promoCode={state.promoCode}
        chargedSnapshot={state.chargedSnapshot}
        isSettled={isSettled}
        txHash={state.txHash}
        walletAddress={MOCK_WALLET_ADDRESS}
        isReceiptOpen={state.isReceiptOpen}
        isRedeemModalOpen={state.isRedeemModalOpen}
        onCloseReceipt={() => dispatch({ type: "CLOSE_RECEIPT" })}
        onCloseRedeem={() => dispatch({ type: "CLOSE_REDEEM" })}
      />
    </DashboardShell>
  );
}
