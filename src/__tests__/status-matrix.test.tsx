import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { StatusMatrix } from "@/components/design/status-matrix/status-matrix";
import { StatusLegend } from "@/components/design/status-matrix/status-legend";
import { StatusCell } from "@/components/design/status-matrix/status-cell";
import type { StatusMatrixConfig, CellData, Region, Component } from "@/components/design/status-matrix/types";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockRegion: Region = { id: "us-east", label: "US-East" };
const mockComponent: Component = { id: "api", label: "API" };

const allOperational: StatusMatrixConfig = {
  components: [
    { id: "api", label: "API" },
    { id: "auth", label: "Auth" },
  ],
  regions: [
    { id: "us-east", label: "US-East" },
    { id: "eu-west", label: "EU-West" },
  ],
  cells: {
    api: {
      "us-east": { status: "operational", lastChecked: "1 min ago", message: "OK" },
      "eu-west": { status: "operational", lastChecked: "1 min ago", message: "OK" },
    },
    auth: {
      "us-east": { status: "operational", lastChecked: "2 min ago", message: "OK" },
      "eu-west": { status: "operational", lastChecked: "2 min ago", message: "OK" },
    },
  },
};

const mixedStates: StatusMatrixConfig = {
  components: [
    { id: "api", label: "API" },
    { id: "payments", label: "Payments" },
  ],
  regions: [
    { id: "us-east", label: "US-East" },
    { id: "eu-west", label: "EU-West" },
  ],
  cells: {
    api: {
      "us-east": { status: "operational", lastChecked: "1 min ago", message: "OK" },
      "eu-west": { status: "degraded", lastChecked: "5 min ago", message: "Latency" },
    },
    payments: {
      "us-east": { status: "outage", lastChecked: "10 min ago", message: "Down" },
      "eu-west": { status: "unknown", lastChecked: "15 min ago", message: "No data" },
    },
  },
};

// ── Tests: StatusLegend ──────────────────────────────────────────────────────

describe("StatusLegend", () => {
  it("renders all four status types", () => {
    render(<StatusLegend />);
    expect(screen.getByText("Operational")).toBeInTheDocument();
    expect(screen.getByText("Degraded")).toBeInTheDocument();
    expect(screen.getByText("Outage")).toBeInTheDocument();
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });

  it("has role=list and listitems", () => {
    render(<StatusLegend />);
    expect(screen.getByRole("list", { name: "Status legend" })).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(4);
  });
});

// ── Tests: StatusCell ─────────────────────────────────────────────────────────

const cellDataMap: Record<string, CellData> = {
  operational: { status: "operational", lastChecked: "1 min ago", message: "All OK" },
  degraded: { status: "degraded", lastChecked: "5 min ago", message: "Latency" },
  outage: { status: "outage", lastChecked: "10 min ago", message: "Down" },
  unknown: { status: "unknown", lastChecked: "15 min ago", message: "No data" },
};

describe("StatusCell", () => {
  it("renders a button with aria-label describing component, region, and status", () => {
    render(
      <StatusCell
        cell={cellDataMap.operational}
        region={mockRegion}
        component={mockComponent}
      />,
    );
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute(
      "aria-label",
      expect.stringContaining("API US-East: operational"),
    );
    expect(btn).toHaveAttribute(
      "aria-label",
      expect.stringContaining("All OK"),
    );
    expect(btn).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Last checked 1 min ago"),
    );
  });

  it("shows tooltip on mouse enter", () => {
    render(
      <StatusCell
        cell={cellDataMap.operational}
        region={mockRegion}
        component={mockComponent}
      />,
    );
    const btn = screen.getByRole("button");
    fireEvent.mouseEnter(btn);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    expect(screen.getByText("API")).toBeInTheDocument();
    expect(screen.getByText("US-East")).toBeInTheDocument();
    expect(screen.getByText("All OK")).toBeInTheDocument();
    expect(screen.getByText(/Last check: 1 min ago/)).toBeInTheDocument();
  });

  it("hides tooltip on mouse leave", () => {
    render(
      <StatusCell
        cell={cellDataMap.operational}
        region={mockRegion}
        component={mockComponent}
      />,
    );
    const btn = screen.getByRole("button");
    fireEvent.mouseEnter(btn);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.mouseLeave(btn);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip on focus", () => {
    render(
      <StatusCell
        cell={cellDataMap.operational}
        region={mockRegion}
        component={mockComponent}
      />,
    );
    const btn = screen.getByRole("button");
    fireEvent.focus(btn);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("hides tooltip on blur", () => {
    render(
      <StatusCell
        cell={cellDataMap.operational}
        region={mockRegion}
        component={mockComponent}
      />,
    );
    const btn = screen.getByRole("button");
    fireEvent.focus(btn);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.blur(btn);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("toggles tooltip on click", () => {
    render(
      <StatusCell
        cell={cellDataMap.operational}
        region={mockRegion}
        component={mockComponent}
      />,
    );
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("sets aria-describedby when tooltip is visible", () => {
    render(
      <StatusCell
        cell={cellDataMap.operational}
        region={mockRegion}
        component={mockComponent}
      />,
    );
    const btn = screen.getByRole("button");
    expect(btn).not.toHaveAttribute("aria-describedby");
    fireEvent.mouseEnter(btn);
    expect(btn).toHaveAttribute("aria-describedby");
  });

  it("renders all four status variants without error", () => {
    Object.entries(cellDataMap).forEach(([key, cell]) => {
      const { unmount } = render(
        <StatusCell cell={cell} region={mockRegion} component={mockComponent} />,
      );
      expect(screen.getByRole("button")).toBeInTheDocument();
      unmount();
    });
  });

  it("closes tooltip when clicking outside", () => {
    render(
      <div>
        <StatusCell
          cell={cellDataMap.operational}
          region={mockRegion}
          component={mockComponent}
        />
        <span data-testid="outside">Outside</span>
      </div>,
    );
    const btn = screen.getByRole("button");
    fireEvent.click(btn);
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("outside"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});

// ── Tests: StatusMatrix (desktop / mobile) ────────────────────────────────────

describe("StatusMatrix", () => {
  it("renders section title", () => {
    render(<StatusMatrix config={allOperational} />);
    expect(screen.getByText("Component × Region Health")).toBeInTheDocument();
  });

  it("renders legend", () => {
    render(<StatusMatrix config={allOperational} />);
    expect(screen.getByRole("list", { name: "Status legend" })).toBeInTheDocument();
  });

  it("renders desktop table with role=table", () => {
    render(<StatusMatrix config={allOperational} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Component")).toBeInTheDocument();
    const rowHeaders = screen.getAllByRole("rowheader");
    expect(rowHeaders).toHaveLength(2);
    expect(rowHeaders[0]).toHaveTextContent("API");
    expect(rowHeaders[1]).toHaveTextContent("Auth");
  });

  it("desktop table has column headers for each region", () => {
    render(<StatusMatrix config={allOperational} />);
    const cols = screen.getAllByRole("columnheader");
    expect(cols).toHaveLength(3);
    const textContent = cols.map((c) => c.textContent).join(" ");
    expect(textContent).toContain("US-East");
    expect(textContent).toContain("EU-West");
  });

  it("renders region column headers with status dots", () => {
    render(<StatusMatrix config={allOperational} />);
    const colHeaders = screen.getAllByRole("columnheader");
    const usEastHeader = colHeaders.find((h) => h.textContent?.includes("US-East"));
    expect(usEastHeader).toBeInTheDocument();
    expect(usEastHeader?.querySelector("span[aria-hidden='true']")).toBeInTheDocument();
  });

  it("renders gridcell for each component x region pair", () => {
    render(<StatusMatrix config={allOperational} />);
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(4);
  });

  it("mobile view renders per-component expand buttons", () => {
    render(<StatusMatrix config={allOperational} />);
    const expandButtons = screen.getAllByRole("button", { name: "API" });
    expect(expandButtons.length).toBeGreaterThan(0);
  });

  it("expands mobile item on click to show region statuses", () => {
    render(<StatusMatrix config={allOperational} />);
    const apiBtn = screen.getByRole("button", { name: "API" });
    expect(apiBtn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(apiBtn);
    expect(apiBtn).toHaveAttribute("aria-expanded", "true");
    const regionEls = screen.getAllByText("US-East");
    expect(regionEls.length).toBeGreaterThanOrEqual(2);
  });

  it("collapses mobile item on second click", () => {
    render(<StatusMatrix config={allOperational} />);
    const apiBtn = screen.getByRole("button", { name: "API" });
    fireEvent.click(apiBtn);
    fireEvent.click(apiBtn);
    expect(apiBtn).toHaveAttribute("aria-expanded", "false");
  });

  it("renders status cells in expanded mobile section", () => {
    render(<StatusMatrix config={allOperational} />);
    const apiBtn = screen.getByRole("button", { name: "API" });
    fireEvent.click(apiBtn);
    const cellButtons = screen.getAllByRole("button");
    const statusCellButtons = cellButtons.filter(
      (b) => b.getAttribute("aria-label")?.includes("operational"),
    );
    expect(statusCellButtons.length).toBeGreaterThanOrEqual(2);
  });
});

// ── Edge cases ────────────────────────────────────────────────────────────────

describe("StatusMatrix edge cases", () => {
  it("renders all-operational config without errors", () => {
    render(<StatusMatrix config={allOperational} />);
    const cells = screen.getAllByRole("gridcell");
    cells.forEach((cell) => {
      const btn = cell.querySelector("button");
      expect(btn?.getAttribute("aria-label")).toContain("operational");
    });
  });

  it("renders mixed states (operational, degraded, outage, unknown)", () => {
    render(<StatusMatrix config={mixedStates} />);
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(4);
    const labels = cells.map((c) => c.querySelector("button")?.getAttribute("aria-label") ?? "");
    expect(labels.some((l) => l.includes("operational"))).toBe(true);
    expect(labels.some((l) => l.includes("degraded"))).toBe(true);
    expect(labels.some((l) => l.includes("outage"))).toBe(true);
    expect(labels.some((l) => l.includes("unknown"))).toBe(true);
  });

  it("renders dash for missing cell data", () => {
    const missingData: StatusMatrixConfig = {
      components: [{ id: "api", label: "API" }],
      regions: [{ id: "us-east", label: "US-East" }],
      cells: {},
    };
    render(<StatusMatrix config={missingData} />);
    const gridcells = screen.getAllByRole("gridcell");
    expect(gridcells[0]).toHaveTextContent("—");
  });
});
