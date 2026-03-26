import { describe, expect, it } from "vitest";
import { createBoard, placeMines } from "../board";
import { checkWin, revealCell } from "../reveal";

// create a board with mines placed, ready for testing.
// uses a fixed seed + click position for reproducible layouts.
function makeBoard(seed = "reveal-test") {
  const board = createBoard(9, 9, 10, seed);
  return placeMines(board, 4, 4);
}

// find a cell matching a predicate.
function findCell(
  board: ReturnType<typeof makeBoard>,
  predicate: (c: (typeof board.cells)[0][0]) => boolean,
) {
  for (const row of board.cells) {
    for (const cell of row) {
      if (predicate(cell)) return cell;
    }
  }
  return null;
}

describe("revealCell", () => {
  it("reveals a mine → status lost + BOARD_LOST event", () => {
    const board = makeBoard();
    const mine = findCell(board, (c) => c.isMine);
    expect(mine).not.toBeNull();

    const result = revealCell(board, mine!.row, mine!.col);
    expect(result.board.status).toBe("lost");
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("BOARD_LOST");
  });

  it("reveals a numbered cell (adjacentMines > 0) → CELL_REVEALED event", () => {
    const board = makeBoard();
    // find a safe cell with adjacentMines > 0 (numbered)
    const numbered = findCell(board, (c) => !c.isMine && c.adjacentMines > 0);
    expect(numbered).not.toBeNull();

    const result = revealCell(board, numbered!.row, numbered!.col);
    expect(result.board.cells[numbered!.row][numbered!.col].state).toBe("revealed");
    expect(result.board.revealedCount).toBe(1);
    expect(result.events.some((e) => e.type === "CELL_REVEALED")).toBe(true);
  });

  it("reveals a 0-cell → triggers flood fill, reveals multiple cells", () => {
    const board = makeBoard();
    // find a 0-cell (no adjacent mines)
    const zero = findCell(board, (c) => !c.isMine && c.adjacentMines === 0);
    expect(zero).not.toBeNull();

    const result = revealCell(board, zero!.row, zero!.col);
    // flood fill should reveal more than 1 cell
    expect(result.board.revealedCount).toBeGreaterThan(1);
    // should emit a FLOOD_FILL event
    const floodEvent = result.events.find((e) => e.type === "FLOOD_FILL");
    expect(floodEvent).toBeDefined();
    if (floodEvent && floodEvent.type === "FLOOD_FILL") {
      expect(floodEvent.cellsRevealed).toBeGreaterThan(1);
      expect(floodEvent.cellsRevealed).toBe(result.board.revealedCount);
    }
  });

  it("can't reveal a flagged cell", () => {
    const board = makeBoard();
    const safe = findCell(board, (c) => !c.isMine && c.state === "hidden");
    expect(safe).not.toBeNull();

    // manually set a cell to flagged
    const newCells = board.cells.map((row) => row.map((cell) => ({ ...cell })));
    newCells[safe!.row][safe!.col].state = "flagged";
    const flaggedBoard = { ...board, cells: newCells, flaggedCount: 1 };

    const result = revealCell(flaggedBoard, safe!.row, safe!.col);
    // should be a no-op — cell stays flagged
    expect(result.board.cells[safe!.row][safe!.col].state).toBe("flagged");
    expect(result.events).toHaveLength(0);
  });

  it("can't reveal an already-revealed cell", () => {
    const board = makeBoard();
    const numbered = findCell(board, (c) => !c.isMine && c.adjacentMines > 0);
    expect(numbered).not.toBeNull();

    const first = revealCell(board, numbered!.row, numbered!.col);
    const second = revealCell(first.board, numbered!.row, numbered!.col);
    // second reveal is a no-op
    expect(second.events).toHaveLength(0);
    expect(second.board.revealedCount).toBe(first.board.revealedCount);
  });

  it("can't reveal when game is already lost", () => {
    const board = makeBoard();
    const mine = findCell(board, (c) => c.isMine);
    const safe = findCell(board, (c) => !c.isMine);

    const lost = revealCell(board, mine!.row, mine!.col);
    expect(lost.board.status).toBe("lost");

    const afterLost = revealCell(lost.board, safe!.row, safe!.col);
    expect(afterLost.events).toHaveLength(0);
  });

  it("revealing all safe cells → status won + BOARD_WON event", () => {
    // use a 5x5 board so the safe zone (9 cells) doesn't cover everything
    const board = createBoard(5, 5, 1, "win-test");
    const withMines = placeMines(board, 0, 0);
    const totalSafe = 5 * 5 - 1; // 24 safe cells

    // reveal every non-mine cell one at a time
    let current = withMines;
    for (const row of withMines.cells) {
      for (const cell of row) {
        if (!cell.isMine && current.status === "playing") {
          const result = revealCell(current, cell.row, cell.col);
          current = result.board;
          if (current.status === "won") {
            const wonEvent = result.events.find((e) => e.type === "BOARD_WON");
            expect(wonEvent).toBeDefined();
          }
        }
      }
    }

    expect(current.status).toBe("won");
    expect(current.revealedCount).toBe(totalSafe);
  });

  it("does not mutate the original board", () => {
    const board = makeBoard();
    const safe = findCell(board, (c) => !c.isMine && c.adjacentMines > 0);
    const originalState = board.cells[safe!.row][safe!.col].state;

    revealCell(board, safe!.row, safe!.col);

    // original board's cell should still be hidden
    expect(board.cells[safe!.row][safe!.col].state).toBe(originalState);
  });
});

describe("checkWin", () => {
  it("returns false when not all safe cells are revealed", () => {
    const board = makeBoard();
    expect(checkWin(board)).toBe(false);
  });

  it("returns true when all safe cells are revealed", () => {
    const board = makeBoard();
    // simulate full reveal by setting revealedCount
    const fakeBoard = { ...board, revealedCount: 9 * 9 - 10 };
    expect(checkWin(fakeBoard)).toBe(true);
  });
});
