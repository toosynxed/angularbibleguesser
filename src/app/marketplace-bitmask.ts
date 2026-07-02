export const MARKETPLACE_ITEM_BITS = [
  1,
  2,
  4,
  8,
  16,
  32,
  64,
  128,
  256,
  512,
  1024,
  2048,
  4096,
  8192,
  16384,
  32768,
  65536
] as const;

export const INITIAL_BITMARKET_MASK = MARKETPLACE_ITEM_BITS.reduce((mask, bit) => mask | bit, 0);

function normalizeBitMarket(bitMarket: number | string | null | undefined): number {
  const numericBitMarket = Number(bitMarket);
  return Number.isFinite(numericBitMarket) ? numericBitMarket : INITIAL_BITMARKET_MASK;
}

export function isItemUnlocked(bitMarket: number | string | null | undefined, itemBit: number): boolean {
  const bitmask = normalizeBitMarket(bitMarket);
  return (bitmask & itemBit) === 0;
}

export function isItemPurchased(bitMarket: number | string | null | undefined, itemBit: number): boolean {
  return isItemUnlocked(bitMarket, itemBit);
}

export function removeItemFromMarket(bitMarket: number | string | null | undefined, itemBit: number): number {
  const bitmask = normalizeBitMarket(bitMarket);
  return bitmask & ~itemBit;
}
