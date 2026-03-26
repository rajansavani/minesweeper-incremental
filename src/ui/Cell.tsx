import type { Cell as CellType } from "../engine/types";

const NUMBER_COLORS: Record<number, string> = {
  1: "text-blue-400",
  2: "text-green-400",
  3: "text-red-400",
  4: "text-purple-400",
  5: "text-amber-600",
  6: "text-cyan-400",
  7: "text-neutral-300",
  8: "text-neutral-500",
};

interface CellProps {
  cell: CellType;
  gameOver: boolean;
  onReveal: () => void;
  onFlag: () => void;
  onChord: () => void;
}

export function Cell({ cell, gameOver, onReveal, onFlag, onChord }: CellProps) {
  // left-click on a revealed numbered cell with the correct number of adjacent flags triggers chord
  const handleClick = () => {
    if (gameOver) return;
    if (cell.state === "revealed" && cell.adjacentMines > 0) {
      onChord();
      return;
    }
    onReveal();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (gameOver) return;
    onFlag();
  };

  // middle-click also triggers chord
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1) {
      e.preventDefault();
      if (gameOver) return;
      onChord();
    }
  };

  let content: React.ReactNode = null;
  let cellStyle = "";

  if (cell.state === "flagged") {
    content = "🚩";
    cellStyle = "bg-neutral-700 hover:bg-neutral-600 cursor-pointer";
  } else if (cell.state === "hidden") {
    if (gameOver && cell.isMine) {
      content = "💣";
      cellStyle = "bg-neutral-800";
    } else {
      content = null;
      cellStyle = "bg-neutral-700 hover:bg-neutral-600 cursor-pointer";
    }
  } else {
    if (cell.isMine) {
      content = "💥";
      cellStyle = "bg-red-900/60";
    } else if (cell.adjacentMines > 0) {
      content = (
        <span className={`font-bold ${NUMBER_COLORS[cell.adjacentMines] ?? "text-neutral-300"}`}>
          {cell.adjacentMines}
        </span>
      );
      cellStyle = "bg-neutral-800/80";
    } else {
      content = null;
      cellStyle = "bg-neutral-800/50";
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseDown={handleMouseDown}
      className={`
        aspect-square flex items-center justify-center
        text-sm font-mono select-none
        border border-neutral-600/40
        transition-colors duration-75
        ${cellStyle}
      `}
      aria-label={`Cell ${cell.row},${cell.col}: ${cell.state}`}
    >
      {content}
    </button>
  );
}
