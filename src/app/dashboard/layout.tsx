import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";

/** Every dashboard route is authenticated, so none of it should be indexed. */
export const metadata: Metadata = {
  robots: NO_INDEX,
};

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
