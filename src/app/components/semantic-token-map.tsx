"use client";

import { useState, useCallback, useId } from "react";
import { clsx } from "clsx";
import { CheckCircle2, Copy } from "lucide-react";

type Theme = "dark" | "light" | "auto";

interface TokenEntry {
  semantic: string;
  dark: string;
  light: string;
  category: string;
  description: string;
}

interface SemanticTokenMapProps {
  tokens?: TokenEntry[];
  className?: string;
}

const DEFAULT_TOKENS: TokenEntry[] = [
  {
    semantic: "--background",
    dark: "#07111f",
    light: "#f0f5fb",
    category: "color",
    description: "Page background. Matches the darkest app surface.",
  },
  {
    semantic: "--foreground",
    dark: "#f4f7fb",
    light: "#0a1628",
    category: "color",
    description: "Primary text on background surfaces.",
  },
  {
    semantic: "--surface",
    dark: "rgba(11, 23, 40, 0.82)",
    light: "rgba(255, 255, 255, 0.88)",
    category: "color",
    description: "Default card/panel background with translucency.",
  },
  {
    semantic: "--surface-strong",
    dark: "rgba(10, 20, 36, 0.96)",
    light: "rgba(255, 255, 255, 0.98)",
    category: "color",
    description: "Higher-opacity surface for dialogs and overlays.",
  },
  {
    semantic: "--border-subtle",
    dark: "rgba(148, 163, 184, 0.14)",
    light: "rgba(15, 23, 42, 0.10)",
    category: "color",
    description: "Low-contrast border for dividers and card outlines.",
  },
  {
    semantic: "--border-strong",
    dark: "rgba(125, 211, 252, 0.22)",
    light: "rgba(8, 145, 178, 0.28)",
    category: "color",
    description: "Accent-tinted border for focused or elevated surfaces.",
  },
  {
    semantic: "--accent",
    dark: "#6ee7f9",
    light: "#0891b2",
    category: "color",
    description: "Primary accent color for links, chips, and focus rings.",
  },
  {
    semantic: "--accent-strong",
    dark: "#22d3ee",
    light: "#06b6d4",
    category: "color",
    description: "Stronger accent for CTAs and active states.",
  },
  {
    semantic: "--accent-warm",
    dark: "#f59e0b",
    light: "#d97706",
    category: "color",
    description: "Warm accent for warnings or secondary highlights.",
  },
  {
    semantic: "--success",
    dark: "#34d399",
    light: "#059669",
    category: "color",
    description: "Success state color.",
  },
  {
    semantic: "--danger",
    dark: "#f87171",
    light: "#dc2626",
    category: "color",
    description: "Error or destructive action color.",
  },
  {
    semantic: "--muted",
    dark: "#9fb0c7",
    light: "#4a6080",
    category: "color",
    description: "Secondary or disabled text.",
  },
  {
    semantic: "--helper-text-color",
    dark: "rgb(203 213 225)",
    light: "rgb(30 58 138)",
    category: "typography",
    description: "Default helper text color beneath labels.",
  },
  {
    semantic: "--helper-text-color-muted",
    dark: "rgb(148 163 184)",
    light: "rgb(71 85 105)",
    category: "typography",
    description: "Quiet helper text for metadata and empty states.",
  },
  {
    semantic: "--helper-text-color-emphasis",
    dark: "rgb(207 250 254 / 0.8)",
    light: "rgb(8 145 178 / 0.9)",
    category: "typography",
    description: "Emphasized helper text on accent surfaces.",
  },
  {
    semantic: "--radius-md",
    dark: "24px",
    light: "24px",
    category: "layout",
    description: "Default card border radius.",
  },
  {
    semantic: "--radius-lg",
    dark: "28px",
    light: "28px",
    category: "layout",
    description: "Panel/large card border radius.",
  },
  {
    semantic: "--radius-xl",
    dark: "32px",
    light: "32px",
    category: "layout",
    description: "Glass card / elevated surface radius.",
  },
  {
    semantic: "--shell-header-bg",
    dark: "rgba(7, 17, 31, 0.4)",
    light: "rgba(240, 245, 251, 0.75)",
    category: "shell",
    description: "Top navigation header background.",
  },
  {
    semantic: "--shell-text",
    dark: "#f4f7fb",
    light: "#0a1628",
    category: "shell",
    description: "Primary text in the dashboard shell.",
  },
  {
    semantic: "--shell-text-muted",
    dark: "#9fb0c7",
    light: "#4a6080",
    category: "shell",
    description: "Secondary text in the dashboard shell.",
  },
];

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copyId = useId();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [text]);

  return (
    <button
      id={copyId}
      type="button"
      onClick={handleCopy}
      aria-label={`${label}: copy`}
      className={clsx(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors focus-ring-cyan",
        copied
          ? "border border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
          : "border border-white/10 bg-white/6 text-slate-200 hover:border-white/20"
      )}
    >
      {copied ? (
        <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
      ) : (
        <Copy aria-hidden="true" className="h-3.5 w-3.5" />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function Swatch({ value }: { value: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-8 w-8 rounded-lg border border-white/20 shadow-sm"
      style={{ backgroundColor: value }}
      title={value}
    />
  );
}

export function SemanticTokenMap({
  tokens = DEFAULT_TOKENS,
  className = "",
}: SemanticTokenMapProps) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const liveId = useId();
  const headingId = useId();

  const categories = Array.from(new Set(tokens.map((t) => t.category)));

  const filtered = tokens.filter(
    (t) => categoryFilter === "all" || t.category === categoryFilter
  );

  const announce = useCallback(
    (message: string) => {
      const el = document.getElementById(liveId);
      if (el) {
        el.textContent = message;
        setTimeout(() => {
          if (el) el.textContent = "";
        }, 2000);
      }
    },
    [liveId]
  );

  const isDarkActive = theme === "dark" || (theme === "auto" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const isLightActive = theme === "light" || (theme === "auto" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches);

  return (
    <div className={clsx("space-y-6", className)} aria-labelledby={headingId}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 id={headingId} className="text-xl font-semibold text-white">
            Semantic vs Primitive Tokens
          </h2>
          <p className="helper-text helper-text--muted">
            Map each semantic token to its primitive value across themes. Dark
            mode shows the default fallback; light mode shows explicit overrides.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <fieldset className="flex items-center gap-1 rounded-full border border-white/10 bg-white/6 p-1">
            <legend className="sr-only">Theme</legend>
            {(["dark", "light", "auto"] as Theme[]).map((t) => (
              <label
                key={t}
                className={clsx(
                  "flex cursor-pointer items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  theme === t
                    ? "border border-cyan-300/30 bg-cyan-300/10 text-cyan-100"
                    : "border border-white/6 bg-white/4 text-slate-300 hover:border-white/16"
                )}
              >
                <input
                  type="radio"
                  name="token-theme"
                  value={t}
                  checked={theme === t}
                  onChange={() => {
                    setTheme(t);
                    announce(`Theme switched to ${t}.`);
                  }}
                  className="sr-only"
                />
                <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
              </label>
            ))}
          </fieldset>
        </div>
      </div>

      <div
        id={liveId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label="Screen reader announcements"
        className="sr-only"
      />

      <div className="flex flex-wrap gap-2" role="group" aria-label="Category filter">
        <button
          type="button"
          onClick={() => setCategoryFilter("all")}
          aria-pressed={categoryFilter === "all"}
          className={clsx(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-ring-cyan",
            categoryFilter === "all"
              ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
              : "border-white/10 bg-white/6 text-slate-300 hover:border-white/20"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            aria-pressed={categoryFilter === cat}
            className={clsx(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-ring-cyan",
              categoryFilter === cat
                ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
                : "border-white/10 bg-white/6 text-slate-300 hover:border-white/20"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div
        role="region"
        aria-label="Token mapping table"
        className="card card--panel overflow-x-auto"
      >
        <table
          className="w-full min-w-[720px] text-left text-sm"
          dir="ltr"
        >
          <thead>
            <tr className="border-b border-white/10">
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-slate-300 sticky left-0 bg-slate-900/95 backdrop-blur-sm z-10"
              >
                Semantic Token
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-slate-300 text-center"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full bg-slate-700 border border-white/20"
                    aria-hidden="true"
                  />
                  Dark
                </span>
              </th>
              <th
                scope="col"
                className="px-4 py-3 font-semibold text-slate-300 text-center"
              >
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full bg-slate-200 border border-white/20"
                    aria-hidden="true"
                  />
                  Light
                </span>
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-slate-300">
                Category
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-slate-300">
                Description
              </th>
              <th scope="col" className="px-4 py-3 font-semibold text-slate-300">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/6">
            {filtered.map((token) => {
              const darkValue = token.dark;
              const lightValue = token.light;
              const isDarkHighlighted =
                theme === "dark" ||
                (theme === "auto" && isDarkActive);
              const isLightHighlighted =
                theme === "light" ||
                (theme === "auto" && isLightActive);

              return (
                <tr
                  key={token.semantic}
                  className="hover:bg-white/4 transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs text-cyan-200 break-all sticky left-0 bg-slate-900/90 backdrop-blur-sm z-10">
                    {token.semantic}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-1.5">
                      <Swatch value={darkValue} />
                      <span
                        className={clsx(
                          "font-mono text-xs break-all text-center",
                          isDarkHighlighted
                            ? "text-slate-100 font-medium"
                            : "text-slate-500"
                        )}
                      >
                        {darkValue}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-center gap-1.5">
                      <Swatch value={lightValue} />
                      <span
                        className={clsx(
                          "font-mono text-xs break-all text-center",
                          isLightHighlighted
                            ? "text-slate-100 font-medium"
                            : "text-slate-500"
                        )}
                      >
                        {lightValue}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400 capitalize">
                    {token.category}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {token.description}
                  </td>
                  <td className="px-4 py-3">
                    <CopyButton
                      text={token.semantic}
                      label={token.semantic}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="helper-text helper-text--muted text-xs" role="note">
        Highlighted values correspond to the currently selected theme. Use the
        Copy button to copy a semantic token name for use in{" "}
        <code className="font-mono text-slate-300">var(--token)</code>.
      </p>
    </div>
  );
}