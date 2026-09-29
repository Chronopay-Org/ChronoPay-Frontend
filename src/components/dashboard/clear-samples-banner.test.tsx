/**
 * ClearSamplesBanner tests
 *
 * Regression suite for the public `ClearSamplesBannerProps` contract:
 *
 *  1. happy path      — the banner is visible by default and the CTA drives `onClear`.
 *  2. empty result    — `visible={false}` returns `null` (no region, no CTA, no handler).
 *  3. boundary inputs — omitted `visible`, custom `className`, repeated clicks,
 *                       keyboard activation and the `type="button"` guard.
 *  4. failure path    — a throwing (or retried) `onClear` stays observable and
 *                       deterministic; the banner is never silently swallowed.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  describe,
  it,
  expect,
  vi,
  expectTypeOf,
  beforeEach,
  afterEach,
} from "vitest";
import {
  ClearSamplesBanner,
  type ClearSamplesBannerProps,
} from "./clear-samples-banner";

const REGION_NAME = "Sample data controls";
const CTA_NAME = "Clear samples";

/**
 * Capture the errors React reports through the global error channel.
 *
 * `onClick={onClear}` means a throwing callback surfaces as an uncaught error:
 * React deliberately does not rethrow it back to the `dispatchEvent` caller, so
 * the `error` event on `window` is the only place the failure is observable.
 * `preventDefault()` keeps the jsdom virtual console quiet, and the listener is
 * always torn down so a later test cannot swallow a real failure.
 */
function captureUncaughtErrors() {
  const errors: unknown[] = [];
  const handler = (event: ErrorEvent) => {
    event.preventDefault();
    errors.push(event.error ?? event.message);
  };

  window.addEventListener("error", handler);

  return {
    errors,
    stop: () => window.removeEventListener("error", handler),
  };
}

describe("ClearSamplesBanner", () => {
  it("renders region copy and clear CTA", () => {
    render(<ClearSamplesBanner onClear={() => undefined} />);
    expect(
      screen.getByRole("region", { name: REGION_NAME }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: CTA_NAME })).toBeInTheDocument();
  });

  it("exposes data-tour-target for the walkthrough spotlight", () => {
    const { container } = render(
      <ClearSamplesBanner onClear={() => undefined} />,
    );
    expect(
      container.querySelector('[data-tour-target="clear-samples"]'),
    ).toBeInTheDocument();
  });

  it("invokes onClear when the CTA is pressed", () => {
    const onClear = vi.fn();
    render(<ClearSamplesBanner onClear={onClear} />);
    fireEvent.click(screen.getByRole("button", { name: CTA_NAME }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when visible is false", () => {
    const { container } = render(
      <ClearSamplesBanner onClear={() => undefined} visible={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});

// ---------------------------------------------------------------------------
// Public contract — the props surface is checked at compile time. `tsc` (run by
// `npm run build`) fails if the required/optional split silently changes.
// ---------------------------------------------------------------------------

describe("ClearSamplesBannerProps public contract", () => {
  it("keeps onClear required and visible/className optional", () => {
    expectTypeOf<ClearSamplesBannerProps["onClear"]>().toEqualTypeOf<
      () => void
    >();
    expectTypeOf<ClearSamplesBannerProps["visible"]>().toEqualTypeOf<
      boolean | undefined
    >();
    expectTypeOf<ClearSamplesBannerProps["className"]>().toEqualTypeOf<
      string | undefined
    >();
  });
});

// ---------------------------------------------------------------------------
// Empty-result path — `if (!visible) return null;`
// ---------------------------------------------------------------------------

describe("ClearSamplesBanner empty-result path", () => {
  it("returns null from the component function (no element is produced)", () => {
    // Calling the component directly pins the early return itself rather than
    // only its DOM side effect: the contract is "null", not "an empty wrapper".
    const result = ClearSamplesBanner({
      onClear: () => undefined,
      visible: false,
    });

    expect(result).toBeNull();
  });

  it("renders no region, CTA or tour target when hidden", () => {
    const { container } = render(
      <ClearSamplesBanner onClear={() => undefined} visible={false} />,
    );

    expect(screen.queryByRole("region", { name: REGION_NAME })).toBeNull();
    expect(screen.queryByRole("button", { name: CTA_NAME })).toBeNull();
    expect(
      container.querySelector('[data-tour-target="clear-samples"]'),
    ).toBeNull();
    expect(container.firstChild).toBeNull();
    expect(container.innerHTML).toBe("");
  });

  it("does not render a wrapper when hidden, even if className is supplied", () => {
    // Guard against the early return being moved below the root element: a
    // hidden banner must not leak an empty styled container into the layout.
    const { container } = render(
      <ClearSamplesBanner
        onClear={() => undefined}
        visible={false}
        className="my-4"
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("never calls onClear while hidden", () => {
    const onClear = vi.fn();
    const { container } = render(
      <ClearSamplesBanner onClear={onClear} visible={false} />,
    );

    fireEvent.click(container);
    fireEvent.keyDown(container, { key: "Enter" });

    expect(onClear).not.toHaveBeenCalled();
  });

  it("re-shows and hides again when visible flips", () => {
    // The hidden state must be derived from props on every render rather than
    // latched, otherwise a later "samples came back" render would stay blank.
    const onClear = vi.fn();
    const { rerender, container } = render(
      <ClearSamplesBanner onClear={onClear} visible={false} />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<ClearSamplesBanner onClear={onClear} visible={true} />);
    expect(
      screen.getByRole("region", { name: REGION_NAME }),
    ).toBeInTheDocument();

    rerender(<ClearSamplesBanner onClear={onClear} visible={false} />);
    expect(container).toBeEmptyDOMElement();
    expect(onClear).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Neighbouring normal path and boundary inputs
// ---------------------------------------------------------------------------

describe("ClearSamplesBanner visible boundary inputs", () => {
  it("treats an omitted visible prop as visible (documented default)", () => {
    const props: ClearSamplesBannerProps = { onClear: () => undefined };
    const { container } = render(<ClearSamplesBanner {...props} />);

    expect(
      screen.getByRole("region", { name: REGION_NAME }),
    ).toBeInTheDocument();
    expect(container.firstChild).not.toBeNull();
  });

  it("renders for visible={true}", () => {
    render(<ClearSamplesBanner onClear={() => undefined} visible={true} />);
    expect(screen.getByRole("button", { name: CTA_NAME })).toBeInTheDocument();
  });

  it("applies the default className without leaking 'undefined'", () => {
    const { container } = render(
      <ClearSamplesBanner onClear={() => undefined} />,
    );
    const root = container.firstElementChild as HTMLElement;

    expect(root.className).not.toContain("undefined");
    expect(root.className.trim()).toBe(root.className);
    expect(root.className.split(/\s+/).every(Boolean)).toBe(true);
  });

  it("merges a caller className with the built-in classes", () => {
    const { container } = render(
      <ClearSamplesBanner onClear={() => undefined} className="my-4" />,
    );
    const root = container.firstElementChild as HTMLElement;

    expect(root).toHaveClass("my-4");
    expect(root).toHaveClass("rounded-[1.5rem]");
  });
});

describe("ClearSamplesBanner CTA behaviour", () => {
  it("does not call onClear during render", () => {
    const onClear = vi.fn();
    render(<ClearSamplesBanner onClear={onClear} />);

    expect(onClear).not.toHaveBeenCalled();
  });

  it("is wired directly as the click handler (it receives the click event)", () => {
    // `onClear` is typed `() => void` but is mounted as `onClick={onClear}`, so
    // React hands it the synthetic click event. Pinning this keeps the wiring
    // visible: callers that ignore the argument keep working, and it explains
    // why a thrown error becomes an uncaught error rather than a rejection.
    const onClear = vi.fn();
    render(<ClearSamplesBanner onClear={onClear} />);

    const button = screen.getByRole("button", { name: CTA_NAME });
    fireEvent.click(button);

    expect(onClear).toHaveBeenCalledTimes(1);

    const [event] = onClear.mock.calls[0] as unknown as [
      React.SyntheticEvent<HTMLButtonElement>,
    ];
    expect(event.type).toBe("click");
    expect(event.target).toBe(button);
    expect(event.nativeEvent).toBeInstanceOf(Event);
  });

  it("calls onClear once per click", () => {
    const onClear = vi.fn();
    render(<ClearSamplesBanner onClear={onClear} />);

    const button = screen.getByRole("button", { name: CTA_NAME });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(onClear).toHaveBeenCalledTimes(3);
  });

  it("does not double-fire through its own click handler", () => {
    // A single click must produce exactly one handler invocation: a stray
    // parent/child handler pair would clear samples twice.
    const onClear = vi.fn();
    const { container } = render(<ClearSamplesBanner onClear={onClear} />);
    const root = container.firstElementChild as HTMLElement;

    fireEvent.click(root);

    expect(onClear).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: CTA_NAME }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("is keyboard activatable with Enter and Space", async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<ClearSamplesBanner onClear={onClear} />);

    const button = screen.getByRole("button", { name: CTA_NAME });

    await user.tab();
    expect(button).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onClear).toHaveBeenCalledTimes(1);

    await user.keyboard("[Space]");
    expect(onClear).toHaveBeenCalledTimes(2);
  });

  it('declares type="button" so it cannot submit an enclosing form', () => {
    render(<ClearSamplesBanner onClear={() => undefined} />);

    expect(screen.getByRole("button", { name: CTA_NAME })).toHaveAttribute(
      "type",
      "button",
    );
  });

  it("keeps the decorative icon out of the CTA accessible name", () => {
    const { container } = render(
      <ClearSamplesBanner onClear={() => undefined} />,
    );

    expect(container.querySelector("svg")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(
      screen.getByRole("button", { name: new RegExp(`^${CTA_NAME}$`) }),
    ).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Failure path — a failing `onClear` must stay observable and retryable
// ---------------------------------------------------------------------------

describe("ClearSamplesBanner failure handling", () => {
  let capture: ReturnType<typeof captureUncaughtErrors>;

  beforeEach(() => {
    capture = captureUncaughtErrors();
  });

  afterEach(() => {
    capture.stop();
  });

  it("surfaces a throwing onClear instead of swallowing it", () => {
    const failure = new Error("clear samples request failed");
    const onClear = vi.fn(() => {
      throw failure;
    });
    render(<ClearSamplesBanner onClear={onClear} />);

    fireEvent.click(screen.getByRole("button", { name: CTA_NAME }));

    expect(onClear).toHaveBeenCalledTimes(1);
    // The failure is not converted into a silent no-op: it reaches the global
    // error channel exactly once, with the original error identity preserved.
    expect(capture.errors).toHaveLength(1);
    expect(capture.errors[0]).toBe(failure);
  });

  it("stays mounted after a failed clear so the user can retry", () => {
    const onClear = vi.fn().mockImplementationOnce(() => {
      throw new Error("clear samples request failed");
    });
    render(<ClearSamplesBanner onClear={onClear} />);

    fireEvent.click(screen.getByRole("button", { name: CTA_NAME }));
    expect(capture.errors).toHaveLength(1);

    // The affordance survives the failure: the user is not stranded without a
    // way to clear onboarding rows, and no partial/empty state is rendered.
    const button = screen.getByRole("button", { name: CTA_NAME });
    expect(button).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: REGION_NAME }),
    ).toBeInTheDocument();

    fireEvent.click(button);

    expect(onClear).toHaveBeenCalledTimes(2);
    expect(capture.errors).toHaveLength(1);
    expect(
      screen.getByRole("region", { name: REGION_NAME }),
    ).toBeInTheDocument();
  });

  it("does not render its own error message when onClear fails", () => {
    // Error surfacing (toast, banner, retry copy) belongs to the caller that
    // owns the request; this component must not invent a second error channel.
    const onClear = vi.fn(() => {
      throw new Error("clear samples request failed");
    });
    const { container } = render(<ClearSamplesBanner onClear={onClear} />);

    fireEvent.click(screen.getByRole("button", { name: CTA_NAME }));

    expect(capture.errors).toHaveLength(1);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(container.textContent).not.toContain("request failed");
    expect(
      screen.getByRole("button", { name: CTA_NAME }),
    ).toBeInTheDocument();
  });
});
