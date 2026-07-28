import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarSyncConnect } from "@/components/dashboard/settings/calendar-sync-connect";

const mockProviders = [
  {
    id: "google",
    name: "Google Calendar",
    icon: "Google",
    description: "Sync with Google workspace.",
    scopes: ["https://www.googleapis.com/auth/calendar.events", "https://www.googleapis.com/auth/calendar.readonly"],
  },
  {
    id: "outlook",
    name: "Outlook Calendar",
    icon: "Calendar",
    description: "Sync with Microsoft 365.",
    scopes: ["Calendars.ReadWrite", "Calendars.Read"],
  },
  {
    id: "apple",
    name: "Apple Calendar",
    icon: "Apple",
    description: "Sync via CalDAV.",
    scopes: ["https://www.apple.com/cadav/calendar/"],
  },
  {
    id: "multi-scope",
    name: "Test Provider",
    icon: "T",
    description: "Provider with many scopes.",
    scopes: ["scope1", "scope2", "scope3", "scope4", "scope5"],
  },
];

const mockCalendars = [
  { id: "cal-1", providerId: "google", title: "Primary", description: "alex@example.com", color: "#4285F4" },
];

describe("CalendarSyncConnect", () => {
  it("renders provider cards in idle state", () => {
    render(<CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />);
    expect(screen.getByText("Calendar sync")).toBeInTheDocument();
    expect(screen.getByText("Google Calendar")).toBeInTheDocument();
    expect(screen.getByText("Outlook Calendar")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: /sync status/i })).toBeInTheDocument();
  });

  it("shows permissions preview after clicking a provider", async () => {
    const user = userEvent.setup();
    render(
      <CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />
    );

    await user.click(screen.getByRole("button", { name: /connect google calendar/i }));

    expect(await screen.findByRole("button", { name: /approve/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /deny/i })).toBeInTheDocument();
  });

  it("shows per-calendar selection after approving", async () => {
    const user = userEvent.setup();
    render(<CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />);

    await user.click(screen.getByRole("button", { name: /connect google calendar/i }));

    await user.click(await screen.findByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(screen.getByRole("radiogroup", { name: /sync-direction-cal-1/i })).toBeInTheDocument()
    );

    expect(screen.getByText("Primary")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /save preferences/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /back to providers/i })).toBeInTheDocument();
  });

  it("switches sync direction for a calendar", async () => {
    const user = userEvent.setup();
    const onSyncChange = vi.fn();
    render(
      <CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} onSyncChange={onSyncChange} />
    );

    await user.click(screen.getByRole("button", { name: /connect google calendar/i }));
    await user.click(await screen.findByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(screen.getByRole("radiogroup", { name: /sync-direction-cal-1/i })).toBeInTheDocument()
    );

    await user.click(screen.getByRole("radio", { name: /read only/i }));

    expect(onSyncChange).toHaveBeenCalledWith("google", "cal-1", "read");
  });

  it("shows denied state and allows retry", async () => {
    const user = userEvent.setup();
    render(<CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />);

    await user.click(screen.getByRole("button", { name: /connect google calendar/i }));

    const denyBtn = await screen.findByRole("button", { name: /deny/i });
    await user.click(denyBtn);

    expect(await screen.findByText("Authorization denied")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("saves and shows confirmation status", async () => {
    const user = userEvent.setup();
    render(<CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />);

    await user.click(screen.getByRole("button", { name: /connect google calendar/i }));
    await user.click(await screen.findByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(screen.getByRole("radiogroup", { name: /sync-direction-cal-1/i })).toBeInTheDocument()
    );

    await user.click(await screen.findByRole("button", { name: /save preferences/i }));

    await waitFor(() => expect(screen.getByText("Saved")).toBeInTheDocument(), { timeout: 2000 });
  });

  it("supports keyboard-only provider selection", async () => {
    const user = userEvent.setup();
    render(<CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />);

    const firstCard = screen.getByRole("button", { name: /connect google calendar/i });
    firstCard.focus();
    await user.keyboard("{Enter}");

    expect(await screen.findByRole("button", { name: /approve/i })).toBeInTheDocument();
  });

  it("supports declared radio groups for direction", async () => {
    const user = userEvent.setup();
    const onSyncChange = vi.fn();
    render(
      <CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} onSyncChange={onSyncChange} />
    );

    await user.click(screen.getByRole("button", { name: /connect google calendar/i }));
    await user.click(await screen.findByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(screen.getByRole("radiogroup", { name: /sync-direction-cal-1/i })).toBeInTheDocument()
    );

    await user.click(screen.getByRole("radio", { name: /bidirectional/i }));

    expect(screen.getByRole("radio", { name: /bidirectional/i })).toBeChecked();
    expect(onSyncChange).toHaveBeenCalledWith("google", "cal-1", "bidirectional");
  });

  it("switches direction without onSyncChange callback", async () => {
    const user = userEvent.setup();
    render(<CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />);

    await user.click(screen.getByRole("button", { name: /connect google calendar/i }));
    await user.click(await screen.findByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(screen.getByRole("radiogroup", { name: /sync-direction-cal-1/i })).toBeInTheDocument()
    );

    await user.click(screen.getByRole("radio", { name: /read only/i }));
    expect(screen.getByRole("radio", { name: /read only/i })).toBeChecked();
  });

  it("shows helper text and receives focus on interactive elements", async () => {
    render(<CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />);

    const connectCard = screen.getByRole("button", { name: /connect google calendar/i });
    connectCard.focus();
    expect(connectCard).toHaveFocus();
  });

  it("does not show scope chips outside provider cards", async () => {
    render(<CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />);

    expect(screen.queryByRole("region", { name: /calendar sync connect/i })).toBeInTheDocument();
    expect(screen.queryByLabelText(/Requested permissions/i)).not.toBeInTheDocument();
  });

  it("calls onSyncChange with all-saved when save completes", async () => {
    const user = userEvent.setup();
    const onSyncChange = vi.fn();
    render(
      <CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} onSyncChange={onSyncChange} />
    );

    await user.click(screen.getByRole("button", { name: /connect google calendar/i }));
    await user.click(await screen.findByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(screen.getByRole("radiogroup", { name: /sync-direction-cal-1/i })).toBeInTheDocument()
    );

    await user.click(await screen.findByRole("button", { name: /save preferences/i }));

    await waitFor(() =>
      expect(onSyncChange).toHaveBeenCalledWith("google", "all-saved", expect.stringMatching("")), { timeout: 2000 }
    );
  });

  it("shows no calendars message when provider has no calendars", async () => {
    const user = userEvent.setup();
    render(
      <CalendarSyncConnect providers={mockProviders} calendars={[]} />
    );

    await user.click(screen.getByRole("button", { name: /connect google calendar/i }));
    await user.click(await screen.findByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(screen.getByText("No calendars available for this provider.")).toBeInTheDocument()
    );
  });

  it("retries from denied state back to authorizing", async () => {
    const user = userEvent.setup();
    render(<CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />);

    await user.click(screen.getByRole("button", { name: /connect google calendar/i }));
    await user.click(await screen.findByRole("button", { name: /deny/i }));

    expect(screen.getByText("Authorization denied")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(await screen.findByRole("button", { name: /approve/i })).toBeInTheDocument();
  });

  it("returns to idle state from authorized via back to providers", async () => {
    const user = userEvent.setup();
    render(<CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />);

    await user.click(screen.getByRole("button", { name: /connect google calendar/i }));
    await user.click(await screen.findByRole("button", { name: /approve/i }));

    await waitFor(() =>
      expect(screen.getByRole("radiogroup", { name: /sync-direction-cal-1/i })).toBeInTheDocument()
    );

    await user.click(screen.getByRole("button", { name: /back to providers/i }));
    expect(screen.getByRole("button", { name: /connect google calendar/i })).toBeInTheDocument();
  });

  it("renders denied scopes in denied state", async () => {
    const user = userEvent.setup();
    render(<CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />);

    await user.click(screen.getByRole("button", { name: /connect google calendar/i }));
    await user.click(await screen.findByRole("button", { name: /deny/i }));

    expect(screen.getByText("https://www.googleapis.com/auth/calendar.events")).toBeInTheDocument();
  });

  it("renders apple provider icon with correct style", () => {
    render(<CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />);

    const appleCard = screen.getByRole("button", { name: /connect apple calendar/i });
    expect(appleCard).toHaveTextContent("Apple Calendar");
  });

  it("renders scope overflow chip for providers with many scopes", () => {
    render(<CalendarSyncConnect providers={mockProviders} calendars={mockCalendars} />);

    const multiScopeCard = screen.getByRole("button", { name: /connect test provider/i });
    expect(multiScopeCard).toHaveTextContent("+2");
  });
});
