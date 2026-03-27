import { Grid } from "./Grid";
import { useAutoSave } from "./hooks/useAutoSave";
import { useGameStore } from "./hooks/useGameStore";
import { Onboarding } from "./Onboarding";
import { PrestigePanel } from "./PrestigePanel";
import { RunSummary } from "./RunSummary";
import { Settings } from "./Settings";
import { Shop } from "./Shop";
import { TopBar } from "./TopBar";

export default function App() {
  const status = useGameStore((s) => s.board.status);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const lifetimeScrap = useGameStore((s) => s.currencies.lifetimeScrap);

  // auto-save every 30s + on tab close
  const { showSaved } = useAutoSave();

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col items-center px-4 py-6 pb-16">
      <h1 className="text-2xl font-bold tracking-tight mb-4 font-mono">
        <span className="text-amber-400">mine</span>sweeper
        <span className="text-neutral-500 text-base ml-2 font-normal">incremental</span>
      </h1>

      {/* first-visit onboarding tooltip */}
      <Onboarding />

      <TopBar />
      <Grid />

      {/* save indicator */}
      {showSaved && (
        <div className="mt-2 text-xs font-mono text-green-400 animate-pulse">✓ saved</div>
      )}

      {/* run summary after game ends */}
      <RunSummary />

      {/* hint text changes based on game state */}
      {status === "playing" && (
        <p className="mt-3 text-xs text-neutral-500 font-mono text-center">
          left-click to reveal · right-click to flag · 🚩 toggle for mobile
        </p>
      )}

      <Shop />

      {/* show prestige panel after first prestige or when player has enough scrap */}
      {(prestigeCount > 0 || lifetimeScrap >= 500) && <PrestigePanel />}

      {/* settings panel (save/export/import/reset)*/}
      <Settings />
    </div>
  );
}
