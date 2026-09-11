import type { Metadata } from "next";
import { MaintenanceView } from "@/components/views/maintenance";

export const metadata: Metadata = { title: "Maintenance" };

export default function MaintenancePage() {
  return <MaintenanceView />;
}
