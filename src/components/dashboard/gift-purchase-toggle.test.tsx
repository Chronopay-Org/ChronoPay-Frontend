/**
 * Focused behavior coverage for `GiftDetails` / `GiftPurchaseToggle`.
 *
 * `gift-purchase-toggle.tsx` is the checkout gift flow. It owns the gift
 * `GiftDetails` shape, the email validity gate, the 240-char message budget,
 * the emoji inserter and the handoff-method selection. This suite pins those
 * contracts, the primary on/off and method transitions, and the failure/
 * boundary paths (invalid + empty email, over-length message, no-op without a
 * change listener).
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GiftPurchaseToggle, type GiftDetails } from "./gift-purchase-toggle";

const MESSAGE_LIMIT = 240;

function renderToggle(onChange?: (details: GiftDetails) => void) {
  return render(<GiftPurchaseToggle onChange={onChange} />);
}

function enableGift() {
  fireEvent.click(screen.getByRole("switch"));
}

// ─── GiftDetails shape / toggle transition ───────────────────────────────────

describe("GiftPurchaseToggle gift transition", () => {
  it("starts disabled with the gift panel hidden", () => {
    renderToggle();

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByLabelText("Recipient name")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Recipient email")).not.toBeInTheDocument();
  });

  it("enables the gift panel and emits the initial GiftDetails", () => {
    const onChange = vi.fn();
    renderToggle(onChange);

    enableGift();

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByLabelText("Recipient name")).toBeInTheDocument();
    expect(screen.getByLabelText("Recipient email")).toBeInTheDocument();
    expect(screen.getByLabelText("Personalized message")).toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith({
      isGift: true,
      recipientName: "",
      recipientEmail: "",
      message: "",
      handoffMethod: "email",
    });
  });

  it("returns to the disabled state when toggled back off", () => {
    const onChange = vi.fn();
    renderToggle(onChange);

    enableGift();
    fireEvent.click(screen.getByRole("switch"));

    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "false");
    expect(screen.queryByLabelText("Recipient name")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ isGift: false }),
    );
  });

  it("does not throw when rendered without a change listener", () => {
    renderToggle();
    expect(() => enableGift()).not.toThrow();
    expect(screen.getByLabelText("Recipient name")).toBeInTheDocument();
  });
});

// ─── recipient fields ────────────────────────────────────────────────────────

describe("GiftDetails recipient fields", () => {
  it("emits the recipient name as it is typed", () => {
    const onChange = vi.fn();
    renderToggle(onChange);
    enableGift();

    fireEvent.change(screen.getByLabelText("Recipient name"), {
      target: { value: "Amara Okafor" },
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ recipientName: "Amara Okafor" }),
    );
  });

  it("emits the recipient email as it is typed", () => {
    const onChange = vi.fn();
    renderToggle(onChange);
    enableGift();

    fireEvent.change(screen.getByLabelText("Recipient email"), {
      target: { value: "amara@example.com" },
    });

    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ recipientEmail: "amara@example.com" }),
    );
  });
});

// ─── email failure contract ──────────────────────────────────────────────────

describe("GiftDetails email validation", () => {
  it("does not flag the email before it is touched", () => {
    renderToggle();
    enableGift();

    fireEvent.change(screen.getByLabelText("Recipient email"), {
      target: { value: "not-an-email" },
    });

    expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument();
  });

  it("flags an invalid email once it is blurred", () => {
    renderToggle();
    enableGift();
    const email = screen.getByLabelText("Recipient email");

    fireEvent.change(email, { target: { value: "not-an-email" } });
    fireEvent.blur(email);

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "true");
  });

  it.each(["plainaddress", "missing@domain", "@no-local.com", "space in@mail.com"])(
    "rejects malformed address %s",
    (value) => {
      renderToggle();
      enableGift();
      const email = screen.getByLabelText("Recipient email");

      fireEvent.change(email, { target: { value } });
      fireEvent.blur(email);

      expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    },
  );

  it("reports the required-error for an empty blurred email", () => {
    renderToggle();
    enableGift();
    const email = screen.getByLabelText("Recipient email");

    fireEvent.blur(email);

    expect(screen.getByText("Recipient email is required for gifting.")).toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "true");
  });

  it("clears the error for a valid address", () => {
    renderToggle();
    enableGift();
    const email = screen.getByLabelText("Recipient email");

    fireEvent.change(email, { target: { value: "amara@example.com" } });
    fireEvent.blur(email);

    expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument();
    expect(email).toHaveAttribute("aria-invalid", "false");
  });
});

// ─── message budget / boundary ───────────────────────────────────────────────

describe("GiftDetails message budget", () => {
  it("tracks the remaining character count", () => {
    renderToggle();
    enableGift();

    expect(screen.getByText(`${MESSAGE_LIMIT} characters left`)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Personalized message"), {
      target: { value: "hello" },
    });

    expect(screen.getByText(`${MESSAGE_LIMIT - 5} characters left`)).toBeInTheDocument();
  });

  it("clips input past the 240-character budget", () => {
    const onChange = vi.fn();
    renderToggle(onChange);
    enableGift();

    fireEvent.change(screen.getByLabelText("Personalized message"), {
      target: { value: "a".repeat(300) },
    });

    expect(screen.getByLabelText("Personalized message")).toHaveValue("a".repeat(MESSAGE_LIMIT));
    expect(screen.getByText("0 characters left")).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ message: "a".repeat(MESSAGE_LIMIT) }),
    );
  });

  it("clips a message that would overflow when an emoji is inserted", () => {
    renderToggle();
    enableGift();

    fireEvent.change(screen.getByLabelText("Personalized message"), {
      target: { value: "a".repeat(MESSAGE_LIMIT) },
    });

    fireEvent.click(screen.getByRole("button", { name: "Insert emoji" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Insert 🎁" }));

    expect(screen.getByLabelText("Personalized message")).toHaveValue("a".repeat(MESSAGE_LIMIT));
    expect(screen.getByText("0 characters left")).toBeInTheDocument();
  });

  it("toggles the emoji picker and appends the picked emoji", () => {
    const onChange = vi.fn();
    renderToggle(onChange);
    enableGift();

    const trigger = screen.getByRole("button", { name: "Insert emoji" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByRole("menuitem", { name: "Insert 🎉" }));

    expect(screen.getByLabelText("Personalized message")).toHaveValue("🎉");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ message: "🎉" }));
  });
});

// ─── handoff method transitions ──────────────────────────────────────────────

describe("GiftDetails handoff method", () => {
  it("defaults to email and switches to the chosen method", () => {
    const onChange = vi.fn();
    renderToggle(onChange);
    enableGift();

    expect(screen.getByText("Delivered via email")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("radio", { name: /qr code/i }));

    expect(screen.getByText("Delivered via qr code")).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ handoffMethod: "qr" }),
    );
  });

  it("can switch to the share-link method", () => {
    renderToggle();
    enableGift();

    fireEvent.click(screen.getByRole("radio", { name: /share link/i }));

    expect(screen.getByText("Delivered via share link")).toBeInTheDocument();
  });
});

// ─── preview rendering ───────────────────────────────────────────────────────

describe("GiftDetails preview", () => {
  it("falls back to placeholder recipient values", () => {
    renderToggle();
    enableGift();

    expect(screen.getByText("Your recipient")).toBeInTheDocument();
    expect(screen.getByText("recipient@example.com")).toBeInTheDocument();
    expect(
      screen.getByText("Your personalized message will appear here."),
    ).toBeInTheDocument();
  });

  it("uses trimmed recipient values when present", () => {
    renderToggle();
    enableGift();

    fireEvent.change(screen.getByLabelText("Recipient name"), {
      target: { value: "  Amara  " },
    });
    fireEvent.change(screen.getByLabelText("Recipient email"), {
      target: { value: "  amara@example.com  " },
    });
    fireEvent.change(screen.getByLabelText("Personalized message"), {
      target: { value: "Happy booking!" },
    });

    expect(screen.getByText("Amara")).toBeInTheDocument();
    expect(screen.getByText("amara@example.com")).toBeInTheDocument();
    expect(screen.getByText("Happy booking!")).toBeInTheDocument();
  });

  it("keeps the placeholder for a whitespace-only recipient name", () => {
    renderToggle();
    enableGift();

    fireEvent.change(screen.getByLabelText("Recipient name"), {
      target: { value: "   " },
    });

    expect(screen.getByText("Your recipient")).toBeInTheDocument();
  });
});
