export function formatPrice(amount: number, currencyCode: string) {
  try {
    const currency = (currencyCode || "Rs").toUpperCase();
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency === "NPR" ? "Rs" : currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currencyCode || "Rs"}`;
  }
}

