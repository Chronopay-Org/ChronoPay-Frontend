import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reportError } from "./reportError";

describe("dashboard reportError", () => {
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    errorSpy.mockRestore();
  });

  it("logs the message and digest alongside the original error", () => {
    const error = Object.assign(new Error("request failed"), { digest: "abc" });

    reportError(error);

    expect(errorSpy).toHaveBeenCalledExactlyOnceWith(
      "[ChronoPay] request failed (digest: abc)",
      error,
    );
  });

  it("logs only the original error when it has no digest", () => {
    const error = new Error("request failed");

    reportError(error);

    expect(errorSpy).toHaveBeenCalledExactlyOnceWith(error);
  });
});
