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
  const currencies = useGameStore((s) => s.currencies);
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
    <div className="w-full max-w-[min(95vw,32rem)] mx-auto mb-3 flex flex-col gap-2">
      {/* scrap + intel + board info */}
      <div className="flex items-center justify-between bg-neutral-800/60 rounded px-3 py-1.5 border border-neutral-700/30 text-sm font-mono">
        <div className="text-amber-400" title="Current scrap">
          ⚙ {formatNumber(currencies.scrap)} scrap
        </div>
        {currencies.intel > 0 && (
          <div className="text-cyan-400 text-sm" title="Intel (prestige currency)">
            ⬡ {formatNumber(currencies.intel)}
          </div>
        )}
        <div className="text-neutral-500 text-xs" title="Board size">
          {board.rows}×{board.cols}
        </div>
        <div className="text-neutral-500" title="Lifetime scrap (never resets)">
          Σ {formatNumber(currencies.lifetimeScrap)}
        </div>
      </div>

      {/* mine count / timer row */}
      <div className="flex items-center justify-between bg-neutral-800 rounded px-3 py-2 border border-neutral-700/50">
        <div
          className="font-mono text-lg text-red-400 min-w-[3rem] text-left"
          title="Remaining mines"
        >
          💣 {remaining}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleFlagMode}
            className={`
              px-2 py-1 text-xs font-mono rounded transition-colors
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
        </div>

        {/* timer */}
        <div
          className="font-mono text-lg text-neutral-300 min-w-[3rem] text-right"
          title="Elapsed time"
        >
          ⏱ {formatTime(elapsed)}
        </div>
      </div>
    </div>
  );
}
