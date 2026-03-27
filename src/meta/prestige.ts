import type { Currencies, UpgradeState } from "./types";
import { UPGRADES } from "./upgrades";

// INTEL FORMULA
// intel earned = floor(10 * sqrt(lifetimeScrap / 1000))

export function computeIntelGain(lifetimeScrap: number): number {
  if (lifetimeScrap <= 0) return 0;
  return Math.floor(10 * Math.sqrt(lifetimeScrap / 1000));
}

// shows how much intel the player would gain if they prestiged right now
export function computeIntelOnPrestige(lifetimeScrap: number, totalIntelEarned: number): number {
  const totalIntel = computeIntelGain(lifetimeScrap);
  const gain = totalIntel - totalIntelEarned;
  return Math.max(0, gain);
}

// PRESTIGE RESET
// resets scrap and scrap-costed upgrades
// keeps intel, intel-costed upgrades, prestige count, and settings

export function performPrestige(
  currencies: Currencies,
  upgrades: UpgradeState,
  prestigeCount: number,
): {
  currencies: Currencies;
  upgrades: UpgradeState;
  prestigeCount: number;
} {
  const intelGain = computeIntelOnPrestige(currencies.lifetimeScrap, currencies.totalIntelEarned);

  // can't prestige for 0 intel
  if (intelGain <= 0) {
    return { currencies, upgrades, prestigeCount };
  }

  // reset scrap to 0, add intel gain, keep lifetimeScrap intact
  const newCurrencies: Currencies = {
    scrap: 0,
    lifetimeScrap: currencies.lifetimeScrap,
    intel: currencies.intel + intelGain,
    totalIntelEarned: currencies.totalIntelEarned + intelGain,
  };

  // reset scrap-costed upgrades to level 0, keep intel-costed upgrades
  const newUpgrades: UpgradeState = {};
  for (const [id, level] of Object.entries(upgrades)) {
    const def = UPGRADES.find((u) => u.id === id);
    if (def && def.currency === "intel") {
      newUpgrades[id] = level; // keep intel upgrades
    }
    // scrap upgrdes are wiped by not adding them to newUpgrades
  }

  return {
    currencies: newCurrencies,
    upgrades: newUpgrades,
    prestigeCount: prestigeCount + 1,
  };
}
