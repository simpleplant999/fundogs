const CARD_NUMBER_MAX_DIGITS = 16;

export function digitsFromCardInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, CARD_NUMBER_MAX_DIGITS);
}

/** Groups card digits as `1111 1111 1111 1111` (up to 16 digits). */
export function formatCardNumberDisplay(value: string): string {
  const digits = digitsFromCardInput(value);
  if (!digits) return '';
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
