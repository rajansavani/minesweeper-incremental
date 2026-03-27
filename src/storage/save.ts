import type { Currencies, UpgradeState } from "../meta/types";
import type { SaveFile } from "./types";
import { CURRENT_SAVE_VERSION, SAVE_KEY } from "./types";

interface SaveableState {
  currencies: Currencies;
  upgrades: UpgradeState;
  prestigeCount: number;
  level: number;
  xp: number;
  settings?: {
    showTimer: boolean;
    showMineCount: boolean;
    enableTooltips: boolean;
  };
}

// serializes the current game state to localStorage
// only saves meta-progression (not the board or current run)
// returns true if save succeeded, false if it failed
export function saveGame(state: SaveableState): boolean {
  try {
    const saveFile: SaveFile = {
      version: CURRENT_SAVE_VERSION,
      timestamp: Date.now(),
      currencies: state.currencies,
      upgrades: state.upgrades,
      prestigeCount: state.prestigeCount,
      level: state.level,
      xp: state.xp,
      settings: state.settings ?? {
        showTimer: true,
        showMineCount: true,
        enableTooltips: true,
      },
    };

    const json = JSON.stringify(saveFile);
    localStorage.setItem(SAVE_KEY, json);
    return true;
  } catch (err) {
    // localStorage can fail if storage is full or in private browsing mode
    console.error("failed to save game:", err);
    return false;
  }
}

// completely wipes the save from localStorage
// used by the hard reset feature in settings
export function deleteSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (err) {
    console.error("failed to delete save:", err);
  }
}
