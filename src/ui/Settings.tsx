import { saveGame } from "../storage/save";
import { useGameStore } from "./hooks/useGameStore";

function SettingSelect<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
}: {
  label: string;
  description?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <span className="text-sm font-mono text-neutral-300">{label}</span>
        {description && <p className="text-xs text-neutral-500 mt-0.5">{description}</p>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="shrink-0 bg-neutral-700 text-neutral-200 text-xs font-mono rounded px-2 py-1 border border-neutral-600 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Settings() {
  const hardReset = useGameStore((s) => s.hardReset);
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);

  // manual save that reads current state directly
  const handleSave = () => {
    const state = useGameStore.getState();
    saveGame({
      currencies: state.currencies,
      upgrades: state.upgrades,
      prestigeCount: state.prestigeCount,
      level: state.level,
      xp: state.xp,
      settings: state.settings,
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
    <div className="w-full flex flex-col gap-4">
      {/* controls */}
      <div className="bg-neutral-800 rounded border border-neutral-700/50 divide-y divide-neutral-700/30">
        <div className="px-4 py-2">
          <span className="text-xs font-mono text-neutral-500 tracking-wide">controls</span>
        </div>
        <SettingSelect
          label="chord mode"
          description="which click triggers chord reveal on a number"
          value={settings.chordMode}
          options={[
            { value: "left-click", label: "left click" },
            { value: "middle-click", label: "middle click" },
            { value: "both-click", label: "left + right" },
          ]}
          onChange={(v) => updateSettings({ chordMode: v })}
        />
        <SettingSelect
          label="spacebar"
          description="what spacebar does while hovering a cell"
          value={settings.spacebarBehavior}
          options={[
            { value: "off", label: "off" },
            { value: "flag", label: "flag / unflag" },
            { value: "chord", label: "chord" },
            { value: "flag-or-chord", label: "flag or chord" },
          ]}
          onChange={(v) => updateSettings({ spacebarBehavior: v })}
        />
      </div>

      {/* save / reset */}
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
