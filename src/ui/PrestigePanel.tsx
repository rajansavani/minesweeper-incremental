import { useState } from "react";
import { computeIntelOnPrestige } from "../meta/prestige";
import { getUpgradeCost, UPGRADES } from "../meta/upgrades";
import { useGameStore } from "./hooks/useGameStore";
import { formatNumber } from "./TopBar";

export function PrestigePanel() {
  const currencies = useGameStore((s) => s.currencies);
  const upgrades = useGameStore((s) => s.upgrades);
  const prestigeCount = useGameStore((s) => s.prestigeCount);
  const prestige = useGameStore((s) => s.prestige);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);

  const [confirming, setConfirming] = useState(false);

  const potentialIntel = computeIntelOnPrestige(
    currencies.lifetimeScrap,
    currencies.totalIntelEarned,
  );
  const canPrestige = potentialIntel > 0;

  // filter to only intel-costed upgrades
  const intelUpgrades = UPGRADES.filter((def) => def.currency === "intel");

  const handlePrestige = () => {
    if (!confirming) {
      // first click -> show confirmation
      setConfirming(true);
      return;
    }
    // second click -> actually prestige
    prestige();
    setConfirming(false);
  };

  return (
    <div className="w-full max-w-[min(95vw,32rem)] mx-auto mt-4">
      <h2 className="text-sm font-mono text-neutral-400 mb-2 tracking-wide">🔬 prestige</h2>

      {/* prestige info card */}
      <div className="bg-neutral-800 rounded px-4 py-3 border border-neutral-700/50 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-mono text-sm">
            <span className="text-cyan-400">⬡ {formatNumber(currencies.intel)}</span>
            <span className="text-neutral-500"> intel</span>
          </div>
          <div className="text-xs text-neutral-500 font-mono">prestiges: {prestigeCount}</div>
        </div>

        {/* explanation text */}
        <p className="text-xs text-neutral-400 mb-3">
          prestige resets your scrap and scrap upgrades, but awards{" "}
          <span className="text-cyan-400">intel</span> based on your lifetime scrap. now you can
          play the same game again but faster this time yay!
        </p>

        {/* potential gain + button */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-mono">
            {canPrestige ? (
              <span className="text-cyan-300">+{potentialIntel} intel available</span>
            ) : (
              <span className="text-neutral-500">earn more scrap to gain intel</span>
            )}
          </div>

          <button
            type="button"
            onClick={handlePrestige}
            onBlur={() => setConfirming(false)}
            disabled={!canPrestige}
            className={`
              px-4 py-1.5 text-xs font-mono rounded transition-colors
              ${
                confirming
                  ? "bg-red-500/80 text-white hover:bg-red-400"
                  : canPrestige
                    ? "bg-cyan-600/80 text-white hover:bg-cyan-500"
                    : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
              }
            `}
          >
            {confirming ? "confirm reset?" : "prestige"}
          </button>
        </div>
      </div>

      {/* intel upgrades shop */}
      {intelUpgrades.length > 0 && (
        <div className="grid gap-2">
          {intelUpgrades.map((def) => {
            const currentLevel = upgrades[def.id] ?? 0;
            const isMaxed = currentLevel >= def.maxLevel;
            const cost = isMaxed ? 0 : getUpgradeCost(def, currentLevel);
            const canAfford = currencies.intel >= cost;
            const canBuy = !isMaxed && canAfford;

            return (
              <div
                key={def.id}
                className={`
                  flex items-center gap-3 bg-neutral-800 rounded px-3 py-2.5
                  border transition-colors
                  ${isMaxed ? "border-cyan-600/30 bg-neutral-800/50" : "border-neutral-700/50"}
                `}
              >
                {/* icon placeholder */}
                <div className="text-xl w-8 h-8 flex items-center justify-center shrink-0 bg-neutral-700/50 rounded">
                  {def.icon ? (
                    <img src={def.icon} alt="" className="w-6 h-6" />
                  ) : (
                    <span className="text-sm">🔬</span>
                  )}
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-sm text-neutral-100">{def.name}</span>
                    <span className="text-xs text-neutral-500 font-mono">
                      {isMaxed ? "MAX" : `${currentLevel}/${def.maxLevel}`}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 truncate">{def.description}</p>
                </div>

                {/* buy button */}
                <button
                  type="button"
                  disabled={!canBuy}
                  onClick={() => buyUpgrade(def.id)}
                  className={`
                    px-3 py-1.5 text-xs font-mono rounded shrink-0 transition-colors
                    ${
                      isMaxed
                        ? "bg-neutral-700/30 text-neutral-600 cursor-default"
                        : canBuy
                          ? "bg-cyan-600/80 text-white hover:bg-cyan-500"
                          : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                    }
                  `}
                >
                  {isMaxed ? "✓" : `${cost} ⬡`}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
