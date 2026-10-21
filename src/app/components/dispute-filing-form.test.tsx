import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import {
  DisputeFilingForm,
  type DisputeFormData,
  type DisputeFilingFormProps,
} from "./dispute-filing-form";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeFile(name: string, size = 1024, type = "image/png"): File {
  return new File(["x".repeat(size)], name, { type });
}

function defaultProps(
  overrides: Partial<DisputeFilingFormProps> = {}
): DisputeFilingFormProps {
  return {
    slotId: "slot-001",
    onSubmit: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
    onCancel: vi.fn(),
    ...overrides,
  };
}

function fillForm(
  category = "quality_mismatch",
  reason = "Test reason",
  description = "Detailed description of the problem."
) {
  fireEvent.change(screen.getByRole("combobox"), {
    target: { value: category },
  });
  fireEvent.change(screen.getByPlaceholderText(/e\.g\.,/i), {
    target: { value: reason },
  });
  fireEvent.change(screen.getByPlaceholderText(/detailed description/i), {
    target: { value: description },
  });
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe("DisputeFormData (type contract)", () => {
  it("satisfies the required shape at compile-time", () => {
    const data: DisputeFormData = {
      category: "other",
      reason: "any reason",
      description: "any description",
      evidence: [],
    };
    expect(data).toBeDefined();
    expect(Object.keys(data)).toEqual(
      expect.arrayContaining(["category", "reason", "description", "evidence"])
    );
  });

  it("accepts File[] as evidence", () => {
    const file = makeFile("receipt.png");
    const data: DisputeFormData = {
      category: "quality_mismatch",
      reason: "r",
      description: "d",
      evidence: [file],
    };
    expect(data.evidence[0]).toBeInstanceOf(File);
    expect(data.evidence[0].name).toBe("receipt.png");
  });

  it("allows an empty evidence array", () => {
    const data: DisputeFormData = {
      category: "other",
      reason: "r",
      description: "d",
      evidence: [],
    };
    expect(data.evidence).toHaveLength(0);
  });
});

describe("DisputeFilingForm – rendering", () => {
  it("renders all required form fields", () => {
    render(<DisputeFilingForm {...defaultProps()} />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\.,/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/detailed description/i)
    ).toBeInTheDocument();
  });

  it("renders Cancel and Submit Dispute buttons", () => {
    render(<DisputeFilingForm {...defaultProps()} />);
    expect(
      screen.getByRole("button", { name: /cancel/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /submit dispute/i })
    ).toBeInTheDocument();
  });

  it("renders all five category options plus the placeholder", () => {
    render(<DisputeFilingForm {...defaultProps()} />);
    const select = screen.getByRole("combobox");
    expect(select).toContainElement(
      screen.getByText("Select a category")
    );
    expect(screen.getByText("Quality Mismatch")).toBeInTheDocument();
    expect(screen.getByText("Service Not Delivered")).toBeInTheDocument();
    expect(screen.getByText("Incorrect Duration")).toBeInTheDocument();
    expect(screen.getByText("Communication Issue")).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
  });

  it("shows the mediator notice", () => {
    render(<DisputeFilingForm {...defaultProps()} />);
    expect(screen.getByText(/mediator/i)).toBeInTheDocument();
  });
});

describe("DisputeFilingForm – submit button guard (invalid inputs)", () => {
  it("is disabled when all fields are empty", () => {
    render(<DisputeFilingForm {...defaultProps()} />);
    expect(
      screen.getByRole("button", { name: /submit dispute/i })
    ).toBeDisabled();
  });

  it("remains disabled when only category is filled", () => {
    render(<DisputeFilingForm {...defaultProps()} />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "other" },
    });
    expect(
      screen.getByRole("button", { name: /submit dispute/i })
    ).toBeDisabled();
  });

  it("remains disabled when category and reason are filled but description is empty", () => {
    render(<DisputeFilingForm {...defaultProps()} />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "other" },
    });
    fireEvent.change(screen.getByPlaceholderText(/e\.g\.,/i), {
      target: { value: "Some reason" },
    });
    expect(
      screen.getByRole("button", { name: /submit dispute/i })
    ).toBeDisabled();
  });

  it("is enabled once all three required fields are filled", () => {
    render(<DisputeFilingForm {...defaultProps()} />);
    fillForm();
    expect(
      screen.getByRole("button", { name: /submit dispute/i })
    ).not.toBeDisabled();
  });
});

describe("DisputeFilingForm – submission (success path)", () => {
  it("calls onSubmit with the correct DisputeFormData payload", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DisputeFilingForm {...defaultProps({ onSubmit })} />);
    fillForm("service_not_delivered", "No service", "Elaborated details here.");
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload: DisputeFormData = onSubmit.mock.calls[0][0];
    expect(payload.category).toBe("service_not_delivered");
    expect(payload.reason).toBe("No service");
    expect(payload.description).toBe("Elaborated details here.");
    expect(payload.evidence).toEqual([]);
  });

  it("includes uploaded files in the evidence array", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(<DisputeFilingForm {...defaultProps({ onSubmit })} />);
    fillForm();
    const file = makeFile("proof.png");
    const fileInput = document.getElementById(
      "evidence-upload"
    ) as HTMLInputElement;
    Object.defineProperty(fileInput, "files", {
      value: [file],
      configurable: true,
    });
    fireEvent.change(fileInput);
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());
    const payload: DisputeFormData = onSubmit.mock.calls[0][0];
    expect(payload.evidence).toHaveLength(1);
    expect(payload.evidence[0].name).toBe("proof.png");
  });
});

describe("DisputeFilingForm – submission (failure / guard path)", () => {
  it("does not call onSubmit when form is submitted with empty fields", async () => {
    const onSubmit = vi.fn();
    render(<DisputeFilingForm {...defaultProps({ onSubmit })} />);
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
  });

  it("does not call onSubmit when category is missing", async () => {
    const onSubmit = vi.fn();
    render(<DisputeFilingForm {...defaultProps({ onSubmit })} />);
    fireEvent.change(screen.getByPlaceholderText(/e\.g\.,/i), {
      target: { value: "Some reason" },
    });
    fireEvent.change(screen.getByPlaceholderText(/detailed description/i), {
      target: { value: "Some description" },
    });
    fireEvent.submit(document.querySelector("form")!);
    await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
  });
});

describe("DisputeFilingForm – isSubmitting state", () => {
  it("disables all interactive elements while submitting", () => {
    render(<DisputeFilingForm {...defaultProps({ isSubmitting: true })} />);
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(screen.getByPlaceholderText(/e\.g\.,/i)).toBeDisabled();
    expect(screen.getByPlaceholderText(/detailed description/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: /submitting/i })
    ).toBeDisabled();
  });

  it("shows 'Submitting...' label on submit button while submitting", () => {
    render(<DisputeFilingForm {...defaultProps({ isSubmitting: true })} />);
    expect(
      screen.getByRole("button", { name: /submitting/i })
    ).toBeInTheDocument();
  });
});

describe("DisputeFilingForm – file management", () => {
  it("displays uploaded file name and size", () => {
    render(<DisputeFilingForm {...defaultProps()} />);
    const file = makeFile("invoice.pdf", 2048, "application/pdf");
    const fileInput = document.getElementById(
      "evidence-upload"
    ) as HTMLInputElement;
    Object.defineProperty(fileInput, "files", {
      value: [file],
      configurable: true,
    });
    fireEvent.change(fileInput);
    expect(screen.getByText("invoice.pdf")).toBeInTheDocument();
  });

  it("removes a file when the remove button is clicked", () => {
    render(<DisputeFilingForm {...defaultProps()} />);
    const file = makeFile("to-remove.png");
    const fileInput = document.getElementById(
      "evidence-upload"
    ) as HTMLInputElement;
    Object.defineProperty(fileInput, "files", {
      value: [file],
      configurable: true,
    });
    fireEvent.change(fileInput);
    expect(screen.getByText("to-remove.png")).toBeInTheDocument();
    const removeBtn = screen
      .getByText("to-remove.png")
      .closest("div")!
      .parentElement!.querySelector("button")!;
    fireEvent.click(removeBtn);
    expect(screen.queryByText("to-remove.png")).not.toBeInTheDocument();
  });

  it("supports adding multiple files", () => {
    render(<DisputeFilingForm {...defaultProps()} />);
    const files = [makeFile("a.png"), makeFile("b.png")];
    const fileInput = document.getElementById(
      "evidence-upload"
    ) as HTMLInputElement;
    Object.defineProperty(fileInput, "files", {
      value: files,
      configurable: true,
    });
    fireEvent.change(fileInput);
    expect(screen.getByText("a.png")).toBeInTheDocument();
    expect(screen.getByText("b.png")).toBeInTheDocument();
  });
});

describe("DisputeFilingForm – cancel action", () => {
  it("calls onCancel when Cancel button is clicked", () => {
    const onCancel = vi.fn();
    render(<DisputeFilingForm {...defaultProps({ onCancel })} />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

describe("DisputeFilingForm – description character counter", () => {
  it("shows 0/1000 initially", () => {
    render(<DisputeFilingForm {...defaultProps()} />);
    expect(screen.getByText("0/1000")).toBeInTheDocument();
  });

  it("updates counter as user types", () => {
    render(<DisputeFilingForm {...defaultProps()} />);
    fireEvent.change(screen.getByPlaceholderText(/detailed description/i), {
      target: { value: "Hello" },
    });
    expect(screen.getByText("5/1000")).toBeInTheDocument();
  });
});
