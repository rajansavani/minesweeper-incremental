import type { Board, EngineEvent } from "../engine/types";
import type { UpgradeState } from "./types";

// read an upgrade level safely
function getLevel(upgrades: UpgradeState, id: string): number {
  return upgrades[id] ?? 0;
}

// upgrade effect helpers
// read upgrade levels and compute the bonus values

// "scrap_per_reveal" upgrade: +1 bonus scrap per cell revealed per level
export function revealBonus(upgrades: UpgradeState): number {
  return getLevel(upgrades, "scrap_per_reveal");
}

// "flood_bonus" upgrade: + 0.5 bonus scrap per flood-fill cell per level
export function floodFillBonus(upgrades: UpgradeState): number {
  return getLevel(upgrades, "flood_bonus") * 0.5;
}

// "win_bonus" upgrade: +20% win bonus per level (multiplier)
export function winBonusMultiplier(upgrades: UpgradeState): number {
  return 1 + getLevel(upgrades, "win_bonus") * 0.2;
}

// "flag_bonus" upgrade: +2 bonus scrap per validated flag per level
export function flagBonusPerFlag(upgrades: UpgradeState): number {
  return getLevel(upgrades, "flag_bonus") * 2;
}

// "scrap_multi" upgrade: x1.25 global multiplier per level
export function globalMultiplier(upgrades: UpgradeState): number {
  const level = getLevel(upgrades, "scrap_multi");
  return 1.25 ** level;
}

// "intel_scrap_multi" upgrade: +10% scrap per level
export function intelScrapMultiplier(upgrades: UpgradeState): number {
  const level = getLevel(upgrades, "intel_scrap_multi");
  return 1 + level * 0.1;
}

// "board_size" upgrade: bigger boards give proportionally more scrap
// calculated as board area / beginner area (a 15x15 board gives 225/81 = ~2.78x scrap)
export function boardSizeMultiplier(board?: Board): number {
  if (!board) return 1;
  const beginnerArea = 9 * 9; // 81 cells
  return (board.rows * board.cols) / beginnerArea;
}

// "loss_shield" upgrade: keep a % of what the win bonus would have been
export function lossShieldPercent(upgrades: UpgradeState): number {
  return getLevel(upgrades, "loss_shield") * 0.25;
}

// main scrap computation

// computes how much scrap a single engine event is worth
// returns the scrap amount (always >= 0, rounded down to integer)
// the store calls this for every event emitted by the engine
export function computeScrapReward(
  event: EngineEvent,
  upgrades: UpgradeState,
  board?: Board,
): number {
  const gMulti =
    globalMultiplier(upgrades) * intelScrapMultiplier(upgrades) * boardSizeMultiplier(board);

  switch (event.type) {
    case "CELL_REVEALED": {
      // base 1 scrap + upgrade bonus, scaled by global multiplier
      const base = 1 + revealBonus(upgrades);
      return Math.floor(base * gMulti);
    }

    case "FLOOD_FILL": {
      // base 0 scrap for flood fills (bc it's kinda broken)
      // can later get a "Chain Reaction" upgrade to give a bonus
      const perCell = floodFillBonus(upgrades);
      if (perCell <= 0) return 0;
      return Math.floor(event.cellsRevealed * perCell * gMulti);
    }

    case "BOARD_WON": {
      // win bonus: totalMines * 5, scaled by win upgrade + global multiplier
      // validated flag bonus is added on top (only flags on actual mines count)
      const mineCount = board?.totalMines ?? 0;
      const winBase = mineCount * 5 * winBonusMultiplier(upgrades);

      const correctFlags = countCorrectFlags(board);
      const flagReward = correctFlags * (3 + flagBonusPerFlag(upgrades));

      return Math.floor((winBase + flagReward) * gMulti);
    }

    case "BOARD_LOST": {
      // half credit for correct flags on loss
      const shieldPct = lossShieldPercent(upgrades);
      const mineCount = board?.totalMines ?? 0;
      const wouldBeWinBonus = mineCount * 5 * winBonusMultiplier(upgrades);
      const shieldedBonus = wouldBeWinBonus * shieldPct;

      const correctFlags = countCorrectFlags(board);
      const flagReward = correctFlags * (3 + flagBonusPerFlag(upgrades));
      const halfFlagReward = flagReward * 0.5;

      return Math.floor((shieldedBonus + halfFlagReward) * gMulti);
    }

    // no scrap for these events
    case "FLAG_PLACED":
    case "FLAG_REMOVED":
    case "ABILITY_USED":
      return 0;

    default:
      return 0;
  }
}

// helper to count how many flags are correctly placed on mines at game end
export function countCorrectFlags(board?: Board): number {
  if (!board) return 0;
  let count = 0;
  for (const row of board.cells) {
    for (const cell of row) {
      if (cell.state === "flagged" && cell.isMine) {
        count++;
      }
    }
  }
  return count;
}
