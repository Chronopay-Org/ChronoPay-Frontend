import type { Metadata } from "next";
import AdminUsersClient from "./admin-users-client";

export const metadata: Metadata = {
  title: "User Management",
  description: "View, sort, and manage platform users.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
