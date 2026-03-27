import { describe, expect, it } from "vitest";
import { createBoard, placeMines } from "../../engine/board";
import {
  computeScrapReward,
  countCorrectFlags,
  floodFillBonus,
  globalMultiplier,
  revealBonus,
  winBonusMultiplier,
} from "../scrap";
import type { UpgradeState } from "../types";

const NO_UPGRADES: UpgradeState = {};

function makeBoard(seed = "scrap-test") {
  return placeMines(createBoard(9, 9, 10, seed), 4, 4);
}

// helper: flag N mines on a board
function flagMines(board: ReturnType<typeof makeBoard>, count: number) {
  const cells = board.cells.map((row) => row.map((cell) => ({ ...cell })));
  let flagged = 0;
  for (const row of cells) {
    for (const cell of row) {
      if (cell.isMine && flagged < count) {
        cell.state = "flagged";
        flagged++;
      }
    }
  }
  return { ...board, cells, flaggedCount: flagged };
}

describe("computeScrapReward", () => {
  // CELL REVEALED
  it("CELL_REVEALED gives 1 base scrap with no upgrades", () => {
    const reward = computeScrapReward(
      { type: "CELL_REVEALED", row: 0, col: 0, adjacentMines: 3 },
      NO_UPGRADES,
    );
    expect(reward).toBe(1);
  });

  it("CELL_REVEALED scales with scrap_per_reveal upgrade", () => {
    const upgrades: UpgradeState = { scrap_per_reveal: 3 };
    const reward = computeScrapReward(
      { type: "CELL_REVEALED", row: 0, col: 0, adjacentMines: 1 },
      upgrades,
    );
    expect(reward).toBe(4);
  });

  // FLOOD FILL
  it("FLOOD_FILL gives 0 scrap with no upgrades", () => {
    const reward = computeScrapReward({ type: "FLOOD_FILL", cellsRevealed: 10 }, NO_UPGRADES);
    expect(reward).toBe(0);
  });

  // -- BOARD_WON --
  it("BOARD_WON gives mine-based bonus with no upgrades", () => {
    const board = makeBoard();
    const reward = computeScrapReward(
      { type: "BOARD_WON", revealedCount: 71, flaggedCount: 0, timeMs: 5000 },
      NO_UPGRADES,
      board,
    );
    expect(reward).toBe(50);
  });

  it("BOARD_WON includes validated flag bonus", () => {
    const board = flagMines(makeBoard("flag-win"), 3);
    const reward = computeScrapReward(
      { type: "BOARD_WON", revealedCount: 71, flaggedCount: 3, timeMs: 5000 },
      NO_UPGRADES,
      board,
    );
    // win base: 50, flag bonus: 3 * 3 = 9, total: 59
    expect(reward).toBe(59);
  });

  it("BOARD_WON scales with win_bonus upgrade", () => {
    const board = makeBoard("win-upgrade");
    const upgrades: UpgradeState = { win_bonus: 2 };
    const reward = computeScrapReward(
      { type: "BOARD_WON", revealedCount: 71, flaggedCount: 0, timeMs: 5000 },
      upgrades,
      board,
    );
    // 10 * 5 * (1 + 0.4) = 70
    expect(reward).toBe(70);
  });

  // BOARD LOST
  it("BOARD_LOST gives half flag bonus for correct flags", () => {
    const board = flagMines(makeBoard("loss-flag"), 4);
    const reward = computeScrapReward({ type: "BOARD_LOST", row: 0, col: 0 }, NO_UPGRADES, board);
    // 4 flags * 3 base * 0.5 = 6
    expect(reward).toBe(6);
  });

  it("BOARD_LOST gives 0 when no flags placed", () => {
    const reward = computeScrapReward({ type: "BOARD_LOST", row: 0, col: 0 }, NO_UPGRADES);
    expect(reward).toBe(0);
  });

  // NO SCRAP EVENTS
  it("FLAG_PLACED gives 0 scrap", () => {
    expect(computeScrapReward({ type: "FLAG_PLACED", row: 0, col: 0 }, NO_UPGRADES)).toBe(0);
  });

  it("FLAG_REMOVED gives 0 scrap", () => {
    expect(computeScrapReward({ type: "FLAG_REMOVED", row: 0, col: 0 }, NO_UPGRADES)).toBe(0);
  });

  // GLOBAL MULTIPLIER
  it("scrap_multi scales all rewards", () => {
    const upgrades: UpgradeState = { scrap_per_reveal: 3, scrap_multi: 1 };
    const reward = computeScrapReward(
      { type: "CELL_REVEALED", row: 0, col: 0, adjacentMines: 1 },
      upgrades,
    );
    // (1 + 3) * 1.25 = 5
    expect(reward).toBe(5);
  });

  it("intel_scrap_multi stacks with scrap_multi", () => {
    const upgrades: UpgradeState = {
      scrap_per_reveal: 3,
      scrap_multi: 1,
      intel_scrap_multi: 2,
    };
    const reward = computeScrapReward(
      { type: "CELL_REVEALED", row: 0, col: 0, adjacentMines: 1 },
      upgrades,
    );
    // base: 4, global: 1.25 * 1.2 = 1.5, total: 4 * 1.5 = 6
    expect(reward).toBe(6);
  });
});

describe("countCorrectFlags", () => {
  it("returns 0 when no flags placed", () => {
    expect(countCorrectFlags(makeBoard())).toBe(0);
  });

  it("counts only flags on actual mines", () => {
    const board = makeBoard();
    const cells = board.cells.map((row) => row.map((cell) => ({ ...cell })));
    let minesFlagged = 0;
    let nonMineFlagged = false;
    for (const row of cells) {
      for (const cell of row) {
        if (cell.isMine && minesFlagged < 2) {
          cell.state = "flagged";
          minesFlagged++;
        } else if (!cell.isMine && !nonMineFlagged) {
          cell.state = "flagged";
          nonMineFlagged = true;
        }
      }
    }
    expect(countCorrectFlags({ ...board, cells })).toBe(2);
  });

  it("returns 0 for undefined board", () => {
    expect(countCorrectFlags(undefined)).toBe(0);
  });
});

describe("upgrade helpers", () => {
  it("globalMultiplier stacks multiplicatively", () => {
    expect(globalMultiplier({})).toBe(1);
    expect(globalMultiplier({ scrap_multi: 1 })).toBe(1.25);
    expect(globalMultiplier({ scrap_multi: 2 })).toBeCloseTo(1.5625);
  });

  it("revealBonus returns upgrade level", () => {
    expect(revealBonus({})).toBe(0);
    expect(revealBonus({ scrap_per_reveal: 4 })).toBe(4);
  });

  it("floodFillBonus returns 0.5 per level (currently unused)", () => {
    expect(floodFillBonus({})).toBe(0);
    expect(floodFillBonus({ flood_bonus: 3 })).toBe(1.5);
  });

  it("winBonusMultiplier returns 1 + 0.2 per level", () => {
    expect(winBonusMultiplier({})).toBe(1);
    expect(winBonusMultiplier({ win_bonus: 5 })).toBe(2);
  });
});
