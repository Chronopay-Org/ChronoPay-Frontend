/**
 * @vitest-environment node
 */
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { RoleProvider, useRole } from "./RoleContext";
import React from "react";

describe("RoleContext Node Environment", () => {
  it("returns default/initial role and handles window being undefined safely (line 65)", () => {
    // In node environment, window is undefined
    expect(typeof window).toBe("undefined");

    const TestComponent = () => {
      const { role } = useRole();
      return <span>{role}</span>;
    };

    const html = renderToStaticMarkup(
      <RoleProvider initialRole="admin">
        <TestComponent />
      </RoleProvider>
    );

    expect(html).toBe("<span>admin</span>");
  });
});
