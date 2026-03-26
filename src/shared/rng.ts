// use mulberry32 for pseudo-random number generator
// let's us reproduce any board for testing and later for leaderboard verification

// converts a string seed into a 32-bit integer hash
// needed bc mulberry32 operates on a number (not a string)
function hashSeed(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    // bit shift left 5 = multiply by 32, then subtract original value and add the char code
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    // force to 32-bit integer
    hash |= 0;
  }
  return hash >>> 0; // convert to unsigned 32-bit
}

// mulberry32 PRNG implementation
// produces float in [0, 1) and is seedable
export function createRng(seed: string): () => number {
  let state = hashSeed(seed);

  // mulberry32 algorithm, magic constants chosen for good bit mixing
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
