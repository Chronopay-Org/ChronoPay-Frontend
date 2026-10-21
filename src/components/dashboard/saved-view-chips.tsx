"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Bookmark, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import clsx from "clsx";
import { LiveRegion } from "@/components/common/LiveRegion";

const STORAGE_KEY = "chronopay-saved-views";
const MAX_VIEWS = 20;
const MAX_NAME_LENGTH = 40;

export interface SavedView {
  id: string;
  name: string;
  /** Serialised URL search params captured when the view was saved. */
  params: string;
}

function createViewId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `view-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Sort key/value pairs so two semantically-equal params compare equal. */
export function normalizeParams(params: string): string {
  const url = new URLSearchParams(params);
  const keys = [...url.keys()].sort();
  return keys.map((key) => `${key}=${url.get(key)}`).join("&");
}

function trimName(name: string): string {
  return name.trim().slice(0, MAX_NAME_LENGTH);
}

function safeParseViews(raw: string | null): SavedView[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (entry): entry is Record<string, unknown> =>
          !!entry &&
          typeof entry === "object" &&
          typeof (entry as Record<string, unknown>).id === "string" &&
          typeof (entry as Record<string, unknown>).name === "string" &&
          typeof (entry as Record<string, unknown>).params === "string"
      )
      .map((entry) => ({
        id: entry.id as string,
        name: trimName(entry.name as string),
        params: entry.params as string,
      }))
      .filter((view) => view.name.length > 0)
      .slice(0, MAX_VIEWS);
  } catch {
    return [];
  }
}

interface SavedViewChipsProps {
  /** Persist hook override for tests (defaults to window.localStorage). */
  storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">;
}

/**
 * Saved-view chips for the marketplace browse grid. Each chip snapshots the
 * current URL search params; pressing it restores that exact view. Views are
 * persisted to localStorage and support rename and delete affordances that are
 * fully operable from the keyboard.
 */
export function SavedViewChips({ storage }: SavedViewChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const store = storage;
  const [views, setViews] = useState<SavedView[]>([]);
  const [persisted, setPersisted] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveValue, setSaveValue] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const saveInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  const safeGet = useCallback(
    (key: string): string | null => {
      try {
        if (store) return store.getItem(key);
        if (typeof window === "undefined") return null;
        return window.localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    [store]
  );

  const safeSet = useCallback(
    (key: string, value: string): void => {
      try {
        if (store) {
          store.setItem(key, value);
          return;
        }
        window.localStorage.setItem(key, value);
      } catch {
        // localStorage may be unavailable in private browsing.
      }
    },
    [store]
  );

  useEffect(() => {
    // Load the persisted view list once from localStorage (external system).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setViews(safeParseViews(safeGet(STORAGE_KEY)));
    setPersisted(true);
  }, [safeGet]);

  useEffect(() => {
    if (renamingId) renameInputRef.current?.focus();
  }, [renamingId]);

  useEffect(() => {
    if (saveOpen) saveInputRef.current?.focus();
  }, [saveOpen]);

  // Close the open chip menu when the URL changes (e.g. a view was applied).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuOpenId(null);
    setRenamingId(null);
    setSaveOpen(false);
  }, [searchParams]);

  const currentParams = searchParams.toString();

  const normalizedCurrent = normalizeParams(currentParams);

  const activeViewId = useMemo(() => {
    if (views.length === 0) return null;
    const match = views.find((view) => normalizeParams(view.params) === normalizedCurrent);
    return match?.id ?? null;
  }, [views, normalizedCurrent]);

  const persistViews = useCallback(
    (nextViews: SavedView[]) => {
      setViews(nextViews);
      safeSet(STORAGE_KEY, JSON.stringify(nextViews));
    },
    [safeSet]
  );

  const announce = useCallback((message: string) => {
    setAnnouncement(message);
  }, []);

  const handleApplyView = useCallback(
    (view: SavedView) => {
      router.replace(view.params ? `${pathname}?${view.params}` : pathname);
      setMenuOpenId(null);
      announce(`Restored saved view ${view.name}`);
    },
    [router, pathname, announce]
  );

  const handleSaveCurrentView = useCallback(() => {
    const name = trimName(saveValue);
    if (!name) return;

    const nextViews = [...views];
    const duplicateIndex = nextViews.findIndex(
      (view) => normalizeParams(view.params) === normalizedCurrent
    );
    const newView: SavedView = { id: createViewId(), name, params: currentParams };

    if (duplicateIndex >= 0) {
      nextViews.splice(duplicateIndex, 1);
    }
    nextViews.unshift(newView);
    persistViews(nextViews.slice(0, MAX_VIEWS));

    setSaveOpen(false);
    setSaveValue("");
    announce(`Saved view ${name}`);
  }, [saveValue, views, normalizedCurrent, currentParams, persistViews, announce]);

  const handleRename = useCallback(
    (view: SavedView) => {
      const name = trimName(renameValue);
      if (!name) return;
      persistViews(views.map((v) => (v.id === view.id ? { ...v, name } : v)));
      setRenamingId(null);
      setRenameValue("");
      announce(`Renamed saved view to ${name}`);
    },
    [renameValue, views, persistViews, announce]
  );

  const handleDelete = useCallback(
    (view: SavedView) => {
      persistViews(views.filter((v) => v.id !== view.id));
      if (menuOpenId === view.id) setMenuOpenId(null);
      setDeletePendingId(null);
      announce(`Removed saved view ${view.name}`);
    },
    [views, persistViews, menuOpenId, announce]
  );

  const openSaveForm = useCallback(() => {
    setSaveValue("");
    setSaveOpen(true);
  }, []);

  const handleMenuKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>, viewId: string) => {
      if (event.key === "Escape") {
        setMenuOpenId(null);
        setRenamingId(null);
        setDeletePendingId(null);
      }
      if (event.key === "Enter" && renamingId === viewId) {
        const view = views.find((v) => v.id === viewId);
        if (view) handleRename(view);
      }
    },
    [renamingId, views, handleRename]
  );

  return (
    <section aria-label="Saved views" className="space-y-2">
      <LiveRegion ariaLive="polite">{announcement}</LiveRegion>

      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-zinc-400">
          Saved views
        </span>
        <span
          className="text-xs text-zinc-500"
          aria-label={`${views.length} saved views`}
        >
          ({views.length})
        </span>
      </div>

      {!persisted ? (
        <div
          aria-hidden="true"
          className="flex h-8 items-center gap-2"
        >
          <div className="h-7 w-24 animate-pulse rounded-full bg-zinc-800" />
          <div className="h-7 w-24 animate-pulse rounded-full bg-zinc-800" />
        </div>
      ) : views.length === 0 ? (
        <p className="text-sm text-zinc-500">
          No saved views yet. Configure the grid, then save it for later.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {views.map((view) => {
            const active = view.id === activeViewId;
            const menuOpen = menuOpenId === view.id;
            const renaming = renamingId === view.id;
            const deletePending = deletePendingId === view.id;
            return (
              <li
                key={view.id}
                className={clsx(
                  "inline-flex items-center gap-1 rounded-full border py-1 pl-3 pr-1 text-sm transition-colors",
                  active
                    ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-300"
                    : "border-zinc-700 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600"
                )}
              >
                {renaming ? (
                  <input
                    ref={renameInputRef}
                    aria-label={`Rename saved view ${view.name}`}
                    value={renameValue}
                    maxLength={MAX_NAME_LENGTH}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") handleRename(view);
                      if (event.key === "Escape") setRenamingId(null);
                    }}
                    onChange={(event) => setRenameValue(event.target.value)}
                    className="w-32 rounded bg-zinc-900 px-2 py-0.5 text-sm text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApplyView(view)}
                    aria-pressed={active}
                    className={clsx(
                      "rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                      active ? "text-cyan-300" : "text-zinc-300 hover:text-white"
                    )}
                  >
                    {view.name}
                  </button>
                )}

                <span className="relative">
                  <button
                    type="button"
                    aria-label={`More actions for saved view ${view.name}`}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                    onClick={() => {
                      setMenuOpenId(menuOpen ? null : view.id);
                      setRenamingId(null);
                      setRenameValue(view.name);
                      setDeletePendingId(null);
                    }}
                    className={clsx(
                      "inline-flex items-center justify-center rounded-full p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300",
                      "hover:bg-white/10"
                    )}
                  >
                    {menuOpen ? (
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    ) : (
                      <MoreHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                    )}
                  </button>

                  {menuOpen && (
                    <div
                      role="menu"
                      aria-label={`Actions for saved view ${view.name}`}
                      onKeyDown={(event) => handleMenuKeyDown(event, view.id)}
                      className={clsx(
                        "absolute right-0 top-8 z-20 min-w-36 rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-xl",
                        "focus-within:ring-2 focus-within:ring-cyan-300"
                      )}
                    >
                      {renaming ? null : (
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setRenamingId(view.id);
                            setRenameValue(view.name);
                          }}
                          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-zinc-200 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          Rename
                        </button>
                      )}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          if (deletePending) {
                            handleDelete(view);
                          } else {
                            setDeletePendingId(view.id);
                          }
                        }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm text-red-400 hover:bg-red-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {deletePending ? "Confirm delete?" : "Delete"}
                      </button>
                    </div>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {saveOpen ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleSaveCurrentView();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <label htmlFor="saved-view-name" className="sr-only">
            Saved view name
          </label>
          <input
            ref={saveInputRef}
            id="saved-view-name"
            type="text"
            placeholder="Name this view (e.g. Cheap soonest)"
            maxLength={MAX_NAME_LENGTH}
            value={saveValue}
            onChange={(event) => setSaveValue(event.target.value)}
            className="w-56 rounded-lg border border-zinc-700 bg-zinc-900/70 px-3 py-1.5 text-sm text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          />
          <button
            type="submit"
            className="rounded-lg bg-cyan-500/15 px-3 py-1.5 text-sm font-medium text-cyan-300 border border-cyan-500/30 transition-colors hover:bg-cyan-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Save view
          </button>
          <button
            type="button"
            onClick={() => setSaveOpen(false)}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={openSaveForm}
          aria-expanded={saveOpen}
          className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-zinc-700 px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
          Save current view
        </button>
      )}
    </section>
  );
}