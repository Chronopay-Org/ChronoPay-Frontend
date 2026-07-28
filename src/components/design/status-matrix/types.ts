export type Status = "operational" | "degraded" | "outage" | "unknown";

export type Region = {
  id: string;
  label: string;
};

export type Component = {
  id: string;
  label: string;
};

export type CellData = {
  status: Status;
  lastChecked: string;
  message: string;
};

export type StatusMatrixConfig = {
  components: Component[];
  regions: Region[];
  cells: Record<string, Record<string, CellData>>;
};

export const STATUS_ICON_LABELS: Record<Status, string> = {
  operational: "Operational",
  degraded: "Degraded Performance",
  outage: "Service Outage",
  unknown: "Unknown",
};
