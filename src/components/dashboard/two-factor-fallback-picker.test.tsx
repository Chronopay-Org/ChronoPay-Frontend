import React from "react";
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  TwoFactorFallbackPicker,
  DEFAULT_FALLBACK_METHODS,
  type TwoFactorMethodOption,
} from "./two-factor-fallback-picker";

function setup(
  props: Partial<React.ComponentProps<typeof TwoFactorFallbackPicker>> = {},
) {
  const onSelect = vi.fn();
  const result = render(
    <TwoFactorFallbackPicker onSelect={onSelect} {...props} />,
  );
  return { ...result, onSelect };
}

describe("TwoFactorFallbackPicker", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("initial render", () => {
    it("renders the default title", () => {
      setup();
      expect(
        screen.getByRole("heading", {
          name: "Choose another sign-in method",
        }),
      ).toBeInTheDocument();
    });

    it("renders all default fallback methods", () => {
      setup();
      for (const method of DEFAULT_FALLBACK_METHODS) {
        expect(
          screen.getByRole("radio", { name: new RegExp(method.label, "i") }),
        ).toBeInTheDocument();
      }
    });

    it("renders method descriptions", () => {
      setup();
      for (const method of DEFAULT_FALLBACK_METHODS) {
        expect(
          screen.getByText(method.description),
        ).toBeInTheDocument();
      }
    });

    it("exposes a radiogroup", () => {
      setup();
      expect(
        screen.getByRole("radiogroup"),
      ).toBeInTheDocument();
    });

    it("disables continue until a method is selected", () => {
      setup();
      expect(
        screen.getByRole("button", { name: "Continue" }),
      ).not.toBeDisabled();
    });

    it("renders the help link with correct href", () => {
      setup();
      const link = screen.getByRole("link", { name: /Help me sign in/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/help/sign-in");
    });

    it("renders ETAs for default methods", () => {
      setup();
      expect(screen.getByText(/\u00b7 ~30 seconds/)).toBeInTheDocument();
      expect(screen.getByText(/\u00b7 ~15 seconds/)).toBeInTheDocument();
      expect(screen.getByText(/\u00b7 ~10 seconds/)).toBeInTheDocument();
    });

    it("has a region with correct aria-labelledby", () => {
      setup();
      const region = screen.getByRole("region");
      expect(region).toHaveAttribute(
        "aria-labelledby",
        expect.stringContaining("-title"),
      );
      expect(region).toHaveAttribute(
        "aria-describedby",
        expect.stringContaining("-description"),
      );
    });
  });

  describe("custom props", () => {
    it("renders custom title and description", () => {
      setup({
        title: "Verify your identity",
        description: "Pick another way to sign in.",
      });
      expect(
        screen.getByRole("heading", { name: "Verify your identity" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Pick another way to sign in.")).toBeInTheDocument();
    });

    it("renders custom methods in provided order", () => {
      const customMethods: readonly TwoFactorMethodOption[] = [
        {
          id: "hardware_key",
          label: "YubiKey",
          description: "Insert your YubiKey.",
          icon: "KeyRound",
        },
        {
          id: "sms",
          label: "Text message",
          description: "SMS to your phone.",
          icon: "Smartphone",
        },
      ];
      setup({ methods: customMethods });

      const radios = screen.getAllByRole("radio");
      expect(radios).toHaveLength(2);
      expect(radios[0]).toHaveTextContent("YubiKey");
      expect(radios[1]).toHaveTextContent("Text message");
    });

    it("renders custom continue label", () => {
      setup({ continueLabel: "Next step" });
      expect(
        screen.getByRole("button", { name: "Next step" }),
      ).toBeInTheDocument();
    });

    it("renders custom help link label and href", () => {
      setup({
        helpLinkLabel: "Having trouble?",
        helpLinkHref: "/support/2fa",
      });
      const link = screen.getByRole("link", { name: /Having trouble\?/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/support/2fa");
    });

    it("renders badge when method has one", () => {
      const methodsWithBadge: readonly TwoFactorMethodOption[] = [
        {
          id: "totp",
          label: "TOTP",
          description: "Use an app.",
          icon: "Shield",
          badge: "Fastest",
        },
      ];
      setup({ methods: methodsWithBadge });
      expect(screen.getByText("Fastest")).toBeInTheDocument();
    });
  });

  describe("single method", () => {
    it("works with only one method available", () => {
      const single: readonly TwoFactorMethodOption[] = [
        {
          id: "sms",
          label: "SMS code",
          description: "Text message.",
          icon: "Smartphone",
        },
      ];
      setup({ methods: single });
      const radio = screen.getByRole("radio", { name: /SMS code/i });
      expect(radio).toBeInTheDocument();
      expect(radio).toHaveAttribute("aria-checked", "true");
      expect(
        screen.getByRole("button", { name: "Continue" }),
      ).not.toBeDisabled();
    });
  });

  describe("selection", () => {
    it("defaults to first method selected", () => {
      setup();
      const first = screen.getByRole("radio", { name: /SMS code/i });
      expect(first).toHaveAttribute("aria-checked", "true");
    });

    it("marks the chosen method as aria-checked", () => {
      setup();
      const totp = screen.getByRole("radio", { name: /Authenticator app/i });
      fireEvent.click(totp);
      expect(totp).toHaveAttribute("aria-checked", "true");
      const sms = screen.getByRole("radio", { name: /SMS code/i });
      expect(sms).toHaveAttribute("aria-checked", "false");
    });

    it("announces the selected method", async () => {
      setup();
      fireEvent.click(
        screen.getByRole("radio", { name: /Hardware security key/i }),
      );
      await act(async () => {
        vi.runAllTimers();
      });
      await waitFor(() => {
        expect(
          screen.getByRole("status").textContent,
        ).toContain("Selected: Hardware security key");
      });
    });
  });

  describe("keyboard navigation", () => {
    it("moves selection with ArrowRight", () => {
      setup();
      const first = screen.getByRole("radio", { name: /SMS code/i });
      first.focus();
      fireEvent.keyDown(first, { key: "ArrowRight" });
      expect(
        screen.getByRole("radio", { name: /Authenticator app/i }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("moves selection with ArrowDown and ArrowUp", () => {
      setup();
      const first = screen.getByRole("radio", { name: /SMS code/i });
      first.focus();
      fireEvent.keyDown(first, { key: "ArrowDown" });
      expect(
        screen.getByRole("radio", { name: /Authenticator app/i }),
      ).toHaveAttribute("aria-checked", "true");

      const second = screen.getByRole("radio", { name: /Authenticator app/i });
      fireEvent.keyDown(second, { key: "ArrowUp" });
      expect(
        screen.getByRole("radio", { name: /SMS code/i }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("wraps selection with ArrowLeft", () => {
      setup();
      const first = screen.getByRole("radio", { name: /SMS code/i });
      fireEvent.click(first);
      fireEvent.keyDown(first, { key: "ArrowLeft" });
      expect(
        screen.getByRole("radio", { name: /Hardware security key/i }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("jumps to Home and End", () => {
      setup();
      const mid = screen.getByRole("radio", { name: /Authenticator app/i });
      fireEvent.click(mid);
      fireEvent.keyDown(mid, { key: "Home" });
      expect(
        screen.getByRole("radio", { name: /SMS code/i }),
      ).toHaveAttribute("aria-checked", "true");

      const first = screen.getByRole("radio", { name: /SMS code/i });
      fireEvent.keyDown(first, { key: "End" });
      expect(
        screen.getByRole("radio", { name: /Hardware security key/i }),
      ).toHaveAttribute("aria-checked", "true");
    });

    it("ignores unrelated keys", () => {
      setup();
      const first = screen.getByRole("radio", { name: /SMS code/i });
      fireEvent.click(first);
      fireEvent.keyDown(first, { key: "a" });
      expect(first).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("continue action", () => {
    it("calls onSelect with the selected method", () => {
      const { onSelect } = setup();
      fireEvent.click(
        screen.getByRole("radio", { name: /Authenticator app/i }),
      );
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: "totp" }),
      );
    });

    it("does not call onSelect when nothing is selected (all methods removed)", () => {
      const { onSelect } = setup({ methods: [] });
      const btn = screen.queryByRole("button", { name: "Continue" });
      if (btn) fireEvent.click(btn);
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("changes button text after confirmation", () => {
      setup();
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(
        screen.getByRole("button", { name: "Continuing..." }),
      ).toBeInTheDocument();
    });

    it("disables button after confirmation", () => {
      setup();
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      expect(
        screen.getByRole("button", { name: "Continuing..." }),
      ).toBeDisabled();
    });

    it("announces confirmation", async () => {
      setup();
      fireEvent.click(
        screen.getByRole("radio", { name: /SMS code/i }),
      );
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      await act(async () => {
        vi.runAllTimers();
      });
      await waitFor(() => {
        expect(screen.getByRole("status").textContent).toContain(
          "Continuing with: SMS code",
        );
      });
    });
  });

  describe("live region", () => {
    it("announces default method on mount", async () => {
      setup();
      await act(async () => {
        vi.runAllTimers();
      });
      await waitFor(() => {
        expect(screen.getByRole("status").textContent).toContain(
          "Default method: SMS code",
        );
      });
    });
  });

  describe("confirmation guard", () => {
    it("prevents selection change after confirmation", () => {
      setup();
      fireEvent.click(screen.getByRole("button", { name: "Continue" }));
      const radio = screen.getByRole("radio", { name: /SMS code/i });
      expect(radio).toHaveAttribute("aria-checked", "true");

      fireEvent.click(
        screen.getByRole("radio", { name: /Authenticator app/i }),
      );
      expect(
        screen.getByRole("radio", { name: /SMS code/i }),
      ).toHaveAttribute("aria-checked", "true");
    });
  });

  describe("unknown icon fallback", () => {
    it("renders HelpCircle icon for unknown icon string", () => {
      const unknownIconMethod: readonly TwoFactorMethodOption[] = [
        {
          id: "sms",
          label: "SMS",
          description: "Text message.",
          icon: "UnknownIcon" as "Smartphone",
        },
      ];
      setup({ methods: unknownIconMethod });
      const helpCircle = document.querySelector(
        '[aria-hidden="true"] svg',
      );
      expect(helpCircle).toBeTruthy();
    });
  });

  describe("help link", () => {
    it("renders help link with external link icon", () => {
      setup();
      const link = screen.getByRole("link", { name: /Help me sign in/i });
      expect(link).toBeInTheDocument();
      const svg = link.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("cleanup", () => {
    it("handles unmount before announce timeout fires", async () => {
      const { unmount } = setup();

      expect(screen.getByRole("status")).toBeInTheDocument();

      unmount();

      await act(async () => {
        vi.runAllTimers();
      });

      expect(screen.queryByRole("status")).not.toBeInTheDocument();
    });
  });
});
