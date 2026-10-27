const LOCALE = 'es-US';

const currencyFormatters = new Map<string, Intl.NumberFormat>();
const decimalFormatter = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });
const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' });

/** 47.25 -> "$47.25" */
export function formatCurrency(amount: number, currency = 'USD'): string {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency });
    currencyFormatters.set(currency, formatter);
  }
  return formatter.format(amount);
}

/** 5.01 -> "5.01 kg" */
export function formatWeight(kg: number): string {
  return `${decimalFormatter.format(kg)} kg`;
}

/** 20 -> "20%" */
export function formatPercent(percent: number): string {
  return `${decimalFormatter.format(percent)}%`;
}

export function formatDateTime(isoDate: string): string {
  return dateTimeFormatter.format(new Date(isoDate));
}
