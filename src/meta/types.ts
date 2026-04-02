// CURRENCIES
export interface Currencies {
  scrap: number; // primary currency, earned per-run
  lifetimeScrap: number; // total scrap ever earned (never resets, used for prestige calc)
  intel: number; // prestige currency, persists across resets
  totalIntelEarned: number; // total intel claimed via prestige
}

// UPGRATE DEFINITIONS
export interface UpgradeDefinition {
  id: string; // unique key
  name: string; // display name
  description: string; // description of the upgrade's effect, shown in UI
  maxLevel: number;
  baseCost: number;
  costScaling: number; // multiplier per level: cost = baseCost * costScaling^level
  effect: {
    type: string; // e.g. "scrap_multiplier", "reveal_radius", "cooldown_reduction"
    baseValue: number; // the value at level 1
    perLevel: number; // additional value per level beyond 1
  };
  currency: "scrap" | "intel"; // which currency to spend
  requiresPrestige?: number; // minimum prestige count to unlock
  requiredLevel?: number; // minimum player level to show this upgrade in the shop
  icon?: string; // optional art path for upgrade icon
}

// UPGRADE STATE
// tracks what the player owns
export interface UpgradeState {
  [upgradeId: string]: number; // maps upgrade id → current level (0 = not purchased)
}

// CD ABILITY
export interface CooldownAbility {
  id: string;
  name: string;
  description: string;
  cooldownMs: number; // milliseconds between uses
  lastUsedAt: number | null; // timestamp of last use, null if never used
}

// RUN STATS
// tracks for the current board
export interface RunStats {
  cellsRevealed: number;
  floodFillCells: number; // cells revealed via flood fill (separate for scrap calc)
  flagsPlaced: number;
  flagsCorrect: number; // validated after win
  startTimeMs: number;
  endTimeMs: number | null;
  scrapEarned: number;
  won: boolean | null; // null = still playing
}

// FULL META STATE
export interface MetaState {
  currencies: Currencies;
  upgrades: UpgradeState;
  cooldowns: CooldownAbility[];
  currentRun: RunStats;
  prestigeCount: number; // how many times the player has prestiged
  level: number; // player level
  xp: number; // current XP towards next level
  settings: {
    showTimer: boolean;
    showMineCount: boolean;
    enableTooltips: boolean;
    // "left-click": left-click a revealed number to chord
    // "middle-click": middle-click any cell to chord
    // "both-click": left+right simultaneously to chord
    chordMode: "left-click" | "middle-click" | "both-click";
    // "flag": spacebar always flags/unflags
    // "chord": spacebar always chords
    // "flag-or-chord": spacebar flags if hidden/flagged, chords if revealed number
    spacebarBehavior: "off" | "flag" | "chord" | "flag-or-chord";
  };
}

// DEFAULT STARTING STATE
export function createDefaultMetaState(): MetaState {
  return {
    currencies: {
      scrap: 0,
      lifetimeScrap: 0,
      intel: 0,
      totalIntelEarned: 0,
    },
    upgrades: {},
    cooldowns: [],
    currentRun: createDefaultRunStats(),
    prestigeCount: 0,
    level: 1,
    xp: 0,
    settings: {
      showTimer: true,
      showMineCount: true,
      enableTooltips: true,
      chordMode: "left-click" as const,
      spacebarBehavior: "flag" as const,
    },
  };
}

export function createDefaultRunStats(): RunStats {
  return {
    cellsRevealed: 0,
    floodFillCells: 0,
    flagsPlaced: 0,
    flagsCorrect: 0,
    startTimeMs: 0,
    endTimeMs: null,
    scrapEarned: 0,
    won: null,
  };
}
