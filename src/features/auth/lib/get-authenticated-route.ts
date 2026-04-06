import { hasSelectedCurrency } from "@/lib/currency";

type AuthenticatedUser = {
  currency?: string | null;
} | null;

export function getAuthenticatedRoute(user: AuthenticatedUser) {
  return hasSelectedCurrency(user?.currency) ? "/(tabs)/home" : "/select-currency";
}
