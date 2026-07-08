/**
 * HelpPopover tests
 *
 * Coverage targets (95%+):
 *  - Rendering: trigger button, default aria-label, closed state
 *  - Open / close: click, keyboard (Enter, Space, Escape), click-outside
 *  - Structured content: title, body, learn-more link (internal and external)
 *  - No learn-more: omits the footer section
 *  - Learn-more label override
 *  - Custom triggerLabel prop
 *  - ARIA: role="dialog", aria-labelledby, aria-describedby, aria-expanded
 *  - Focus management: close button receives focus on open; trigger regains focus on close
 *  - Tab trap: Tab and Shift+Tab cycle within the popover
 *  - Touch support: touchstart toggles the popover
 *  - Placement: top vs bottom (mocked getBoundingClientRect)
 *  - External link: target="_blank" and rel="noopener noreferrer"
 *  - className prop applied to wrapper
 *  - Glossary data integrity
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HelpPopover } from "@/app/components/ui/help-popover";
import type { GlossaryTerm } from "@/lib/glossary";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const internalTerm: GlossaryTerm = {
  title: "Time token",
  body: "A Stellar-based asset representing a bookable block of time.",
  learnMoreHref: "/docs/glossary#time-token",
  learnMoreLabel: "Learn about time tokens →",
};

const externalTerm: GlossaryTerm = {
  title: "Stellar network",
  body: "A fast, low-cost blockchain.",
  learnMoreHref: "https://stellar.org",
  learnMoreLabel: "Learn about Stellar →",
};

const noLinkTerm: GlossaryTerm = {
  title: "Escrow",
  body: "Tokens held by a contract until a booking is resolved.",
};

const defaultLabelTerm: GlossaryTerm = {
  title: "Redemption",
  body: "Exchanging a token for the session it represents.",
  learnMoreHref: "/docs/glossary#redemption",
  // no learnMoreLabel — should default to "Learn more →"
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function setup(
  term: GlossaryTerm,
  props: Partial<React.ComponentProps<typeof HelpPopover>> = {}
) {
  const result = render(<HelpPopover term={term} {...props} />);
  const trigger = screen.getByRole("button", {
    name: props.triggerLabel ?? `Help: ${term.title}`,
  });
  return { ...result, trigger };
}

/** Click the trigger and flush all pending effects/timers. */
function openPopover(trigger: HTMLElement) {
  act(() => {
    fireEvent.click(trigger);
  });
  // Flush the setTimeout(0) used for focus management
  act(() => {
    vi.runAllTimers();
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("HelpPopover", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── Rendering ────────────────────────────────────────────────────────────

  describe("initial render", () => {
    it("renders a trigger button", () => {
      const { trigger } = setup(internalTerm);
      expect(trigger).toBeInTheDocument();
    });

    it("uses default aria-label derived from term title", () => {
      setup(internalTerm);
      expect(
        screen.getByRole("button", { name: "Help: Time token" })
      ).toBeInTheDocument();
    });

    it("accepts a custom triggerLabel", () => {
      setup(internalTerm, { triggerLabel: "What is a time token?" });
      expect(
        screen.getByRole("button", { name: "What is a time token?" })
      ).toBeInTheDocument();
    });

    it("does not render the popover on mount", () => {
      setup(internalTerm);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("sets aria-expanded=false on the trigger when closed", () => {
      const { trigger } = setup(internalTerm);
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  // ── Opening ──────────────────────────────────────────────────────────────

  describe("opening the popover", () => {
    it("opens on trigger click", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("sets aria-expanded=true when open", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    it("opens on Enter keypress", () => {
      const { trigger } = setup(internalTerm);
      act(() => {
        trigger.focus();
        fireEvent.keyDown(trigger, { key: "Enter" });
      });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("opens on Space keypress", () => {
      const { trigger } = setup(internalTerm);
      act(() => {
        trigger.focus();
        fireEvent.keyDown(trigger, { key: " " });
      });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("moves focus to the close button after opening", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const closeBtn = screen.getByRole("button", { name: "Close help popover" });
      expect(closeBtn).toHaveFocus();
    });

    it("sets aria-controls to the popover id when open", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const dialog = screen.getByRole("dialog");
      expect(trigger).toHaveAttribute("aria-controls", dialog.id);
    });

    it("aria-controls is absent when popover is closed", () => {
      const { trigger } = setup(internalTerm);
      expect(trigger).not.toHaveAttribute("aria-controls");
    });
  });

  // ── Popover content ──────────────────────────────────────────────────────

  describe("popover content", () => {
    it("renders the term title", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      expect(screen.getByText(internalTerm.title)).toBeInTheDocument();
    });

    it("renders the term body text", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      expect(screen.getByText(internalTerm.body)).toBeInTheDocument();
    });

    it("renders an internal learn-more link", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const link = screen.getByRole("link", { name: internalTerm.learnMoreLabel });
      expect(link).toHaveAttribute("href", internalTerm.learnMoreHref);
    });

    it("internal links do NOT have target=_blank", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const link = screen.getByRole("link", { name: internalTerm.learnMoreLabel });
      expect(link).not.toHaveAttribute("target", "_blank");
    });

    it("external links have target=_blank and rel=noopener noreferrer", () => {
      const { trigger } = setup(externalTerm);
      openPopover(trigger);
      const link = screen.getByRole("link", { name: externalTerm.learnMoreLabel });
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("omits the learn-more section when learnMoreHref is absent", () => {
      const { trigger } = setup(noLinkTerm);
      openPopover(trigger);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("defaults learn-more label to 'Learn more →' when learnMoreLabel is omitted", () => {
      const { trigger } = setup(defaultLabelTerm);
      openPopover(trigger);
      expect(screen.getByRole("link", { name: "Learn more →" })).toBeInTheDocument();
    });

    it("renders a close button inside the popover", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      expect(
        screen.getByRole("button", { name: "Close help popover" })
      ).toBeInTheDocument();
    });
  });

  // ── ARIA structure ───────────────────────────────────────────────────────

  describe("ARIA attributes", () => {
    it("dialog has role=dialog", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("dialog has aria-labelledby pointing to the title element", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const dialog = screen.getByRole("dialog");
      const titleId = dialog.getAttribute("aria-labelledby");
      expect(titleId).toBeTruthy();
      const titleEl = document.getElementById(titleId!);
      expect(titleEl?.textContent).toBe(internalTerm.title);
    });

    it("dialog has aria-describedby pointing to the body element", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const dialog = screen.getByRole("dialog");
      const bodyId = dialog.getAttribute("aria-describedby");
      expect(bodyId).toBeTruthy();
      const bodyEl = document.getElementById(bodyId!);
      expect(bodyEl?.textContent).toBe(internalTerm.body);
    });

    it("dialog has aria-modal=false (non-modal dialog)", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "false");
    });
  });

  // ── Closing ──────────────────────────────────────────────────────────────

  describe("closing the popover", () => {
    it("closes on second trigger click (toggle)", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      act(() => { fireEvent.click(trigger); });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes via the close button", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const closeBtn = screen.getByRole("button", { name: "Close help popover" });
      act(() => { fireEvent.click(closeBtn); });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("returns focus to the trigger when closed via close button", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const closeBtn = screen.getByRole("button", { name: "Close help popover" });
      act(() => { fireEvent.click(closeBtn); });
      expect(trigger).toHaveFocus();
    });

    it("closes on Escape key fired inside the dialog", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const dialog = screen.getByRole("dialog");
      act(() => { fireEvent.keyDown(dialog, { key: "Escape" }); });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("returns focus to trigger after Escape from dialog", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const dialog = screen.getByRole("dialog");
      act(() => { fireEvent.keyDown(dialog, { key: "Escape" }); });
      expect(trigger).toHaveFocus();
    });

    it("closes on Escape from the trigger when popover is open", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      act(() => {
        trigger.focus();
        fireEvent.keyDown(trigger, { key: "Escape" });
      });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("does not close when Escape is pressed while already closed", () => {
      const { trigger } = setup(internalTerm);
      fireEvent.keyDown(trigger, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("closes on click outside the popover and trigger", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      act(() => { fireEvent.mouseDown(document.body); });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("does NOT close on mouseDown inside the popover panel", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const dialog = screen.getByRole("dialog");
      act(() => { fireEvent.mouseDown(dialog); });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  // ── Touch support ────────────────────────────────────────────────────────

  describe("touch support", () => {
    it("opens on touchstart on the trigger", () => {
      const { trigger } = setup(internalTerm);
      act(() => { fireEvent.touchStart(trigger); });
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("toggles (closes) on second touchstart", () => {
      const { trigger } = setup(internalTerm);
      act(() => { fireEvent.touchStart(trigger); });
      act(() => { fireEvent.touchStart(trigger); });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  // ── Tab trap ─────────────────────────────────────────────────────────────

  describe("tab trap inside popover", () => {
    it("wraps Tab from the last focusable element back to the first", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const dialog = screen.getByRole("dialog");

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      );
      expect(focusable.length).toBeGreaterThan(0);

      const last = focusable[focusable.length - 1];
      const first = focusable[0];
      act(() => {
        // Focus the last element — document.activeElement must match for the trap to fire
        last.focus();
        // Fire Tab on the dialog — the component listens on the dialog's onKeyDown
        fireEvent.keyDown(dialog, { key: "Tab", shiftKey: false });
      });
      expect(first).toHaveFocus();
    });

    it("wraps Shift+Tab from the first focusable element back to the last", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const dialog = screen.getByRole("dialog");

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      );

      const last = focusable[focusable.length - 1];
      act(() => {
        focusable[0].focus();
        fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
      });
      expect(last).toHaveFocus();
    });

    it("does not interfere with Tab when focus is on a middle element", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const dialog = screen.getByRole("dialog");

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"
        )
      );

      // If there are 2+ focusable elements, test the middle one is not wrapped
      if (focusable.length > 2) {
        const mid = focusable[1];
        act(() => {
          mid.focus();
          fireEvent.keyDown(dialog, { key: "Tab", shiftKey: false });
        });
        // Dialog should still be open (no close triggered)
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      }
    });
  });

  // ── Placement ────────────────────────────────────────────────────────────

  describe("viewport-aware placement", () => {
    it("places the popover above the trigger when there is enough space above", () => {
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
        top: 400,
        bottom: 420,
        left: 100,
        right: 150,
        width: 50,
        height: 20,
        x: 100,
        y: 400,
        toJSON: () => ({}),
      });

      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      act(() => { vi.runAllTimers(); });
      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toMatch(/bottom-full/);
    });

    it("places the popover below the trigger when there is not enough space above", () => {
      vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
        top: 5,
        bottom: 25,
        left: 100,
        right: 150,
        width: 50,
        height: 20,
        x: 100,
        y: 5,
        toJSON: () => ({}),
      });

      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      act(() => { vi.runAllTimers(); });
      const dialog = screen.getByRole("dialog");
      expect(dialog.className).toMatch(/top-full/);
    });
  });

  // ── className prop ───────────────────────────────────────────────────────

  describe("className prop", () => {
    it("applies additional className to the wrapper span", () => {
      const { container } = render(
        <HelpPopover term={internalTerm} className="custom-class" />
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("custom-class");
    });

    it("works without a className prop", () => {
      const { container } = render(<HelpPopover term={internalTerm} />);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  // ── Popover does not re-open after close-by-Escape ───────────────────────

  describe("state after close", () => {
    it("aria-expanded is false after closing", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      const closeBtn = screen.getByRole("button", { name: "Close help popover" });
      act(() => { fireEvent.click(closeBtn); });
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });

    it("popover can be reopened after being closed", () => {
      const { trigger } = setup(internalTerm);
      openPopover(trigger);
      act(() => { fireEvent.click(trigger); }); // close
      openPopover(trigger); // reopen
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  // ── Glossary data ────────────────────────────────────────────────────────

  describe("glossary data integrity", () => {
    it("all glossary entries have a non-empty title and body", async () => {
      const { glossary } = await import("@/lib/glossary");
      for (const [key, term] of Object.entries(glossary)) {
        expect(term.title, `${key}.title`).toBeTruthy();
        expect(term.body, `${key}.body`).toBeTruthy();
      }
    });

    it("all learnMoreHref values are valid path or URL strings when present", async () => {
      const { glossary } = await import("@/lib/glossary");
      for (const [key, term] of Object.entries(glossary)) {
        if (term.learnMoreHref) {
          expect(
            term.learnMoreHref.startsWith("/") ||
              term.learnMoreHref.startsWith("http"),
            `${key}.learnMoreHref must start with / or http`
          ).toBe(true);
        }
      }
    });

    it("exports glossary entries for all annotated jargon terms", async () => {
      const { glossary } = await import("@/lib/glossary");
      const requiredKeys = [
        "escrow",
        "pendingEscrow",
        "mint",
        "redemption",
        "timeToken",
        "xlm",
        "nextPayout",
        "bookingStages",
        "rate",
        "stellarNetwork",
      ];
      for (const key of requiredKeys) {
        expect(glossary).toHaveProperty(key);
      }
    });

    it("each glossary term title is 6 words or fewer (conciseness guideline)", async () => {
      const { glossary } = await import("@/lib/glossary");
      for (const [key, term] of Object.entries(glossary)) {
        const wordCount = term.title.trim().split(/\s+/).length;
        expect(wordCount, `${key}.title has ${wordCount} words — expected ≤ 6`).toBeLessThanOrEqual(6);
      }
    });
  });
});
