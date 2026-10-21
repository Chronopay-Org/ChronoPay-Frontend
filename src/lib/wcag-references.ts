/**
 * WCAG 2.1 Success Criteria References & Audit Data
 *
 * This module provides standardized definitions for accessibility audit issues,
 * mapped to specific WCAG 2.1 success criteria with recommendations.
 */

// ─── Types ────────────────────────────────────────────────────────────────

export type WCAGLevel = "A" | "AA" | "AAA";

export interface WCAGCriterion {
  /** WCAG success criterion ID (e.g., "1.4.3") */
  id: string;
  /** Short title of the criterion */
  title: string;
  /** Full description of what the criterion requires */
  description: string;
  /** Required compliance level */
  level: WCAGLevel;
  /** Link to WCAG 2.1 specification */
  specUrl: string;
  /** Related techniques */
  techniques: string[];
}

export interface AccessibilityIssue {
  /** Unique issue ID */
  id: string;
  /** Issue title */
  title: string;
  /** Detailed description of the issue */
  description: string;
  /** Severity level */
  severity: "critical" | "major" | "minor" | "warning";
  /** HTML snippet where issue was found */
  snippet: string;
  /** WCAG criterion violated */
  wcagCriterion: WCAGCriterion;
  /** Recommended fix with code example */
  recommendedFix: {
    description: string;
    codeExample: string;
    explanation: string;
  };
  /** Impact description */
  impact: string;
  /** Affected element type */
  elementType: string;
  /** Where issue was found */
  location: string;
}

// ─── WCAG 2.1 Criteria Database ──────────────────────────────────────────

const WCAG_CRITERIA: Record<string, WCAGCriterion> = {
  "1.4.3": {
    id: "1.4.3",
    title: "Contrast (Minimum)",
    description:
      "The visual presentation of text and images of text has a contrast ratio of at least 4.5:1, except for large text or incidental text.",
    level: "AA",
    specUrl: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html",
    techniques: [
      "G18: Ensuring that a contrast ratio of at least 4.5:1 exists between text and background",
      "G148: Not specifying background color, not specifying text color, and not using technology features that change those defaults",
    ],
  },
  "2.1.1": {
    id: "2.1.1",
    title: "Keyboard",
    description:
      "All functionality of the content is operable through a keyboard interface without requiring specific timings for individual keystrokes.",
    level: "A",
    specUrl: "https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html",
    techniques: [
      "G202: Ensuring keyboard control for all functionality",
      "SCR2: Using redundant keyboard and mouse event handlers",
    ],
  },
  "2.4.3": {
    id: "2.4.3",
    title: "Focus Order",
    description:
      "If a Web page can be navigated sequentially and the navigation sequences affect the meaning or operation, focusable components receive focus in an order that preserves meaning and operability.",
    level: "A",
    specUrl: "https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html",
    techniques: [
      "G57: Using the most appropriate semantics of a language to mark visited links",
      "SCR27: Reordering page sections using the DOM",
    ],
  },
  "2.4.7": {
    id: "2.4.7",
    title: "Focus Visible",
    description:
      "Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible.",
    level: "AA",
    specUrl: "https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html",
    techniques: [
      "G149: Using user interface components that are highlighted by the user agent as having focus",
      "SCR31: Using script to change the background color or border of the element with focus",
    ],
  },
  "1.1.1": {
    id: "1.1.1",
    title: "Non-text Content",
    description:
      "All non-text content that is presented to the user has a text alternative that serves the equivalent purpose.",
    level: "A",
    specUrl: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html",
    techniques: [
      "G94: Providing short text alternative for nontext content that serves the same purpose",
      "G95: Providing alt attributes on img elements, area elements, and input elements of type image",
    ],
  },
  "1.3.1": {
    id: "1.3.1",
    title: "Info and Relationships",
    description:
      "Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text.",
    level: "A",
    specUrl: "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html",
    techniques: [
      "G115: Using semantic HTML to mark up structure",
      "ARIA1: Using the aria-describedby property to provide a descriptive label for user interface controls",
    ],
  },
  "3.2.4": {
    id: "3.2.4",
    title: "Consistent Identification",
    description:
      "Components that have the same functionality are identified consistently.",
    level: "AA",
    specUrl:
      "https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification.html",
    techniques: [
      "G197: Using labels, names, and text alternatives consistently for content that has the same functionality",
    ],
  },
  "4.1.2": {
    id: "4.1.2",
    title: "Name, Role, Value",
    description:
      "For all user interface components (including but not limited to: form elements, links and components generated by scripts), the name and role can be programmatically determined; states, properties, and values that can be set by the user can be programmatically set; and notification of changes to these items is available to user agents.",
    level: "A",
    specUrl: "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html",
    techniques: [
      "ARIA5: Using WAI-ARIA role to expose the semantic meaning of content",
      "ARIA10: Using aria-labelledby to provide a text alternative for non-text content",
    ],
  },
};

// ─── Sample Audit Issues ──────────────────────────────────────────────────

export const SAMPLE_AUDIT_ISSUES: AccessibilityIssue[] = [
  {
    id: "issue-001",
    title: "Insufficient Color Contrast on Button Text",
    description:
      "The button text has a contrast ratio of 3.2:1, which fails to meet the WCAG AA requirement of 4.5:1 for normal text.",
    severity: "critical",
    snippet: '<button class="bg-cyan-600 text-slate-400">Save Changes</button>',
    wcagCriterion: WCAG_CRITERIA["1.4.3"],
    recommendedFix: {
      description:
        "Increase the contrast by making the text darker or the background lighter.",
      codeExample: '<button class="bg-cyan-600 text-white">Save Changes</button>',
      explanation:
        "Using text-white (RGB 255, 255, 255) on the cyan background (RGB 6, 182, 212) achieves a contrast ratio of 8.1:1, well above the 4.5:1 minimum.",
    },
    impact:
      "Users with low vision or color blindness may struggle to read the button text.",
    elementType: "button",
    location: "Dashboard > Settings > Save Button",
  },
  {
    id: "issue-002",
    title: "Missing Focus Indicator on Input Field",
    description:
      "The input field does not display a visible focus ring when using keyboard navigation.",
    severity: "major",
    snippet: '<input type="text" className="rounded-lg border border-white/10 bg-slate-900" />',
    wcagCriterion: WCAG_CRITERIA["2.4.7"],
    recommendedFix: {
      description: "Add focus-visible styles to create a visible focus indicator.",
      codeExample:
        '<input type="text" className="rounded-lg border border-white/10 bg-slate-900 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2" />',
      explanation:
        "The focus-visible classes ensure a cyan ring appears around the input when focused via keyboard, meeting WCAG 2.4.7 requirements.",
    },
    impact:
      "Keyboard users cannot see which element currently has focus, making navigation difficult.",
    elementType: "input",
    location: "Settings > Profile > Email Field",
  },
  {
    id: "issue-003",
    title: "Image Without Alt Text",
    description:
      "A decorative image is missing an alt attribute, which is required for non-text content.",
    severity: "major",
    snippet: '<img src="icon-chevron.svg" className="h-4 w-4" />',
    wcagCriterion: WCAG_CRITERIA["1.1.1"],
    recommendedFix: {
      description:
        "Add aria-hidden attribute for decorative images or meaningful alt text for informative images.",
      codeExample:
        '<img src="icon-chevron.svg" className="h-4 w-4" aria-hidden="true" />',
      explanation:
        "Decorative images should have aria-hidden='true' so screen readers skip them. Informative images need descriptive alt text instead.",
    },
    impact:
      "Screen reader users receive unnecessary announcements about decorative images.",
    elementType: "img",
    location: "Navigation > Dropdown Menu",
  },
  {
    id: "issue-004",
    title: "Button Missing Accessible Name",
    description:
      "A button has no text label and no aria-label, making its purpose unclear to screen reader users.",
    severity: "critical",
    snippet: '<button className="h-8 w-8 rounded-full bg-white/10">✕</button>',
    wcagCriterion: WCAG_CRITERIA["4.1.2"],
    recommendedFix: {
      description: "Add an aria-label attribute to provide an accessible name.",
      codeExample:
        '<button className="h-8 w-8 rounded-full bg-white/10" aria-label="Close dialog">✕</button>',
      explanation:
        "The aria-label provides a text alternative that screen readers can announce to users, satisfying the name requirement.",
    },
    impact:
      "Screen reader users cannot understand the purpose of the button.",
    elementType: "button",
    location: "Modal > Close Button",
  },
  {
    id: "issue-005",
    title: "Heading Level Skipped",
    description:
      'Document structure skips from <h2> directly to <h4>, breaking the logical hierarchy.',
    severity: "minor",
    snippet: "<h2>Main Section</h2>\n<h4>Subsection</h4>",
    wcagCriterion: WCAG_CRITERIA["1.3.1"],
    recommendedFix: {
      description: "Use sequential heading levels without skipping.",
      codeExample: "<h2>Main Section</h2>\n<h3>Subsection</h3>",
      explanation:
        "Following a logical heading hierarchy (h1 → h2 → h3) helps screen reader users understand document structure and navigate efficiently.",
    },
    impact:
      "Screen reader users may struggle to navigate and understand the page structure.",
    elementType: "heading",
    location: "Dashboard > Reports Section",
  },
];

/**
 * Get a WCAG criterion by its ID
 */
export function getWCAGCriterion(id: string): WCAGCriterion | undefined {
  return WCAG_CRITERIA[id];
}

/**
 * Get all WCAG criteria
 */
export function getAllWCAGCriteria(): WCAGCriterion[] {
  return Object.values(WCAG_CRITERIA);
}

/**
 * Get audit issues by severity
 */
export function getIssuesBySeverity(
  severity: AccessibilityIssue["severity"]
): AccessibilityIssue[] {
  return SAMPLE_AUDIT_ISSUES.filter((issue) => issue.severity === severity);
}

/**
 * Get issue count by severity
 */
export function getIssueCounts() {
  return {
    critical: SAMPLE_AUDIT_ISSUES.filter((i) => i.severity === "critical").length,
    major: SAMPLE_AUDIT_ISSUES.filter((i) => i.severity === "major").length,
    minor: SAMPLE_AUDIT_ISSUES.filter((i) => i.severity === "minor").length,
    warning: SAMPLE_AUDIT_ISSUES.filter((i) => i.severity === "warning").length,
  };
}
