import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, renderHook, screen, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { BrowseToolbar, useViewMode } from "./browse-toolbar";

const DEFAULT_KEY = "supplier-view-mode";
type ViewMode = "grid" | "compact-list";

const group = () => screen.getByRole("group", { name: "View mode" });

describe("useViewMode", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to grid when nothing is stored", () => {
    const { result } = renderHook(() => useViewMode());

    expect(result.current.viewMode).toBe("grid");
  });

  it("restores a persisted compact-list preference", () => {
    localStorage.setItem(DEFAULT_KEY, "compact-list");

    const { result } = renderHook(() => useViewMode());

    expect(result.current.viewMode).toBe("compact-list");
  });

  it("restores an explicitly persisted grid preference", () => {
    localStorage.setItem(DEFAULT_KEY, "grid");

    const { result } = renderHook(() => useViewMode());

    expect(result.current.viewMode).toBe("grid");
  });

  it("falls back to grid for an invalid stored value", () => {
    localStorage.setItem(DEFAULT_KEY, "list");

    const { result } = renderHook(() => useViewMode());

    expect(result.current.viewMode).toBe("grid");
  });

  it("falls back to grid for an empty stored value", () => {
    localStorage.setItem(DEFAULT_KEY, "");

    const { result } = renderHook(() => useViewMode());

    expect(result.current.viewMode).toBe("grid");
  });

  it("falls back to grid when reading localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });

    const { result } = renderHook(() => useViewMode());

    expect(result.current.viewMode).toBe("grid");
  });

  it("persists the selected mode under the default key on toggle", () => {
    const { result } = renderHook(() => useViewMode());

    act(() => {
      result.current.toggleViewMode("compact-list");
    });

    expect(result.current.viewMode).toBe("compact-list");
    expect(localStorage.getItem(DEFAULT_KEY)).toBe("compact-list");
  });

  it("supports toggling back to grid", () => {
    localStorage.setItem(DEFAULT_KEY, "compact-list");
    const { result } = renderHook(() => useViewMode());

    act(() => {
      result.current.toggleViewMode("grid");
    });

    expect(result.current.viewMode).toBe("grid");
    expect(localStorage.getItem(DEFAULT_KEY)).toBe("grid");
  });

  it("honors a custom storage key for both reads and writes", () => {
    localStorage.setItem("custom-key", "compact-list");
    const { result } = renderHook(() => useViewMode("custom-key"));

    expect(result.current.viewMode).toBe("compact-list");

    act(() => {
      result.current.toggleViewMode("grid");
    });

    expect(localStorage.getItem("custom-key")).toBe("grid");
    expect(localStorage.getItem(DEFAULT_KEY)).toBeNull();
  });

  it("keeps preferences isolated per storage key", () => {
    const first = renderHook(() => useViewMode("key-a"));
    const second = renderHook(() => useViewMode("key-b"));

    act(() => {
      first.result.current.toggleViewMode("compact-list");
    });

    expect(first.result.current.viewMode).toBe("compact-list");
    expect(second.result.current.viewMode).toBe("grid");
  });

  it("updates state before the write and keeps it even if the write throws", () => {
    const { result } = renderHook(() => useViewMode());

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded");
    });

    let caught: unknown;
    act(() => {
      try {
        result.current.toggleViewMode("compact-list");
      } catch (error) {
        caught = error;
      }
    });

    expect(caught).toBeInstanceOf(Error);
    expect(result.current.viewMode).toBe("compact-list");
  });

  it("writes an out-of-contract mode verbatim and rejects it on the next read", () => {
    const { result } = renderHook(() => useViewMode());

    act(() => {
      result.current.toggleViewMode("list" as unknown as ViewMode);
    });

    expect(result.current.viewMode).toBe("list" as unknown as ViewMode);
    expect(localStorage.getItem(DEFAULT_KEY)).toBe("list");

    const remounted = renderHook(() => useViewMode());
    expect(remounted.result.current.viewMode).toBe("grid");
  });
});

describe("BrowseToolbar", () => {
  const renderToolbar = (
    props: Partial<React.ComponentProps<typeof BrowseToolbar>> = {}
  ) => {
    const onViewModeChange = vi.fn();
    const utils = render(
      <BrowseToolbar
        viewMode={props.viewMode ?? "grid"}
        onViewModeChange={props.onViewModeChange ?? onViewModeChange}
      />
    );
    return { onViewModeChange, ...utils };
  };

  it("renders a labelled group with grid and compact list buttons", () => {
    renderToolbar();

    expect(screen.getByRole("heading", { name: "Browse Suppliers" })).toBeInTheDocument();
    expect(
      within(group()).getByRole("button", { name: "Grid view" })
    ).toBeInTheDocument();
    expect(
      within(group()).getByRole("button", { name: "Compact list view" })
    ).toBeInTheDocument();
  });

  it("marks grid pressed by default", () => {
    renderToolbar();

    expect(
      within(group()).getByRole("button", { name: "Grid view" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(group()).getByRole("button", { name: "Compact list view" })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("marks compact list pressed when the view mode is compact-list", () => {
    renderToolbar({ viewMode: "compact-list" });

    expect(
      within(group()).getByRole("button", { name: "Compact list view" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(group()).getByRole("button", { name: "Grid view" })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("marks neither option pressed for an out-of-contract view mode", () => {
    render(
      <BrowseToolbar
        viewMode={"wide" as unknown as ViewMode}
        onViewModeChange={vi.fn()}
      />
    );

    expect(
      within(group()).getByRole("button", { name: "Grid view" })
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      within(group()).getByRole("button", { name: "Compact list view" })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("requests the grid view on click", async () => {
    const user = userEvent.setup();
    const { onViewModeChange } = renderToolbar({ viewMode: "compact-list" });

    await user.click(within(group()).getByRole("button", { name: "Grid view" }));

    expect(onViewModeChange).toHaveBeenCalledTimes(1);
    expect(onViewModeChange).toHaveBeenCalledWith("grid");
  });

  it("requests the compact list view on click", async () => {
    const user = userEvent.setup();
    const { onViewModeChange } = renderToolbar();

    await user.click(
      within(group()).getByRole("button", { name: "Compact list view" })
    );

    expect(onViewModeChange).toHaveBeenCalledTimes(1);
    expect(onViewModeChange).toHaveBeenCalledWith("compact-list");
  });

  it("reports every click so the latest selection wins", async () => {
    const user = userEvent.setup();
    const { onViewModeChange } = renderToolbar();

    await user.click(
      within(group()).getByRole("button", { name: "Compact list view" })
    );
    await user.click(within(group()).getByRole("button", { name: "Grid view" }));
    await user.click(
      within(group()).getByRole("button", { name: "Compact list view" })
    );

    expect(onViewModeChange).toHaveBeenCalledTimes(3);
    expect(onViewModeChange).toHaveBeenNthCalledWith(1, "compact-list");
    expect(onViewModeChange).toHaveBeenNthCalledWith(2, "grid");
    expect(onViewModeChange).toHaveBeenNthCalledWith(3, "compact-list");
  });

  it("reflects controlled view mode changes in the pressed state", () => {
    const { rerender } = renderToolbar();

    expect(
      within(group()).getByRole("button", { name: "Grid view" })
    ).toHaveAttribute("aria-pressed", "true");

    rerender(
      <BrowseToolbar viewMode="compact-list" onViewModeChange={vi.fn()} />
    );

    expect(
      within(group()).getByRole("button", { name: "Compact list view" })
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      within(group()).getByRole("button", { name: "Grid view" })
    ).toHaveAttribute("aria-pressed", "false");
  });

  it("styles the active option distinctly from the idle one", () => {
    const { container } = renderToolbar({ viewMode: "compact-list" });

    const active = within(group()).getByRole("button", { name: "Compact list view" });
    const idle = within(group()).getByRole("button", { name: "Grid view" });

    expect(active).toHaveClass("bg-white/10");
    expect(active).toHaveClass("text-white");
    expect(idle).not.toHaveClass("bg-white/10");
    expect(idle).toHaveClass("text-slate-400");
    expect(container.querySelector("h2")).toHaveTextContent("Browse Suppliers");
  });

  it("keeps the icons hidden from assistive technology", () => {
    const { container } = renderToolbar();

    const hiddenIcons = container.querySelectorAll("svg[aria-hidden='true']");
    expect(hiddenIcons).toHaveLength(2);
  });

  it("has no axe accessibility violations", async () => {
    const { container } = renderToolbar({ viewMode: "compact-list" });

    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("useViewMode + BrowseToolbar integration", () => {
  const Harness = ({ storageKey }: { storageKey?: string }) => {
    const { viewMode, toggleViewMode } = useViewMode(storageKey);
    return <BrowseToolbar viewMode={viewMode} onViewModeChange={toggleViewMode} />;
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("drives the pressed state from the hook and persists the selection", async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Harness />);

    expect(within(group()).getByRole("button", { name: "Grid view" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    await user.click(
      within(group()).getByRole("button", { name: "Compact list view" })
    );

    expect(within(group()).getByRole("button", { name: "Compact list view" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(localStorage.getItem(DEFAULT_KEY)).toBe("compact-list");

    unmount();

    render(<Harness />);
    expect(within(group()).getByRole("button", { name: "Compact list view" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
