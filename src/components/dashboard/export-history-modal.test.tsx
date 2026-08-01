import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExportHistoryModal } from "./export-history-modal";

// ── Mocks ──────────────────────────────────────────────────────────────────────

const defaultProps = {
  isOpen: false,
  onClose: vi.fn(),
};

function renderModal(overrides: Partial<typeof defaultProps> = {}) {
  return render(<ExportHistoryModal {...defaultProps} {...overrides} />);
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("ExportHistoryModal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Visibility & rendering ────────────────────────────────────────────

  it("does not render when isOpen is false", () => {
    renderModal({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the configure step when opened", () => {
    renderModal({ isOpen: true });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Export transactions")).toBeInTheDocument();
    expect(screen.getByText("CSV")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
  });

  // ── Accessibility ─────────────────────────────────────────────────────

  it("has role='dialog' with aria-modal and aria-labelledby", () => {
    renderModal({ isOpen: true });
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby");
  });

  it("has a fieldset for export format with radio semantics", () => {
    renderModal({ isOpen: true });
    expect(screen.getByText("Export format")).toBeInTheDocument();
    const csvRadio = screen.getByRole("radio", { name: "CSV" });
    expect(csvRadio).toHaveAttribute("aria-checked", "true");
    const pdfRadio = screen.getByRole("radio", { name: "PDF" });
    expect(pdfRadio).toHaveAttribute("aria-checked", "false");
  });

  it("date range preset buttons have radio semantics", () => {
    renderModal({ isOpen: true });
    const last30 = screen.getByRole("radio", { name: "Last 30 days" });
    expect(last30).toHaveAttribute("aria-checked", "true");
    const last7 = screen.getByRole("radio", { name: "Last 7 days" });
    expect(last7).toHaveAttribute("aria-checked", "false");
  });

  it("privacy switches have role='switch' and aria-checked", () => {
    renderModal({ isOpen: true });
    const nameSwitch = screen.getByRole("switch", {
      name: "Toggle name masking",
    });
    expect(nameSwitch).toHaveAttribute("aria-checked", "true");
    const txSwitch = screen.getByRole("switch", {
      name: "Toggle transaction ID masking",
    });
    expect(txSwitch).toHaveAttribute("aria-checked", "true");
  });

  it("renders a LiveRegion for screen reader announcements", () => {
    renderModal({ isOpen: true });
    const liveRegion = document.querySelector(".sr-only[role='status']");
    expect(liveRegion).toBeInTheDocument();
  });

  // ── Format selection ──────────────────────────────────────────────────

  it("switches format from CSV to PDF", () => {
    renderModal({ isOpen: true });
    const csvRadio = screen.getByRole("radio", { name: "CSV" });
    const pdfRadio = screen.getByRole("radio", { name: "PDF" });
    expect(csvRadio).toHaveAttribute("aria-checked", "true");

    fireEvent.click(pdfRadio);
    expect(pdfRadio).toHaveAttribute("aria-checked", "true");
    expect(csvRadio).toHaveAttribute("aria-checked", "false");
  });

  // ── Date range selection ──────────────────────────────────────────────

  it("selects a different date range preset", () => {
    renderModal({ isOpen: true });
    const last90Btn = screen.getByRole("radio", { name: "Last 90 days" });
    fireEvent.click(last90Btn);
    expect(last90Btn).toHaveAttribute("aria-checked", "true");
  });

  it("shows custom date inputs when Custom range is selected", () => {
    renderModal({ isOpen: true });
    expect(screen.queryByLabelText("Start date")).not.toBeInTheDocument();

    const customBtn = screen.getByRole("radio", { name: "Custom range" });
    fireEvent.click(customBtn);

    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
  });

  // ── Columns picker ────────────────────────────────────────────────────

  it("renders all column checkboxes", () => {
    renderModal({ isOpen: true });
    const columnLabels = [
      "Date",
      "Description",
      "Amount",
      "Status",
      "Transaction ID",
      "Counterparty",
    ];
    columnLabels.forEach((label) => {
      expect(screen.getByLabelText(label)).toBeInTheDocument();
    });
  });

  it("all columns are checked by default", () => {
    renderModal({ isOpen: true });
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((cb) => {
      expect(cb).toBeChecked();
    });
  });

  it("unchecks a column when clicked", () => {
    renderModal({ isOpen: true });
    const descriptionCb = screen.getByLabelText("Description") as HTMLInputElement;
    fireEvent.click(descriptionCb);
    expect(descriptionCb.checked).toBe(false);
  });

  it("disables the export button when no columns are selected", () => {
    renderModal({ isOpen: true });
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    checkboxes.forEach((cb) => {
      if (cb.checked) fireEvent.click(cb);
    });
    expect(
      screen.getByRole("button", { name: /export as csv/i }),
    ).toBeDisabled();
  });

  // ── Privacy toggles ───────────────────────────────────────────────────

  it("toggles name masking switch", () => {
    renderModal({ isOpen: true });
    const nameSwitch = screen.getByRole("switch", {
      name: "Toggle name masking",
    });
    expect(nameSwitch).toHaveAttribute("aria-checked", "true");

    fireEvent.click(nameSwitch);
    expect(nameSwitch).toHaveAttribute("aria-checked", "false");

    fireEvent.click(nameSwitch);
    expect(nameSwitch).toHaveAttribute("aria-checked", "true");
  });

  // ── Close button ──────────────────────────────────────────────────────

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    renderModal({ isOpen: true, onClose });

    const closeBtn = screen.getByLabelText("Close export dialog");
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    renderModal({ isOpen: true, onClose });
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // ── Export flow: configure → generating ───────────────────────────────

  it("transitions to generating step when Export is clicked", () => {
    renderModal({ isOpen: true });
    const exportBtn = screen.getByRole("button", { name: /export as csv/i });
    fireEvent.click(exportBtn);
    expect(screen.getByText(/generating your csv export/i)).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("prevents closing via Escape during generation", () => {
    const onClose = vi.fn();
    render(
      <ExportHistoryModal isOpen={true} onClose={onClose} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /export as csv/i }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });

  // ── Custom onExport handler ───────────────────────────────────────────

  it("calls custom onExport handler when provided", async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    render(
      <ExportHistoryModal isOpen={true} onClose={vi.fn()} onExport={onExport} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /export as csv/i }));

    await waitFor(() => {
      expect(onExport).toHaveBeenCalledTimes(1);
    });

    expect(onExport).toHaveBeenCalledWith(
      expect.objectContaining({
        format: "csv",
        dateRange: "last30",
        columns: expect.arrayContaining(["date", "description"]),
      }),
    );
  });

  it("handles custom onExport rejection gracefully", async () => {
    const onExport = vi.fn().mockRejectedValue(new Error("Export failed"));
    render(
      <ExportHistoryModal isOpen={true} onClose={vi.fn()} onExport={onExport} />,
    );

    const exportBtn = screen.getByRole("button", { name: /export as csv/i });
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(screen.getByText("Export transactions")).toBeInTheDocument();
    });
  });

  // ── Export complete step (via immediate onExport resolution) ──────────

  it("transitions to complete step when export succeeds", async () => {
    render(
      <ExportHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        onExport={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /export as csv/i }));

    await waitFor(() => {
      expect(screen.getByText(/export ready/i)).toBeInTheDocument();
      expect(screen.getByText(/42 transactions exported/i)).toBeInTheDocument();
    });
  });

  it("shows download button in complete step for CSV", async () => {
    render(
      <ExportHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        onExport={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /export as csv/i }));

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /download csv/i }),
      ).toBeInTheDocument();
    });
  });

  it("shows a back button to return to configure step", async () => {
    render(
      <ExportHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        onExport={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /export as csv/i }));

    await waitFor(async () => {
      const backBtn = screen.getByLabelText("Back to export settings");
      expect(backBtn).toBeInTheDocument();

      fireEvent.click(backBtn);
      expect(screen.getByText("Export transactions")).toBeInTheDocument();
    });
  });

  it("shows privacy summary when masking is enabled", async () => {
    render(
      <ExportHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        onExport={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /export as csv/i }));

    await waitFor(() => {
      expect(screen.getByText(/Privacy applied/i)).toBeInTheDocument();
      expect(screen.getByText(/Counterparty names masked/i)).toBeInTheDocument();
      expect(screen.getByText(/Transaction IDs truncated/i)).toBeInTheDocument();
    });
  });

  it("hides privacy summary when masking is disabled", async () => {
    render(
      <ExportHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        onExport={vi.fn().mockResolvedValue(undefined)}
      />,
    );

    // Disable both masking toggles
    fireEvent.click(screen.getByRole("switch", { name: "Toggle name masking" }));
    fireEvent.click(
      screen.getByRole("switch", { name: "Toggle transaction ID masking" }),
    );

    fireEvent.click(screen.getByRole("button", { name: /export as csv/i }));

    await waitFor(() => {
      expect(screen.queryByText(/Privacy applied/i)).not.toBeInTheDocument();
    });
  });

  it("supports estimatedCount prop", async () => {
    render(
      <ExportHistoryModal
        isOpen={true}
        onClose={vi.fn()}
        onExport={vi.fn().mockResolvedValue(undefined)}
        estimatedCount={123}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /export as csv/i }));

    await waitFor(() => {
      // Should show in the complete step
      expect(screen.getByText(/export ready/i)).toBeInTheDocument();
      expect(screen.getByText(/123 transactions exported/i)).toBeInTheDocument();
    });
  });

  // ── Reset state on re-open ────────────────────────────────────────────

  it("resets to configure step when re-opened", () => {
    const { rerender } = render(
      <ExportHistoryModal isOpen={true} onClose={vi.fn()} />,
    );

    // Start export to change step from configure
    fireEvent.click(screen.getByRole("button", { name: /export as csv/i }));

    // Close and re-open
    rerender(<ExportHistoryModal isOpen={false} onClose={vi.fn()} />);
    rerender(<ExportHistoryModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("Export transactions")).toBeInTheDocument();
  });
});
