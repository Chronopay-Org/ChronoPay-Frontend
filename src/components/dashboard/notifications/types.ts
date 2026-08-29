export type NotificationTone = "info" | "success" | "warning" | "error";

export type NotificationItem = {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  read: boolean;
  tone: NotificationTone;
};
