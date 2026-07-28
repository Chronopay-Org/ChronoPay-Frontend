/**
 * ClearSamplesBanner tests
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ClearSamplesBanner } from "./clear-samples-banner";

describe("ClearSamplesBanner", () => {
  it("renders region copy and clear CTA", () => {
    render(<ClearSamplesBanner onClear={() => undefined} />);
    expect(
      screen.getByRole("region", { name: "Sample data controls" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear samples" }),
    ).toBeInTheDocument();
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
    fireEvent.click(screen.getByRole("button", { name: "Clear samples" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("renders nothing when visible is false", () => {
    const { container } = render(
      <ClearSamplesBanner onClear={() => undefined} visible={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
