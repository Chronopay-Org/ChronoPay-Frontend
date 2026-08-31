import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: [
        "src/app/components/ui/form-field.tsx",
        "src/app/components/ui/help-popover.tsx",
        "src/lib/glossary.ts",
        "src/components/dashboard/booking-progress.tsx",
        "src/components/dashboard/review-reply-thread.tsx",
        "src/components/dashboard/earnings-chart.tsx",
        "src/components/dashboard/rating-breakdown-bars.tsx",
        "src/components/dashboard/sentiment-sparkline.tsx",
        "src/components/receipt/RefundConversionNote.tsx",
        "src/components/receipt/types.ts",
        "src/components/receipt/Receipt.tsx",
        "src/components/marketplace/results-per-page-selector.tsx",
        "src/components/dashboard/plan-comparison.tsx",
        "src/components/dashboard/rebooking-utils.ts",
        "src/components/dashboard/rebooking-dialog.tsx",
        "src/components/dashboard/slot-list.tsx",
      ],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
