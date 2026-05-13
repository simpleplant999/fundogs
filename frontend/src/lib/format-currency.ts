const phpFormatter = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  currencyDisplay: "narrowSymbol",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Whole-peso amounts with ₱ (never $). */
export function formatPhp(amount: number): string {
  let s = phpFormatter.format(amount);
  s = s.replace(/\$/g, "₱");
  s = s.replace(/^PHP\s*/i, "₱");
  return s;
}
