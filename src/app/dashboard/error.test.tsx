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

vi.mock("@/app/components/navigation/RoleContext", () => ({
  useOptionalRole: () => "buyer",
}));

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
    expect(alert).toHaveAttribute("aria-labelledby", "route-error-title");
    expect(alert).toHaveAttribute("aria-describedby", "route-error-description");

    const title = screen.getByText("Oops! Something went wrong.");
    expect(title).toHaveAttribute("id", "route-error-title");

    expect(
      screen.getByText(
        "We couldn't load your dashboard. This might be a temporary network glitch.",
      ),
    ).toHaveAttribute("id", "route-error-description");
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

    expect(errorSpy).toHaveBeenCalledWith(
      "[ChronoPay] dashboard blew up (digest: abc123)",
      error,
      {
        pathname: "/",
        role: "buyer",
        digest: "abc123",
      },
    );
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
    expect(errorSpy).toHaveBeenLastCalledWith(second, {
      pathname: "/",
      role: "buyer",
      digest: undefined,
    });
  });

  it("renders without reporting when no error prop is supplied", () => {
    render(<DashboardError reset={vi.fn()} />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(errorSpy).not.toHaveBeenCalled();
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
