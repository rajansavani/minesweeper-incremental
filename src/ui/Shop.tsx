import { getUpgradeCost, UPGRADES } from "../meta/upgrades";
import { useGameStore } from "./hooks/useGameStore";
import { formatNumber } from "./TopBar";

export function Shop() {
  const currencies = useGameStore((s) => s.currencies);
  const upgrades = useGameStore((s) => s.upgrades);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);

  return (
    <div className="w-full max-w-[min(95vw,32rem)] mx-auto mt-4">
      <h2 className="text-sm font-mono text-neutral-400 mb-2 tracking-wide">⚙ upgrades</h2>

      <div className="grid gap-2">
        {UPGRADES.filter((def) => {
          // hide intel-currency upgrades until player has prestiged
          if (def.currency === "intel" && def.requiresPrestige) {
            return false;
          }
          return true;
        }).map((def) => {
          const currentLevel = upgrades[def.id] ?? 0;
          const isMaxed = currentLevel >= def.maxLevel;
          const cost = isMaxed ? 0 : getUpgradeCost(def, currentLevel);
          const canAfford =
            def.currency === "scrap" ? currencies.scrap >= cost : currencies.intel >= cost;
          const canBuy = !isMaxed && canAfford;

          return (
            <div
              key={def.id}
              className={`
                flex items-center gap-3 bg-neutral-800 rounded px-3 py-2.5
                border transition-colors
                ${isMaxed ? "border-amber-600/30 bg-neutral-800/50" : "border-neutral-700/50"}
              `}
            >
              {/* icon placeholder */}
              <div className="text-xl w-8 h-8 flex items-center justify-center shrink-0 bg-neutral-700/50 rounded">
                {def.icon ? (
                  <img src={def.icon} alt="" className="w-6 h-6" />
                ) : (
                  <span className="text-sm">⚙</span>
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
                        ? "bg-amber-500/90 text-neutral-900 hover:bg-amber-400"
                        : "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                  }
                `}
              >
                {isMaxed ? "✓" : `${formatNumber(cost)} ⚙`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
