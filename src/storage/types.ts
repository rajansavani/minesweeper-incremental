import type { Currencies, UpgradeState } from "../meta/types";

// current save version: increment this whenever the save schema changes
// add a corresponding migration function in migrations.ts
export const CURRENT_SAVE_VERSION = 3;

// the key used in localStorage
export const SAVE_KEY = "minesweeper-incremental-save";

// save file schema
// don't save the board, just meta-progression state like currencies and upgrades
export interface SaveFile {
  version: number; // schema version for migration support
  timestamp: number;
  currencies: Currencies;
  upgrades: UpgradeState;
  prestigeCount: number;
  level: number;
  xp: number;
  settings: {
    showTimer: boolean;
    showMineCount: boolean;
    enableTooltips: boolean;
    chordMode: "left-click" | "middle-click" | "both-click";
    spacebarBehavior: "off" | "flag" | "chord" | "flag-or-chord";
  };
}

// migration function takes an old save file and transforms it to the new schema
export type Migration = (save: Record<string, unknown>) => Record<string, unknown>;
