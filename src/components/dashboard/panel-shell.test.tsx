import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

import { PanelShell } from "./panel-shell";

describe("PanelShell", () => {
  it("renders the minimal required props correctly", () => {
    render(<PanelShell title="My Panel">Panel Content</PanelShell>);

    // Title is rendered
    const heading = screen.getByRole("heading", { level: 2, name: "My Panel" });
    expect(heading).toBeInTheDocument();

    // Content is rendered
    expect(screen.getByText("Panel Content")).toBeInTheDocument();

    // The region should be labelled by the title
    const region = screen.getByRole("region", { name: "My Panel" });
    expect(region).toBeInTheDocument();
    
    // There shouldn't be an aria-describedby without a description
    expect(region).not.toHaveAttribute("aria-describedby");
  });

  it("renders all optional props correctly", () => {
    render(
      <PanelShell
        title="Full Panel"
        eyebrow="Settings"
        description="Configure your panel settings here."
        action={<button>Save</button>}
        id="custom-id"
        className="custom-class"
      >
        <p>Advanced Settings</p>
      </PanelShell>
    );

    // Check eyebrow
    expect(screen.getByText("Settings")).toBeInTheDocument();

    // Check description
    const description = screen.getByText("Configure your panel settings here.");
    expect(description).toBeInTheDocument();

    // Check action
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();

    // Check ID and custom class on the wrapper
    const region = screen.getByRole("region", { name: "Full Panel" });
    expect(region).toHaveAttribute("id", "custom-id");
    expect(region).toHaveClass("custom-class");
    
    // Check aria-describedby linkage
    const descriptionId = description.getAttribute("id");
    expect(region).toHaveAttribute("aria-describedby", descriptionId);
  });

  it("handles missing description gracefully (no aria-describedby)", () => {
    render(<PanelShell title="No Desc">Content</PanelShell>);
    const region = screen.getByRole("region", { name: "No Desc" });
    expect(region).not.toHaveAttribute("aria-describedby");
  });

  it("renders empty string inputs for optional fields appropriately without crashing", () => {
    render(
      <PanelShell
        title=""
        eyebrow=""
        description=""
        className=""
      >
        Empty strings test
      </PanelShell>
    );
    
    // Region should exist but might have empty name
    const region = screen.getByRole("region");
    expect(region).toBeInTheDocument();
    expect(region).not.toHaveAttribute("aria-describedby");
  });
});
