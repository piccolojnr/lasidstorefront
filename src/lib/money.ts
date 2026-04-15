/**
 * All monetary values from the API are in minor units (pesewas).
 * 1000 = GHS 10.00
 *
 * Always use these helpers for display. Never divide inline.
 */

const DEFAULT_CURRENCY = 'GHS';
const DEFAULT_LOCALE = 'en-GH';

export function formatMoney(
  minorUnits: number,
  currency: string = DEFAULT_CURRENCY,
  locale: string = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(minorUnits / 100);
}

/** Returns just the numeric string without the currency symbol, e.g. "10.00" */
export function formatMoneyValue(minorUnits: number): string {
  return (minorUnits / 100).toFixed(2);
}

/** Converts a display value (e.g. 10.00) back to minor units. */
export function toMinorUnits(displayValue: number): number {
  return Math.round(displayValue * 100);
}
