export function calculateCascadingDiscount(basePrice: number, discountPercents: number[]): number {
  if (!discountPercents || discountPercents.length === 0) return basePrice;
  let currentPrice = basePrice;
  for (const discount of discountPercents) {
    currentPrice = currentPrice * (1 - discount / 100);
  }
  return currentPrice;
}

export function calculateEffectiveDiscountPercentage(basePrice: number, finalPrice: number): number {
  if (basePrice === 0) return 0;
  return ((basePrice - finalPrice) / basePrice) * 100;
}
