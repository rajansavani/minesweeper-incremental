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

// helper for empty upgrade state (no upgrades purchased)
const NO_UPGRADES: UpgradeState = {};

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
    // base 1 + 3 bonus = 4, no global multiplier upgrades
    expect(reward).toBe(4);
  });

  // FLOOD FILL
  it("FLOOD_FILL gives 0 scrap with no upgrades", () => {
    const reward = computeScrapReward({ type: "FLOOD_FILL", cellsRevealed: 10 }, NO_UPGRADES);
    expect(reward).toBe(0);
  });

  it("FLOOD_FILL gives scrap when flood_bonus upgrade is purchased", () => {
    const upgrades: UpgradeState = { flood_bonus: 2 };
    const reward = computeScrapReward({ type: "FLOOD_FILL", cellsRevealed: 10 }, upgrades);
    // per cell: 2 * 0.5 = 1.0. total: 10 * 1.0 = 10
    expect(reward).toBe(10);
  });

  // BOARD WON
  it("BOARD_WON gives mine-based bonus with no upgrades", () => {
    const board = createBoard(9, 9, 10, "test");
    const withMines = placeMines(board, 4, 4);

    const reward = computeScrapReward(
      {
        type: "BOARD_WON",
        revealedCount: 71,
        flaggedCount: 0,
        timeMs: 5000,
      },
      NO_UPGRADES,
      withMines,
    );
    // win base: 10 mines * 5 = 50, no flags, no multipliers
    expect(reward).toBe(50);
  });

  it("BOARD_WON includes validated flag bonus", () => {
    // create board and manually set some flags on mines
    const board = createBoard(9, 9, 10, "flag-win-test");
    const withMines = placeMines(board, 4, 4);

    // flag 3 mines correctly
    const cells = withMines.cells.map((row) => row.map((cell) => ({ ...cell })));
    let flagged = 0;
    for (const row of cells) {
      for (const cell of row) {
        if (cell.isMine && flagged < 3) {
          cell.state = "flagged";
          flagged++;
        }
      }
    }
    const flaggedBoard = { ...withMines, cells, flaggedCount: 3 };

    const reward = computeScrapReward(
      {
        type: "BOARD_WON",
        revealedCount: 71,
        flaggedCount: 3,
        timeMs: 5000,
      },
      NO_UPGRADES,
      flaggedBoard,
    );
    // win base: 10 * 5 = 50. flag bonus: 3 * 3 = 9. total: 59
    expect(reward).toBe(59);
  });

  // BOARD LOST
  it("BOARD_LOST gives half flag bonus for correct flags", () => {
    const board = createBoard(9, 9, 10, "loss-flag-test");
    const withMines = placeMines(board, 4, 4);

    // flag 4 mines correctly
    const cells = withMines.cells.map((row) => row.map((cell) => ({ ...cell })));
    let flagged = 0;
    for (const row of cells) {
      for (const cell of row) {
        if (cell.isMine && flagged < 4) {
          cell.state = "flagged";
          flagged++;
        }
      }
    }
    const flaggedBoard = { ...withMines, cells, flaggedCount: 4 };

    const reward = computeScrapReward(
      { type: "BOARD_LOST", row: 0, col: 0 },
      NO_UPGRADES,
      flaggedBoard,
    );
    // 4 correct flags * 3 base * 0.5 loss penalty = 6
    expect(reward).toBe(6);
  });

  it("BOARD_LOST gives 0 when no flags placed", () => {
    const reward = computeScrapReward({ type: "BOARD_LOST", row: 0, col: 0 }, NO_UPGRADES);
    expect(reward).toBe(0);
  });

  // EXPECT NO SCRAP
  it("FLAG_PLACED gives 0 scrap", () => {
    const reward = computeScrapReward({ type: "FLAG_PLACED", row: 0, col: 0 }, NO_UPGRADES);
    expect(reward).toBe(0);
  });

  it("FLAG_REMOVED gives 0 scrap", () => {
    const reward = computeScrapReward({ type: "FLAG_REMOVED", row: 0, col: 0 }, NO_UPGRADES);
    expect(reward).toBe(0);
  });

  // GLOBAL MULTIPLIER
  it("scrap_multi upgrade scales all rewards", () => {
    const upgrades: UpgradeState = { scrap_multi: 1 };
    const reward = computeScrapReward(
      { type: "CELL_REVEALED", row: 0, col: 0, adjacentMines: 1 },
      upgrades,
    );
    // base 1 * 1.25 global = 1.25 → floor → 1
    expect(reward).toBe(1);

    // with higher base to see the multiplier effect
    const upgrades2: UpgradeState = { scrap_per_reveal: 3, scrap_multi: 1 };
    const reward2 = computeScrapReward(
      { type: "CELL_REVEALED", row: 0, col: 0, adjacentMines: 1 },
      upgrades2,
    );
    // (1 + 3) * 1.25 = 5
    expect(reward2).toBe(5);
  });

  it("intel_scrap_multi upgrade stacks with scrap_multi", () => {
    const upgrades: UpgradeState = {
      scrap_per_reveal: 3,
      scrap_multi: 1,
      intel_scrap_multi: 2,
    };
    const reward = computeScrapReward(
      { type: "CELL_REVEALED", row: 0, col: 0, adjacentMines: 1 },
      upgrades,
    );
    // base: 1 + 3 = 4. global: 1.25 * 1.2 = 1.5. total: 4 * 1.5 = 6
    expect(reward).toBe(6);
  });
});

describe("countCorrectFlags", () => {
  it("returns 0 when no flags are placed", () => {
    const board = createBoard(5, 5, 3, "test");
    const withMines = placeMines(board, 2, 2);
    expect(countCorrectFlags(withMines)).toBe(0);
  });

  it("counts only flags on actual mines", () => {
    const board = createBoard(5, 5, 3, "test");
    const withMines = placeMines(board, 2, 2);

    const cells = withMines.cells.map((row) => row.map((cell) => ({ ...cell })));
    // flag 2 mines and 1 non-mine
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

    expect(countCorrectFlags({ ...withMines, cells })).toBe(2);
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

  it("floodFillBonus returns 0.5 per level", () => {
    expect(floodFillBonus({})).toBe(0);
    expect(floodFillBonus({ flood_bonus: 3 })).toBe(1.5);
  });

  it("winBonusMultiplier returns 1 + 0.2 per level", () => {
    expect(winBonusMultiplier({})).toBe(1);
    expect(winBonusMultiplier({ win_bonus: 5 })).toBe(2);
  });
});
