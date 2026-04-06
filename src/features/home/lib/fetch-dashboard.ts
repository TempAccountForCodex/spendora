import type { DashboardPayload } from "@/features/expenses/types";
import { appApiFetch } from "@/lib/app-api-client";

export async function fetchDashboard() {
  return appApiFetch<DashboardPayload>("/api/dashboard");
}
