import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated files
    "coverage/**",
  ]),
  // Production code must not log directly. Route failures through reportError
  // (src/app/dashboard/reportError.ts) so there is a single telemetry sink.
  // console.warn stays allowed for non-error diagnostics.
  {
    files: ["src/**/*.{js,jsx,mjs,ts,tsx}"],
    rules: {
      "no-console": ["error", { allow: ["warn"] }],
    },
  },
  // The sanctioned sink itself and tests may use console freely.
  {
    files: ["**/*.test.*", "**/*.spec.*", "src/app/dashboard/reportError.ts"],
    rules: {
      "no-console": "off",
    },
  },
]);

export default eslintConfig;
