import type { UpgradeDefinition, UpgradeState } from "./types";

// defines all upgrades as plain objects
// to add upgrade, just add one object here (no new functions needed)
// shop UI loops over this array to render buy buttons

// board size presets for each level of the board_size upgrade
// we store these separately so we can look up dimensions by level
// keep mine density at roughly ~13% to keep difficulty consistent
export const BOARD_SIZE_LEVELS = [
  { rows: 9, cols: 9, mines: 10 }, // level 0: beginner (default)
  { rows: 11, cols: 11, mines: 16 },
  { rows: 13, cols: 13, mines: 22 },
  { rows: 15, cols: 15, mines: 30 },
  { rows: 17, cols: 17, mines: 40 },
];

export const UPGRADES: UpgradeDefinition[] = [
  {
    id: "scrap_per_reveal",
    name: "keen eye",
    description: "+1 scrap per cell revealed",
    maxLevel: 50,
    baseCost: 25,
    costScaling: 1.5,
    effect: { type: "scrap_per_reveal", baseValue: 1, perLevel: 1 },
    currency: "scrap",
    requiredLevel: 1, // only upgrade available immediately
    // icon: future art path, e.g. "/img/upgrades/keen-eye.png"
  },
  {
    id: "scrap_multi",
    name: "salvage mastery",
    description: "×1.25 all scrap earned",
    maxLevel: 10,
    baseCost: 150,
    costScaling: 2.0,
    effect: { type: "scrap_multiplier", baseValue: 1.25, perLevel: 0 },
    currency: "scrap",
    requiredLevel: 3,
  },
  {
    id: "win_bonus",
    name: "victory spoils",
    description: "+20% win bonus per level",
    maxLevel: 50,
    baseCost: 60,
    costScaling: 1.8,
    effect: { type: "win_bonus", baseValue: 0.2, perLevel: 0.2 },
    currency: "scrap",
    requiredLevel: 5,
  },

  // intel (prestige) upgrades
  // persist through resets and provide permanent bonuses (for now it's the last reset layer)

  {
    id: "intel_scrap_multi",
    name: "neural boost",
    description: "+10% permanent scrap multiplier",
    maxLevel: 10,
    baseCost: 1,
    costScaling: 1.5,
    effect: { type: "intel_scrap_multi", baseValue: 0.1, perLevel: 0.1 },
    currency: "intel",
  },
  {
    id: "intel_starting_scrap",
    name: "supply cache",
    description: "start each prestige with bonus scrap",
    maxLevel: 5,
    baseCost: 2,
    costScaling: 1.8,
    effect: { type: "starting_scrap", baseValue: 50, perLevel: 50 },
    currency: "intel",
  },
  {
    id: "intel_cost_reduction",
    name: "bulk discount",
    description: "-10% scrap upgrade costs",
    maxLevel: 5,
    baseCost: 3,
    costScaling: 2.0,
    effect: { type: "cost_reduction", baseValue: 0.1, perLevel: 0.1 },
    currency: "intel",
  },
];

// cost calculation
// cost = baseCost * costScaling ^ currentLevel
export function getUpgradeCost(
  def: UpgradeDefinition,
  currentLevel: number,
  upgrades?: UpgradeState,
): number {
  const rawCost = Math.floor(def.baseCost * def.costScaling ** currentLevel);

  // apply cost reduction from intel upgrade (only for scrap-costed upgrades)
  if (def.currency === "scrap" && upgrades) {
    const reductionLevel = upgrades.intel_cost_reduction ?? 0;
    const discount = reductionLevel * 0.1; // 10% per level
    return Math.max(1, Math.floor(rawCost * (1 - discount)));
  }

  return rawCost;
}

// look up a definition by id
export function getUpgradeById(id: string): UpgradeDefinition | undefined {
  return UPGRADES.find((u) => u.id === id);
}
