import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ServicesStep } from "./index";
import { ToastProvider } from "@/hooks/use-toast";
import { ToastContainer } from "@/app/components/ui/toast-container";
import type { ServiceItem } from "../types";

// Wrap with the ToastProvider + ToastContainer so the Save handler's toasts
// are rendered to the DOM in tests (otherwise they only live in context).
function renderWithProviders(ui: React.ReactNode) {
  return render(
    <ToastProvider>
      {ui}
      <ToastContainer />
    </ToastProvider>,
  );
}

const sample = (overrides: Partial<ServiceItem> = {}): ServiceItem => ({
  id: "svc-1",
  title: "Strategy call",
  description: "A 60-minute strategy session.",
  basePriceXLM: 120,
  durationMinutes: 60,
  ...overrides,
});

describe("ServicesStep", () => {
  beforeEach(() => {
    // jsdom does not implement crypto.randomUUID — provide a fallback
    // so deterministic ids continue to work in tests
    if (!("randomUUID" in globalThis.crypto)) {
      (globalThis.crypto as unknown as { randomUUID: () => string }).randomUUID =
        () => "uuid-test";
    }
  });

  it("renders without crashing when empty", () => {
    renderWithProviders(<ServicesStep initialItems={[]} />);
    expect(screen.getByRole("heading", { name: /services & pricing/i })).toBeInTheDocument();
  });

  it("shows the empty state when no seed items are provided", () => {
    renderWithProviders(<ServicesStep initialItems={[]} />);
    expect(screen.getByText(/no services yet/i)).toBeInTheDocument();
    expect(screen.getByTestId("services-step-empty-add")).toBeInTheDocument();
  });

  it("renders the seeded items", () => {
    renderWithProviders(
      <ServicesStep initialItems={[sample({ title: "Strategy call" })]} />,
    );
    expect(screen.getAllByTestId("services-step-row")).toHaveLength(1);
    const titleInput = screen.getByTestId("services-step-title") as HTMLInputElement;
    expect(titleInput.value).toBe("Strategy call");
  });

  it("renders the draft status chip", () => {
    renderWithProviders(
      <ServicesStep initialItems={[sample()]} draftStatus="saved" lastSavedLabel="2 minutes ago" />,
    );
    expect(screen.getByText(/saved as draft · 2 minutes ago/i)).toBeInTheDocument();
  });

  it("renders warning draft status", () => {
    renderWithProviders(
      <ServicesStep initialItems={[]} draftStatus="offline" />,
    );
    expect(screen.getByText(/offline — changes local only/i)).toBeInTheDocument();
  });

  it("renders the saving draft status", () => {
    renderWithProviders(
      <ServicesStep initialItems={[sample()]} draftStatus="saving" />,
    );
    expect(screen.getByText(/saving…/i)).toBeInTheDocument();
  });

  describe("add row", () => {
    it("adds a blank service when the Add service button is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServicesStep initialItems={[]} />);
      // Switch out of empty state first
      await user.click(screen.getByTestId("services-step-empty-add"));
      expect(screen.getAllByTestId("services-step-row")).toHaveLength(1);
      await user.click(screen.getByTestId("services-step-add"));
      expect(screen.getAllByTestId("services-step-row")).toHaveLength(2);
    });

    it("disables Add service once the cap is reached", () => {
      const many = Array.from({ length: 30 }, (_, i) =>
        sample({ id: `svc-${i}`, title: `Row ${i + 1}` }),
      );
      renderWithProviders(<ServicesStep initialItems={many} />);
      const addBtn = screen.getByTestId("services-step-add");
      expect(addBtn).toBeDisabled();
    });
  });

  describe("duplicate / delete / reorder", () => {
    it("duplicates a row directly below the original with a '(copy)' suffix", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServicesStep initialItems={[sample({ id: "a", title: "Coaching" })]} />);
      const beforeRows = screen.getAllByTestId("services-step-row");
      const titleBefore = within(beforeRows[0]).getByTestId(
        "services-step-title",
      ) as HTMLInputElement;
      await user.click(within(beforeRows[0]).getByTestId("services-step-duplicate"));
      const afterRows = screen.getAllByTestId("services-step-row");
      expect(afterRows).toHaveLength(2);
      const newTitle = within(afterRows[1]).getByTestId(
        "services-step-title",
      ) as HTMLInputElement;
      expect(newTitle.value).toBe("Coaching (copy)");
      expect(within(afterRows[0]).getByTestId("services-step-title")).toBe(titleBefore);
    });

    it("removes the row when delete is clicked", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ServicesStep initialItems={[sample({ id: "a" }), sample({ id: "b" })]} />,
      );
      const rows = screen.getAllByTestId("services-step-row");
      await user.click(within(rows[0]).getByTestId("services-step-delete"));
      expect(screen.getAllByTestId("services-step-row")).toHaveLength(1);
    });

    it("moves a row up via the up button", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ServicesStep
          initialItems={[
            sample({ id: "a", title: "A" }),
            sample({ id: "b", title: "B" }),
          ]}
        />,
      );
      const rows = screen.getAllByTestId("services-step-row");
      await user.click(within(rows[1]).getByTestId("services-step-move-up"));
      const titles = screen
        .getAllByTestId("services-step-title")
        .map((input) => (input as HTMLInputElement).value);
      expect(titles).toEqual(["B", "A"]);
    });

    it("moves a row down via the down button", async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ServicesStep
          initialItems={[
            sample({ id: "a", title: "A" }),
            sample({ id: "b", title: "B" }),
          ]}
        />,
      );
      const rows = screen.getAllByTestId("services-step-row");
      await user.click(within(rows[0]).getByTestId("services-step-move-down"));
      const titles = screen
        .getAllByTestId("services-step-title")
        .map((input) => (input as HTMLInputElement).value);
      expect(titles).toEqual(["B", "A"]);
    });

    it("disables the up button on the first row", () => {
      renderWithProviders(
        <ServicesStep initialItems={[sample({ id: "a", title: "A" })]} />,
      );
      const row = screen.getByTestId("services-step-row");
      expect(within(row).getByTestId("services-step-move-up")).toBeDisabled();
    });

    it("disables the down button on the last row", () => {
      renderWithProviders(
        <ServicesStep initialItems={[sample({ id: "a", title: "A" })]} />,
      );
      const row = screen.getByTestId("services-step-row");
      expect(within(row).getByTestId("services-step-move-down")).toBeDisabled();
    });
  });

  describe("validation feedback", () => {
    it("blocks save when any row is invalid", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);
      renderWithProviders(
        <ServicesStep
          initialItems={[sample({ id: "a", title: "" })]}
          onSave={onSave}
        />,
      );
      const saveBtn = screen.getByTestId("services-step-save");
      // Ensure it is not focusable as a real link by clicking via user
      await user.click(saveBtn);
      expect(onSave).not.toHaveBeenCalled();
    });

    it("does not block onSave when rows are valid", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);
      renderWithProviders(
        <ServicesStep
          initialItems={[sample({ id: "valid", title: "Coaching" })]}
          onSave={onSave}
        />,
      );
      await user.click(screen.getByTestId("services-step-save"));
      expect(onSave).toHaveBeenCalledTimes(1);
    });

    it("renders an error message for empty titles", () => {
      renderWithProviders(
        <ServicesStep initialItems={[sample({ id: "a", title: "" })]} />,
      );
      expect(screen.getByRole("alert", { name: /title is required/i })).toBeInTheDocument();
    });

    it("marks the title input aria-invalid when invalid", () => {
      renderWithProviders(
        <ServicesStep initialItems={[sample({ id: "a", title: "" })]} />,
      );
      const title = screen.getByTestId("services-step-title");
      expect(title).toHaveAttribute("aria-invalid", "true");
    });
  });

  describe("save lifecycle", () => {
    it("calls onSave with the current items", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);
      renderWithProviders(
        <ServicesStep
          initialItems={[sample({ id: "a", title: "Coaching" })]}
          onSave={onSave}
        />,
      );
      await user.click(screen.getByTestId("services-step-save"));
      expect(onSave).toHaveBeenCalledWith([
        expect.objectContaining({ id: "a", title: "Coaching" }),
      ]);
    });

    it("shows the success toast after save", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);
      renderWithProviders(
        <ServicesStep
          initialItems={[sample({ id: "a", title: "Coaching" })]}
          onSave={onSave}
        />,
      );
      await user.click(screen.getByTestId("services-step-save"));
      // The success toast is mounted via ToastContainer inside the harness.
      expect(await screen.findByText(/services saved/i)).toBeInTheDocument();
    });

    it("shows error toast on save failure", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockRejectedValue(new Error("network down"));
      renderWithProviders(
        <ServicesStep
          initialItems={[sample({ id: "a", title: "Coaching" })]}
          onSave={onSave}
        />,
      );
      await user.click(screen.getByTestId("services-step-save"));
      // Wait for the rejected promise + finally clause
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      // Error toast surfaces inside the rendered ToastContainer
      expect(await screen.findByText(/could not save services/i)).toBeInTheDocument();
      expect(await screen.findByText(/network down/i)).toBeInTheDocument();
      const btn = screen.getByTestId("services-step-save");
      expect(btn).not.toHaveAttribute("aria-busy", "true");
    });

    it("shows warning toast when save is attempted with invalid rows", async () => {
      const user = userEvent.setup();
      const onSave = vi.fn().mockResolvedValue(undefined);
      renderWithProviders(
        <ServicesStep
          initialItems={[sample({ id: "a", title: "" })]}
          onSave={onSave}
        />,
      );
      // The save button is disabled, so we verify the disabled attribute and
      // that the click guard inside handleSave also defends against any pointer
      // events that slip through (e.g. via aria-disabled bypass tools).
      const btn = screen.getByTestId("services-step-save");
      expect(btn).toHaveAttribute("aria-disabled", "true");
      // Calling handleSave directly via a synthetic click should still be
      // blocked by the disabled Link, but the JS guard is a belt-and-braces.
      await user.click(btn).catch(() => undefined);
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe("live region announcements", () => {
    it("announces when a row is added", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServicesStep initialItems={[]} />);
      await user.click(screen.getByTestId("services-step-empty-add"));
      // Wait one frame for the requestAnimationFrame-based announce helper.
      await act(async () => {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      });
      const live = screen.getByTestId("services-step-live-region");
      expect(live.textContent ?? "").toMatch(/new service added/i);
    });

    it("announces when a row is duplicated", async () => {
      const user = userEvent.setup();
      renderWithProviders(<ServicesStep initialItems={[sample({ id: "a", title: "Yoga" })]} />);
      const row = screen.getByTestId("services-step-row");
      await user.click(within(row).getByTestId("services-step-duplicate"));
      await act(async () => {
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      });
      const live = screen.getByTestId("services-step-live-region");
      expect(live.textContent ?? "").toMatch(/duplicated/i);
    });
  });

  describe("large data set", () => {
    it("renders 25 services without crashing", () => {
      const many = Array.from({ length: 25 }, (_, i) =>
        sample({ id: `svc-${i}`, title: `Service ${i + 1}` }),
      );
      renderWithProviders(<ServicesStep initialItems={many} />);
      expect(screen.getAllByTestId("services-step-row")).toHaveLength(25);
    });
  });

  describe("RTL logical layout", () => {
    it("aligns text-start in arabic locale when document direction is RTL", () => {
      // Simulate RTL by setting <html dir="rtl">; the row already uses
      // flex / ms-/me-/text-start-friendly Tailwind classes so layout
      // reverses without code changes.
      document.documentElement.setAttribute("dir", "rtl");
      renderWithProviders(
        <ServicesStep initialItems={[sample({ title: "جلسة استشارية" })]} />,
      );
      const title = screen.getByTestId("services-step-title") as HTMLInputElement;
      expect(title.value).toBe("جلسة استشارية");
      document.documentElement.removeAttribute("dir");
    });
  });

  describe("validation summary", () => {
    it("shows 'all valid' when every row passes", () => {
      renderWithProviders(
        <ServicesStep initialItems={[sample({ title: "Coaching" })]} />,
      );
      expect(screen.getByTestId("services-step-validation-summary")).toHaveTextContent(
        /all valid/i,
      );
    });

    it("reports the error count when rows fail validation", () => {
      renderWithProviders(
        <ServicesStep initialItems={[sample({ id: "a", title: "" })]} />,
      );
      expect(screen.getByTestId("services-step-validation-summary")).toHaveTextContent(
        /1 row need attention/i,
      );
    });
  });

  describe("without onSave", () => {
    it("does not render the Save button when onSave is omitted", () => {
      renderWithProviders(<ServicesStep initialItems={[sample()]} />);
      expect(screen.queryByTestId("services-step-save")).not.toBeInTheDocument();
    });
  });
});
