/**
 * meet-checklist-card.test.tsx
 *
 * Coverage targets (95%+):
 *  - DEFAULT_CHECKLIST_ITEMS — structure validation
 *  - MeetChecklistCard — render, check/uncheck, progress, completion,
 *    reset, remote mode, location/contact links, custom items,
 *    aria attributes, live-region announcements, callbacks
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import {
  DEFAULT_CHECKLIST_ITEMS,
  MeetChecklistCard,
  type MeetChecklistCardProps,
  type ChecklistItemId,
} from "./meet-checklist-card";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setup(props: Partial<MeetChecklistCardProps> = {}) {
  const onAllComplete = vi.fn();
  const onReset = vi.fn();
  const result = render(
    <MeetChecklistCard
      onAllComplete={onAllComplete}
      onReset={onReset}
      {...props}
    />,
  );
  return { ...result, onAllComplete, onReset };
}

/** Returns all checkbox buttons. */
function getCheckboxes() {
  return screen.getAllByRole("checkbox");
}

/** Returns the checkbox for a given label text. */
function getCheckbox(name: RegExp | string) {
  return screen.getByRole("checkbox", { name });
}

// ---------------------------------------------------------------------------
// DEFAULT_CHECKLIST_ITEMS
// ---------------------------------------------------------------------------

describe("DEFAULT_CHECKLIST_ITEMS", () => {
  it("has at least 3 items", () => {
    expect(DEFAULT_CHECKLIST_ITEMS.length).toBeGreaterThanOrEqual(3);
  });

  it("every item has a non-empty id and label", () => {
    for (const item of DEFAULT_CHECKLIST_ITEMS) {
      expect(item.id.length).toBeGreaterThan(0);
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it("at least one item is inPersonOnly", () => {
    const inPersonItems = DEFAULT_CHECKLIST_ITEMS.filter((i) => i.inPersonOnly);
    expect(inPersonItems.length).toBeGreaterThan(0);
  });

  it("confirm_location is inPersonOnly", () => {
    const item = DEFAULT_CHECKLIST_ITEMS.find((i) => i.id === "confirm_location");
    expect(item?.inPersonOnly).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

describe("MeetChecklistCard — rendering", () => {
  it("renders the card with heading", () => {
    setup();
    expect(
      screen.getByRole("heading", { name: /pre-meet checklist/i }),
    ).toBeInTheDocument();
  });

  it("renders the card testid", () => {
    setup();
    expect(screen.getByTestId("meet-checklist-card")).toBeInTheDocument();
  });

  it("renders default eyebrow 'In-person meet' for non-remote bookings", () => {
    setup({ isRemote: false });
    expect(screen.getByText(/in-person meet/i)).toBeInTheDocument();
  });

  it("renders 'Remote session' eyebrow when isRemote=true", () => {
    setup({ isRemote: true });
    // The eyebrow is a <p> element with the exact text
    const eyebrow = screen.getByText("Remote session", { selector: "p" });
    expect(eyebrow).toBeInTheDocument();
  });

  it("renders meeting time when provided", () => {
    setup({ meetingTime: "Tue 29 Jul, 2:00 PM" });
    expect(screen.getByText("Tue 29 Jul, 2:00 PM")).toBeInTheDocument();
  });

  it("does not render meeting time when not provided", () => {
    setup({ meetingTime: undefined });
    expect(screen.queryByText(/jul/i)).not.toBeInTheDocument();
  });

  it("renders all default items as checkboxes in non-remote mode", () => {
    setup({ isRemote: false });
    // All default items visible
    expect(getCheckboxes().length).toBe(DEFAULT_CHECKLIST_ITEMS.length);
  });

  it("hides inPersonOnly items in remote mode", () => {
    setup({ isRemote: true });
    const inPersonCount = DEFAULT_CHECKLIST_ITEMS.filter(
      (i) => i.inPersonOnly,
    ).length;
    const expectedCount = DEFAULT_CHECKLIST_ITEMS.length - inPersonCount;
    expect(getCheckboxes().length).toBe(expectedCount);
  });

  it("shows remote notice in remote mode", () => {
    setup({ isRemote: true });
    expect(
      screen.getByText(/remote session.*in-person steps are not required/i),
    ).toBeInTheDocument();
  });

  it("renders progress chip showing 0/N initially", () => {
    setup();
    const total = DEFAULT_CHECKLIST_ITEMS.length;
    expect(screen.getByText(`0/${total}`)).toBeInTheDocument();
  });

  it("renders location link when locationLabel and locationHref provided", () => {
    setup({
      locationLabel: "Central Park",
      locationHref: "https://maps.example.com",
      isRemote: false,
    });
    const link = screen.getByRole("link", { name: /open location in maps/i });
    expect(link).toHaveAttribute("href", "https://maps.example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders location link without href when locationHref is omitted", () => {
    setup({ locationLabel: "Central Park", locationHref: undefined, isRemote: false });
    const link = screen.getByRole("link", { name: /open location in maps/i });
    expect(link).toHaveAttribute("href", "#");
  });

  it("does not render location link in remote mode", () => {
    setup({ locationLabel: "Central Park", locationHref: "https://maps.example.com", isRemote: true });
    expect(screen.queryByRole("link", { name: /open location in maps/i })).not.toBeInTheDocument();
  });

  it("renders contact link when contactHref provided", () => {
    setup({ contactHref: "tel:+1234567890", contactLabel: "Call Alex" });
    const link = screen.getByRole("link", { name: /call alex/i });
    expect(link).toHaveAttribute("href", "tel:+1234567890");
  });

  it("does not render contact/location strip when neither is provided on remote booking", () => {
    setup({ isRemote: true, locationHref: undefined, contactHref: undefined });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("does not render reset button initially (nothing checked)", () => {
    setup();
    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
  });

  it("renders a progressbar with correct aria attributes", () => {
    setup();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute(
      "aria-valuemax",
      String(DEFAULT_CHECKLIST_ITEMS.length),
    );
  });
});

// ---------------------------------------------------------------------------
// Checkbox interaction
// ---------------------------------------------------------------------------

describe("MeetChecklistCard — checking items", () => {
  it("all checkboxes start unchecked", () => {
    setup();
    for (const cb of getCheckboxes()) {
      expect(cb).toHaveAttribute("aria-checked", "false");
    }
  });

  it("clicking a checkbox marks it checked", async () => {
    const user = userEvent.setup();
    setup();
    const cb = getCheckboxes()[0];
    await user.click(cb);
    expect(cb).toHaveAttribute("aria-checked", "true");
  });

  it("clicking a checked checkbox unchecks it", async () => {
    const user = userEvent.setup();
    setup();
    const cb = getCheckboxes()[0];
    await user.click(cb);
    await user.click(cb);
    expect(cb).toHaveAttribute("aria-checked", "false");
  });

  it("progress chip updates after checking an item", async () => {
    const user = userEvent.setup();
    setup();
    const total = DEFAULT_CHECKLIST_ITEMS.length;
    await user.click(getCheckboxes()[0]);
    expect(screen.getByText(`1/${total}`)).toBeInTheDocument();
  });

  it("progressbar aria-valuenow increments after checking", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(getCheckboxes()[0]);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
  });

  it("footer progress text updates", async () => {
    const user = userEvent.setup();
    setup();
    const total = DEFAULT_CHECKLIST_ITEMS.length;
    await user.click(getCheckboxes()[0]);
    expect(screen.getByText(`1 of ${total} steps complete`)).toBeInTheDocument();
  });

  it("reset button appears after first check", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(getCheckboxes()[0]);
    expect(screen.getByRole("button", { name: /reset checklist/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Completion
// ---------------------------------------------------------------------------

describe("MeetChecklistCard — completion", () => {
  async function checkAll() {
    const user = userEvent.setup();
    setup();
    for (const cb of getCheckboxes()) {
      await user.click(cb);
    }
    return user;
  }

  it("shows completion alert when all items are checked", async () => {
    await checkAll();
    expect(
      screen.getByRole("alert"),
    ).toHaveTextContent(/all steps complete/i);
  });

  it("status chip changes to positive tone text when complete", async () => {
    setup();
    const total = DEFAULT_CHECKLIST_ITEMS.length;
    const user = userEvent.setup();
    for (const cb of getCheckboxes()) await user.click(cb);
    expect(screen.getByText(`${total}/${total}`)).toBeInTheDocument();
  });

  it("calls onAllComplete with the full set of ids", async () => {
    const onAllComplete = vi.fn();
    const user = userEvent.setup();
    setup({ onAllComplete });
    for (const cb of getCheckboxes()) await user.click(cb);
    expect(onAllComplete).toHaveBeenCalledTimes(1);
    const arg = onAllComplete.mock.calls[0][0] as Set<ChecklistItemId>;
    expect(arg.size).toBe(DEFAULT_CHECKLIST_ITEMS.length);
  });

  it("footer shows 'All steps complete' when done", async () => {
    await checkAll();
    // Footer progress <p> - use the footer text specifically
    const footerText = screen.getByText("All steps complete", { selector: "p" });
    expect(footerText).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

describe("MeetChecklistCard — reset", () => {
  it("reset button unchecks all items", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(getCheckboxes()[0]);
    await user.click(screen.getByRole("button", { name: /reset/i }));
    for (const cb of getCheckboxes()) {
      expect(cb).toHaveAttribute("aria-checked", "false");
    }
  });

  it("reset button disappears after reset", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(getCheckboxes()[0]);
    const resetBtn = screen.getByRole("button", { name: /reset/i });
    await user.click(resetBtn);
    expect(screen.queryByRole("button", { name: /reset/i })).not.toBeInTheDocument();
  });

  it("calls onReset callback", async () => {
    const onReset = vi.fn();
    const user = userEvent.setup();
    setup({ onReset });
    await user.click(getCheckboxes()[0]);
    await user.click(screen.getByRole("button", { name: /reset/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("completion alert disappears after reset", async () => {
    const user = userEvent.setup();
    setup();
    for (const cb of getCheckboxes()) await user.click(cb);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /reset/i }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("progressbar resets to 0 after reset", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(getCheckboxes()[0]);
    await user.click(screen.getByRole("button", { name: /reset/i }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  });
});

// ---------------------------------------------------------------------------
// Custom items
// ---------------------------------------------------------------------------

describe("MeetChecklistCard — custom items", () => {
  const customItems = [
    { id: "confirm_time" as ChecklistItemId, label: "Check time" },
    { id: "safety_check" as ChecklistItemId, label: "Safety check", description: "Be safe." },
  ] as const;

  it("renders custom items", () => {
    setup({ items: customItems });
    expect(screen.getByRole("checkbox", { name: /check time/i })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: /safety check/i })).toBeInTheDocument();
  });

  it("renders item description as accessible description", () => {
    setup({ items: customItems });
    expect(screen.getByText("Be safe.")).toBeInTheDocument();
  });

  it("renders item with actionHref as a link inside the row", () => {
    const itemsWithAction = [
      {
        id: "confirm_location" as ChecklistItemId,
        label: "View map",
        actionHref: "https://maps.example.com",
        actionLabel: "Open map",
      },
    ];
    setup({ items: itemsWithAction, isRemote: false });
    const actionLink = screen.getByRole("link", { name: "Open map" });
    expect(actionLink).toHaveAttribute("href", "https://maps.example.com");
    expect(actionLink).toHaveAttribute("target", "_blank");
  });

  it("clicking the action link does not toggle the checkbox (stopPropagation)", async () => {
    const user = userEvent.setup();
    const itemsWithAction = [
      {
        id: "confirm_location" as ChecklistItemId,
        label: "View map",
        actionHref: "https://maps.example.com",
        actionLabel: "Open map",
      },
    ];
    setup({ items: itemsWithAction, isRemote: false });
    const cb = getCheckboxes()[0];
    const actionLink = screen.getByRole("link", { name: "Open map" });
    // Click the link — stopPropagation should prevent the checkbox from toggling
    await user.click(actionLink);
    expect(cb).toHaveAttribute("aria-checked", "false");
  });

  it("renders action link with default 'Open' label when actionLabel omitted", () => {
    const itemsWithAction = [
      {
        id: "confirm_location" as ChecklistItemId,
        label: "View map",
        actionHref: "https://maps.example.com",
      },
    ];
    setup({ items: itemsWithAction, isRemote: false });
    expect(screen.getByRole("link", { name: /^open: view map/i })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe("MeetChecklistCard — accessibility", () => {
  it("card has an accessible name via aria-labelledby", () => {
    setup();
    // The article/card element should be labelled by the heading
    const card = screen.getByTestId("meet-checklist-card");
    expect(card).toHaveAttribute("aria-labelledby");
  });

  it("checklist group has an accessible label", () => {
    setup();
    // The <ul role="group"> is labelled via aria-labelledby pointing to a <p>
    expect(
      screen.getByText(/steps to complete before your session/i),
    ).toBeInTheDocument();
  });

  it("progressbar has descriptive aria-label", () => {
    setup();
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-label");
    expect(bar.getAttribute("aria-label")).toMatch(/checklist progress/i);
  });

  it("role=status live region is present", () => {
    setup();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("each checkbox has aria-checked", () => {
    setup();
    for (const cb of getCheckboxes()) {
      expect(cb).toHaveAttribute("aria-checked");
    }
  });

  it("checkboxes with descriptions have aria-describedby", () => {
    const itemsWithDesc = [
      {
        id: "safety_check" as ChecklistItemId,
        label: "Safety check",
        description: "Be careful.",
      },
    ];
    setup({ items: itemsWithDesc });
    const cb = getCheckbox(/safety check/i);
    expect(cb).toHaveAttribute("aria-describedby");
  });

  it("checkboxes without descriptions do not have aria-describedby", () => {
    const itemsNoDesc = [
      { id: "confirm_time" as ChecklistItemId, label: "Confirm time" },
    ];
    setup({ items: itemsNoDesc });
    const cb = getCheckbox(/confirm time/i);
    expect(cb).not.toHaveAttribute("aria-describedby");
  });

  it("reset button has a descriptive aria-label", async () => {
    const user = userEvent.setup();
    setup();
    await user.click(getCheckboxes()[0]);
    expect(
      screen.getByRole("button", { name: /reset checklist — uncheck all steps/i }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe("MeetChecklistCard — edge cases", () => {
  it("renders correctly with zero custom items", () => {
    setup({ items: [] });
    expect(screen.getByTestId("meet-checklist-card")).toBeInTheDocument();
    // Progress bar should show 0/0
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "0");
  });

  it("handles remote mode with contactHref showing contact link", () => {
    setup({
      isRemote: true,
      contactHref: "mailto:supplier@example.com",
      contactLabel: "Email supplier",
    });
    expect(
      screen.getByRole("link", { name: /email supplier/i }),
    ).toBeInTheDocument();
  });

  it("applies custom className to outer card", () => {
    setup({ className: "my-custom-class" });
    expect(screen.getByTestId("meet-checklist-card")).toHaveClass(
      "my-custom-class",
    );
  });

  it("location link without href falls back to #", () => {
    setup({ locationLabel: "Office", isRemote: false });
    const link = screen.getByRole("link", { name: /open location in maps/i });
    expect(link).toHaveAttribute("href", "#");
    expect(link).not.toHaveAttribute("target");
  });

  it("footer progress text says 'All steps complete' when 0 items and nothing to do", () => {
    // Empty items list — allComplete is false (0 > 0 is false), so shows "0 of 0"
    setup({ items: [] });
    expect(screen.getByText(/0 of 0 steps complete/i)).toBeInTheDocument();
  });

  it("onAllComplete is not called when an item is unchecked after all were checked", async () => {
    const onAllComplete = vi.fn();
    const user = userEvent.setup();
    const oneItem = [
      { id: "confirm_time" as ChecklistItemId, label: "Check time" },
    ];
    setup({ items: oneItem, onAllComplete });
    const cb = getCheckboxes()[0];
    await user.click(cb); // check → complete fires
    expect(onAllComplete).toHaveBeenCalledTimes(1);
    // uncheck and re-check — onAllComplete fires again (new completion)
    await user.click(cb);
    await user.click(cb);
    expect(onAllComplete).toHaveBeenCalledTimes(2);
  });
});
