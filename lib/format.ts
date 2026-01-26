export function formatPrice(value: string, maxDigits = 6): string {
  const cleanValue = value.replace(/[^\d]/g, "");
  if (!cleanValue) return "";
  if (cleanValue.length > maxDigits) {
    return formatPrice(cleanValue.slice(0, maxDigits), maxDigits);
  }
  return cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function cleanPriceValue(formattedValue: string): string {
  return formattedValue.replace(/\./g, "");
}

export function formatCurrency(amount: number): string {
  return `$${formatPrice(amount.toString())}`;
}
