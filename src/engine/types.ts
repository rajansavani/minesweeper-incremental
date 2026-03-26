// CELL
// each cell represents on square on the board
export type CellState = "hidden" | "revealed" | "flagged";

export interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  adjacentMines: number; // 0-8, count of neighboring mines
  state: CellState;
}

// BOARD
// the full grid + metadata needed for game logic
export interface Board {
  rows: number;
  cols: number;
  totalMines: number;
  cells: Cell[][]; // 2D array of cells, cells[row][col]
  seed: string; // RNG seed used to generate this board
  firstClickDone: boolean; // mines are not placed until first click
  status: "playing" | "won" | "lost";
  revealedCount: number; // how many non-mine cells have been revealed
  flaggedCount: number; // how many cells are currently flagged
}

// ENGINE EVENTS
// every meaningful thing that happens on the board emits one of these events
export type EngineEvent =
  | { type: "CELL_REVEALED"; row: number; col: number; adjacentMines: number }
  | { type: "FLOOD_FILL"; cellsRevealed: number } // batch reveal of 0-cells
  | { type: "FLAG_PLACED"; row: number; col: number }
  | { type: "FLAG_REMOVED"; row: number; col: number }
  | { type: "BOARD_WON"; revealedCount: number; flaggedCount: number; timeMs: number }
  | { type: "BOARD_LOST"; row: number; col: number } // which mine was clicked
  | { type: "ABILITY_USED"; abilityId: string };
