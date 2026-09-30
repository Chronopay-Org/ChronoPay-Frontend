/**
 * Regression coverage for SavedViewChips failure handling.
 *
 * Pins the null-return branches called out in saved-view-chips.tsx:
 * - safeGet: `if (typeof window === "undefined") return null` (SSR guard)
 * - safeGet: catch block `return null` when the storage backend throws
 * - activeViewId: `if (views.length === 0) return null`
 *
 * Contract:
 * - Failures degrade to an empty view list (empty-state UI), never a crash.
 * - The component never returns `null`/`undefined` for these paths.
 * - With views present, chips render and the active view is marked.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SavedViewChips, type SavedView } from "./saved-view-chips";

const h = vi.hoisted(() => ({
  search: new URLSearchParams(),
  router: { replace: vi.fn(), push: vi.fn() },
  pathname: "/dashboard",
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => h.search,
  useRouter: () => h.router,
  usePathname: () => h.pathname,
}));

const STORAGE_KEY = "chronopay-saved-views";
const EMPTY_MESSAGE = "No saved views yet. Configure the grid, then save it for later.";

function setSearch(queryString: string) {
  h.search = new URLSearchParams(queryString);
}

function createStorage(seed: Record<string, string> = {}) {
  const data = new Map(Object.entries(seed));
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      data.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      data.delete(key);
    }),
  };
}

function seedViews(views: SavedView[]): Record<string, string> {
  return { [STORAGE_KEY]: JSON.stringify(views) };
}

describe("SavedViewChips failure handling (regression — #998)", () => {
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "window",
  );

  beforeEach(() => {
    setSearch("");
    h.router.replace.mockClear();
    localStorage.clear();
  });

  afterEach(() => {
    if (originalWindowDescriptor) {
      Object.defineProperty(globalThis, "window", originalWindowDescriptor);
    }
    vi.unstubAllGlobals();
  });

  describe("safeGet null when window is undefined (SSR guard)", () => {
    it("degrades to empty state when window is undefined and no storage prop", () => {
      // Simulate SSR: typeof window === "undefined" ⇒ safeGet returns null
      // ⇒ views stay [] ⇒ activeViewId is null (line 149) ⇒ empty-state UI.
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        configurable: true,
        writable: true,
      });

      const { container } = render(<SavedViewChips />);

      // Returned value contract: non-null DOM, not a null return from the component.
      expect(container.firstChild).not.toBeNull();
      expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /More actions/ }),
      ).not.toBeInTheDocument();
    });
  });

  describe("safeGet null when the storage backend throws (catch branch)", () => {
    it("renders empty state when getItem throws", async () => {
      const throwing = {
        getItem: vi.fn(() => {
          throw new Error("SecurityError: access denied");
        }),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };

      const { container } = render(<SavedViewChips storage={throwing} />);

      await waitFor(() =>
        expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument(),
      );
      expect(container.firstChild).not.toBeNull();
      expect(
        screen.queryByRole("button", { name: /More actions/ }),
      ).not.toBeInTheDocument();
    });

    it("still allows saving after a failed read (setItem works)", async () => {
      const flaky = {
        getItem: vi.fn(() => {
          throw new Error("quota");
        }),
        setItem: vi.fn((key: string, value: string) => {
          flaky._data.set(key, value);
        }),
        removeItem: vi.fn(),
        _data: new Map<string, string>(),
      };
      // Keep getItem throwing even after set — read path stays broken.
      const user = (await import("@testing-library/user-event")).default.setup();
      render(<SavedViewChips storage={flaky as never} />);

      await waitFor(() =>
        expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument(),
      );
      await user.click(screen.getByRole("button", { name: "Save current view" }));
      await user.type(screen.getByLabelText("Saved view name"), "After failure");
      await user.click(screen.getByRole("button", { name: "Save view" }));

      // In-memory state updated even though persistence read failed.
      expect(screen.getByRole("button", { name: "After failure" })).toBeInTheDocument();
    });
  });

  describe("activeViewId null when no views (line 149)", () => {
    it("shows empty state and count (0) when storage returns null", async () => {
      const storage = createStorage(); // getItem → null
      render(<SavedViewChips storage={storage} />);

      await waitFor(() =>
        expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument(),
      );
      expect(screen.getByLabelText("0 saved views")).toBeInTheDocument();
      // activeViewId === null ⇒ no chip can be aria-pressed=true.
      expect(
        document.querySelectorAll('[aria-pressed="true"]'),
      ).toHaveLength(0);
    });

    it("treats corrupt JSON as empty views (activeViewId null)", async () => {
      const storage = createStorage({ [STORAGE_KEY]: "{{{not-json" });
      render(<SavedViewChips storage={storage} />);

      await waitFor(() =>
        expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument(),
      );
      expect(screen.getByLabelText("0 saved views")).toBeInTheDocument();
    });

    it("treats non-array JSON as empty views (activeViewId null)", async () => {
      const storage = createStorage({
        [STORAGE_KEY]: JSON.stringify({ nope: true }),
      });
      render(<SavedViewChips storage={storage} />);

      await waitFor(() =>
        expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument(),
      );
      expect(
        screen.queryByRole("button", { name: /More actions/ }),
      ).not.toBeInTheDocument();
    });

    it("filters all-invalid entries down to empty views", async () => {
      const storage = createStorage({
        [STORAGE_KEY]: JSON.stringify([
          null,
          42,
          { id: "", name: "", params: "" },
          "junk",
        ]),
      });
      render(<SavedViewChips storage={storage} />);

      await waitFor(() =>
        expect(screen.getByText(EMPTY_MESSAGE)).toBeInTheDocument(),
      );
      expect(screen.getByLabelText("0 saved views")).toBeInTheDocument();
    });
  });

  describe("normal path — renders when views are present", () => {
    it("renders a chip for each saved view", async () => {
      setSearch("sort=price");
      const storage = createStorage(
        seedViews([
          { id: "v1", name: "Quick wins", params: "sort=price" },
          { id: "v2", name: "Soonest", params: "sort=soonest" },
        ]),
      );
      render(<SavedViewChips storage={storage} />);

      await waitFor(() =>
        expect(screen.getByRole("button", { name: "Quick wins" })).toBeInTheDocument(),
      );
      expect(screen.getByRole("button", { name: "Soonest" })).toBeInTheDocument();
      expect(screen.getByLabelText("2 saved views")).toBeInTheDocument();
      expect(screen.queryByText(EMPTY_MESSAGE)).not.toBeInTheDocument();
    });

    it("marks the matching view as active (activeViewId not null)", async () => {
      setSearch("sort=price");
      const storage = createStorage(
        seedViews([{ id: "v1", name: "Quick wins", params: "sort=price" }]),
      );
      render(<SavedViewChips storage={storage} />);

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Quick wins" }),
        ).toHaveAttribute("aria-pressed", "true"),
      );
    });

    it("leaves non-matching views inactive when views exist but params differ", async () => {
      setSearch("sort=soonest");
      const storage = createStorage(
        seedViews([{ id: "v1", name: "Quick wins", params: "sort=price" }]),
      );
      render(<SavedViewChips storage={storage} />);

      await waitFor(() =>
        expect(
          screen.getByRole("button", { name: "Quick wins" }),
        ).toHaveAttribute("aria-pressed", "false"),
      );
    });

    it("component never returns null when views are present", async () => {
      setSearch("sort=price");
      const storage = createStorage(
        seedViews([{ id: "v1", name: "Quick wins", params: "sort=price" }]),
      );
      const { container } = render(<SavedViewChips storage={storage} />);
      expect(container.firstChild).not.toBeNull();
      await waitFor(() =>
        expect(screen.getByRole("region", { name: "Saved views" })).toBeInTheDocument(),
      );
    });
  });
});
