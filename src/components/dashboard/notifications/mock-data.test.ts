import { describe, it, expect } from "vitest";
import { notifications } from "./mock-data";
import type { NotificationItem, NotificationTone } from "./types";

describe("notifications mock data", () => {
  it("should be an array", () => {
    expect(Array.isArray(notifications)).toBe(true);
    expect(notifications.length).toBeGreaterThan(0);
  });

  it("should contain items with the correct structure and types", () => {
    notifications.forEach((notification) => {
      expect(notification).toHaveProperty("id");
      expect(typeof notification.id).toBe("string");

      expect(notification).toHaveProperty("title");
      expect(typeof notification.title).toBe("string");

      if ("description" in notification) {
        expect(typeof notification.description).toBe("string");
      }

      expect(notification).toHaveProperty("timestamp");
      expect(typeof notification.timestamp).toBe("string");

      expect(notification).toHaveProperty("read");
      expect(typeof notification.read).toBe("boolean");

      expect(notification).toHaveProperty("tone");
      expect(typeof notification.tone).toBe("string");
    });
  });

  it("should contain valid notification tones", () => {
    const validTones: NotificationTone[] = ["info", "success", "warning", "error"];
    
    notifications.forEach((notification) => {
      expect(validTones).toContain(notification.tone);
    });
  });

  it("should have unique IDs", () => {
    const ids = notifications.map((n) => n.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it("should have both read and unread notifications to represent state transitions", () => {
    const hasRead = notifications.some((n) => n.read === true);
    const hasUnread = notifications.some((n) => n.read === false);
    
    expect(hasRead).toBe(true);
    expect(hasUnread).toBe(true);
  });
});
