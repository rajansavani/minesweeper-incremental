import { Grid } from "./Grid";
import { useGameStore } from "./hooks/useGameStore";
import { Shop } from "./Shop";
import { TopBar } from "./TopBar";

export default function App() {
  const status = useGameStore((s) => s.board.status);
  const currentRun = useGameStore((s) => s.currentRun);
  const newGame = useGameStore((s) => s.newGame);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col items-center px-4 py-6">
      {/* title */}
      <h1 className="text-2xl font-bold tracking-tight mb-4 font-mono">
        <span className="text-amber-400">mine</span>sweeper
        <span className="text-neutral-500 text-base ml-2 font-normal">incremental</span>
      </h1>

      <TopBar />
      <Grid />

      {/* win/loss banner with run stats */}
      {status !== "playing" && (
        <div
          className={`
            mt-4 px-6 py-4 rounded font-mono text-center max-w-xs w-full
            ${status === "won" ? "bg-green-900/50 border border-green-600/50 text-green-300" : ""}
            ${status === "lost" ? "bg-red-900/50 border border-red-600/50 text-red-300" : ""}
          `}
        >
          <p className="text-lg font-bold mb-2">
            {status === "won" ? "🎉 board cleared!" : "💥 mine hit!"}
          </p>

          {/* run summary */}
          <div className="text-sm space-y-1 mb-3 text-neutral-300">
            <p>
              cells revealed: <span className="text-neutral-100">{currentRun.cellsRevealed}</span>
            </p>
            <p>
              flags placed: <span className="text-neutral-100">{currentRun.flagsPlaced}</span>
            </p>
            <p className="text-amber-400 font-bold">+{currentRun.scrapEarned} scrap earned</p>
          </div>
          <button
            type="button"
            onClick={() => newGame()}
            className="px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-sm transition-colors text-neutral-100"
          >
            new game
          </button>
        </div>
      )}

      <Shop />

      <p className="mt-6 text-xs text-neutral-500 font-mono text-center">
        left-click to reveal · right-click to flag · 🚩 toggle for mobile
      </p>
    </div>
  );
}
