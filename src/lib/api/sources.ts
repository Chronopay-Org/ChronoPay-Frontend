import type { AdminUser } from "@/components/dashboard/admin-user-types";
import { SAMPLE_ADMIN_USERS } from "@/components/dashboard/admin-user-data";
import { buildCatalogue, type MarketplaceListing } from "@/app/marketplace/catalogue";
import { notifications } from "@/components/dashboard/notifications/mock-data";
import type { NotificationItem } from "@/components/dashboard/notifications/types";
import { request, type RequestOptions } from "./client";

export interface ListingsSource {
  list(options?: Pick<RequestOptions, "signal">): Promise<MarketplaceListing[]>;
}

export interface UsersSource {
  list(options?: Pick<RequestOptions, "signal">): Promise<AdminUser[]>;
}

export interface NotificationsSource {
  list(options?: Pick<RequestOptions, "signal">): Promise<NotificationItem[]>;
}

export interface ApiSources {
  listings: ListingsSource;
  users: UsersSource;
  notifications: NotificationsSource;
}

export const mockSources: ApiSources = {
  listings: {
    async list() {
      return buildCatalogue();
    },
  },
  users: {
    async list() {
      return SAMPLE_ADMIN_USERS;
    },
  },
  notifications: {
    async list() {
      return notifications;
    },
  },
};

export const fetchSources: ApiSources = {
  listings: {
    list: (options) => request<MarketplaceListing[]>("/listings", options),
  },
  users: {
    list: (options) => request<AdminUser[]>("/users", options),
  },
  notifications: {
    list: (options) => request<NotificationItem[]>("/notifications", options),
  },
};
