import { saveGame } from "../storage/save";
import { useGameStore } from "./hooks/useGameStore";

export function Settings() {
  const hardReset = useGameStore((s) => s.hardReset);

  // manual save that reads current state directly
  const handleSave = () => {
    const state = useGameStore.getState();
    saveGame({
      currencies: state.currencies,
      upgrades: state.upgrades,
      prestigeCount: state.prestigeCount,
      level: state.level,
      xp: state.xp,
    });
    alert("saved!");
  };

  // export save as copyable JSON string
  const handleExport = () => {
    try {
      const raw = localStorage.getItem("minesweeper-incremental-save");
      if (raw) {
        navigator.clipboard.writeText(raw);
        alert("save copied to clipboard!");
      } else {
        alert("no save data found.");
      }
    } catch {
      alert("failed to copy save.");
    }
  };

  // import save from pasted JSON string
  const handleImport = () => {
    const input = window.prompt("paste your save data:");
    if (!input) return;

    try {
      JSON.parse(input);
      localStorage.setItem("minesweeper-incremental-save", input);
      window.location.reload();
    } catch {
      alert("invalid save data.");
    }
  };

  return (
    <div className="w-full">
      <div className="bg-neutral-800 rounded border border-neutral-700/50 divide-y divide-neutral-700/30">
        {/* save */}
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-mono text-neutral-300">save game</span>
          <button
            type="button"
            onClick={handleSave}
            className="px-3 py-1 text-xs font-mono rounded bg-neutral-700 text-neutral-300 hover:bg-neutral-600 transition-colors"
          >
            💾 save now
          </button>
        </div>

        {/* export */}
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-mono text-neutral-300">export save</span>
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-1 text-xs font-mono rounded bg-neutral-700 text-neutral-300 hover:bg-neutral-600 transition-colors"
          >
            📋 copy to clipboard
          </button>
        </div>

        {/* import */}
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-mono text-neutral-300">import save</span>
          <button
            type="button"
            onClick={handleImport}
            className="px-3 py-1 text-xs font-mono rounded bg-neutral-700 text-neutral-300 hover:bg-neutral-600 transition-colors"
          >
            📥 paste save
          </button>
        </div>

        {/* hard reset */}
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <span className="text-sm font-mono text-neutral-300">hard reset</span>
            <p className="text-xs text-neutral-500">erase all progress permanently</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("this will erase ALL progress. are you sure?")) {
                hardReset();
              }
            }}
            className="px-3 py-1 text-xs font-mono rounded bg-red-900/50 text-red-300 hover:bg-red-800/50 transition-colors"
          >
            ⚠ reset
          </button>
        </div>
      </div>
    </div>
  );
}
