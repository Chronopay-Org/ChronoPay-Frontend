import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useKycFlow } from "./use-kyc-flow";

describe("useKycFlow", () => {
  it("advances from document submission through review to verified", async () => {
    const { result } = renderHook(() => useKycFlow());

    await act(async () => {
      await result.current.completeDocument(true, "data:image/jpeg;base64,doc");
    });
    expect(result.current.stage).toBe("reviewing");

    await act(async () => {
      await result.current.completeLiveness(true);
    });
    expect(result.current.stage).toBe("verified");
  });

  it.each(["needs_info", "rejected"] as const)(
    "maps adapter status %s into the flow state",
    async (stage) => {
      const { result } = renderHook(() =>
        useKycFlow({ processCapture: vi.fn().mockResolvedValue(stage) }),
      );

      await act(async () => {
        await result.current.completeDocument(true);
      });

      expect(result.current.stage).toBe(stage);
    },
  );

  it("keeps the previous stage and exposes adapter failures for retry", async () => {
    const { result } = renderHook(() =>
      useKycFlow({
        processCapture: vi.fn().mockRejectedValue(new Error("Upload service unavailable")),
      }),
    );

    await act(async () => {
      await expect(result.current.completeDocument(true)).rejects.toThrow(
        "Upload service unavailable",
      );
    });

    expect(result.current.stage).toBe("submitted");
    expect(result.current.error).toBe("Upload service unavailable");
  });

  it("maps failed capture results to needs_info", async () => {
    const { result } = renderHook(() => useKycFlow());

    await act(async () => {
      await result.current.completeLiveness(false);
    });

    expect(result.current.stage).toBe("needs_info");
    expect(result.current.lastCaptureKind).toBe("liveness");
  });
});
