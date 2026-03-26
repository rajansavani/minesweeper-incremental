import { createRng } from "../shared/rng";
import { revealCell } from "./reveal";
import type { Board, EngineEvent } from "./types";

// reveals N random safe hidden cells on the board
// used by the "starting_reveals" (recon drone) upgrade
export function autoRevealSafeCells(
  board: Board,
  count: number,
): { board: Board; events: EngineEvent[] } {
  if (count <= 0) return { board, events: [] };

  // collect all safe hidden cells
  const safeCells: { row: number; col: number }[] = [];
  for (const row of board.cells) {
    for (const cell of row) {
      if (!cell.isMine && cell.state === "hidden" && cell.adjacentMines > 0) {
        // only numbered cells get revealed
        safeCells.push({ row: cell.row, col: cell.col });
      }
    }
  }

  // shuffle using a deterministic seed so the same board always gets the same starting reveals
  const rng = createRng(`${board.seed}-auto-reveal`);
  for (let i = safeCells.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [safeCells[i], safeCells[j]] = [safeCells[j], safeCells[i]];
  }

  // reveal up to N cells
  let current = board;
  const allEvents: EngineEvent[] = [];
  const toReveal = Math.min(count, safeCells.length);

  for (let i = 0; i < toReveal; i++) {
    const { row, col } = safeCells[i];
    // skip if already revealed (shouldn't happen, but safety check)
    if (current.cells[row][col].state !== "hidden") continue;

    const result = revealCell(current, row, col);
    current = result.board;
    allEvents.push(...result.events);
  }

  return { board: current, events: allEvents };
}
