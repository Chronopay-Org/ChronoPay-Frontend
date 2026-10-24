import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import DashboardClient from "./dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: NO_INDEX,
};

export default function DashboardPage() {
  return <DashboardClient />;
}
