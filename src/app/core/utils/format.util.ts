const EUR = '€';

/** Formats a mock price the same way the original layout did (e.g. €285). */
export function formatPrice(value: number): string {
  return `${EUR}${value}`;
}
