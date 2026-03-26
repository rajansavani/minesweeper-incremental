import type { Board, Cell, EngineEvent } from "./types";

// clone the cells to avoid mutating originl board
function cloneCells(cells: Cell[][]): Cell[][] {
  return cells.map((row) => row.map((cell) => ({ ...cell })));
}

// toggles a cell between hidden and flagged
// can only flag hidden cells
// returns updated board + a FLAG_PLACED or FLAG_REMOVED event
export function toggleFlag(
  board: Board,
  row: number,
  col: number,
): { board: Board; events: EngineEvent[] } {
  // can't flag if the game is over
  if (board.status !== "playing") {
    return { board, events: [] };
  }

  const cell = board.cells[row][col];

  // can't flag a revealed cell
  if (cell.state === "revealed") {
    return { board, events: [] };
  }

  const newCells = cloneCells(board.cells);
  let newFlaggedCount = board.flaggedCount;
  const events: EngineEvent[] = [];

  if (cell.state === "hidden") {
    // place flag
    newCells[row][col].state = "flagged";
    newFlaggedCount++;
    events.push({ type: "FLAG_PLACED", row, col });
  } else {
    // remove flag
    newCells[row][col].state = "hidden";
    newFlaggedCount--;
    events.push({ type: "FLAG_REMOVED", row, col });
  }

  return {
    board: {
      ...board,
      cells: newCells,
      flaggedCount: newFlaggedCount,
    },
    events,
  };
}
