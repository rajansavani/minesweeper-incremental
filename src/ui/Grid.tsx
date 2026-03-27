import { Cell } from "./Cell";
import { useGameStore } from "./hooks/useGameStore";

export function Grid() {
  const board = useGameStore((s) => s.board);
  const flagMode = useGameStore((s) => s.flagMode);
  const reveal = useGameStore((s) => s.reveal);
  const flag = useGameStore((s) => s.flag);
  const chord = useGameStore((s) => s.chord);

  const gameOver = board.status === "won" || board.status === "lost";

  return (
    <div
      className="grid gap-0 w-full max-w-[min(95vw,30rem)] mx-auto"
      style={{
        // css grid with equal-width columns matching the board's column count
        // minmax(0, 1fr) ensures cells shrink evenly on small screens
        gridTemplateColumns: `repeat(${board.cols}, minmax(0, 1fr))`,
      }}
    >
      {board.cells.flat().map((cell) => (
        <Cell
          key={`${cell.row}-${cell.col}`}
          cell={cell}
          gameOver={gameOver}
          onReveal={() => {
            // in flag mode (mobile), taps place flags instead of revealing
            if (flagMode) {
              flag(cell.row, cell.col);
            } else {
              reveal(cell.row, cell.col);
            }
          }}
          onFlag={() => flag(cell.row, cell.col)}
          onChord={() => chord(cell.row, cell.col)}
        />
      ))}
    </div>
  );
}
