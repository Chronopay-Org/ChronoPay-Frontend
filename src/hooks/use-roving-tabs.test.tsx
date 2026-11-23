import React, { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { useRovingTabs } from "./use-roving-tabs";

const TABS = ["tab-1", "tab-2", "tab-3"] as const;
type TabId = (typeof TABS)[number];

interface HarnessProps {
  tabs?: readonly TabId[];
  initialActive?: TabId;
  dir?: "ltr" | "rtl";
  onSelectSpy?: (tab: TabId) => void;
}

function TabsHarness({
  tabs = TABS,
  initialActive = "tab-1",
  dir,
  onSelectSpy,
}: HarnessProps) {
  const [activeTab, setActiveTab] = useState<TabId | undefined>(initialActive);

  const handleSelect = (tab: TabId) => {
    setActiveTab(tab);
    onSelectSpy?.(tab);
  };

  const { registerTab, handleKeyDown } = useRovingTabs({
    tabs,
    activeTab,
    onSelect: handleSelect,
    dir,
  });

  return (
    <div role="tablist" dir={dir} onKeyDown={handleKeyDown}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={activeTab === tab}
          tabIndex={activeTab === tab ? 0 : -1}
          ref={registerTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}

describe("useRovingTabs", () => {
  describe("LTR navigation (default)", () => {
    it("selects next tab on ArrowRight and wraps from last to first", () => {
      const onSelect = vi.fn();
      render(<TabsHarness onSelectSpy={onSelect} />);

      const tablist = screen.getByRole("tablist");
      const [tab1, tab2, tab3] = screen.getAllByRole("tab");

      tab1.focus();
      expect(document.activeElement).toBe(tab1);

      fireEvent.keyDown(tablist, { key: "ArrowRight" });
      expect(onSelect).toHaveBeenLastCalledWith("tab-2");
      expect(tab2).toHaveAttribute("aria-selected", "true");
      expect(document.activeElement).toBe(tab2);

      fireEvent.keyDown(tablist, { key: "ArrowRight" });
      expect(onSelect).toHaveBeenLastCalledWith("tab-3");
      expect(tab3).toHaveAttribute("aria-selected", "true");
      expect(document.activeElement).toBe(tab3);

      fireEvent.keyDown(tablist, { key: "ArrowRight" });
      expect(onSelect).toHaveBeenLastCalledWith("tab-1");
      expect(tab1).toHaveAttribute("aria-selected", "true");
      expect(document.activeElement).toBe(tab1);
    });

    it("selects previous tab on ArrowLeft and wraps from first to last", () => {
      const onSelect = vi.fn();
      render(<TabsHarness onSelectSpy={onSelect} />);

      const tablist = screen.getByRole("tablist");
      const [tab1, tab2, tab3] = screen.getAllByRole("tab");

      tab1.focus();

      fireEvent.keyDown(tablist, { key: "ArrowLeft" });
      expect(onSelect).toHaveBeenLastCalledWith("tab-3");
      expect(document.activeElement).toBe(tab3);

      fireEvent.keyDown(tablist, { key: "ArrowLeft" });
      expect(onSelect).toHaveBeenLastCalledWith("tab-2");
      expect(document.activeElement).toBe(tab2);
    });
  });

  describe("RTL navigation", () => {
    it("treats ArrowLeft as forward and wraps from last to first", () => {
      const onSelect = vi.fn();
      render(<TabsHarness dir="rtl" onSelectSpy={onSelect} />);

      const tablist = screen.getByRole("tablist");
      const [tab1, tab2, tab3] = screen.getAllByRole("tab");

      tab1.focus();

      fireEvent.keyDown(tablist, { key: "ArrowLeft" });
      expect(onSelect).toHaveBeenLastCalledWith("tab-2");
      expect(document.activeElement).toBe(tab2);

      fireEvent.keyDown(tablist, { key: "ArrowLeft" });
      expect(onSelect).toHaveBeenLastCalledWith("tab-3");
      expect(document.activeElement).toBe(tab3);

      fireEvent.keyDown(tablist, { key: "ArrowLeft" });
      expect(onSelect).toHaveBeenLastCalledWith("tab-1");
      expect(document.activeElement).toBe(tab1);
    });

    it("treats ArrowRight as backward and wraps from first to last", () => {
      const onSelect = vi.fn();
      render(<TabsHarness dir="rtl" onSelectSpy={onSelect} />);

      const tablist = screen.getByRole("tablist");
      const [tab1, tab2, tab3] = screen.getAllByRole("tab");

      tab1.focus();

      fireEvent.keyDown(tablist, { key: "ArrowRight" });
      expect(onSelect).toHaveBeenLastCalledWith("tab-3");
      expect(document.activeElement).toBe(tab3);

      fireEvent.keyDown(tablist, { key: "ArrowRight" });
      expect(onSelect).toHaveBeenLastCalledWith("tab-2");
      expect(document.activeElement).toBe(tab2);
    });
  });

  describe("Home, End, and unhandled keys", () => {
    it("selects first tab on Home and last tab on End and moves focus", () => {
      const onSelect = vi.fn();
      render(<TabsHarness initialActive="tab-2" onSelectSpy={onSelect} />);

      const tablist = screen.getByRole("tablist");
      const [tab1, tab2, tab3] = screen.getAllByRole("tab");

      tab2.focus();

      fireEvent.keyDown(tablist, { key: "End" });
      expect(onSelect).toHaveBeenLastCalledWith("tab-3");
      expect(document.activeElement).toBe(tab3);

      fireEvent.keyDown(tablist, { key: "Home" });
      expect(onSelect).toHaveBeenLastCalledWith("tab-1");
      expect(document.activeElement).toBe(tab1);
    });

    it("prevents default on handled navigation keys", () => {
      render(<TabsHarness />);
      const tablist = screen.getByRole("tablist");

      for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) {
        const event = createEvent.keyDown(tablist, { key });
        fireEvent(tablist, event);
        expect(event.defaultPrevented).toBe(true);
      }
    });

    it("does nothing and does not call preventDefault on unhandled keys", () => {
      const onSelect = vi.fn();
      render(<TabsHarness onSelectSpy={onSelect} />);

      const tablist = screen.getByRole("tablist");
      const [tab1] = screen.getAllByRole("tab");
      tab1.focus();

      for (const key of ["Enter", " ", "Tab", "ArrowUp", "ArrowDown", "Escape", "a"]) {
        const event = createEvent.keyDown(tablist, { key });
        fireEvent(tablist, event);
        expect(event.defaultPrevented).toBe(false);
      }

      expect(onSelect).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(tab1);
    });
  });

  describe("edge cases", () => {
    it("is a no-op when tabs array is empty", () => {
      const onSelect = vi.fn();
      render(<TabsHarness tabs={[]} onSelectSpy={onSelect} />);

      const tablist = screen.getByRole("tablist");

      for (const key of ["ArrowRight", "ArrowLeft", "Home", "End"]) {
        const event = createEvent.keyDown(tablist, { key });
        fireEvent(tablist, event);
        expect(event.defaultPrevented).toBe(false);
      }

      expect(onSelect).not.toHaveBeenCalled();
    });

    it("returns the registered button node via getTabRef", () => {
      let refNode: HTMLButtonElement | null = null;

      function RefCheckHarness() {
        const { registerTab, getTabRef } = useRovingTabs({
          tabs: TABS,
          activeTab: "tab-1",
          onSelect: () => {},
        });

        return (
          <div role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                ref={registerTab(tab)}
                onClick={() => {
                  refNode = getTabRef("tab-2").current;
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        );
      }

      render(<RefCheckHarness />);
      const [tab1, tab2] = screen.getAllByRole("tab");
      fireEvent.click(tab1);
      expect(refNode).toBe(tab2);
    });
  });
});
