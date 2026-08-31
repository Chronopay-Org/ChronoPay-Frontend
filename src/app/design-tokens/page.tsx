"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CopyButton } from "@/app/components/ui/copy-button";
import { ThemeSwitcher } from "@/app/components/ui/theme-switcher";

const tokens = [
  { name: "Primary 500", value: "#06B6D4", category: "Colors" },
  { name: "Primary 600", value: "#0891B2", category: "Colors" },
  { name: "Secondary 500", value: "#8B5CF6", category: "Colors" },
  { name: "Spacing 4", value: "16px", category: "Spacing" },
  { name: "Spacing 8", value: "32px", category: "Spacing" },
  { name: "Font Base", value: "16px", category: "Typography" },
  { name: "Heading XL", value: "36px", category: "Typography" },
  { name: "Radius MD", value: "8px", category: "Borders" },
  { name: "Radius XL", value: "16px", category: "Borders" },
  { name: "Shadow MD", value: "0 4px 8px rgba(0,0,0,0.15)", category: "Shadows" },
  // Chart tokens — tooltip surface + gridlines
  // See docs/chart-tokens.md for full documentation
  {
    name: "--chart-tooltip-bg",
    value: "var(--chart-tooltip-bg)",
    category: "Charts",
    description: "Tooltip panel background (dark: #0f1c2e / light: #ffffff)",
  },
  {
    name: "--chart-tooltip-border",
    value: "var(--chart-tooltip-border)",
    category: "Charts",
    description:
      "Tooltip hairline border (dark: rgba(148,163,184,0.2) / light: rgba(15,23,42,0.12))",
  },
  {
    name: "--chart-tooltip-text",
    value: "var(--chart-tooltip-text)",
    category: "Charts",
    description: "Primary value text inside tooltip (dark: #f4f7fb / light: #0a1628)",
  },
  {
    name: "--chart-tooltip-text-muted",
    value: "var(--chart-tooltip-text-muted)",
    category: "Charts",
    description:
      "Secondary/metadata line in tooltip (dark: #9fb0c7 / light: #4a6080)",
  },
  {
    name: "--chart-gridline-color",
    value: "var(--chart-gridline-color)",
    category: "Charts",
    description:
      "Bar-track background and SVG reference lines (dark: rgba(148,163,184,0.15) / light: rgba(15,23,42,0.1))",
  },
  {
    name: "--chart-gridline-stroke-width",
    value: "1px",
    category: "Charts",
    description: "SVG stroke-width for sparkline gridlines",
  },
];

const categories = [
  "All",
  "Colors",
  "Typography",
  "Spacing",
  "Borders",
  "Shadows",
  "Charts",
];

export default function DesignTokensPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filteredTokens = useMemo(() => {
    return tokens.filter((token) => {
      const matchesCategory =
        category === "All" || token.category === category;

      const matchesSearch =
        token.name.toLowerCase().includes(search.toLowerCase()) ||
        token.value.toLowerCase().includes(search.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-900/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold">Design Tokens</h1>
            <p className="text-sm text-slate-400">
              Search and copy design tokens
            </p>
          </div>

          <div className="flex items-center gap-4">
            <ThemeSwitcher />
            <Link
              href="/design-review"
              className="text-sm text-cyan-400 hover:underline"
            >
              Design Review
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <label htmlFor="search" className="sr-only">
            Search tokens
          </label>

          <input
            id="search"
            type="text"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 outline-none focus:border-cyan-500"
          />
        </div>

        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                category === item
                  ? "bg-cyan-500 text-slate-900"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTokens.map((token) => (
            <article
              key={token.name}
              className="rounded-xl border border-white/10 bg-slate-900 p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-cyan-400">
                  {token.category}
                </span>

                <CopyButton
                  text={token.value}
                  variant="icon"
                  label={`Copy ${token.name}`}
                />
              </div>

              <h2 className="font-semibold">{token.name}</h2>

              <p className="mt-1 break-all text-sm text-slate-400">
                {token.value}
              </p>

              {token.category === "Colors" && (
                <div className="mt-5 space-y-3">
                  <div>
                    <p className="mb-1 text-xs text-slate-400">Light</p>
                    <div
                      className="h-12 rounded-lg border"
                      style={{ background: token.value }}
                    />
                  </div>

                  <div className="rounded-lg bg-slate-800 p-3">
                    <p className="mb-1 text-xs text-slate-400">Dark</p>
                    <div
                      className="h-12 rounded-lg border border-slate-700"
                      style={{ background: token.value }}
                    />
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>

        {filteredTokens.length === 0 && (
          <div className="mt-12 rounded-lg border border-dashed border-slate-700 p-8 text-center text-slate-400">
            No tokens found.
          </div>
        )}
      </main>
    </div>
  );
}