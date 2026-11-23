import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ReviewCard } from "./review-card";

describe("ReviewCard", () => {
  const defaultProps = {
    id: "r1",
    authorName: "John Doe",
    rating: 4,
    date: "2023-10-01",
    content: "Great product!",
  };

  it("renders review details correctly", () => {
    render(<ReviewCard {...defaultProps} />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("2023-10-01")).toBeInTheDocument();
    expect(screen.getByText("Great product!")).toBeInTheDocument();
    expect(screen.queryByTitle("Verified Buyer")).not.toBeInTheDocument();
  });

  it("renders verified badge when isVerified is true", () => {
    render(<ReviewCard {...defaultProps} isVerified={true} />);
    expect(screen.getByTitle("Verified Buyer")).toBeInTheDocument();
  });

  it("renders flagged badge when isAlreadyFlagged is true", () => {
    render(<ReviewCard {...defaultProps} isAlreadyFlagged={true} />);
    expect(screen.getByTestId("review-flagged-badge")).toHaveTextContent("Flagged");
  });

  it("handles helpful toggle", async () => {
    const onHelpfulToggle = vi.fn();
    render(<ReviewCard {...defaultProps} helpfulCount={10} onHelpfulToggle={onHelpfulToggle} />);

    const user = userEvent.setup();
    const helpfulBtn = screen.getByRole("button", { name: /Helpful \(10\)/i });
    await user.click(helpfulBtn);
    expect(onHelpfulToggle).toHaveBeenCalledWith("r1");
  });

  it("opens ReviewModerationFlagModal and handles submission", async () => {
    const onReport = vi.fn();
    const onFlag = vi.fn();
    render(<ReviewCard {...defaultProps} onReport={onReport} onFlag={onFlag} />);

    const user = userEvent.setup();

    // Open overflow menu
    await user.click(screen.getByRole("button", { name: /More options/i }));

    // Click report
    const reportBtn = await screen.findByRole("menuitem", { name: /Report review/i });
    await user.click(reportBtn);

    // Modal should be open
    const dialog = await screen.findByRole("dialog", { name: /Flag this review/i });
    expect(dialog).toBeInTheDocument();

    // Select a reason and fill context
    await user.click(screen.getByLabelText(/Inappropriate content/i));
    await user.type(screen.getByLabelText(/Additional context/i), "Inappropriate content");

    // Submit
    await user.click(screen.getByRole("button", { name: /Submit report/i }));

    expect(onFlag).toHaveBeenCalledWith("r1", "inappropriate", "Inappropriate content");
    expect(onReport).toHaveBeenCalledWith("r1", "Inappropriate content");

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("passes isAlreadyFlagged and isOffline to ReviewModerationFlagModal", async () => {
    render(<ReviewCard {...defaultProps} isAlreadyFlagged={true} isOffline={true} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /More options/i }));
    await user.click(await screen.findByRole("menuitem", { name: /Report review/i }));

    expect(
      screen.getByText(/already being reviewed by our moderation team/i)
    ).toBeInTheDocument();
  });
});
