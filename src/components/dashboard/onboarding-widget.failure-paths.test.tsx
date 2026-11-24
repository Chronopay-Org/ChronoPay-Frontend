/**
 * Focused regression coverage for the failure / empty-result paths of
 * `OnboardingWidget` (issue #982).
 *
 * Branch evidence in `onboarding-widget.tsx`:
 *   - line 59: `if (dismissed) return null;`
 *
 * The contract is: once the widget is dismissed it must render **nothing at
 * all** – no panel, no tasks, no progress ring.  Dismissal is only reachable
 * after every task for the current role is checked off (completedCount ===
 * totalCount), so this suite also pins the task-completion gate, the two-step
 * confirm dialog, and the Cancel path that aborts dismissal without mutating
 * state.  The neighbouring normal-path and boundary-input cases confirm the
 * returned UI contract across all three roles and at 0 / partial / 100 %
 * progress.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoleProvider } from "@/app/components/navigation/RoleContext";
import { OnboardingWidget } from "./onboarding-widget";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

type Role = "buyer" | "supplier" | "admin";

function renderWidget(initialRole: Role = "buyer") {
  return render(
    <RoleProvider initialRole={initialRole}>
      <OnboardingWidget />
    </RoleProvider>,
  );
}

/** Check every unchecked task for the given role so the widget reaches 100 %. */
function completeAllTasks() {
  const unchecked = screen
    .getAllByRole("checkbox")
    .filter((cb) => !(cb as HTMLInputElement).checked);
  for (const cb of unchecked) {
    fireEvent.click(cb);
  }
}

// ---------------------------------------------------------------------------
// 1.  The `dismissed` branch (line 59) — core failure path
// ---------------------------------------------------------------------------

describe("OnboardingWidget dismissed branch (#982)", () => {
  it("returns null after the user confirms dismissal — widget is completely unmounted", () => {
    renderWidget();

    // Reach 100 % so the dismiss button appears.
    completeAllTasks();

    // Open the confirm dialog.
    fireEvent.click(screen.getByRole("button", { name: /dismiss widget/i }));
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();

    // Confirm — triggers setDismissed(true) → `if (dismissed) return null`.
    fireEvent.click(screen.getByRole("button", { name: /confirm dismiss/i }));

    // The entire widget must be gone — no panel title, no tasks, no progress.
    expect(screen.queryByText("Buyer setup guide")).not.toBeInTheDocument();
    expect(screen.queryByText("Getting Started")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("returns null for the supplier role too once dismissed", () => {
    renderWidget("supplier");

    completeAllTasks();
    fireEvent.click(screen.getByRole("button", { name: /dismiss widget/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm dismiss/i }));

    expect(screen.queryByText("Supplier setup guide")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("returns null for the admin role too once dismissed", () => {
    renderWidget("admin");

    completeAllTasks();
    fireEvent.click(screen.getByRole("button", { name: /dismiss widget/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm dismiss/i }));

    expect(screen.queryByText("Admin setup guide")).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  });

  it("does NOT return null when dismissal is cancelled — widget stays mounted", () => {
    renderWidget();

    completeAllTasks();
    fireEvent.click(screen.getByRole("button", { name: /dismiss widget/i }));

    // Click Cancel — setShowConfirm(false) but setDismissed stays false.
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    // Widget must still be present.
    expect(screen.getByText("Buyer setup guide")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("does NOT return null before all tasks are complete — no dismiss button visible", () => {
    renderWidget();

    // Only 1 of 3 tasks pre-completed → progress < 100 %.
    expect(screen.queryByRole("button", { name: /dismiss widget/i })).not.toBeInTheDocument();
    expect(screen.getByText("Buyer setup guide")).toBeInTheDocument();
  });

  it("does NOT return null after partial completion — widget remains fully rendered", () => {
    renderWidget();

    fireEvent.click(screen.getByLabelText("Mark Review open supplier slots as complete"));

    expect(screen.queryByRole("button", { name: /dismiss widget/i })).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 2.  Normal-path rendering contract across all three roles
// ---------------------------------------------------------------------------

describe("OnboardingWidget normal path", () => {
  it("renders buyer copy, eyebrow, and all buyer tasks by default", () => {
    renderWidget("buyer");

    expect(screen.getByText("Getting Started")).toBeInTheDocument();
    expect(screen.getByText("Buyer setup guide")).toBeInTheDocument();
    expect(
      screen.getByText(/Start with the essentials for booking time safely/),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Mark Connect wallet as complete")).toBeInTheDocument();
    expect(screen.getByLabelText("Mark Review open supplier slots as complete")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Mark Book your first protected session as complete"),
    ).toBeInTheDocument();
  });

  it("renders supplier copy, eyebrow, and all supplier tasks", () => {
    renderWidget("supplier");

    expect(screen.getByText("Supplier Launch")).toBeInTheDocument();
    expect(screen.getByText("Supplier setup guide")).toBeInTheDocument();
    expect(
      screen.getByText(/Shape your public availability and payout readiness/),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Mark Connect payout wallet as complete")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Mark Publish your weekly availability as complete"),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Mark Prepare your first supplier offer as complete"),
    ).toBeInTheDocument();
  });

  it("renders admin copy, eyebrow, and all admin tasks", () => {
    renderWidget("admin");

    expect(screen.getByText("Operations")).toBeInTheDocument();
    expect(screen.getByText("Admin setup guide")).toBeInTheDocument();
    expect(
      screen.getByText(/Use this checklist to verify controls/),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Mark Review system health as complete")).toBeInTheDocument();
    expect(screen.getByLabelText("Mark Confirm risk controls as complete")).toBeInTheDocument();
    expect(screen.getByLabelText("Mark Triage active escalations as complete")).toBeInTheDocument();
  });

  it("renders a Jump link for every task", () => {
    renderWidget("buyer");

    const jumpLinks = screen.getAllByRole("link", { name: /Jump to/i });
    expect(jumpLinks).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// 3.  Progress-ring boundary inputs
// ---------------------------------------------------------------------------

describe("OnboardingWidget progress boundary cases", () => {
  it("shows 33 % with one pre-completed task out of three (buyer default)", () => {
    renderWidget("buyer");
    expect(screen.getByText("33%")).toBeInTheDocument();
  });

  it("shows 33 % for supplier (one pre-completed task)", () => {
    renderWidget("supplier");
    expect(screen.getByText("33%")).toBeInTheDocument();
  });

  it("shows 33 % for admin (one pre-completed task)", () => {
    renderWidget("admin");
    expect(screen.getByText("33%")).toBeInTheDocument();
  });

  it("advances to 67 % when a second task is checked", () => {
    renderWidget("buyer");

    fireEvent.click(screen.getByLabelText("Mark Review open supplier slots as complete"));
    expect(screen.getByText("67%")).toBeInTheDocument();
  });

  it("reaches 100 % when all tasks are checked", () => {
    renderWidget("buyer");

    completeAllTasks();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  it("progressbar aria-valuenow reflects the current rounded percentage", () => {
    renderWidget("buyer");

    const ring = screen.getByRole("progressbar");
    expect(ring).toHaveAttribute("aria-valuenow", "33");
    expect(ring).toHaveAttribute("aria-valuemin", "0");
    expect(ring).toHaveAttribute("aria-valuemax", "100");

    fireEvent.click(screen.getByLabelText("Mark Review open supplier slots as complete"));
    expect(ring).toHaveAttribute("aria-valuenow", "67");

    completeAllTasks();
    expect(ring).toHaveAttribute("aria-valuenow", "100");
  });

  it("checking a task also updates its visual style to struck-through", () => {
    renderWidget("buyer");

    const label = screen.getByText("Review open supplier slots");
    expect(label.className).not.toContain("line-through");

    fireEvent.click(screen.getByLabelText("Mark Review open supplier slots as complete"));

    expect(label.className).toContain("line-through");
  });

  it("un-checking a completed task drops progress back below 100 % and hides dismiss button", () => {
    renderWidget("buyer");

    completeAllTasks();
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dismiss widget/i })).toBeInTheDocument();

    // Un-check the first (pre-completed) task.
    fireEvent.click(screen.getByLabelText("Mark Connect wallet as complete"));
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /dismiss widget/i })).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 4.  Two-step dismiss flow (showConfirm state)
// ---------------------------------------------------------------------------

describe("OnboardingWidget dismiss confirmation dialog", () => {
  it("does not show the confirm dialog on first render", () => {
    renderWidget("buyer");
    completeAllTasks();

    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /confirm dismiss/i })).not.toBeInTheDocument();
  });

  it("opens the confirm dialog when Dismiss widget is clicked", () => {
    renderWidget("buyer");
    completeAllTasks();

    fireEvent.click(screen.getByRole("button", { name: /dismiss widget/i }));

    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm dismiss/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
  });

  it("returns to the Dismiss widget button when Cancel is clicked", () => {
    renderWidget("buyer");
    completeAllTasks();

    fireEvent.click(screen.getByRole("button", { name: /dismiss widget/i }));
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));

    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dismiss widget/i })).toBeInTheDocument();
  });

  it("confirm dialog uses alertdialog role with aria-labelledby pointing to the prompt", () => {
    renderWidget("buyer");
    completeAllTasks();

    fireEvent.click(screen.getByRole("button", { name: /dismiss widget/i }));

    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toBeInTheDocument();
    const labelId = dialog.getAttribute("aria-labelledby");
    expect(labelId).toBeTruthy();
    const labelEl = document.getElementById(labelId!);
    expect(labelEl).not.toBeNull();
    expect(labelEl!.textContent).toBe("Are you sure?");
  });

  it("Confirm dismiss unmounts the entire widget (the dismissed branch)", () => {
    renderWidget("buyer");
    completeAllTasks();

    fireEvent.click(screen.getByRole("button", { name: /dismiss widget/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm dismiss/i }));

    expect(screen.queryByText("Buyer setup guide")).not.toBeInTheDocument();
    expect(screen.queryByText("Are you sure?")).not.toBeInTheDocument();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// 5.  ARIA / accessibility contract
// ---------------------------------------------------------------------------

describe("OnboardingWidget accessibility contract", () => {
  it("each checkbox carries a descriptive aria-label", () => {
    renderWidget("buyer");

    expect(
      screen.getByRole("checkbox", { name: "Mark Connect wallet as complete" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Mark Review open supplier slots as complete" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Mark Book your first protected session as complete" }),
    ).toBeInTheDocument();
  });

  it("each Jump link carries a descriptive aria-label", () => {
    renderWidget("buyer");

    expect(screen.getByRole("link", { name: "Jump to Connect wallet" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Jump to Review open supplier slots" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Jump to Book your first protected session" }),
    ).toBeInTheDocument();
  });

  it("the sr-only progress label references the correct role and counts", () => {
    renderWidget("buyer");

    // The screen-reader-only span is inside the progressbar; it is not a
    // named ARIA label on the progressbar itself but an sr-only child.
    const srLabel = document.querySelector(".sr-only");
    expect(srLabel).not.toBeNull();
    expect(srLabel!.textContent).toMatch(/1 of 3 tasks completed for the buyer role/);
  });

  it("sr-only progress label updates as tasks are completed", () => {
    renderWidget("buyer");

    fireEvent.click(screen.getByLabelText("Mark Review open supplier slots as complete"));

    const srLabel = document.querySelector(".sr-only");
    expect(srLabel!.textContent).toMatch(/2 of 3 tasks completed for the buyer role/);
  });
});
