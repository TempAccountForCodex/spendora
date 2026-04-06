export const defaultCurrencyCode = "USD";

export const supportedCurrencies = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "EUR" },
  { code: "GBP", label: "British Pound", symbol: "GBP" },
  { code: "PKR", label: "Pakistani Rupee", symbol: "Rs" },
  // { code: "INR", label: "Indian Rupee", symbol: "Rs" },
  { code: "AED", label: "UAE Dirham", symbol: "AED" },
  { code: "SAR", label: "Saudi Riyal", symbol: "SAR" },
] as const;

export type SupportedCurrencyCode = (typeof supportedCurrencies)[number]["code"];

export function isSupportedCurrencyCode(
  value: string | null | undefined,
): value is SupportedCurrencyCode {
  return supportedCurrencies.some((currency) => currency.code === value);
}
