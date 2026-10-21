import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import AdminUsersPage from "./page";
import { SAMPLE_ADMIN_USERS } from "@/components/dashboard/admin-user-data";

describe("AdminUsersPage", () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
  });

  afterEach(() => {
    infoSpy.mockRestore();
  });

  // ── Structure / rendering ────────────────────────────────────────────────

  it("renders the page landmark, heading, and panel chrome", () => {
    render(<AdminUsersPage />);

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "main-content");

    expect(
      screen.getByRole("heading", { level: 1, name: /user management/i }),
    ).toBeInTheDocument();

    expect(screen.getByText(/view, sort, and manage platform users/i)).toBeInTheDocument();

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /all users/i })).toBeInTheDocument();
  });

  it("renders every sample user as a row in the grid", () => {
    render(<AdminUsersPage />);

    const grid = screen.getByRole("grid", { name: /user management/i });
    expect(grid).toHaveAttribute("aria-rowcount", String(SAMPLE_ADMIN_USERS.length + 1));

    for (const user of SAMPLE_ADMIN_USERS) {
      expect(screen.getByTestId(`row-${user.id}`)).toBeInTheDocument();
      expect(within(grid).getByText(user.name)).toBeInTheDocument();
    }
  });

  // ── Primary state transition: selection → bulk toolbar ──────────────────

  it("shows no bulk toolbar until a row is selected, then reflects the selection count", async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();

    const first = SAMPLE_ADMIN_USERS[0];
    await user.click(screen.getByTestId(`checkbox-${first.id}`));

    const toolbar = await screen.findByRole("toolbar");
    expect(toolbar).toHaveAccessibleName(/1 user selected/i);
  });

  it("supports select-all via the header checkbox and reports the full count", async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);

    await user.click(screen.getByTestId("select-all-checkbox"));

    const toolbar = await screen.findByRole("toolbar");
    expect(toolbar).toHaveAccessibleName(
      new RegExp(`${SAMPLE_ADMIN_USERS.length} users selected`, "i"),
    );

    await user.click(screen.getByTestId("select-all-checkbox"));
    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
  });

  // ── Success paths: each bulk action reaches the page's handler ──────────

  it("wires the 'Set Role' bulk action through to the page handler with the selected ids", async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);

    const target = SAMPLE_ADMIN_USERS[1];
    await user.click(screen.getByTestId(`checkbox-${target.id}`));
    await user.click(screen.getByRole("button", { name: /set role/i }));
    await user.click(await screen.findByTestId("role-option-moderator"));

    expect(infoSpy).toHaveBeenCalledWith(
      "[AdminUsersPage] bulk action",
      expect.objectContaining({
        action: "setRole",
        ids: [target.id],
        payload: { role: "moderator" },
      }),
    );

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("wires the 'Suspend' bulk action through with every selected id", async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);

    await user.click(screen.getByTestId("select-all-checkbox"));
    await user.click(screen.getByTestId("bulk-suspend"));

    expect(infoSpy).toHaveBeenCalledWith(
      "[AdminUsersPage] bulk action",
      expect.objectContaining({
        action: "suspend",
        ids: expect.arrayContaining(SAMPLE_ADMIN_USERS.map((u) => u.id)),
      }),
    );
  });

  it("wires the 'Message' bulk action through with trimmed text", async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);

    const target = SAMPLE_ADMIN_USERS[2];
    await user.click(screen.getByTestId(`checkbox-${target.id}`));
    await user.click(screen.getByTestId("bulk-message-toggle"));

    const textarea = await screen.findByLabelText(/message to 1 user/i);
    await user.type(textarea, "  Please verify your account  ");
    await user.click(screen.getByTestId("bulk-message-send"));

    expect(infoSpy).toHaveBeenCalledWith(
      "[AdminUsersPage] bulk action",
      expect.objectContaining({
        action: "message",
        ids: [target.id],
        payload: { text: "Please verify your account" },
      }),
    );
  });

  // ── Failure / boundary paths ──────────────────────────────────────────

  it("keeps the 'Send' message action disabled for whitespace-only input (invalid input, deterministic no-op)", async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);

    const target = SAMPLE_ADMIN_USERS[0];
    await user.click(screen.getByTestId(`checkbox-${target.id}`));
    await user.click(screen.getByTestId("bulk-message-toggle"));

    const sendButton = screen.getByTestId("bulk-message-send");
    expect(sendButton).toBeDisabled();

    const textarea = await screen.findByLabelText(/message to 1 user/i);
    await user.type(textarea, "   ");
    expect(sendButton).toBeDisabled();

    await user.click(sendButton);
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("does not surface a bulk toolbar or fire the handler when no rows are selected", () => {
    render(<AdminUsersPage />);

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("dismissing the toolbar clears the selection without invoking the bulk handler", async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);

    await user.click(screen.getByTestId("select-all-checkbox"));
    await screen.findByRole("toolbar");

    await user.click(screen.getByTestId("bulk-dismiss"));

    expect(screen.queryByRole("toolbar")).not.toBeInTheDocument();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  // ── Secondary state transition: sorting is preserved through the page ───

  it("sorts rows by a column when its header is activated (state transition, not just a static render)", async () => {
    const user = userEvent.setup();
    render(<AdminUsersPage />);

    const grid = screen.getByRole("grid", { name: /user management/i });
    const nameHeader = screen.getByTestId("sort-name");

    const expectedAsc = [...SAMPLE_ADMIN_USERS]
      .map((u) => u.name)
      .sort((a, b) => a.localeCompare(b));

    await user.click(nameHeader);

    const renderedNames = within(grid)
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).getAllByRole("gridcell")[0].textContent?.trim());

    expect(renderedNames).toEqual(expectedAsc);
    expect(screen.getByTestId("sort-name").closest("th")).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
  });
});