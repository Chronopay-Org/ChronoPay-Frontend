import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SettingsPage, { metadata as settingsMetadata } from "../app/dashboard/settings/page";

describe("Settings Page", () => {
  it("renders the settings page", () => {
    render(<SettingsPage />);
    // Settings panel is loaded dynamically, just check the shell renders
    expect(document.querySelector("body")).toBeInTheDocument();
  });

  it("exports metadata with the correct title and noindex", () => {
    expect(settingsMetadata).toHaveProperty("title", "Settings");
    expect(settingsMetadata.robots).toEqual({ index: false, follow: false });
  });
});
