/**
 * SupplierFaqAccordion tests
 *
 * Coverage targets (95%+):
 *  - Default render with PanelShell chrome / bare mode
 *  - Accordion disclosure semantics (aria-expanded/aria-controls, toggle open/close)
 *  - Keyboard navigation: ArrowDown/ArrowUp/Home/End across visible headers
 *  - Search filtering by question, answer, and category
 *  - Highlighted matched terms in question and answer
 *  - Empty search results state
 *  - Deep-linking: initial hash expands + scrolls the target entry, and
 *    activating a header updates the hash
 *  - Long answers, dark mode (class-based, no failures), RTL (dir attribute)
 */

import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  SupplierFaqAccordion,
  type SupplierFaqEntry,
} from "./supplier-faq-accordion";

const ENTRIES: SupplierFaqEntry[] = [
  {
    id: "refund-policy",
    question: "What is the refund policy?",
    answer: "Refunds are issued within 5 business days of a cancelled session.",
    category: "Policy",
  },
  {
    id: "pricing-currency",
    question: "What currency is pricing shown in?",
    answer: "All prices are shown in XLM, converted at the live network rate.",
    category: "Pricing",
  },
  {
    id: "booking-process",
    question: "How do I book a session?",
    answer: "Select an available slot on the calendar and confirm escrow.",
    category: "Process",
  },
];

function setup(
  props: Partial<React.ComponentProps<typeof SupplierFaqAccordion>> = {},
) {
  return render(<SupplierFaqAccordion entries={ENTRIES} {...props} />);
}

function setHash(hash: string) {
  window.history.replaceState(null, "", `${window.location.pathname}${hash}`);
}

describe("SupplierFaqAccordion", () => {
  beforeEach(() => {
    setHash("");
  });

  afterEach(() => {
    setHash("");
    vi.restoreAllMocks();
  });

  it("renders within PanelShell chrome by default", () => {
    setup();
    expect(
      screen.getByRole("heading", { name: "Frequently asked questions" }),
    ).toBeInTheDocument();
  });

  it("renders bare without PanelShell chrome when bare is true", () => {
    setup({ bare: true });
    expect(
      screen.queryByRole("heading", { name: "Frequently asked questions" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /refund policy/i }),
    ).toBeInTheDocument();
  });

  it("renders all entries collapsed by default", () => {
    setup();
    const headers = screen.getAllByRole("button", { name: /.+/ });
    // 3 disclosure headers (search clear button only appears once query is set)
    expect(headers).toHaveLength(3);
    headers.forEach((header) => {
      expect(header).toHaveAttribute("aria-expanded", "false");
    });
    expect(
      screen.queryByText(/Refunds are issued within/),
    ).not.toBeInTheDocument();
  });

  it("expands and collapses an entry on click", async () => {
    const user = userEvent.setup();
    setup();

    const header = screen.getByRole("button", { name: /refund policy/i });
    expect(header).toHaveAttribute("aria-expanded", "false");

    await user.click(header);
    expect(header).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/Refunds are issued within/),
    ).toBeInTheDocument();

    await user.click(header);
    expect(header).toHaveAttribute("aria-expanded", "false");
  });

  it("associates each header and panel via aria-controls/aria-labelledby", async () => {
    const user = userEvent.setup();
    setup();
    const header = screen.getByRole("button", { name: /refund policy/i });
    await user.click(header);

    const panelId = header.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    const panel = document.getElementById(panelId as string);
    expect(panel).toHaveAttribute("aria-labelledby", header.id);
    expect(panel).toHaveAttribute("role", "region");
  });

  it("supports multiple entries open simultaneously", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: /refund policy/i }));
    await user.click(
      screen.getByRole("button", { name: /how do i book a session/i }),
    );

    expect(
      screen.getByRole("button", { name: /refund policy/i }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: /how do i book a session/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("navigates headers with ArrowDown and ArrowUp", async () => {
    setup();
    const headers = screen.getAllByRole("button", { name: /.+/ });
    headers[0].focus();
    expect(headers[0]).toHaveFocus();

    fireEvent.keyDown(headers[0], { key: "ArrowDown" });
    expect(headers[1]).toHaveFocus();

    fireEvent.keyDown(headers[1], { key: "ArrowDown" });
    expect(headers[2]).toHaveFocus();

    // wraps around
    fireEvent.keyDown(headers[2], { key: "ArrowDown" });
    expect(headers[0]).toHaveFocus();

    fireEvent.keyDown(headers[0], { key: "ArrowUp" });
    expect(headers[2]).toHaveFocus();
  });

  it("navigates headers with Home and End", async () => {
    setup();
    const headers = screen.getAllByRole("button", { name: /.+/ });
    headers[1].focus();

    fireEvent.keyDown(headers[1], { key: "End" });
    expect(headers[2]).toHaveFocus();

    fireEvent.keyDown(headers[2], { key: "Home" });
    expect(headers[0]).toHaveFocus();
  });

  it("filters entries by question text", async () => {
    const user = userEvent.setup();
    setup();
    const search = screen.getByRole("searchbox", { name: /search faqs/i });

    await user.type(search, "refund");

    expect(
      screen.getByRole("button", { name: /refund policy/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /how do i book a session/i }),
    ).not.toBeInTheDocument();
  });

  it("filters entries by answer text", async () => {
    const user = userEvent.setup();
    setup();
    const search = screen.getByRole("searchbox", { name: /search faqs/i });

    await user.type(search, "escrow");

    expect(
      screen.getByRole("button", { name: /how do i book a session/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { expanded: false })).toHaveLength(1);
  });

  it("filters entries by category text", async () => {

    const user = userEvent.setup();
    setup();
    const search = screen.getByRole("searchbox", { name: /search faqs/i });

    await user.type(search, "Pricing");

    expect(
      screen.getByRole("button", { name: /what currency is pricing/i }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("button", { expanded: false })).toHaveLength(1);
  });

  it("highlights matched terms in question and answer", async () => {
    const user = userEvent.setup();
    setup();
    const search = screen.getByRole("searchbox", { name: /search faqs/i });

    await user.type(search, "refund");
    const marks = document.querySelectorAll("mark");
    expect(marks.length).toBeGreaterThan(0);
    marks.forEach((mark) => {
      expect(mark.textContent?.toLowerCase()).toBe("refund");
    });
  });

  it("shows an empty state message when nothing matches", async () => {
    const user = userEvent.setup();
    setup();
    const search = screen.getByRole("searchbox", { name: /search faqs/i });

    await user.type(search, "zzzznotfound");

    expect(
      screen.getByText(/No questions match "zzzznotfound"/),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /.+/ })).toBeInTheDocument(); // clear button remains
  });

  it("clears the search query via the clear button", async () => {
    const user = userEvent.setup();
    setup();
    const search = screen.getByRole("searchbox", { name: /search faqs/i });

    await user.type(search, "refund");
    expect(search).toHaveValue("refund");

    await user.click(screen.getByRole("button", { name: /clear search/i }));
    expect(search).toHaveValue("");
    expect(screen.getAllByRole("button", { name: /.+/ }).length).toBe(3);
  });

  it("shows result count text that updates with the query", async () => {
    const user = userEvent.setup();
    setup();

    expect(screen.getByText(/Showing all 3 questions/)).toBeInTheDocument();

    const search = screen.getByRole("searchbox", { name: /search faqs/i });
    await user.type(search, "refund");

    expect(screen.getByText(/1 of 3 questions match/)).toBeInTheDocument();
  });

  it("expands and scrolls to the deep-linked entry from a URL hash on mount", async () => {
    setHash("#faq-booking-process");
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    setup();

    const header = screen.getByRole("button", { name: /how do i book a session/i });
    expect(header).toHaveAttribute("aria-expanded", "true");

    await act(async () => {
      await Promise.resolve();
    });
    expect(scrollIntoViewMock).toHaveBeenCalled();
  });

  it("expands and scrolls to the deep-linked entry via initialDeepLinkId prop", async () => {
    const scrollIntoViewMock = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoViewMock;

    setup({ initialDeepLinkId: "pricing-currency" });

    const header = screen.getByRole("button", {
      name: /what currency is pricing/i,
    });
    expect(header).toHaveAttribute("aria-expanded", "true");
  });

  it("updates the URL hash when an entry is toggled open", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: /refund policy/i }));
    expect(window.location.hash).toBe("#faq-refund-policy");
  });

  it("ignores an unknown deep-link id gracefully", () => {
    setHash("#faq-does-not-exist");
    setup();
    const headers = screen.getAllByRole("button", { name: /.+/ });
    headers.forEach((header) => {
      expect(header).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("renders long answers without truncation", async () => {
    const user = userEvent.setup();
    const longAnswer = "This is a very long answer. ".repeat(50);
    setup({
      entries: [
        { id: "long", question: "Why is this answer so long?", answer: longAnswer },
      ],
    });

    await user.click(
      screen.getByRole("button", { name: /why is this answer so long/i }),
    );
    expect(screen.getByText(longAnswer.trim(), { exact: false })).toBeInTheDocument();
  });

  it("shows an empty-list state gracefully when entries is empty", () => {
    setup({ entries: [] });
    expect(screen.getByText(/Showing all 0 questions/)).toBeInTheDocument();
    expect(screen.getByText(/No questions match/)).toBeInTheDocument();
  });

  it("renders correctly under RTL direction", () => {
    document.documentElement.dir = "rtl";
    setup();
    expect(
      screen.getByRole("button", { name: /refund policy/i }),
    ).toBeInTheDocument();
    document.documentElement.dir = "ltr";
  });

  it("renders correctly with a dark-mode class applied to an ancestor", () => {
    document.documentElement.classList.add("dark");
    setup();
    expect(
      screen.getByRole("heading", { name: "Frequently asked questions" }),
    ).toBeInTheDocument();
    document.documentElement.classList.remove("dark");
  });

  it("ignores irrelevant key presses on the header", () => {
    setup();
    const headers = screen.getAllByRole("button", { expanded: false });
    headers[0].focus();
    fireEvent.keyDown(headers[0], { key: "a" });
    expect(headers[0]).toHaveFocus();
  });

  it("respects custom idPrefix for anchors", async () => {
    const user = userEvent.setup();
    setup({ idPrefix: "supplier-faq-" });

    await user.click(screen.getByRole("button", { name: /refund policy/i }));
    expect(window.location.hash).toBe("#supplier-faq-refund-policy");
    expect(document.getElementById("supplier-faq-refund-policy")).toBeInTheDocument();
  });
});
