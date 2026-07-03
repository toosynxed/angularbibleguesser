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

export function normalizeBitMarket(bitMarket: number | string | null | undefined): number {
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

// --- Deterministic daily item selection ---
//
// Goal: the 5 marketplace item *slots* shown to a given user stay fixed for the
// whole day, without needing a Firestore write per-user per-day. This is achieved
// by seeding a PRNG from (date + uid + a small shared "seed" value) so the same
// inputs always produce the same output. Admins can force a same-day reshuffle for
// everyone by changing the shared seed (see MarketplaceDailyService.generateNewMarketSeed).
//
// Selection is intentionally made from the FULL item catalog (MARKETPLACE_ITEM_BITS),
// not from the user's currently-unpurchased bits. This keeps the 5 slots stable even
// after a purchase - a purchased item stays visible in its slot (shown as
// owned/disabled by the caller) rather than being swapped out for a different item.
// Purchase state should be checked separately per item via isItemPurchased().

// Simple, fast, deterministic string hash (FNV-1a, 32-bit).
function hashStringToUint32(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

// Deterministic PRNG (mulberry32). Given the same seed, always yields the same sequence.
function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Deterministically selects up to `count` unique item bit-values for a given user/day,
 * from the full item catalog (not filtered by purchase state - see comment above).
 *
 * Same (uid, dateStr, dailySeed) input will always produce the same output, so no
 * per-user Firestore write is required to "lock in" a user's daily item slots.
 */
export function selectDailyMarketItemIds(
  uid: string,
  dateStr: string,
  dailySeed: number,
  count = 5
): number[] {
  const pool = [...MARKETPLACE_ITEM_BITS];

  if (pool.length <= count) {
    return pool;
  }

  const seed = hashStringToUint32(`${dateStr}:${uid}:${dailySeed}`);
  const random = createSeededRandom(seed);

  const selected: number[] = [];
  while (selected.length < count && pool.length > 0) {
    const randomIndex = Math.floor(random() * pool.length);
    const [chosenBit] = pool.splice(randomIndex, 1);
    selected.push(chosenBit);
  }

  return selected;
}
