import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  ReviewComposer,
  type ReviewCriterion,
  type ReviewSubmissionData,
} from "./review-composer";

const CRITERIA: ReviewCriterion[] = [
  { id: "quality", label: "Quality" },
  { id: "delivery", label: "Delivery", description: "How fast was it?" },
];

function createImageFile(name = "photo.png"): File {
  return new File(["test"], name, { type: "image/png" });
}

beforeEach(() => {
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn(() => "blob:mock"),
    revokeObjectURL: vi.fn(),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ReviewComposer", () => {
  it("renders all criteria passed in", () => {
    render(<ReviewComposer criteria={CRITERIA} />);
    expect(screen.getByText("Quality")).toBeInTheDocument();
    expect(screen.getByText("Delivery")).toBeInTheDocument();
    expect(screen.getByText("How fast was it?")).toBeInTheDocument();
  });

  it("updates the rating when a star is clicked", async () => {
    const user = userEvent.setup();
    render(<ReviewComposer criteria={CRITERIA} />);

    const fourthStar = screen.getAllByRole("button", { name: "4 stars" })[0];
    await user.click(fourthStar);

    expect(fourthStar).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps the submit button disabled until all criteria are rated and a comment is present", async () => {
    const user = userEvent.setup();
    render(<ReviewComposer criteria={CRITERIA} />);

    const submit = screen.getByRole("button", { name: /submit review/i });
    expect(submit).toBeDisabled();

    await user.click(screen.getAllByRole("button", { name: "5 stars" })[0]);
    expect(submit).toBeDisabled();

    await user.click(screen.getAllByRole("button", { name: "5 stars" })[1]);
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText(/your comment/i), "Great product");
    expect(submit).toBeEnabled();
  });

  it("respects maxCommentLength", async () => {
    const user = userEvent.setup();
    render(<ReviewComposer criteria={CRITERIA} maxCommentLength={10} />);

    const textarea = screen.getByLabelText(/your comment/i) as HTMLTextAreaElement;
    await user.type(textarea, "abcdefghijklmno");

    expect(textarea.value.length).toBeLessThanOrEqual(10);
  });

  it("calls onSubmit with the correct shape when valid", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(<ReviewComposer criteria={CRITERIA} onSubmit={onSubmit} />);

    for (const btn of screen.getAllByRole("button", { name: "5 stars" })) {
      await user.click(btn);
    }
    await user.type(screen.getByLabelText(/your comment/i), "All good");
    await user.click(screen.getByRole("button", { name: /submit review/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const payload = onSubmit.mock.calls[0][0] as ReviewSubmissionData;
    expect(payload.ratings).toEqual({ quality: 5, delivery: 5 });
    expect(payload.comment).toBe("All good");
    expect(payload.photos).toEqual([]);
  });

  it("calls onSaveDraft with current state", async () => {
    const user = userEvent.setup();
    const onSaveDraft = vi.fn();
    render(<ReviewComposer criteria={CRITERIA} onSaveDraft={onSaveDraft} />);

    await user.click(screen.getAllByRole("button", { name: "3 stars" })[0]);
    await user.type(screen.getByLabelText(/your comment/i), "Draft");
    await user.click(screen.getByRole("button", { name: /save as draft/i }));

    expect(onSaveDraft).toHaveBeenCalledTimes(1);
    const payload = onSaveDraft.mock.calls[0][0] as ReviewSubmissionData;
    expect(payload.ratings).toEqual({ quality: 3 });
    expect(payload.comment).toBe("Draft");
  });

  it("applies the className prop to the section", () => {
    const { container } = render(
      <ReviewComposer criteria={CRITERIA} className="custom-class" />
    );
    expect(container.querySelector("section")).toHaveClass("custom-class");
  });

  it("does not add more photos than maxPhotos allows", async () => {
    const user = userEvent.setup();
    render(<ReviewComposer criteria={CRITERIA} maxPhotos={2} />);

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;

    const files = [
      createImageFile("a.png"),
      createImageFile("b.png"),
      createImageFile("c.png"),
    ];
    await user.upload(fileInput, files);

      // The photos are capped at maxPhotos=2, so the counter should never show 3.
    const counterText = screen.getByText((content) =>
      /photos uploaded/i.test(content)
    );
    expect(counterText).toBeInTheDocument();
    expect(counterText.textContent).not.toMatch(/^3\//);
  });

  it("renders without crashing when criteria is empty", () => {
    render(<ReviewComposer criteria={[]} />);
    expect(screen.getByLabelText(/review composer/i)).toBeInTheDocument();
  });

  it("clears photo alt text error once alt text is filled", async () => {
    const user = userEvent.setup();
    render(<ReviewComposer criteria={CRITERIA} />);

    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    await user.upload(fileInput, createImageFile());

    expect(
      screen.getByText(/alt text is required before submitting/i)
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/alt text \(required\)/i),
      "A description"
    );

    expect(
      screen.queryByText(/alt text is required before submitting/i)
    ).not.toBeInTheDocument();
  });
});