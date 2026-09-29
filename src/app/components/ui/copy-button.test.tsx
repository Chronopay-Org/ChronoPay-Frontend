import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CopyButton } from "./copy-button";

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
  navigator,
  "clipboard",
);
const originalExecCommandDescriptor = Object.getOwnPropertyDescriptor(
  document,
  "execCommand",
);

describe("CopyButton", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (originalClipboardDescriptor) {
      Object.defineProperty(
        navigator,
        "clipboard",
        originalClipboardDescriptor,
      );
    } else {
      Reflect.deleteProperty(navigator, "clipboard");
    }
    if (originalExecCommandDescriptor) {
      Object.defineProperty(
        document,
        "execCommand",
        originalExecCommandDescriptor,
      );
    } else {
      Reflect.deleteProperty(document, "execCommand");
    }
  });

  it("copies text, announces success, calls the callback, and resets after 1500ms", async () => {
    vi.useFakeTimers();
    const onCopied = vi.fn();
    const writeText = vi.mocked(navigator.clipboard.writeText);
    render(
      <CopyButton text="0xabc123" label="Copy address" onCopied={onCopied} />,
    );

    const button = screen.getByRole("button", { name: "Copy address" });
    expect(button).toHaveAttribute("title", "Copy address");
    expect(button).toHaveClass("p-1.5");

    await act(async () => {
      fireEvent.click(button);
    });

    expect(writeText).toHaveBeenCalledWith("0xabc123");
    expect(onCopied).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Copy address: Copied!" }),
    ).toHaveAttribute("title", "Copied!");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Copy address: Copied!",
    );

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(
      screen.getByRole("button", { name: "Copy address" }),
    ).toHaveAttribute("title", "Copy address");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("supports the text variant and treats an empty string as copyable input", async () => {
    const writeText = vi.mocked(navigator.clipboard.writeText);
    render(
      <CopyButton
        text=""
        variant="text"
        label="Copy code"
        className="custom-copy-class"
      />,
    );

    const button = screen.getByRole("button", { name: "Copy code" });
    expect(button).toHaveClass("px-3", "custom-copy-class");
    expect(button).toHaveTextContent("Copy code");

    await act(async () => {
      fireEvent.click(button);
    });

    expect(writeText).toHaveBeenCalledWith("");
    expect(
      screen.getByRole("button", { name: "Copy code: Copied!" }),
    ).toHaveTextContent("Copied!");
    expect(screen.getByRole("status")).toHaveTextContent("Copy code: Copied!");
  });

  it("uses the document copy fallback when the Clipboard API is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined,
    });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execCommand,
    });
    const onCopied = vi.fn();
    render(<CopyButton text="legacy-code" onCopied={onCopied} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Copy" }));
    });

    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector("textarea")).not.toBeInTheDocument();
    expect(onCopied).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("status")).toHaveTextContent("Copy: Copied!");
  });

  it("does not announce success or call onCopied when clipboard writing fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(
      new Error("clipboard denied"),
    );
    const onCopied = vi.fn();
    render(
      <CopyButton
        text="sensitive-code"
        label="Copy code"
        onCopied={onCopied}
      />,
    );

    const button = screen.getByRole("button", { name: "Copy code" });
    await act(async () => {
      fireEvent.click(button);
    });

    expect(errorSpy).toHaveBeenCalledWith("Failed to copy text to clipboard");
    expect(onCopied).not.toHaveBeenCalled();
    expect(button).toHaveAccessibleName("Copy code");
    expect(button).toHaveAttribute("title", "Copy code");
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("disables transitions when reduced motion is preferred", () => {
    vi.spyOn(window, "matchMedia").mockImplementation(
      (query) =>
        ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as MediaQueryList,
    );

    render(<CopyButton text="code" />);

    expect(screen.getByRole("button", { name: "Copy" })).toHaveClass(
      "duration-0",
    );
  });
});
