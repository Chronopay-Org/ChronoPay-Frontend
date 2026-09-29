import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelpPopover, type HelpPopoverProps } from "./help-popover";

const baseTerm = {
  title: "Pending escrow",
  body: "The total value of time tokens currently held in escrow.",
  learnMoreHref: "/docs/glossary#escrow",
  learnMoreLabel: "Learn more about escrow",
};

describe("HelpPopover", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("renders the term information and default trigger label", () => {
    render(<HelpPopover term={baseTerm} />);

    const trigger = screen.getByRole("button", {
      name: "Help: Pending escrow",
    });

    expect(trigger).toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("respects custom triggerLabel and className props", () => {
    const props: HelpPopoverProps = {
      term: baseTerm,
      triggerLabel: "Explain pending escrow",
      className: "custom-help",
    };

    render(<HelpPopover {...props} />);

    const trigger = screen.getByRole("button", {
      name: "Explain pending escrow",
    });

    expect(trigger.parentElement).toHaveClass("custom-help");
  });

  it("opens on click and renders the full popover content", () => {
    render(<HelpPopover term={baseTerm} />);

    const trigger = screen.getByRole("button", {
      name: "Help: Pending escrow",
    });

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Pending escrow")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The total value of time tokens currently held in escrow.",
      ),
    ).toBeInTheDocument();

    const learnMore = screen.getByRole("link", {
      name: "Learn more about escrow",
    });

    expect(learnMore).toHaveAttribute("href", "/docs/glossary#escrow");
    expect(learnMore).not.toHaveAttribute("target");
    expect(learnMore).not.toHaveAttribute("rel");

    vi.runAllTimers();

    expect(
      screen.getByRole("button", { name: "Close help popover" }),
    ).toHaveFocus();
  });

  it("closes with the close button and returns focus to the trigger", () => {
    render(<HelpPopover term={baseTerm} />);

    const trigger = screen.getByRole("button", {
      name: "Help: Pending escrow",
    });

    fireEvent.click(trigger);
    vi.runAllTimers();

    fireEvent.click(
      screen.getByRole("button", { name: "Close help popover" }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(trigger).toHaveFocus();
  });

  it("closes with Escape from inside the popover", () => {
    render(<HelpPopover term={baseTerm} />);

    const trigger = screen.getByRole("button", {
      name: "Help: Pending escrow",
    });

    fireEvent.click(trigger);
    vi.runAllTimers();

    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes when clicking outside the trigger and popover", () => {
    render(
      <div>
        <HelpPopover term={baseTerm} />
        <button type="button">Outside</button>
      </div>,
    );

    const trigger = screen.getByRole("button", {
      name: "Help: Pending escrow",
    });

    fireEvent.click(trigger);
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.mouseDown(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("toggles with Enter and Space on the trigger", () => {
    render(<HelpPopover term={baseTerm} />);

    const trigger = screen.getByRole("button", {
      name: "Help: Pending escrow",
    });

    fireEvent.keyDown(trigger, { key: "Enter" });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(trigger, { key: " " });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("supports external learn-more links with a new tab and safe rel attributes", () => {
    render(
      <HelpPopover
        term={{
          ...baseTerm,
          learnMoreHref: "https://example.com/help",
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Help: Pending escrow",
      }),
    );

    const link = screen.getByRole("link", { name: "Learn more about escrow" });

    expect(link).toHaveAttribute("href", "https://example.com/help");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("omits the learn-more link when learnMoreHref is empty", () => {
    render(
      <HelpPopover
        term={{
          title: "",
          body: "",
          learnMoreHref: "",
          learnMoreLabel: "Custom label",
        }}
      />,
    );

    const trigger = screen.getByRole("button", {
      name: "Help:",
    });

    fireEvent.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.queryByText("Custom label")).not.toBeInTheDocument();
  });

  it("handles Escape safely while already closed", () => {
    render(<HelpPopover term={baseTerm} />);

    const trigger = screen.getByRole("button", {
      name: "Help: Pending escrow",
    });

    expect(() => {
      fireEvent.keyDown(trigger, { key: "Escape" });
    }).not.toThrow();

    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("uses the bottom placement when there is not enough space above", () => {
    render(<HelpPopover term={baseTerm} />);

    const trigger = screen.getByRole("button", {
      name: "Help: Pending escrow",
    });

    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog");

    expect(dialog.className).toContain("top-full");
    expect(dialog.className).toContain("mt-2");
  });

  it("uses the top placement when there is enough space above", () => {
    render(<HelpPopover term={baseTerm} />);

    const trigger = screen.getByRole("button", {
      name: "Help: Pending escrow",
    });

    vi.spyOn(trigger, "getBoundingClientRect").mockReturnValue({
      top: 500,
      bottom: 520,
      left: 100,
      right: 120,
      width: 20,
      height: 20,
      x: 100,
      y: 500,
      toJSON: () => ({}),
    });

    fireEvent.click(trigger);

    const dialog = screen.getByRole("dialog");

    expect(dialog.className).toContain("bottom-full");
    expect(dialog.className).toContain("mb-2");
  });
});