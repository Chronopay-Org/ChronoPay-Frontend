import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, request } from "./client";

describe("request", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns parsed data for successful responses", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test/");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      ),
    );

    await expect(request<{ ok: boolean }>("/items")).resolves.toEqual({
      ok: true,
    });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.example.test/items",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it("throws ApiError with the response status and body for non-2xx responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ message: "Unavailable" }), {
          status: 503,
        }),
      ),
    );

    await expect(request("/items")).rejects.toMatchObject({
      name: "ApiError",
      status: 503,
      body: { message: "Unavailable" },
    });
  });

  it("normalizes network failures to ApiError", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));

    const requestPromise = request("/items");
    await expect(requestPromise).rejects.toBeInstanceOf(ApiError);
    await expect(requestPromise).rejects.toMatchObject({ status: 0 });
  });

  it("aborts when the caller's signal is aborted", async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise((_, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          );
        }),
      ),
    );
    const pending = request("/items", { signal: controller.signal });

    controller.abort();

    await expect(pending).rejects.toMatchObject({
      name: "ApiError",
      status: 0,
    });
  });
});
