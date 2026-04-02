import { useEffect, useRef } from "react";
import { Cell } from "./Cell";
import { useGameStore } from "./hooks/useGameStore";

export function Grid() {
  const board = useGameStore((s) => s.board);
  const flagMode = useGameStore((s) => s.flagMode);
  const settings = useGameStore((s) => s.settings);
  const reveal = useGameStore((s) => s.reveal);
  const flag = useGameStore((s) => s.flag);
  const chord = useGameStore((s) => s.chord);

  const gameOver = board.status === "won" || board.status === "lost";

  // track which cell the mouse is currently over for spacebar handling
  const hoveredCell = useRef<{ row: number; col: number } | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      // always prevent default so focused buttons don't flash or fire a click
      e.preventDefault();

      const cell = hoveredCell.current;
      if (!cell) return;

      const { board: currentBoard, settings: currentSettings } = useGameStore.getState();
      if (currentBoard.status !== "playing") return;

      const { spacebarBehavior } = currentSettings;
      if (spacebarBehavior === "off") return;

      const boardCell = currentBoard.cells[cell.row][cell.col];

      if (spacebarBehavior === "flag") {
        flag(cell.row, cell.col);
      } else if (spacebarBehavior === "chord") {
        chord(cell.row, cell.col);
      } else {
        // flag-or-chord: chord if hovering a revealed number, flag otherwise
        if (boardCell.state === "revealed" && boardCell.adjacentMines > 0) {
          chord(cell.row, cell.col);
        } else {
          flag(cell.row, cell.col);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [flag, chord]);

  return (
    <div
      className="grid gap-0 w-full max-w-[min(95vw,30rem)] mx-auto"
      style={{
        gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))`,
      }}
    >
      {board.cells.flat().map((cell) => (
        <Cell
          key={`${cell.row}-${cell.col}`}
          cell={cell}
          gameOver={gameOver}
          chordMode={settings.chordMode}
          onReveal={() => {
            if (flagMode) {
              flag(cell.row, cell.col);
            } else {
              reveal(cell.row, cell.col);
            }
          }}
          onFlag={() => flag(cell.row, cell.col)}
          onChord={() => chord(cell.row, cell.col)}
          onHoverChange={(hovered) => {
            hoveredCell.current = hovered ? { row: cell.row, col: cell.col } : null;
          }}
        />
      ))}
    </div>
  );
}
