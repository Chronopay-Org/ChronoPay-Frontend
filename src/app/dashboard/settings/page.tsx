import { DashboardShell } from "@/app/components/dashboard-shell";
import SettingsPage from "@/components/dashboard/settings/page";

export default function SettingsRoute() {
  return (
    <DashboardShell>
      <SettingsPage />
    </DashboardShell>
  );
}
