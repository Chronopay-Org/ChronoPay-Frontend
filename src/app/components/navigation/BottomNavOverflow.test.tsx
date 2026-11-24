import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BottomNavOverflow } from "./BottomNavOverflow";
import { UserRole, BOTTOM_NAV_MAX_VISIBLE } from "./role-nav";

// Mock next/navigation
const mockUsePathname = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

// Mock role-nav storage
vi.mock("./role-nav", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./role-nav")>();
  return {
    ...actual,
    readPinnedHrefs: vi.fn(() => []),
    writePinnedHrefs: vi.fn(),
  };
});

import { readPinnedHrefs, writePinnedHrefs } from "./role-nav";

describe("BottomNavOverflow", () => {
  const mockItems = Array.from({ length: 7 }, (_, i) => ({
    href: `/item-${i + 1}`,
    label: `Item ${i + 1}`,
    icon: "🌟",
  }));
  const role: UserRole = "buyer";

  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue("/");
    (readPinnedHrefs as any).mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders all items in nav when items <= BOTTOM_NAV_MAX_VISIBLE", () => {
    const fewItems = mockItems.slice(0, 4); // BOTTOM_NAV_MAX_VISIBLE is usually 5
    render(<BottomNavOverflow items={fewItems} role={role} />);

    fewItems.forEach((item) => {
      expect(screen.getByRole("link", { name: item.label })).toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: /more navigation options/i })).not.toBeInTheDocument();
  });

  it("renders MAX_VISIBLE - 1 items and More button when items > BOTTOM_NAV_MAX_VISIBLE", () => {
    render(<BottomNavOverflow items={mockItems} role={role} />);
    
    // Check first 4 items are visible (assuming max is 5)
    mockItems.slice(0, 4).forEach((item) => {
      expect(screen.getByRole("link", { name: item.label })).toBeInTheDocument();
    });

    // 5th item should not be immediately visible in the bar
    expect(screen.queryByRole("link", { name: mockItems[4].label })).not.toBeInTheDocument();

    // More button should be present
    expect(screen.getByRole("button", { name: /more/i })).toBeInTheDocument();
  });

  it("opens the overflow sheet when 'More' is clicked", async () => {
    const user = userEvent.setup();
    render(<BottomNavOverflow items={mockItems} role={role} />);
    
    const moreBtn = screen.getByRole("button", { name: /more/i });
    expect(moreBtn).toHaveAttribute("aria-expanded", "false");

    await user.click(moreBtn);

    expect(moreBtn).toHaveAttribute("aria-expanded", "true");
    
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /more navigation/i })).toBeInTheDocument();

    // The overflow items should be in the sheet
    const overflowItem = mockItems[4];
    expect(within(dialog).getByRole("link", { name: overflowItem.label })).toBeInTheDocument();
  });

  it("closes the overflow sheet on pressing Escape", async () => {
    const user = userEvent.setup();
    render(<BottomNavOverflow items={mockItems} role={role} />);
    
    await user.click(screen.getByRole("button", { name: /more/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("pins an item and announces it", async () => {
    const user = userEvent.setup();
    render(<BottomNavOverflow items={mockItems} role={role} />);
    
    await user.click(screen.getByRole("button", { name: /more/i }));
    
    const overflowItem = mockItems[4];
    const pinBtn = screen.getByRole("button", { name: new RegExp(`Pin ${overflowItem.label}`, "i") });
    
    await user.click(pinBtn);
    
    expect(writePinnedHrefs).toHaveBeenCalledWith(role, [overflowItem.href]);
    expect(screen.getByText(new RegExp(`${overflowItem.label} pinned`, "i"))).toBeInTheDocument();
  });

  it("unpins an item and announces it", async () => {
    (readPinnedHrefs as any).mockReturnValue([mockItems[4].href]);
    const user = userEvent.setup();
    render(<BottomNavOverflow items={mockItems} role={role} />);
    
    await user.click(screen.getByRole("button", { name: /more/i }));
    
    const overflowItem = mockItems[4];
    const unpinBtn = screen.getByRole("button", { name: new RegExp(`Unpin ${overflowItem.label}`, "i") });
    
    await user.click(unpinBtn);
    
    expect(writePinnedHrefs).toHaveBeenCalledWith(role, []);
    expect(screen.getByText(new RegExp(`${overflowItem.label} unpinned`, "i"))).toBeInTheDocument();
  });

  it("highlights the active link", () => {
    mockUsePathname.mockReturnValue(mockItems[0].href);
    render(<BottomNavOverflow items={mockItems.slice(0, 3)} role={role} />);
    
    const activeLink = screen.getByRole("link", { name: mockItems[0].label });
    expect(activeLink).toHaveAttribute("aria-current", "page");
    
    const inactiveLink = screen.getByRole("link", { name: mockItems[1].label });
    expect(inactiveLink).not.toHaveAttribute("aria-current");
  });
  
  it("renders with empty items without crashing", () => {
    render(<BottomNavOverflow items={[]} role={role} />);
    expect(screen.queryByRole("navigation")).toBeInTheDocument();
  });
});
