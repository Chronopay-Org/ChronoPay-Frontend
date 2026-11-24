import { describe, it, expect } from "vitest";
import * as uptimeExports from "./index";

describe("src/app/components/uptime/index.ts", () => {
  it("should export the expected components and utilities", () => {
    // Components
    expect(uptimeExports.UptimeChart).toBeDefined();
    expect(typeof uptimeExports.UptimeChart).toBe("function");

    expect(uptimeExports.UptimeCell).toBeDefined();
    expect(typeof uptimeExports.UptimeCell).toBe("function");

    expect(uptimeExports.UptimeTooltip).toBeDefined();
    expect(typeof uptimeExports.UptimeTooltip).toBe("function");

    // Token Utilities
    expect(uptimeExports.getUptimeColorClass).toBeDefined();
    expect(typeof uptimeExports.getUptimeColorClass).toBe("function");

    expect(uptimeExports.getUptimeColorVarDark).toBeDefined();
    expect(typeof uptimeExports.getUptimeColorVarDark).toBe("function");

    expect(uptimeExports.getUptimeColorVarLight).toBeDefined();
    expect(typeof uptimeExports.getUptimeColorVarLight).toBe("function");

    expect(uptimeExports.getIncidentIndicator).toBeDefined();
    expect(typeof uptimeExports.getIncidentIndicator).toBe("function");

    // Constants
    expect(uptimeExports.UPTIME_NONE).toBeDefined();
    expect(uptimeExports.UPTIME_NONE_VAR_DARK).toBeDefined();
    expect(uptimeExports.UPTIME_NONE_VAR_LIGHT).toBeDefined();
  });
});
