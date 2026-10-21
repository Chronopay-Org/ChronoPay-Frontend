import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BookingAbandonmentBanner } from "./booking-abandonment-banner";

function renderBanner(overrides?: {
  onResume?: () => void;
  onDiscard?: () => void;
  onViewDetails?: () => void;
}) {
  const onResume = overrides?.onResume ?? vi.fn();
  const onDiscard = overrides?.onDiscard ?? vi.fn();
  const onViewDetails = overrides?.onViewDetails ?? vi.fn();

  const utils = render(
    <BookingAbandonmentBanner
      onResume={onResume}
      onDiscard={onDiscard}
      onViewDetails={onViewDetails}
    />,
  );

  const resume = screen.getByRole("button", { name: "Resume booking" });
  const discard = screen.getByRole("button", { name: "Discard booking draft" });
  const details = screen.getByRole("button", { name: "View draft details" });

  return { ...utils, onResume, onDiscard, onViewDetails, resume, discard, details };
}

describe("BookingAbandonmentBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders a region labelled by its heading", () => {
      renderBanner();

      const region = screen.getByRole("region", { name: "Incomplete Booking Draft" });

      expect(region).toBeInTheDocument();
      expect(region).toHaveAttribute("aria-labelledby", "abandonment-banner-title");
      expect(screen.getByRole("heading", { name: "Incomplete Booking Draft" })).toBeInTheDocument();
    });

    it("exposes a polite live region describing the available actions", () => {
      const { container } = renderBanner();

      const live = container.querySelector('[aria-live="polite"]');

      expect(live).not.toBeNull();
      expect(live).toHaveTextContent(
        "You have an incomplete booking draft. You can resume, discard, or view details.",
      );
    });

    it("renders the expiry hint so the user knows the draft is time limited", () => {
      renderBanner();

      expect(screen.getByText(/drafts expire in 24 hours/i)).toBeInTheDocument();
    });

    it("renders exactly the three documented actions", () => {
      renderBanner();

      expect(screen.getAllByRole("button")).toHaveLength(3);
      expect(screen.getByRole("button", { name: "Resume booking" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Discard booking draft" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "View draft details" })).toBeInTheDocument();
    });
  });

  describe("action callbacks", () => {
    it("invokes onResume and only onResume when Resume is activated", () => {
      const { resume, onResume, onDiscard, onViewDetails } = renderBanner();

      fireEvent.click(resume);

      expect(onResume).toHaveBeenCalledTimes(1);
      expect(onDiscard).not.toHaveBeenCalled();
      expect(onViewDetails).not.toHaveBeenCalled();
    });

    it("invokes onDiscard and only onDiscard when Discard is activated", () => {
      const { discard, onResume, onDiscard, onViewDetails } = renderBanner();

      fireEvent.click(discard);

      expect(onDiscard).toHaveBeenCalledTimes(1);
      expect(onResume).not.toHaveBeenCalled();
      expect(onViewDetails).not.toHaveBeenCalled();
    });

    it("invokes onViewDetails and only onViewDetails when Details is activated", () => {
      const { details, onResume, onDiscard, onViewDetails } = renderBanner();

      fireEvent.click(details);

      expect(onViewDetails).toHaveBeenCalledTimes(1);
      expect(onResume).not.toHaveBeenCalled();
      expect(onDiscard).not.toHaveBeenCalled();
    });

    it("invokes the handler once per activation", () => {
      const { resume, onResume } = renderBanner();

      fireEvent.click(resume);
      fireEvent.click(resume);

      expect(onResume).toHaveBeenCalledTimes(2);
    });
  });

  describe("primary action focus", () => {
    it("moves focus to the Resume button on mount", () => {
      const { resume } = renderBanner();

      expect(resume).toHaveFocus();
    });

    it("does not steal focus away again when it re-renders", () => {
      const { resume, discard, rerender } = renderBanner();

      expect(resume).toHaveFocus();

      discard.focus();
      expect(discard).toHaveFocus();

      rerender(
        <BookingAbandonmentBanner onResume={vi.fn()} onDiscard={vi.fn()} onViewDetails={vi.fn()} />,
      );

      expect(discard).toHaveFocus();
      expect(resume).not.toHaveFocus();
    });

    it("uses the latest handler after re-render rather than the initial one", () => {
      const first = vi.fn();
      const second = vi.fn();
      const { resume, rerender } = renderBanner({ onResume: first });

      rerender(
        <BookingAbandonmentBanner onResume={second} onDiscard={vi.fn()} onViewDetails={vi.fn()} />,
      );

      fireEvent.click(resume);

      expect(second).toHaveBeenCalledTimes(1);
      expect(first).not.toHaveBeenCalled();
    });
  });

  describe("boundary inputs", () => {
    it("does not throw when an action handler is a no-op", () => {
      const { resume, discard, details } = renderBanner({
        onResume: () => {},
        onDiscard: () => {},
        onViewDetails: () => {},
      });

      expect(() => {
        fireEvent.click(discard);
        fireEvent.click(details);
        fireEvent.click(resume);
      }).not.toThrow();
    });
  });
});
