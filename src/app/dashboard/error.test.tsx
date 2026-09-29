import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DashboardError } from "./error";
import DashboardErrorDefault from "./error";

// ─── Mocks / stubs ───────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// The shell is a large layout tree; this suite targets the error boundary only.
vi.mock("../components/dashboard-shell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="dashboard-shell">{children}</div>
  ),
}));

class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

// ─── Rendering ───────────────────────────────────────────────────────────────

describe("DashboardError — rendering", () => {
  it("renders an alert region labelled and described by its copy", () => {
    render(<DashboardError reset={vi.fn()} />);

    const alert = screen.getByRole("alert");
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute("aria-labelledby", "dashboard-error-title");
    expect(alert).toHaveAttribute("aria-describedby", "dashboard-error-description");

    const title = screen.getByText("Oops! Something went wrong.");
    expect(title).toHaveAttribute("id", "dashboard-error-title");

    expect(
      screen.getByText(
        "We couldn't load your dashboard. This might be a temporary network glitch.",
      ),
    ).toHaveAttribute("id", "dashboard-error-description");
  });

  it("renders the error-state illustration", () => {
    render(<DashboardError reset={vi.fn()} />);
    expect(
      screen.getByRole("img", {
        name: "Error state illustration showing a disconnected UI layout",
      }),
    ).toBeInTheDocument();
  });

  it("exposes the same component as the default export", () => {
    expect(DashboardErrorDefault).toBe(DashboardError);
  });
});

// ─── Error reporting ─────────────────────────────────────────────────────────

describe("DashboardError — error reporting", () => {
  it("logs the error on mount", () => {
    const error = Object.assign(new Error("dashboard blew up"), { digest: "abc123" });
    render(<DashboardError error={error} reset={vi.fn()} />);

    expect(errorSpy).toHaveBeenCalledWith(error);
  });

  it("logs again when the error instance changes", () => {
    const first = new Error("first");
    const second = new Error("second");
    const { rerender: rerenderError } = render(
      <DashboardError error={first} reset={vi.fn()} />,
    );
    expect(errorSpy).toHaveBeenCalledTimes(1);

    rerenderError(<DashboardError error={second} reset={vi.fn()} />);
    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy).toHaveBeenLastCalledWith(second);
  });

  it("renders and logs undefined when no error prop is supplied", () => {
    render(<DashboardError reset={vi.fn()} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(errorSpy).toHaveBeenCalledWith(undefined);
  });
});

// ─── Recovery actions ────────────────────────────────────────────────────────

describe("DashboardError — recovery actions", () => {
  it("invokes reset when the retry button is clicked", async () => {
    const reset = vi.fn();
    render(<DashboardError reset={reset} />);

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("links to the status page", () => {
    render(<DashboardError reset={vi.fn()} />);
    expect(screen.getByRole("link", { name: "View status page" })).toHaveAttribute(
      "href",
      "/status",
    );
  });

  it("links to support by email", () => {
    render(<DashboardError reset={vi.fn()} />);
    expect(screen.getByRole("link", { name: "Contact support" })).toHaveAttribute(
      "href",
      "mailto:support@chronopay.com",
    );
  });
});
