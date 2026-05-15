export function humanizePaymongoErrorDetail(detail: string): string {
  const lower = detail.trim().toLowerCase();

  if (lower.includes('card_number') && lower.includes('invalid')) {
    return 'Enter a valid 16-digit card number.';
  }
  if (lower.includes('exp_month') && lower.includes('invalid')) {
    return 'Enter a valid expiry month (01–12).';
  }
  if (lower.includes('exp_year') && lower.includes('invalid')) {
    return 'Enter a valid expiry year.';
  }
  if (lower.includes('cvc') && lower.includes('invalid')) {
    return 'Enter a valid security code (CVC).';
  }

  return detail.trim();
}

export function formatPaymongoClientErrors(json: unknown): string {
  const err = json as { errors?: Array<{ detail?: string }> };
  const parts = err.errors
    ?.map((e) =>
      typeof e.detail === 'string' && e.detail.length > 0 ? humanizePaymongoErrorDetail(e.detail) : null,
    )
    .filter((d): d is string => Boolean(d));

  if (parts?.length) return [...new Set(parts)].join(' — ');
  return 'We could not process your card payment. Please check your details and try again.';
}
