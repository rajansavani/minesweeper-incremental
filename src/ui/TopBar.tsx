import { useEffect, useState } from "react";
import { useGameStore } from "./hooks/useGameStore";

// formats milliseconds into M:SS display
function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

// formats large numbers: 1234 → "1.2K", 1234567 → "1.2M"
export function formatNumber(n: number): string {
  if (n < 1000) return n.toString();
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

export function TopBar() {
  const board = useGameStore((s) => s.board);
  const startTimeMs = useGameStore((s) => s.startTimeMs);
  const endTimeMs = useGameStore((s) => s.endTimeMs);
  const flagMode = useGameStore((s) => s.flagMode);
  const toggleFlagMode = useGameStore((s) => s.toggleFlagMode);

  // live timer -> ticks every second while game is active
  // we store "now" in local state so the component re-renders each tick
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // only tick when game is in progress
    if (!startTimeMs || endTimeMs) return;

    const interval = setInterval(() => setNow(Date.now()), 1000);
    // cleanup -> stop the interval when the game ends or component unmounts
    return () => clearInterval(interval);
  }, [startTimeMs, endTimeMs]);

  // compute displayed time
  let elapsed = 0;
  if (startTimeMs) {
    elapsed = (endTimeMs ?? now) - startTimeMs;
  }

  const remaining = board.totalMines - board.flaggedCount;

  return (
    <div className="w-full flex items-center justify-between bg-neutral-800 rounded px-4 py-3 border border-neutral-700/50">
      <div
        className="font-mono text-xl text-red-400 min-w-[3.5rem] text-left"
        title="Remaining mines"
      >
        💣 {remaining}
      </div>

      <button
        type="button"
        onClick={toggleFlagMode}
        className={`
          px-3 py-1.5 text-sm font-mono rounded transition-colors
          ${
            flagMode
              ? "bg-amber-500/90 text-neutral-900"
              : "bg-neutral-700 text-neutral-400 hover:bg-neutral-600"
          }
        `}
        title="Toggle flag mode (for mobile)"
      >
        🚩 {flagMode ? "ON" : "OFF"}
      </button>

      <div
        className="font-mono text-xl text-neutral-300 min-w-[3.5rem] text-right"
        title="Elapsed time"
      >
        ⏱ {formatTime(elapsed)}
      </div>
    </div>
  );
}
