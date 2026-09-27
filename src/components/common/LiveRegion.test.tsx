import React, { useState } from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { LiveRegion } from "./LiveRegion";

// ── LiveRegion ────────────────────────────────────────────────────────────────
//
// LiveRegion is an assistive-only surface: it must stay in the accessibility
// tree (never `display:none`), always be atomic, and expose a deterministic
// politeness contract so screen readers announce the *whole* updated message.
// These tests pin the public props and the announced content.

describe("LiveRegion", () => {
  it("renders its children inside the live region", () => {
    render(<LiveRegion>Payment sent</LiveRegion>);

    expect(screen.getByRole("status")).toHaveTextContent("Payment sent");
  });

  it("defaults to role=status, aria-live=polite and aria-atomic=true", () => {
    render(<LiveRegion>Saved</LiveRegion>);

    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(region).toHaveAttribute("aria-atomic", "true");
  });

  it("stays in the accessibility tree via the sr-only utility class", () => {
    render(<LiveRegion>Saved</LiveRegion>);

    // A visually hidden region must not use `display: none`, otherwise it is
    // removed from the accessibility tree and never announced.
    expect(screen.getByRole("status")).toHaveClass("sr-only");
  });

  it("honours a custom role", () => {
    render(
      <LiveRegion role="alert" ariaLive="assertive">
        Escrow release failed
      </LiveRegion>,
    );

    const region = screen.getByRole("alert");
    expect(region).toHaveTextContent("Escrow release failed");
    expect(region).toHaveAttribute("aria-live", "assertive");
  });

  it("supports every documented politeness value", () => {
    const { rerender } = render(<LiveRegion ariaLive="off">Quiet</LiveRegion>);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "off");

    rerender(<LiveRegion ariaLive="polite">Polite</LiveRegion>);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");

    rerender(<LiveRegion ariaLive="assertive">Loud</LiveRegion>);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "assertive");
  });

  it("forwards the id so consumers can target a specific region", () => {
    render(<LiveRegion id="checkout-status">Ready</LiveRegion>);

    const region = document.getElementById("checkout-status");
    expect(region).not.toBeNull();
    expect(region).toHaveTextContent("Ready");
  });

  it("announces updated content as the message transitions", () => {
    function Harness() {
      const [status, setStatus] = useState("Saving…");
      return (
        <div>
          <button data-testid="finish" onClick={() => setStatus("Saved")}>
            finish
          </button>
          <LiveRegion>{status}</LiveRegion>
        </div>
      );
    }

    render(<Harness />);
    expect(screen.getByRole("status")).toHaveTextContent("Saving…");

    act(() => {
      screen.getByTestId("finish").click();
    });

    // The same node is reused: live regions announce content changes in place.
    expect(screen.getByRole("status")).toHaveTextContent("Saved");
    expect(screen.getByRole("status")).not.toHaveTextContent("Saving…");
  });

  it("renders an empty but valid region when there is nothing to announce", () => {
    render(<LiveRegion>{null}</LiveRegion>);

    const region = screen.getByRole("status");
    expect(region).toBeInTheDocument();
    expect(region).toBeEmptyDOMElement();
  });

  it("keeps multiple regions independent", () => {
    render(
      <div>
        <LiveRegion ariaLive="polite">First message</LiveRegion>
        <LiveRegion ariaLive="assertive" role="alert">
          Second message
        </LiveRegion>
      </div>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("First message");
    expect(screen.getByRole("alert")).toHaveTextContent("Second message");
    expect(screen.getByRole("alert")).not.toHaveTextContent("First message");
  });
});
