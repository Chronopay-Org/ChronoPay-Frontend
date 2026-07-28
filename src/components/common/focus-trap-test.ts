export interface FocusTrapTestStep {
  step: number;
  action: "initial-focus" | "tab" | "tab-wrap" | "shift-tab-wrap";
  fromLabel: string | null;
  toLabel: string | null;
  expectedLabel: string | null;
  status: "pass" | "fail";
}

export interface FocusTrapTestResult {
  pass: boolean;
  totalFocusableElements: number;
  steps: FocusTrapTestStep[];
  firstOffendingStep?: number;
  firstOffendingElement?: string;
}

function getElementLabel(el: HTMLElement): string {
  return (
    el.getAttribute("aria-label") ??
    el.textContent?.trim().slice(0, 40) ??
    el.tagName.toLowerCase()
  );
}

export function getFocusableElements(
  container: HTMLElement
): HTMLElement[] {
  const selectors = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");
  return Array.from(
    container.querySelectorAll<HTMLElement>(selectors)
  ).filter((el) => el.offsetParent !== null);
}

export function testFocusTrap(
  container: HTMLElement
): FocusTrapTestResult {
  const focusable = getFocusableElements(container);
  const steps: FocusTrapTestStep[] = [];
  let stepNum = 0;
  let hasFailed = false;

  const record = (step: Omit<FocusTrapTestStep, "step">) => {
    stepNum++;
    if (step.status === "fail") hasFailed = true;
    steps.push({ step: stepNum, ...step });
  };

  if (focusable.length === 0) {
    return {
      pass: false,
      totalFocusableElements: 0,
      steps: [],
    };
  }

  // 1. Initial focus test
  focusable[0]?.focus();
  const initialActive = document.activeElement as HTMLElement | null;
  record({
    action: "initial-focus",
    fromLabel: null,
    toLabel: initialActive ? getElementLabel(initialActive) : null,
    expectedLabel: getElementLabel(focusable[0]),
    status: initialActive === focusable[0] ? "pass" : "fail",
  });

  if (hasFailed) return finalize();

  // 2. Tab through elements forward
  for (let i = 0; i < focusable.length - 1; i++) {
    const from = focusable[i];
    const expected = focusable[i + 1];
    expected.focus();
    const actual = document.activeElement as HTMLElement | null;
    record({
      action: "tab",
      fromLabel: getElementLabel(from),
      toLabel: actual ? getElementLabel(actual) : null,
      expectedLabel: getElementLabel(expected),
      status: actual === expected ? "pass" : "fail",
    });
    if (hasFailed) return finalize();
  }

  // 3. Tab wrap: last element -> should cycle to first
  const lastEl = focusable[focusable.length - 1];
  lastEl.focus();

  container.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    })
  );

  const tabWrapped = document.activeElement as HTMLElement | null;
  record({
    action: "tab-wrap",
    fromLabel: getElementLabel(lastEl),
    toLabel: tabWrapped ? getElementLabel(tabWrapped) : null,
    expectedLabel: getElementLabel(focusable[0]),
    status: tabWrapped === focusable[0] ? "pass" : "fail",
  });

  if (hasFailed) return finalize();

  // 4. Shift+Tab wrap: first element -> should cycle to last
  focusable[0]?.focus();

  container.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "Tab",
      shiftKey: true,
      bubbles: true,
      cancelable: true,
    })
  );

  const shiftTabWrapped = document.activeElement as HTMLElement | null;
  record({
    action: "shift-tab-wrap",
    fromLabel: getElementLabel(focusable[0]),
    toLabel: shiftTabWrapped ? getElementLabel(shiftTabWrapped) : null,
    expectedLabel: getElementLabel(lastEl),
    status: shiftTabWrapped === lastEl ? "pass" : "fail",
  });

  return finalize();

  function finalize(): FocusTrapTestResult {
    const firstFailure = steps.find((s) => s.status === "fail");
    return {
      pass: !firstFailure,
      totalFocusableElements: focusable.length,
      steps,
      firstOffendingStep: firstFailure?.step,
      firstOffendingElement: firstFailure
        ? `${firstFailure.action} \u2014 expected focus on "${firstFailure.expectedLabel}" but got "${firstFailure.toLabel ?? "(none)"}"`
        : undefined,
    };
  }
}
