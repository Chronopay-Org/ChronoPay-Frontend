import { afterEach, describe, expect, it, vi } from "vitest";
import { reportError, setErrorReporter } from "./report-error";

afterEach(() => {
  setErrorReporter();
  vi.restoreAllMocks();
});

describe("reportError", () => {
  it("forwards the error and context to the configured reporter", () => {
    const reporter = vi.fn();
    const error = Object.assign(new Error("request failed"), { digest: "abc123" });
    const context = { pathname: "/marketplace", role: "buyer" };

    setErrorReporter(reporter);
    reportError(error, context);

    expect(reporter).toHaveBeenCalledWith(error, {
      ...context,
      digest: "abc123",
    });
  });

  it("logs the message and digest through the default reporter", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = Object.assign(new Error("request failed"), { digest: "abc123" });

    setErrorReporter();
    reportError(error, { pathname: "/pricing", role: "buyer" });

    expect(errorSpy).toHaveBeenCalledWith(
      "[ChronoPay] request failed (digest: abc123)",
      error,
      { pathname: "/pricing", role: "buyer", digest: "abc123" },
    );
  });

  it("resets a custom reporter to the default sink", () => {
    const customReporter = vi.fn();
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("request failed");

    setErrorReporter(customReporter);
    setErrorReporter(null);
    reportError(error, { pathname: "/status" });

    expect(customReporter).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalledWith(error, {
      pathname: "/status",
      digest: undefined,
    });
  });
});
