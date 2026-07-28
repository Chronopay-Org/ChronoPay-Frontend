import type { StatusMatrixConfig } from "./types";

export const statusMatrixData: StatusMatrixConfig = {
  components: [
    { id: "api", label: "API" },
    { id: "auth", label: "Authentication" },
    { id: "payments", label: "Payments" },
    { id: "webapp", label: "Web App" },
    { id: "database", label: "Database" },
  ],
  regions: [
    { id: "us-east", label: "US-East" },
    { id: "eu-west", label: "EU-West" },
    { id: "apac", label: "APAC" },
    { id: "us-west", label: "US-West" },
  ],
  cells: {
    api: {
      "us-east": { status: "operational", lastChecked: "2 min ago", message: "All systems normal" },
      "eu-west": { status: "operational", lastChecked: "2 min ago", message: "All systems normal" },
      apac: { status: "degraded", lastChecked: "5 min ago", message: "Elevated latency detected" },
      "us-west": { status: "operational", lastChecked: "2 min ago", message: "All systems normal" },
    },
    auth: {
      "us-east": { status: "operational", lastChecked: "1 min ago", message: "All systems normal" },
      "eu-west": { status: "outage", lastChecked: "10 min ago", message: "Service unavailable in region" },
      apac: { status: "operational", lastChecked: "1 min ago", message: "All systems normal" },
      "us-west": { status: "operational", lastChecked: "1 min ago", message: "All systems normal" },
    },
    payments: {
      "us-east": { status: "degraded", lastChecked: "3 min ago", message: "Intermittent failures reported" },
      "eu-west": { status: "operational", lastChecked: "3 min ago", message: "All systems normal" },
      apac: { status: "operational", lastChecked: "3 min ago", message: "All systems normal" },
      "us-west": { status: "unknown", lastChecked: "15 min ago", message: "No data from monitoring" },
    },
    webapp: {
      "us-east": { status: "operational", lastChecked: "2 min ago", message: "All systems normal" },
      "eu-west": { status: "operational", lastChecked: "2 min ago", message: "All systems normal" },
      apac: { status: "operational", lastChecked: "2 min ago", message: "All systems normal" },
      "us-west": { status: "operational", lastChecked: "2 min ago", message: "All systems normal" },
    },
    database: {
      "us-east": { status: "operational", lastChecked: "30 sec ago", message: "All systems normal" },
      "eu-west": { status: "operational", lastChecked: "30 sec ago", message: "All systems normal" },
      apac: { status: "operational", lastChecked: "30 sec ago", message: "All systems normal" },
      "us-west": { status: "degraded", lastChecked: "4 min ago", message: "Replication lag detected" },
    },
  },
};
