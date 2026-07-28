import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const mockReplace = vi.fn();
const mockParams: Record<string, string> = {};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/dashboard",
  useSearchParams: () => ({
    get: (key: string) => mockParams[key] ?? null,
    toString: () => new URLSearchParams(mockParams).toString(),
  }),
}));

import { SlotPickerCompare } from "./slot-picker-compare";
import type { Supplier } from "./types";

const suppliers: Supplier[] = [
  { id: "supplier-1", name: "Alex Rivera", title: "Consultant", badges: [] },
  { id: "supplier-2", name: "Morgan Chen", title: "UX Lead", badges: [] },
];

describe("SlotPickerCompare", () => {
  it("renders two panes with a book action each", () => {
    render(<SlotPickerCompare suppliers={suppliers} />);

    expect(screen.getByText("Alex Rivera")).toBeInTheDocument();
    expect(screen.getByText("Morgan Chen")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /book this one/i })).toHaveLength(2);
  });

  it("calls onBook with the pane's supplier id", () => {
    const onBook = vi.fn();
    render(<SlotPickerCompare suppliers={suppliers} onBook={onBook} />);

    fireEvent.click(screen.getAllByRole("button", { name: /book this one/i })[0]);
    expect(onBook).toHaveBeenCalledWith("supplier-1");
  });

  it("persists supplier selection to the URL", () => {
    render(<SlotPickerCompare suppliers={suppliers} />);

    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "supplier-2" } });

    expect(mockReplace).toHaveBeenCalledWith(
      expect.stringContaining("compareA=supplier-2"),
      { scroll: false },
    );
  });

  it("switches focus between panes with Ctrl+ArrowRight", () => {
    render(<SlotPickerCompare suppliers={suppliers} />);

    const panes = screen.getAllByLabelText(/slot list, use Ctrl\+Arrow to switch panes/i);
    panes[0].focus();
    fireEvent.keyDown(panes[0], { key: "ArrowRight", ctrlKey: true });
    expect(panes[1]).toHaveFocus();
  });
});
