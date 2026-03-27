import { xpToNextLevel } from "../meta/levels";
import { useGameStore } from "./hooks/useGameStore";
import { formatNumber } from "./TopBar";

export function CurrencyBar() {
  const currencies = useGameStore((s) => s.currencies);
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);

  const xpNeeded = xpToNextLevel(level);
  const xpPercent = Math.min(100, Math.round((xp / xpNeeded) * 100));

  return (
    <div className="w-full flex flex-col gap-2 bg-neutral-800/60 rounded px-4 py-3 border border-neutral-700/30 font-mono text-base">
      {/* currencies row */}
      <div className="flex items-center justify-between">
        <div className="text-amber-400" title="Current scrap">
          ⚙ {formatNumber(currencies.scrap)}
        </div>
        {currencies.intel > 0 && (
          <div className="text-cyan-400" title="Intel (prestige currency)">
            ⬡ {formatNumber(currencies.intel)}
          </div>
        )}
        <div className="text-neutral-500 text-sm" title="Lifetime scrap (never resets)">
          Σ {formatNumber(currencies.lifetimeScrap)}
        </div>
      </div>

      {/* level + XP bar */}
      <div className="flex items-center gap-2">
        <span className="text-neutral-300 text-sm font-bold shrink-0">Lv.{level}</span>
        <div
          className="flex-1 h-2.5 bg-neutral-700 rounded-full overflow-hidden"
          title={`${xp} / ${xpNeeded} XP to next level`}
        >
          <div
            className="h-full bg-amber-500/80 rounded-full transition-all duration-300"
            style={{ width: `${xpPercent}%` }}
          />
        </div>
        <span className="text-neutral-500 text-sm shrink-0">
          {formatNumber(xp)}/{formatNumber(xpNeeded)}
        </span>
      </div>
    </div>
  );
}
