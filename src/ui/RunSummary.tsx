import { useGameStore } from "./hooks/useGameStore";
import { formatNumber } from "./TopBar";

// shows a detailed summary after each game ends
// players see what they earned and the breakdown of where scrap came from

export function RunSummary() {
  const status = useGameStore((s) => s.board.status);
  const board = useGameStore((s) => s.board);
  const currentRun = useGameStore((s) => s.currentRun);
  const lastRun = useGameStore((s) => s.lastRun);
  const newGame = useGameStore((s) => s.newGame);
  const startTimeMs = useGameStore((s) => s.startTimeMs);
  const endTimeMs = useGameStore((s) => s.endTimeMs);

  // show current run stats if game just ended, otherwise show last run
  const gameJustEnded = status !== "playing";
  const run = gameJustEnded ? currentRun : lastRun;

  if (!run) {
    return (
      <div className="w-full text-center text-neutral-500 text-sm font-mono py-4">
        complete a board to see stats
      </div>
    );
  }

  const isWin = run.won === true;

  // compute time taken
  let timeStr = "—";
  if (gameJustEnded && startTimeMs && endTimeMs) {
    const totalSeconds = Math.floor((endTimeMs - startTimeMs) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  // board completion percentage
  const totalSafe = board.rows * board.cols - board.totalMines;
  const pct = totalSafe > 0 ? Math.round((run.cellsRevealed / totalSafe) * 100) : 0;

  return (
    <div className="w-full">
      {/* header */}
      {gameJustEnded && (
        <div
          className={`text-center font-mono font-bold text-lg mb-2 ${isWin ? "text-green-400" : "text-red-400"}`}
        >
          {isWin ? "🎉 board cleared!" : "💥 mine hit!"}
        </div>
      )}

      {!gameJustEnded && <div className="text-sm font-mono text-neutral-500 mb-2">last run</div>}

      {/* stats */}
      <div className="bg-neutral-800 rounded border border-neutral-700/50 px-4 py-3 text-base font-mono space-y-2">
        {gameJustEnded && <StatRow label="time" value={timeStr} />}
        <StatRow label="cleared" value={`${run.cellsRevealed} / ${totalSafe} (${pct}%)`} />
        <StatRow label="flags" value={String(run.flagsPlaced)} />
        <div className="pt-1 border-t border-neutral-700/30">
          <div className="flex justify-between text-amber-400 font-bold">
            <span>scrap</span>
            <span>+{formatNumber(run.scrapEarned)} ⚙</span>
          </div>
        </div>
      </div>

      {/* next board button — only when game just ended */}
      {gameJustEnded && (
        <button
          type="button"
          onClick={() => newGame()}
          className={`
            w-full mt-2 px-4 py-3 rounded text-base font-mono font-bold transition-colors
            ${
              isWin
                ? "bg-green-700/60 hover:bg-green-600/60 text-green-100"
                : "bg-neutral-700 hover:bg-neutral-600 text-neutral-100"
            }
          `}
        >
          next board →
        </button>
      )}
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
