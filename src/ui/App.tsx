import { Grid } from "./Grid";
import { useGameStore } from "./hooks/useGameStore";
import { TopBar } from "./TopBar";

export default function App() {
  const status = useGameStore((s) => s.board.status);
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

      {/* win/loss banner - shows below the grid */}
      {status !== "playing" && (
        <div
          className={`
            mt-4 px-6 py-3 rounded font-mono text-center
            ${status === "won" ? "bg-green-900/50 border border-green-600/50 text-green-300" : ""}
            ${status === "lost" ? "bg-red-900/50 border border-red-600/50 text-red-300" : ""}
          `}
        >
          <p className="text-lg font-bold mb-2">
            {status === "won" ? "🎉 Board cleared!" : "💥 Mine hit!"}
          </p>
          <button
            type="button"
            onClick={() => newGame()}
            className="px-4 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded text-sm transition-colors"
          >
            New Game
          </button>
        </div>
      )}

      {/* hint text for new players */}
      <p className="mt-4 text-xs text-neutral-500 font-mono text-center">
        left-click to reveal · right-click to flag · 🚩 toggle for mobile
      </p>
    </div>
  );
}
