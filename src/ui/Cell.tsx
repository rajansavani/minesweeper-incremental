import { useRef } from "react";
import type { Cell as CellType } from "../engine/types";

// color map for adjacency numbers
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
  chordMode: "left-click" | "middle-click" | "both-click";
  onReveal: () => void;
  onFlag: () => void;
  onChord: () => void;
  onHoverChange: (hovered: boolean) => void;
}

export function Cell({
  cell,
  gameOver,
  chordMode,
  onReveal,
  onFlag,
  onChord,
  onHoverChange,
}: CellProps) {
  // tracks whether chord already fired this mouse gesture (prevents flag from also firing)
  const chordFiredRef = useRef(false);

  const isRevealedNumber = cell.state === "revealed" && cell.adjacentMines > 0;

  const handleClick = () => {
    if (gameOver) return;
    if (chordMode === "left-click" && isRevealedNumber) {
      onChord();
      return;
    }
    // revealed cells with no number: nothing to do
    if (cell.state === "revealed") return;
    onReveal();
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (gameOver) return;
    // in both-click mode, suppress flag if chord already fired this gesture
    if (chordMode === "both-click" && chordFiredRef.current) {
      chordFiredRef.current = false;
      return;
    }
    onFlag();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // middle click: chord in middle-click mode
    if (e.button === 1) {
      e.preventDefault();
      if (gameOver) return;
      if (chordMode === "middle-click") onChord();
      return;
    }

    // both-click chord: fires when left+right are simultaneously down (e.buttons === 3)
    if (chordMode === "both-click" && e.buttons === 3) {
      if (gameOver) return;
      chordFiredRef.current = true;
      onChord();
    }
  };

  // determine what to show inside the cell
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
    // revealed
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
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
      onKeyDown={(e) => {
        if (e.code === "Space") e.preventDefault();
      }}
      className={`
        aspect-square flex items-center justify-center
        text-base font-mono select-none
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
