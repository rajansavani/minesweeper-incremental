import type { Currencies, UpgradeState } from "./types";
import { UPGRADES } from "./upgrades";

// INTEL FORMULA
// intel earned = floor(sqrt(currentScrap / 800))
// based on current scrap (not lifetime) — resets each prestige
// gate: requires at least 800 current scrap to earn any intel
// 800 = 1, 3200 = 2, 7200 = 3, 12800 = 4, ...

export function computeIntelGain(currentScrap: number): number {
  if (currentScrap < 800) return 0;
  return Math.floor(Math.sqrt(currentScrap / 800));
}

// shows how much intel the player would gain if they prestiged right now
export function computeIntelOnPrestige(currentScrap: number): number {
  return computeIntelGain(currentScrap);
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
  const intelGain = computeIntelOnPrestige(currencies.scrap);

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
    // scrap upgrades are wiped by not adding them to newUpgrades
  }

  return {
    currencies: newCurrencies,
    upgrades: newUpgrades,
    prestigeCount: prestigeCount + 1,
  };
}
