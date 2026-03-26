import { describe, expect, it } from "vitest";
import { createBoard, placeMines } from "../board";
import { toggleFlag } from "../flag";
import { revealCell } from "../reveal";

function makeBoard(seed = "flag-test") {
  const board = createBoard(9, 9, 10, seed);
  return placeMines(board, 4, 4);
}

describe("toggleFlag", () => {
  it("flags a hidden cell → state becomes flagged + FLAG_PLACED event", () => {
    const board = makeBoard();
    const result = toggleFlag(board, 0, 0);

    expect(result.board.cells[0][0].state).toBe("flagged");
    expect(result.board.flaggedCount).toBe(1);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].type).toBe("FLAG_PLACED");
  });

  it("unflag a flagged cell → state becomes hidden + FLAG_REMOVED event", () => {
    const board = makeBoard();
    const flagged = toggleFlag(board, 0, 0);
    const unflagged = toggleFlag(flagged.board, 0, 0);

    expect(unflagged.board.cells[0][0].state).toBe("hidden");
    expect(unflagged.board.flaggedCount).toBe(0);
    expect(unflagged.events).toHaveLength(1);
    expect(unflagged.events[0].type).toBe("FLAG_REMOVED");
  });

  it("can't flag a revealed cell", () => {
    const board = makeBoard();
    // find a safe cell and reveal it first
    const safe = board.cells.flat().find((c) => !c.isMine && c.adjacentMines > 0);
    expect(safe).toBeDefined();

    const revealed = revealCell(board, safe!.row, safe!.col);
    const result = toggleFlag(revealed.board, safe!.row, safe!.col);

    // should be a no-op
    expect(result.board.cells[safe!.row][safe!.col].state).toBe("revealed");
    expect(result.events).toHaveLength(0);
  });

  it("can't flag when game is lost", () => {
    const board = makeBoard();
    const mine = board.cells.flat().find((c) => c.isMine);

    const lost = revealCell(board, mine!.row, mine!.col);
    const result = toggleFlag(lost.board, 0, 0);

    expect(result.events).toHaveLength(0);
  });

  it("flaggedCount tracks multiple flags correctly", () => {
    const board = makeBoard();
    const first = toggleFlag(board, 0, 0);
    const second = toggleFlag(first.board, 0, 1);
    const third = toggleFlag(second.board, 0, 2);

    expect(third.board.flaggedCount).toBe(3);

    // remove one
    const removed = toggleFlag(third.board, 0, 1);
    expect(removed.board.flaggedCount).toBe(2);
  });

  it("does not mutate the original board", () => {
    const board = makeBoard();
    const originalState = board.cells[0][0].state;
    const originalCount = board.flaggedCount;

    toggleFlag(board, 0, 0);

    expect(board.cells[0][0].state).toBe(originalState);
    expect(board.flaggedCount).toBe(originalCount);
  });
});
