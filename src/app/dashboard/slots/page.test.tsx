import { describe, it, expect, vi, beforeEach } from "vitest";
import { redirect } from "next/navigation";
import SlotsIndexPage from "./page";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("SlotsIndexPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects /dashboard/slots to /dashboard", () => {
    SlotsIndexPage();

    expect(redirect).toHaveBeenCalledTimes(1);
    expect(redirect).toHaveBeenCalledWith("/dashboard");
  });
});
