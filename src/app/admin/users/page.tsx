import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import AdminUsersClient from "./admin-users-client";

export const metadata: Metadata = {
  title: "User management",
  robots: NO_INDEX,
};

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
