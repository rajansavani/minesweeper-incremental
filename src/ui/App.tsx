import { useState } from "react";
import { CurrencyBar } from "./CurrencyBar";
import { Grid } from "./Grid";
import { useAutoSave } from "./hooks/useAutoSave";
import { useGameStore } from "./hooks/useGameStore";
import { Onboarding } from "./Onboarding";
import { PrestigePanel } from "./PrestigePanel";
import { RunSummary } from "./RunSummary";
import { Settings } from "./Settings";
import { Shop } from "./Shop";
import { TopBar } from "./TopBar";

type TabId = "upgrades" | "prestige" | "settings";

export default function App() {
  const status = useGameStore((s) => s.board.status);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const lifetimeScrap = useGameStore((s) => s.currencies.lifetimeScrap);

  const { showSaved } = useAutoSave();
  const [activeTab, setActiveTab] = useState<TabId>("upgrades");

  // only show prestige tab after it becomes relevant
  const showPrestigeTab = prestigeCount > 0 || lifetimeScrap >= 800;

  const tabs: { id: TabId; label: string; show: boolean }[] = [
    { id: "upgrades", label: "upgrades", show: true },
    { id: "prestige", label: "prestige", show: showPrestigeTab },
    { id: "settings", label: "settings", show: true },
  ];

  const visibleTabs = tabs.filter((t) => t.show);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col items-center px-4 py-8">
      {/* title */}
      <h1 className="text-3xl font-bold tracking-tight mb-5 font-mono">
        <span className="text-amber-400">mine</span>sweeper
        <span className="text-neutral-500 text-lg ml-2 font-normal">incremental</span>
      </h1>

      {/* first-visit onboarding tooltip */}
      <Onboarding />

      <div className="w-full max-w-7xl flex flex-col md:flex-row gap-6">
        {/* LEFT: game area -> fixed width so right-panel changes can't affect board size */}
        <div className="w-full md:w-[30rem] shrink-0 flex flex-col items-center gap-3">
          <div className="w-full max-w-[min(95vw,30rem)]">
            <TopBar />
          </div>
          <div className="w-full max-w-[min(95vw,30rem)]">
            <Grid />
          </div>

          {/* hint text during play */}
          {status === "playing" && (
            <p className="text-sm text-neutral-500 font-mono text-center">
              left-click reveal · right-click flag · 🚩 mobile
            </p>
          )}

          {/* save indicator */}
          {showSaved && (
            <div className="text-sm font-mono text-green-400 animate-pulse">✓ saved</div>
          )}
        </div>

        {/* RIGHT: tabbed panel */}
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          {/* currency bar -> always visible above tabs */}
          <CurrencyBar />

          {/* run summary -> shows above tabs when game ends or shows last run */}
          <RunSummary />

          {/* tab buttons */}
          <div className="flex gap-1">
            {visibleTabs.map((tab) => (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2 text-sm font-mono rounded-t transition-colors
                  ${
                    activeTab === tab.id
                      ? "bg-neutral-800 text-neutral-100 border border-neutral-700/50 border-b-transparent"
                      : "bg-neutral-800/30 text-neutral-500 hover:text-neutral-300 border border-transparent"
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* tab content */}
          <div className="bg-neutral-800/20 rounded-b rounded-tr border border-neutral-700/30 p-4 min-h-[200px]">
            {activeTab === "upgrades" && <Shop />}
            {activeTab === "prestige" && showPrestigeTab && <PrestigePanel />}
            {activeTab === "settings" && <Settings />}
          </div>
        </div>
      </div>
    </div>
  );
}
