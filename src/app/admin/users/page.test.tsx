import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import AdminUsersPage from "./page";
import { SAMPLE_ADMIN_USERS } from "@/components/dashboard/admin-user-data";
import { RoleProvider } from "@/app/components/navigation/RoleContext";
import { ToastProvider } from "@/hooks/use-toast";
import type { UserRole as NavRole } from "@/app/components/navigation/role-nav";

// ── Navigation mock with reactive URLSearchParams ────────────────────────────

const navState = vi.hoisted(() => ({
  pathname: "/admin/users",
  search: "",
  replaceSpy: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navState.pathname,
  useSearchParams: () => new URLSearchParams(navState.search),
  useRouter: () => ({
    replace: (url: string, opts?: { scroll?: boolean }) => {
      navState.replaceSpy(url, opts);
      const qIdx = url.indexOf("?");
      navState.search = qIdx >= 0 ? url.slice(qIdx + 1) : "";
    },
    push: vi.fn(),
  }),
}));

function renderAdminPage(role: NavRole = "admin", initialQuery = "") {
  navState.search = initialQuery.replace(/^\?/, "");
  window.localStorage.clear();
  window.history.replaceState(
    null,
    "",
    `/admin/users${navState.search ? `?${navState.search}` : ""}`,
  );
  return render(
    <ToastProvider>
      <RoleProvider initialRole={role}>
        <AdminUsersPage />
      </RoleProvider>
    </ToastProvider>,
  );
}

describe("AdminUsersPage", () => {
  beforeEach(() => {
    navState.search = "";
    navState.replaceSpy.mockClear();
    window.localStorage.clear();
  });

  // ── Role gating ────────────────────────────────────────────────────────────

  it("gates non-admin roles (buyer and supplier) with a forbidden state and link home", () => {
    const { unmount } = renderAdminPage("buyer");

    expect(screen.getByTestId("admin-forbidden-state")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /access restricted/i })).toBeInTheDocument();
    const homeLink = screen.getByTestId("forbidden-home-link");
    expect(homeLink).toHaveAttribute("href", "/dashboard");
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();

    unmount();

    renderAdminPage("supplier");
    expect(screen.getByTestId("admin-forbidden-state")).toBeInTheDocument();
    expect(screen.queryByRole("grid")).not.toBeInTheDocument();
  });

  // ── Structure / rendering for admin ────────────────────────────────────────

  it("renders the page landmark, heading, and panel chrome for admin role", () => {
    renderAdminPage("admin");

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");

    expect(
      screen.getByRole("heading", { level: 1, name: /user management/i }),
    ).toBeInTheDocument();

    expect(screen.getByText(/view, sort, and manage platform users/i)).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /all users/i })).toBeInTheDocument();
  });

  it("renders every sample user as a row in the grid on default page size (10)", () => {
    renderAdminPage("admin");

    const grid = screen.getByRole("grid", { name: /user management/i });
    expect(grid).toHaveAttribute("aria-rowcount", String(SAMPLE_ADMIN_USERS.length + 1));

    for (const user of SAMPLE_ADMIN_USERS) {
      expect(screen.getByTestId(`row-${user.id}`)).toBeInTheDocument();
      expect(within(grid).getByText(user.name)).toBeInTheDocument();
    }
  });

  // ── Primary state transition: selection → bulk toolbar ────────────────────

  it("shows no bulk toolbar until a row is selected, then reflects the selection count", async () => {
    const user = userEvent.setup();
    renderAdminPage("admin");

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();

    const first = SAMPLE_ADMIN_USERS[0];
    await user.click(screen.getByTestId(`checkbox-${first.id}`));

    const toolbar = await screen.findByRole("toolbar");
    expect(toolbar).toHaveAccessibleName(/1 user selected/i);
  });

  it("supports select-all via the header checkbox and reports the full count", async () => {
    const user = userEvent.setup();
    renderAdminPage("admin");

    await user.click(screen.getByTestId("select-all-checkbox"));

    const toolbar = await screen.findByRole("toolbar");
    expect(toolbar).toHaveAccessibleName(
      new RegExp(`${SAMPLE_ADMIN_USERS.length} users selected`, "i"),
    );

    await user.click(screen.getByTestId("select-all-checkbox"));
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  // ── Bulk actions: confirm dialog, state mutation, and undo toast ───────────

  it("changes user role after confirmation and reverts on undo", async () => {
    const user = userEvent.setup();
    renderAdminPage("admin");

    // Target u2 (Bob Okafor, initially "supplier")
    const target = SAMPLE_ADMIN_USERS[1];
    expect(within(screen.getByTestId(`row-${target.id}`)).getByText("supplier")).toBeInTheDocument();

    await user.click(screen.getByTestId(`checkbox-${target.id}`));
    await user.click(screen.getByRole("button", { name: /set role/i }));
    await user.click(await screen.findByTestId("role-option-moderator"));

    // Confirm dialog appears before mutating
    const confirmDialog = await screen.findByTestId("bulk-confirm-dialog");
    expect(confirmDialog).toBeInTheDocument();
    expect(within(screen.getByTestId(`row-${target.id}`)).getByText("supplier")).toBeInTheDocument();

    await user.click(screen.getByTestId("bulk-confirm-submit"));

    // Row role is now mutated to moderator
    expect(within(screen.getByTestId(`row-${target.id}`)).getByText("moderator")).toBeInTheDocument();

    // Undo toast appears and clicking Undo restores previous role
    const undoBtn = await screen.findByTestId("bulk-undo-button");
    await user.click(undoBtn);

    expect(within(screen.getByTestId(`row-${target.id}`)).getByText("supplier")).toBeInTheDocument();
  });

  it("suspends selected users after confirmation and reverts on undo", async () => {
    const user = userEvent.setup();
    renderAdminPage("admin");

    // Target u1 (Alice Chen, initially "active")
    const target = SAMPLE_ADMIN_USERS[0];
    expect(within(screen.getByTestId(`row-${target.id}`)).getByText("active")).toBeInTheDocument();

    await user.click(screen.getByTestId(`checkbox-${target.id}`));
    await user.click(screen.getByTestId("bulk-suspend"));

    await screen.findByTestId("bulk-confirm-dialog");
    await user.click(screen.getByTestId("bulk-confirm-submit"));

    expect(within(screen.getByTestId(`row-${target.id}`)).getByText("suspended")).toBeInTheDocument();

    // Undo restores "active"
    await user.click(await screen.findByTestId("bulk-undo-button"));
    expect(within(screen.getByTestId(`row-${target.id}`)).getByText("active")).toBeInTheDocument();
  });

  it("sends a bulk message after confirmation, records it in state, and reverts on undo", async () => {
    const user = userEvent.setup();
    renderAdminPage("admin");

    const target = SAMPLE_ADMIN_USERS[2];
    await user.click(screen.getByTestId(`checkbox-${target.id}`));
    await user.click(screen.getByTestId("bulk-message-toggle"));

    const textarea = await screen.findByLabelText(/message to 1 user/i);
    await user.type(textarea, "  Please verify your account  ");
    await user.click(screen.getByTestId("bulk-message-send"));

    await screen.findByTestId("bulk-confirm-dialog");
    await user.click(screen.getByTestId("bulk-confirm-submit"));

    const log = await screen.findByTestId("sent-messages-log");
    expect(within(log).getByText(/Please verify your account/)).toBeInTheDocument();

    // Undo removes the sent message from the store
    await user.click(await screen.findByTestId("bulk-undo-button"));
    expect(screen.queryByTestId("sent-messages-log")).not.toBeInTheDocument();
  });

  it("cancelling the confirm dialog leaves user state unchanged", async () => {
    const user = userEvent.setup();
    renderAdminPage("admin");

    const target = SAMPLE_ADMIN_USERS[0];
    await user.click(screen.getByTestId(`checkbox-${target.id}`));
    await user.click(screen.getByTestId("bulk-suspend"));

    await screen.findByTestId("bulk-confirm-dialog");
    await user.click(screen.getByTestId("bulk-confirm-cancel"));

    expect(screen.queryByTestId("bulk-confirm-dialog")).not.toBeInTheDocument();
    expect(within(screen.getByTestId(`row-${target.id}`)).getByText("active")).toBeInTheDocument();
  });

  // ── Failure / boundary paths ───────────────────────────────────────────────

  it("keeps the 'Send' message action disabled for whitespace-only input", async () => {
    const user = userEvent.setup();
    renderAdminPage("admin");

    const target = SAMPLE_ADMIN_USERS[0];
    await user.click(screen.getByTestId(`checkbox-${target.id}`));
    await user.click(screen.getByTestId("bulk-message-toggle"));

    const sendButton = screen.getByTestId("bulk-message-send");
    expect(sendButton).toBeDisabled();

    const textarea = await screen.findByLabelText(/message to 1 user/i);
    await user.type(textarea, "   ");
    expect(sendButton).toBeDisabled();

    await user.click(sendButton);
    expect(screen.queryByTestId("bulk-confirm-dialog")).not.toBeInTheDocument();
  });

  it("dismissing the toolbar clears the selection without opening a confirm dialog", async () => {
    const user = userEvent.setup();
    renderAdminPage("admin");

    await user.click(screen.getByTestId("select-all-checkbox"));
    await screen.findByRole("toolbar");

    await user.click(screen.getByTestId("bulk-dismiss"));

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    expect(screen.queryByTestId("bulk-confirm-dialog")).not.toBeInTheDocument();
  });

  // ── URL state: sorting, filtering, and paging synced with searchParams ────

  it("persists sort and pagination changes in URL search params and restores state from URL", async () => {
    const user = userEvent.setup();
    const { unmount } = renderAdminPage("admin");

    const grid = screen.getByRole("grid", { name: /user management/i });
    await user.click(screen.getByTestId("sort-name"));

    expect(navState.replaceSpy).toHaveBeenCalledWith(
      expect.stringContaining("sort=name%3Aasc"),
      expect.anything(),
    );
    expect(screen.getByTestId("sort-name").closest("th")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );

    // Change page size to 5 and go to page 2
    await user.selectOptions(screen.getByTestId("page-size-select"), "5");
    expect(navState.replaceSpy).toHaveBeenCalledWith(
      expect.stringContaining("pageSize=5"),
      expect.anything(),
    );
    expect(within(grid).getAllByRole("row")).toHaveLength(6); // 1 header + 5 rows

    await user.click(screen.getByTestId("pagination-next"));
    expect(navState.replaceSpy).toHaveBeenCalledWith(
      expect.stringContaining("page=2"),
      expect.anything(),
    );
    expect(screen.getByTestId("pagination-status")).toHaveTextContent("Page 2 of 2");

    unmount();

    // Hydrate from shared URL query string directly
    renderAdminPage("admin", "?sort=payouts:desc&role=supplier&pageSize=5&page=1");
    expect(screen.getByTestId("sort-payouts").closest("th")).toHaveAttribute(
      "aria-sort",
      "descending",
    );
    // Only supplier rows are rendered, ordered by payouts descending (Bob=210, Hamid=133, Eve=55)
    const renderedGrid = screen.getByRole("grid", { name: /user management/i });
    const renderedNames = within(renderedGrid)
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("gridcell")[0].textContent?.trim());
    expect(renderedNames).toEqual(["Bob Okafor", "Hamid Rashid", "Eve Nakamura"]);
  });
});
