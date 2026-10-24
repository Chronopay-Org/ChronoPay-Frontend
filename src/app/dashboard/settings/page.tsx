import type { Metadata } from "next";
import { NO_INDEX } from "@/lib/seo";
import SettingsClient from "./settings-client";

export const metadata: Metadata = {
  title: "Settings",
  robots: NO_INDEX,
};

export default function SettingsPage() {
  return <SettingsClient />;
}
