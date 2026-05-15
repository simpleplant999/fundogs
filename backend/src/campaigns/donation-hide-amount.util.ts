/** Stripe / PayMongo metadata values (string-only). */
export function hideAmountPublicMetadataValue(hide: boolean | undefined): string {
  return hide ? '1' : '0';
}

export function parseHideAmountPublicMetadata(v: string | undefined): boolean {
  const s = (v ?? '').trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
}
