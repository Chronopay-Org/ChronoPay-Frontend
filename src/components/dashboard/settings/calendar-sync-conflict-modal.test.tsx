import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarSyncConflictModal } from "./calendar-sync-conflict-modal";
import type { SyncConflict, ConflictResolution } from "../types";

const mockConflicts: SyncConflict[] = [
  {
    id: "conflict-1",
    eventTitle: "Product strategy call",
    dateTime: "Tue, Apr 1, 2026, 10:00 – 11:30",
    localChanges: [
      { field: "title", localValue: "Product strategy call", remoteValue: "Strategy sync" },
      { field: "description", localValue: "Q2 roadmap review", remoteValue: "Quarterly planning" },
    ],
    remoteChanges: [
      { field: "title", localValue: "Product strategy call", remoteValue: "Strategy sync" },
      { field: "description", localValue: "Q2 roadmap review", remoteValue: "Quarterly planning" },
    ],
  },
  {
    id: "conflict-2",
    eventTitle: "Design review",
    dateTime: "Wed, Apr 2, 2026, 14:00 – 15:00",
    localChanges: [
      { field: "location", localValue: "Conference Room A", remoteValue: "Zoom" },
    ],
    remoteChanges: [
      { field: "location", localValue: "Conference Room A", remoteValue: "Zoom" },
    ],
  },
];

describe("CalendarSyncConflictModal", () => {
  const onResolve = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when conflicts array is empty", () => {
    const { container } = render(
      <CalendarSyncConflictModal conflicts={[]} onResolve={onResolve} onClose={onClose} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders conflict summary with title", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );
    expect(screen.getByText("Sync conflicts")).toBeInTheDocument();
    expect(
      screen.getByText(
        "2 events have conflicting changes between local and remote calendars.",
      ),
    ).toBeInTheDocument();
  });

  it("renders single conflict message", () => {
    const singleConflict = [mockConflicts[0]];
    render(
      <CalendarSyncConflictModal conflicts={singleConflict} onResolve={onResolve} onClose={onClose} />,
    );
    expect(screen.getByText("One event has conflicting changes.")).toBeInTheDocument();
  });

  it("renders all conflict event titles in headings", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );
    const headings = screen.getAllByRole("heading", { level: 4 });
    expect(headings).toHaveLength(2);
    expect(headings[0]).toHaveTextContent("Product strategy call");
    expect(headings[1]).toHaveTextContent("Design review");
  });

  it("renders field change table with local and remote values", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );
    expect(screen.getByText("Q2 roadmap review")).toBeInTheDocument();
    expect(screen.getByText("Quarterly planning")).toBeInTheDocument();
    expect(screen.getByText("Conference Room A")).toBeInTheDocument();
    expect(screen.getByText("Zoom")).toBeInTheDocument();
  });

  it("initializes default resolution to merge for all conflicts", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    const mergeRadios = screen.getAllByRole("radio", { name: /Combine changes from both sides/i });
    expect(mergeRadios).toHaveLength(2);
    mergeRadios.forEach((radio) => {
      expect(radio).toBeChecked();
    });
  });

  it("allows selecting use local strategy per conflict", async () => {
    const user = userEvent.setup();
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    const useLocalRadios = screen.getAllByRole("radio", { name: /Keep the local version/i });
    expect(useLocalRadios).toHaveLength(2);

    await user.click(useLocalRadios[0]);
    expect(useLocalRadios[0]).toBeChecked();
  });

  it("allows selecting use remote strategy per conflict", async () => {
    const user = userEvent.setup();
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    const useRemoteRadios = screen.getAllByRole("radio", { name: /Accept the remote version/i });
    await user.click(useRemoteRadios[1]);
    expect(useRemoteRadios[1]).toBeChecked();
  });

  it("resolve button is enabled when all conflicts have resolution selected", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    const resolveBtn = screen.getByRole("button", { name: /Resolve/i });
    expect(resolveBtn).not.toBeDisabled();
  });

  it("calls onResolve with correct resolutions on resolve click", async () => {
    const user = userEvent.setup();
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    await user.click(screen.getByRole("button", { name: /Resolve/i }));

    expect(onResolve).toHaveBeenCalledTimes(1);
    const expected: ConflictResolution[] = [
      { conflictId: "conflict-1", strategy: "merge" },
      { conflictId: "conflict-2", strategy: "merge" },
    ];
    expect(onResolve).toHaveBeenCalledWith(expected);
  });

  it("calls onResolve with custom resolutions after changing strategies", async () => {
    const user = userEvent.setup();
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    const useLocalRadios = screen.getAllByRole("radio", { name: /Keep the local version/i });
    await user.click(useLocalRadios[0]);

    const useRemoteRadios = screen.getAllByRole("radio", { name: /Accept the remote version/i });
    await user.click(useRemoteRadios[1]);

    await user.click(screen.getByRole("button", { name: /Resolve/i }));

    expect(onResolve).toHaveBeenCalledWith([
      { conflictId: "conflict-1", strategy: "useLocal" },
      { conflictId: "conflict-2", strategy: "useRemote" },
    ]);
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    await user.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when close X button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    await user.click(screen.getByRole("button", { name: /Close conflict resolution dialog/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("displays dialog with correct ARIA attributes", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby");
    expect(dialog).toHaveAttribute("aria-describedby");
  });

  it("shows remaining conflicts count in footer", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    expect(screen.getByText("All conflicts have a resolution selected.")).toBeInTheDocument();
  });

  it("renders table headers for field comparison", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    const fields = screen.getAllByText("Field");
    expect(fields).toHaveLength(2);
    const locals = screen.getAllByText("Local");
    expect(locals).toHaveLength(2);
    const remotes = screen.getAllByText("Remote");
    expect(remotes).toHaveLength(2);
  });

  it("renders conflict groups with aria-label", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    expect(screen.getByRole("group", { name: /Conflict: Product strategy call/i })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /Conflict: Design review/i })).toBeInTheDocument();
  });

  it("renders radiogroup per conflict", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    const groups = screen.getAllByRole("radiogroup");
    expect(groups).toHaveLength(2);
  });

  it("renders conflicting field rows in table for each conflict", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    const tableLabels = screen.getAllByRole("table");
    expect(tableLabels).toHaveLength(2);
  });

  it("does not call onResolve when resolve is clicked with no conflicts", () => {
    const { container } = render(
      <CalendarSyncConflictModal conflicts={[]} onResolve={onResolve} onClose={onClose} />,
    );
    expect(container.firstChild).toBeNull();
    expect(onResolve).not.toHaveBeenCalled();
  });

  it("shows correct status when some conflicts need resolution", async () => {
    const user = userEvent.setup();
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    const useLocalRadios = screen.getAllByRole("radio", { name: /Keep the local version/i });
    await user.click(useLocalRadios[0]);

    await waitFor(() => {
      expect(screen.getByText("All conflicts have a resolution selected.")).toBeInTheDocument();
    });
  });

  it("announces resolution progress via live region", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    const liveRegions = screen.getAllByRole("status");
    const srOnlyRegion = liveRegions.find((r) => r.classList.contains("sr-only"));
    expect(srOnlyRegion).toBeTruthy();
    expect(srOnlyRegion).toHaveTextContent(/All 2 conflicts resolved/);
  });

  it("renders screen-reader-only descriptions for each strategy", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    const srDescriptions = document.querySelectorAll(".sr-only");
    const mergeDescriptions = Array.from(srDescriptions).filter(
      (el) => el.textContent === "Combine changes from both sides.",
    );
    expect(mergeDescriptions).toHaveLength(2);
  });

  it("handles single conflict gracefully", () => {
    const singleConflict = [mockConflicts[0]];
    render(
      <CalendarSyncConflictModal conflicts={singleConflict} onResolve={onResolve} onClose={onClose} />,
    );

    expect(screen.getAllByRole("radiogroup")).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Resolve/i })).not.toBeDisabled();
  });

  it("renders focusable buttons for keyboard navigation", () => {
    render(
      <CalendarSyncConflictModal conflicts={mockConflicts} onResolve={onResolve} onClose={onClose} />,
    );

    expect(screen.getByRole("button", { name: /Close conflict resolution dialog/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Resolve/i })).toBeInTheDocument();
  });
});
