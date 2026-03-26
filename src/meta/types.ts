// CURRENCIES
export interface Currencies {
  scrap: number; // primary currency, earned per-run
  lifetimeScrap: number; // total scrap ever earned (never resets, used for prestige calc)
  intel: number; // prestige currency, persists across resets
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
  settings: {
    showTimer: boolean;
    showMineCount: boolean;
    enableToolTips: boolean;
  };
}
