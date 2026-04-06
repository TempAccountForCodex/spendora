import {
  defaultCurrencyCode,
  isSupportedCurrencyCode,
  supportedCurrencies,
  type SupportedCurrencyCode,
} from "@/constants/currencies";

export function hasSelectedCurrency(currency: string | null | undefined) {
  return isSupportedCurrencyCode(currency);
}

export function getUserCurrencyCode(
  currency: string | null | undefined,
): SupportedCurrencyCode {
  if (hasSelectedCurrency(currency)) {
    return currency;
  }

  return defaultCurrencyCode;
}

export function getCurrencyLabel(currency: string | null | undefined) {
  const code = getUserCurrencyCode(currency);

  return supportedCurrencies.find((item) => item.code === code)?.label ?? code;
}

export function formatCurrency(amount: number, currency: string | null | undefined) {
  const code = getUserCurrencyCode(currency);

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}
