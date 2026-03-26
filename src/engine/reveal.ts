import { getNeighbors } from "./board";
import type { Board, Cell, EngineEvent } from "./types";

// deep clones the cells grid
// every engine function returns new objects so react can detect changes and re-render
function cloneCells(cells: Cell[][]): Cell[][] {
  return cells.map((row) => row.map((cell) => ({ ...cell })));
}

// win check -> if every non-mine cell is revealed, the player wins
// we track revealedCount on the board so we can just compare it to the total number of safe cells
export function checkWin(board: Board): boolean {
  const totalSafe = board.rows * board.cols - board.totalMines;
  return board.revealedCount === totalSafe;
}

// reveal cell -> returns a new board with the cell at (row, col) revealed
// if the cell has 0 adjacent mines, triggers flood fill (BFS)
export function revealCell(
  board: Board,
  row: number,
  col: number,
): { board: Board; events: EngineEvent[] } {
  // can't reveal if the game is over
  if (board.status !== "playing") {
    return { board, events: [] };
  }

  const cell = board.cells[row][col];

  // can't reveal flagged or already revealed cells
  if (cell.state !== "hidden") {
    return { board, events: [] };
  }

  const newCells = cloneCells(board.cells);
  const events: EngineEvent[] = [];

  // mine hit = game over
  if (cell.isMine) {
    newCells[row][col].state = "revealed";
    return {
      board: {
        ...board,
        cells: newCells,
        status: "lost",
      },
      events: [{ type: "BOARD_LOST", row, col }],
    };
  }

  // safe cell = reveal with possible flood fill
  let newRevealedCount = board.revealedCount;

  if (newCells[row][col].adjacentMines > 0) {
    // numbered cell: just reveal this one
    newCells[row][col].state = "revealed";
    newRevealedCount++;
    events.push({
      type: "CELL_REVEALED",
      row,
      col,
      adjacentMines: newCells[row][col].adjacentMines,
    });
  } else {
    // 0-cell: flood fill to reveal all connected 0-cells and their numbered borders
    const queue: { row: number; col: number }[] = [{ row, col }];
    let floodCount = 0;

    while (queue.length > 0) {
      const current = queue.shift();
      if (!current) break;
      const c = newCells[current.row][current.col];

      // skip if already processed
      if (c.state === "revealed") continue;
      // skip mines (safety check, should never happen since we don't enqueue mines
      if (c.isMine) continue;
      // skip flagged cells (player deliberately marked these)
      if (c.state === "flagged") continue;

      c.state = "revealed";
      newRevealedCount++;
      floodCount++;

      // if this cell is also a 0-cell, add its neighbors to the queue
      if (c.adjacentMines === 0) {
        for (const n of getNeighbors(current.row, current.col, board.rows, board.cols)) {
          if (newCells[n.row][n.col].state === "hidden") {
            queue.push(n);
          }
        }
      }
    }

    events.push({ type: "FLOOD_FILL", cellsRevealed: floodCount });
  }

  // check for win
  const newBoard: Board = {
    ...board,
    cells: newCells,
    revealedCount: newRevealedCount,
  };

  if (checkWin(newBoard)) {
    return {
      board: { ...newBoard, status: "won" },
      events: [
        ...events,
        {
          type: "BOARD_WON",
          revealedCount: newBoard.revealedCount,
          flaggedCount: newBoard.flaggedCount,
          timeMs: 0, // placeholder, will be filled in by the store layer that tracks time
        },
      ],
    };
  }

  return { board: newBoard, events };
}

// chord reveal -> if the player clicks a revealed numbered cell and has the correct number of flags around it, reveal all unflagged neighbors
export function chordReveal(
  board: Board,
  row: number,
  col: number,
): { board: Board; events: EngineEvent[] } {
  if (board.status !== "playing") return { board, events: [] };

  const cell = board.cells[row][col];

  // only works on revealed numbered cells
  if (cell.state !== "revealed" || cell.adjacentMines === 0) {
    return { board, events: [] };
  }

  // count adjacent flags
  const neighbors = getNeighbors(row, col, board.rows, board.cols);
  const adjacentFlags = neighbors.filter(
    (n) => board.cells[n.row][n.col].state === "flagged",
  ).length;

  // only chord if flag count matches the number
  if (adjacentFlags !== cell.adjacentMines) {
    return { board, events: [] };
  }

  // reveal all hidden unflagged neighbors (may hit a mine!)
  let current = board;
  const allEvents: EngineEvent[] = [];

  for (const n of neighbors) {
    if (current.cells[n.row][n.col].state === "hidden") {
      const result = revealCell(current, n.row, n.col);
      current = result.board;
      allEvents.push(...result.events);
      // stop if we hit a mine
      if (current.status === "lost") break;
    }
  }

  return { board: current, events: allEvents };
}
