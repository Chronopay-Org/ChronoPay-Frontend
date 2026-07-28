import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TimezoneRibbon } from "@/components/dashboard/timezone-ribbon";
import {
  formatUTCOffset,
  getOffsetDeltaText,
  getTimezoneOffsetMinutes,
} from "@/utils/timezone";

describe("Timezone Utilities", () => {
  it("formats offset minutes correctly into UTC strings", () => {
    expect(formatUTCOffset(0)).toBe("UTC+0");
    expect(formatUTCOffset(300)).toBe("UTC+5");
    expect(formatUTCOffset(-300)).toBe("UTC-5");
    expect(formatUTCOffset(330)).toBe("UTC+5:30");
    expect(formatUTCOffset(-210)).toBe("UTC-3:30");
  });

  it("calculates relative offset delta text", () => {
    const deltaSame = getOffsetDeltaText("UTC", "UTC");
    expect(deltaSame).toBe("Same time");
  });
});

describe("TimezoneRibbon Component", () => {
  const defaultProps = {
    supplierId: "supplier-123",
    supplierTimeZone: "America/New_York",
    supplierName: "Sarah",
  };

  beforeEach(() => {
    localStorage.clear();
  });

  it("renders active viewport and toggle options", () => {
    render(<TimezoneRibbon {...defaultProps} />);

    expect(screen.getByRole("region", { name: "Timezone display settings" })).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Select calendar timezone display mode" })).toBeInTheDocument();

    const myTimeBtn = screen.getByRole("radio", { name: /My time/i });
    const supplierTimeBtn = screen.getByRole("radio", { name: /Sarah time/i });

    expect(myTimeBtn).toBeInTheDocument();
    expect(supplierTimeBtn).toBeInTheDocument();
  });

  it("switches timezone mode and updates radio check status", () => {
    const onTimezoneChange = vi.fn();
    render(<TimezoneRibbon {...defaultProps} onTimezoneChange={onTimezoneChange} />);

    const supplierTimeBtn = screen.getByRole("radio", { name: /Sarah time/i });
    fireEvent.click(supplierTimeBtn);

    expect(supplierTimeBtn).toHaveAttribute("aria-checked", "true");
    expect(localStorage.getItem("chronopay_tz_pref_supplier-123")).toBe("supplier");
    expect(onTimezoneChange).toHaveBeenCalledWith("supplier", "America/New_York");
  });
});
