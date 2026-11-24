import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StateCard } from "./state-card";

describe("StateCard", () => {
  it("renders the loading state with polite live region, sr-only message, hidden skeleton, and review button", () => {
    const { container } = render(<StateCard state="loading" />);

    const card = screen.getByRole("article");
    expect(card).toHaveAttribute("aria-live", "polite");

    expect(screen.getByText("Loading state")).toBeInTheDocument();
    const title = screen.getByText("Syncing dashboard signals");
    expect(title).toBeInTheDocument();
    expect(card).toHaveAttribute("aria-labelledby", title.id);

    const badge = screen.getByLabelText("Dashboard state: loading");
    expect(badge).toHaveTextContent("loading");
    expect(badge).toHaveClass("bg-sky-400/10", "text-sky-100");

    const message = screen.getByText(
      "Use progressive disclosure so the dashboard still feels active while wallet and booking data sync."
    );
    expect(message).toHaveClass("sr-only");
    expect(card).toHaveAttribute("aria-describedby", `${message.id} ${badge.id}`);

    const skeletonGroup = container.querySelector('[aria-hidden="true"]');
    expect(skeletonGroup).toBeInTheDocument();
    expect(skeletonGroup?.querySelectorAll(".skeleton")).toHaveLength(3);

    const button = screen.getByRole("button", {
      name: "Review loading dashboard state details",
    });
    expect(button).toHaveTextContent("Review details");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("aria-describedby", message.id);
  });

  it("renders the empty state without aria-live, with warning badge, visible message, and review button", () => {
    const { container } = render(<StateCard state="empty" />);

    const card = screen.getByRole("article");
    expect(card).not.toHaveAttribute("aria-live");

    expect(screen.getByText("Empty state")).toBeInTheDocument();
    const title = screen.getByText("No templates saved yet");
    expect(title).toBeInTheDocument();
    expect(card).toHaveAttribute("aria-labelledby", title.id);

    const badge = screen.getByLabelText("Dashboard state: empty");
    expect(badge).toHaveTextContent("empty");
    expect(badge).toHaveClass("bg-amber-400/10", "text-amber-100");

    const message = screen.getByText(
      "Show the next best action when nothing has been listed yet instead of leaving dead space."
    );
    expect(message).not.toHaveClass("sr-only");
    expect(card).toHaveAttribute("aria-describedby", `${message.id} ${badge.id}`);
    expect(container.querySelector(".skeleton")).not.toBeInTheDocument();

    const button = screen.getByRole("button", {
      name: "Review empty dashboard state details",
    });
    expect(button).toHaveTextContent("Review details");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("aria-describedby", message.id);
  });

  it("renders the error state without aria-live, with critical badge, visible message, and retry button", () => {
    const { container } = render(<StateCard state="error" />);

    const card = screen.getByRole("article");
    expect(card).not.toHaveAttribute("aria-live");

    expect(screen.getByText("Error state")).toBeInTheDocument();
    const title = screen.getByText("Wallet sync interrupted");
    expect(title).toBeInTheDocument();
    expect(card).toHaveAttribute("aria-labelledby", title.id);

    const badge = screen.getByLabelText("Dashboard state: error");
    expect(badge).toHaveTextContent("error");
    expect(badge).toHaveClass("bg-rose-400/10", "text-rose-100");

    const message = screen.getByText(
      "Call out service failures clearly and keep a retry path visible without hiding the rest of the overview."
    );
    expect(message).not.toHaveClass("sr-only");
    expect(card).toHaveAttribute("aria-describedby", `${message.id} ${badge.id}`);
    expect(container.querySelector(".skeleton")).not.toBeInTheDocument();

    const button = screen.getByRole("button", {
      name: "Retry wallet and booking sync",
    });
    expect(button).toHaveTextContent("Retry sync");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("aria-describedby", message.id);
  });
});
