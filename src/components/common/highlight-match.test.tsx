import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { HighlightMatch } from "./highlight-match";

describe("HighlightMatch", () => {
  it("highlights a matching substring case-insensitively while preserving original casing", () => {
    const { container } = render(
      <HighlightMatch text="ChronoPay Wallet" query="pay" />
    );

    const mark = container.querySelector("mark");
    expect(mark).not.toBeNull();
    expect(mark?.textContent).toBe("Pay");
    expect(container.textContent).toBe("ChronoPay Wallet");
  });

  it("renders plain text without a mark element when there is no match", () => {
    const { container } = render(
      <HighlightMatch text="ChronoPay Wallet" query="stellar" />
    );

    expect(container.querySelector("mark")).toBeNull();
    expect(container.textContent).toBe("ChronoPay Wallet");
  });

  it("renders plain text without a mark element when query is empty", () => {
    const { container } = render(
      <HighlightMatch text="ChronoPay Wallet" query="" />
    );

    expect(container.querySelector("mark")).toBeNull();
    expect(container.textContent).toBe("ChronoPay Wallet");
  });

  it.each([
    { text: "Wallet (Primary)", query: "(primary" },
    { text: "Account [01]", query: "[01]" },
    { text: "user.name@example.com", query: "user.name" },
    { text: "price $100+ (USD)", query: "$100+" },
    { text: "path\\to\\file?a=1*2", query: "\\to\\file?a=1*2" },
  ])(
    "handles regex metacharacters safely without throwing for query $query",
    ({ text, query }) => {
      const { container } = render(<HighlightMatch text={text} query={query} />);

      const mark = container.querySelector("mark");
      expect(mark).not.toBeNull();
      expect(mark?.textContent?.toLowerCase()).toBe(query.toLowerCase());
      expect(container.textContent).toBe(text);
    }
  );
});
