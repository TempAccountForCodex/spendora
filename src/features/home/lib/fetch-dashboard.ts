import { fetchDashboardFromTransactions } from "@/features/expenses/lib/transactions-data";

export async function fetchDashboard() {
  return fetchDashboardFromTransactions();
}
