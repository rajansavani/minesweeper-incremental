// players earn XP from completing boards
// leveling up unlocks new upgrades and features

// XP earned per board = 20% of scrap earned that run
export function computeXpGain(scrapEarned: number): number {
  return Math.floor(scrapEarned * 0.2);
}

// XP required to reach the next level (uses exponential scaling of 1.5x per level)
export function xpToNextLevel(currentLevel: number): number {
  return Math.floor(17 * 1.5 ** currentLevel);
}

// processes XP gain and handles level ups
export function processXpGain(
  currentLevel: number,
  currentXp: number,
  xpGained: number,
): { level: number; xp: number; levelsGained: number } {
  let level = currentLevel;
  let xp = currentXp + xpGained;
  let levelsGained = 0;

  // keep leveling up while we have enough XP
  let threshold = xpToNextLevel(level);
  while (xp >= threshold) {
    xp -= threshold;
    level++;
    levelsGained++;
    threshold = xpToNextLevel(level);
  }

  return { level, xp, levelsGained };
}
