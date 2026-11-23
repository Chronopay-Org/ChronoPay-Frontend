"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import type { ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStoredState } from "@/hooks/use-stored-state";
import { notifications as seedNotifications } from "./mock-data";
import type { NotificationItem } from "./types";

/** localStorage key for the persisted notification list. */
export const NOTIFICATIONS_STORAGE_KEY = "chronopay:notifications";

export type NotificationsState = {
  items: NotificationItem[];
  /** Most recently dismissed batch, kept so `undo` can restore it. */
  dismissed: { item: NotificationItem; index: number }[];
  /** True once the persisted list has been loaded into the reducer. */
  hydrated: boolean;
};

export type NotificationsAction =
  | { type: "add"; notification: NotificationItem }
  | { type: "markRead"; id: string }
  | { type: "markAllRead" }
  | { type: "dismiss"; ids: string[] }
  | { type: "undo" }
  | { type: "hydrate"; items: NotificationItem[] };

export function notificationsReducer(
  state: NotificationsState,
  action: NotificationsAction,
): NotificationsState {
  switch (action.type) {
    case "add": {
      const existingIndex = state.items.findIndex(
        (item) => item.id === action.notification.id,
      );
      if (existingIndex !== -1) {
        const items = state.items.slice();
        items[existingIndex] = action.notification;
        return { ...state, items };
      }
      return { ...state, items: [action.notification, ...state.items] };
    }
    case "markRead":
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.id ? { ...item, read: true } : item,
        ),
      };
    case "markAllRead":
      return {
        ...state,
        items: state.items.map((item) => ({ ...item, read: true })),
      };
    case "dismiss": {
      const toDismiss = new Set(action.ids);
      const dismissed: { item: NotificationItem; index: number }[] = [];
      const items = state.items.filter((item, index) => {
        if (toDismiss.has(item.id)) {
          dismissed.push({ item, index });
          return false;
        }
        return true;
      });
      return { ...state, items, dismissed };
    }
    case "undo": {
      if (state.dismissed.length === 0) return state;
      const items = state.items.slice();
      for (const { item, index } of state.dismissed) {
        items.splice(Math.min(index, items.length), 0, item);
      }
      return { ...state, items, dismissed: [] };
    }
    case "hydrate":
      return { items: action.items, dismissed: [], hydrated: true };
    default:
      return state;
  }
}

export interface NotificationsContextValue {
  items: NotificationItem[];
  unreadCount: number;
  canUndo: boolean;
  add: (notification: NotificationItem) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  dismiss: (ids: string[]) => void;
  undo: () => void;
}

export const NotificationsContext =
  createContext<NotificationsContextValue | null>(null);

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      "useNotifications must be used inside <NotificationsProvider>",
    );
  }
  return ctx;
}

export function NotificationsProvider({
  children,
  initialItems = seedNotifications,
}: {
  children: ReactNode;
  initialItems?: NotificationItem[];
}) {
  const { toast } = useToast();
  const {
    value: storedItems,
    setValue: setStoredItems,
    hydrated,
  } = useStoredState<NotificationItem[]>(NOTIFICATIONS_STORAGE_KEY, {
    defaultValue: initialItems,
  });
  const [state, dispatch] = useReducer(notificationsReducer, {
    items: initialItems,
    dismissed: [],
    hydrated: false,
  });
  const hydratedRef = useRef(false);

  // Once storage resolves on the client, replace the seed list with the
  // persisted one. Runs once; the first render stays on the seed so SSR
  // and hydration produce identical markup.
  useEffect(() => {
    if (hydrated && !hydratedRef.current) {
      hydratedRef.current = true;
      dispatch({ type: "hydrate", items: storedItems });
    }
  }, [hydrated, storedItems]);

  // Persist every change once the stored list has been loaded. The
  // equality check keeps this from writing the seed over the stored list.
  useEffect(() => {
    if (!hydrated || !state.hydrated) return;
    if (JSON.stringify(state.items) === JSON.stringify(storedItems)) return;
    setStoredItems(state.items);
  }, [state, hydrated, storedItems, setStoredItems]);

  const add = useCallback(
    (notification: NotificationItem) => {
      dispatch({ type: "add", notification });
      if (notification.tone === "error") {
        toast({
          variant: "critical",
          title: notification.title,
          description: notification.description,
        });
      }
    },
    [toast],
  );
  const markRead = useCallback(
    (id: string) => dispatch({ type: "markRead", id }),
    [],
  );
  const markAllRead = useCallback(
    () => dispatch({ type: "markAllRead" }),
    [],
  );
  const dismiss = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      dispatch({ type: "dismiss", ids });
      toast({
        variant: "info",
        title: `${ids.length} notification${ids.length === 1 ? "" : "s"} dismissed`,
        onUndo: () => dispatch({ type: "undo" }),
      });
    },
    [toast],
  );
  const undo = useCallback(() => dispatch({ type: "undo" }), []);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      items: state.items,
      unreadCount: state.items.filter((item) => !item.read).length,
      canUndo: state.dismissed.length > 0,
      add,
      markRead,
      markAllRead,
      dismiss,
      undo,
    }),
    [state, add, markRead, markAllRead, dismiss, undo],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}
