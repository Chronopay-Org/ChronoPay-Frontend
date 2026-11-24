import { createElement } from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ListingDetailPage from "./page";

const { mockNotFound } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
}));

vi.mock("next/link", () => ({
  default: ({ prefetch: _prefetch, ...props }: any) => <a {...props} />,
}));

vi.mock("next/image", () => ({
  default: ({ fill: _fill, ...props }: any) => createElement("img", props),
}));

describe("ListingDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the listing heading, price, and labelled article for demo-1", async () => {
    const jsx = await ListingDetailPage({
      params: Promise.resolve({ id: "demo-1" }),
    });
    render(jsx);

    const heading = screen.getByRole("heading", {
      name: "1 Hour Technical Consultation",
      level: 1,
    });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute("id", "listing-title");
    expect(screen.getByText("50 XLM")).toBeInTheDocument();

    const article = screen.getByRole("article", {
      name: "1 Hour Technical Consultation",
    });
    expect(article).toBeInTheDocument();
    expect(article).toHaveAttribute("aria-labelledby", "listing-title");

    expect(screen.getByRole("link", { name: "Book" })).toHaveAttribute(
      "href",
      "/dashboard/slots/slot-1",
    );
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("falls back to /dashboard for non-demo listing ids", async () => {
    const jsx = await ListingDetailPage({
      params: Promise.resolve({ id: "svc-1" }),
    });
    render(jsx);

    expect(screen.getByRole("link", { name: "Book" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("invokes notFound() for unknown listing ids", async () => {
    await expect(
      ListingDetailPage({
        params: Promise.resolve({ id: "missing-id" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });
});
