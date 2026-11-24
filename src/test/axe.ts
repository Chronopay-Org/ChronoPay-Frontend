import React from "react";
import { render } from "@testing-library/react";
import { expect } from "vitest";
import { axe, configureAxe, type JestAxeConfigureOptions } from "jest-axe";
import type { RunOptions } from "axe-core";

/**
 * Documented rule exceptions for jsdom/happy-dom unit test environments.
 *
 * NOTE: Every disabled rule MUST include an explicit reason explaining why it
 * cannot or should not be evaluated in isolated page-level tests.
 * Note that jest-axe automatically disables `color-contrast` in DOM test
 * environments because layout and computed styles are not fully simulated.
 */
export const DOCUMENTED_AXE_RULE_EXCEPTIONS: Record<
  string,
  { enabled: boolean; reason: string }
> = {};

const configuredAxe = configureAxe({
  rules: Object.fromEntries(
    Object.entries(DOCUMENTED_AXE_RULE_EXCEPTIONS).map(([id, { enabled }]) => [
      id,
      { enabled },
    ]),
  ),
} as JestAxeConfigureOptions);

export interface ExpectNoA11yViolationsOptions extends RunOptions {
  /**
   * Optional per-test rule exemptions. Each disabled rule must provide a reason.
   */
  exemptions?: Record<string, { enabled: boolean; reason: string }>;
}

/**
 * Renders a React element (or accepts an already-mounted HTMLElement / container)
 * and asserts that axe-core reports zero accessibility violations.
 */
export async function expectNoA11yViolations(
  ui: React.ReactElement | Element,
  options?: ExpectNoA11yViolationsOptions,
) {
  const container =
    ui instanceof Element ? ui : render(ui).container;

  const { exemptions, rules: customRules, ...restOptions } = options ?? {};

  const mergedRules: NonNullable<RunOptions["rules"]> = {
    ...customRules,
  };

  if (exemptions) {
    for (const [ruleId, config] of Object.entries(exemptions)) {
      if (!config.reason || config.reason.trim().length === 0) {
        throw new Error(
          `Undocumented axe rule exemption for "${ruleId}". Provide a non-empty reason.`,
        );
      }
      mergedRules[ruleId] = { enabled: config.enabled };
    }
  }

  const runOptions: RunOptions = {
    iframes: false,
    ...restOptions,
    ...(Object.keys(mergedRules).length > 0 ? { rules: mergedRules } : {}),
  };

  const results = await configuredAxe(container, runOptions);
  expect(results).toHaveNoViolations();
  return results;
}

export { axe };
