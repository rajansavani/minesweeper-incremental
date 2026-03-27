import { Grid } from "./Grid";
import { useAutoSave } from "./hooks/useAutoSave";
import { useGameStore } from "./hooks/useGameStore";
import { PrestigePanel } from "./PrestigePanel";
import { Shop } from "./Shop";
import { TopBar } from "./TopBar";

export default function App() {
  const status = useGameStore((s) => s.board.status);
  const currentRun = useGameStore((s) => s.currentRun);
  const newGame = useGameStore((s) => s.newGame);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const lifetimeScrap = useGameStore((s) => s.currencies.lifetimeScrap);
  const hardReset = useGameStore((s) => s.hardReset);
  const { showSaved, manualSave } = useAutoSave();

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col items-center px-4 py-6">
      {/* title */}
      <h1 className="text-2xl font-bold tracking-tight mb-4 font-mono">
        <span className="text-amber-400">mine</span>sweeper
        <span className="text-neutral-500 text-base ml-2 font-normal">incremental</span>
      </h1>

      <TopBar />
      <Grid />

      {/* save indicator*/}
      {showSaved && (
        <div className="mt-2 text-xs font-mono text-green-400 animate-pulse">✓ saved</div>
      )}

      {/* win/loss banner */}
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

      {/* show prestige panel after first prestige or when player has enough scrap */}
      {(prestigeCount > 0 || lifetimeScrap >= 500) && <PrestigePanel />}

      {/* save + reset controls */}
      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={manualSave}
          className="text-xs font-mono text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          💾 save now
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.confirm("this will erase ALL progress. are you sure?")) {
              hardReset();
            }
          }}
          className="text-xs font-mono text-neutral-600 hover:text-red-400 transition-colors"
        >
          ⚠ hard reset
        </button>
      </div>

      <p className="mt-4 text-xs text-neutral-500 font-mono text-center">
        left-click to reveal · right-click to flag · 🚩 toggle for mobile
      </p>
    </div>
  );
}
