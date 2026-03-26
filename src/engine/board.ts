import { createRng } from "../shared/rng";
import type { Board, Cell } from "./types";

// returns the 8 neighbors of (row, col) that are inside the grid
// used for adjacency counting and for the first-click safety zone
export function getNeighbors(
  row: number,
  col: number,
  rows: number,
  cols: number,
): { row: number; col: number }[] {
  const neighbors: { row: number; col: number }[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue; // skip the cell itself
      const nr = row + dr;
      const nc = col + dc;
      // check bounds
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push({ row: nr, col: nc });
      }
    }
  }
  return neighbors;
}

// board creation -> empty board with all cells hidden and no mines
// mines are placed after the first click (via placeMines)
export function createBoard(rows: number, cols: number, totalMines: number, seed: string): Board {
  const cells: Cell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        adjacentMines: 0,
        state: "hidden",
      });
    }
    cells.push(row);
  }

  return {
    rows,
    cols,
    totalMines,
    cells,
    seed,
    firstClickDone: false,
    status: "playing",
    revealedCount: 0,
    flaggedCount: 0,
  };
}

// mine placement -> places mines randomly using the seeded rng, ensuring the first clicked cell is not a mine and has 0 adjacent mines
// returns a new board (does not mutate the original)
export function placeMines(board: Board, safeRow: number, safeCol: number): Board {
  const { rows, cols, totalMines, seed } = board;
  const rng = createRng(seed);

  // build set of cells that must stay safe (first click + neighbors)
  const safeSet = new Set<string>();
  safeSet.add(`${safeRow},${safeCol}`);
  for (const n of getNeighbors(safeRow, safeCol, rows, cols)) {
    safeSet.add(`${n.row},${n.col}`);
  }

  // collect all cells eligible for mines
  const eligible: { row: number; col: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!safeSet.has(`${r},${c}`)) {
        eligible.push({ row: r, col: c });
      }
    }
  }

  // fisher-yates shuffle the eligible list using seeded rng, then take the first N
  for (let i = eligible.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [eligible[i], eligible[j]] = [eligible[j], eligible[i]];
  }

  // clone cells to avoid mutating original board
  const newCells: Cell[][] = board.cells.map((row) => row.map((cell) => ({ ...cell })));

  // place mines on the first totalMines eligible cells
  const minePositions = eligible.slice(0, totalMines);
  for (const pos of minePositions) {
    newCells[pos.row][pos.col].isMine = true;
  }

  // compute adjacency counts for every cell
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (newCells[r][c].isMine) {
        newCells[r][c].adjacentMines = -1; // mines don't need a count so just label with -1
        continue;
      }
      let count = 0;
      for (const n of getNeighbors(r, c, rows, cols)) {
        if (newCells[n.row][n.col].isMine) count++;
      }
      newCells[r][c].adjacentMines = count;
    }
  }

  return {
    ...board,
    cells: newCells,
    firstClickDone: true,
  };
}
