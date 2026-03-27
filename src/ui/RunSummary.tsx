import { useGameStore } from "./hooks/useGameStore";
import { formatNumber } from "./TopBar";

// shows a detailed summary after each game ends
// players see what they earned and the breakdown of where scrap came from

export function RunSummary() {
  const status = useGameStore((s) => s.board.status);
  const board = useGameStore((s) => s.board);
  const currentRun = useGameStore((s) => s.currentRun);
  const newGame = useGameStore((s) => s.newGame);
  const startTimeMs = useGameStore((s) => s.startTimeMs);
  const endTimeMs = useGameStore((s) => s.endTimeMs);

  if (status === "playing") return null;

  const isWin = status === "won";

  // compute time taken
  let timeStr = "—";
  if (startTimeMs && endTimeMs) {
    const totalSeconds = Math.floor((endTimeMs - startTimeMs) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  // board completion percentage
  const totalSafe = board.rows * board.cols - board.totalMines;
  const pct = totalSafe > 0 ? Math.round((currentRun.cellsRevealed / totalSafe) * 100) : 0;

  return (
    <div
      className={`
        mt-4 px-5 py-4 rounded font-mono text-center max-w-xs w-full
        ${isWin ? "bg-green-900/50 border border-green-600/40" : ""}
        ${!isWin ? "bg-red-900/50 border border-red-600/40" : ""}
      `}
    >
      {/* header */}
      <p className={`text-lg font-bold mb-3 ${isWin ? "text-green-300" : "text-red-300"}`}>
        {isWin ? "🎉 board cleared!" : "💥 mine hit!"}
      </p>

      {/* stats grid */}
      <div className="text-left text-sm space-y-1.5 mb-4">
        <StatRow label="time" value={timeStr} />
        <StatRow label="board" value={`${board.rows}×${board.cols} (${board.totalMines} mines)`} />
        <StatRow label="cleared" value={`${currentRun.cellsRevealed} / ${totalSafe} (${pct}%)`} />
        <StatRow label="flags placed" value={String(currentRun.flagsPlaced)} />

        {/* scrap earned — highlighted */}
        <div className="pt-1 border-t border-neutral-700/30">
          <div className="flex justify-between text-amber-400 font-bold">
            <span>scrap earned</span>
            <span>+{formatNumber(currentRun.scrapEarned)} ⚙</span>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={() => newGame()}
        className={`
          w-full px-4 py-2 rounded text-sm font-bold transition-colors
          ${
            isWin
              ? "bg-green-700/60 hover:bg-green-600/60 text-green-100"
              : "bg-neutral-700 hover:bg-neutral-600 text-neutral-100"
          }
        `}
      >
        next board →
      </button>
    </div>
  );
}

// small helper component for stat rows
function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-neutral-400">
      <span>{label}</span>
      <span className="text-neutral-200">{value}</span>
    </div>
  );
}
