import type { Metadata } from "next";
import StatusClient from "./status-client";

export const metadata: Metadata = {
  title: "System Status",
  description:
    "ChronoPay system health — marketplace, escrow, and Stellar network uptime and recent incidents.",
};

export default function StatusPage() {
  return <StatusClient />;
}
