import type { UpgradeDefinition } from "./types";

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
    maxLevel: 5,
    baseCost: 50,
    costScaling: 1.8,
    effect: { type: "scrap_per_reveal", baseValue: 1, perLevel: 1 },
    currency: "scrap",
    // icon: future art path, e.g. "/img/upgrades/keen-eye.png"
  },
  {
    id: "flood_bonus",
    name: "chain reaction",
    description: "unlock +0.5 scrap per flood-fill cell",
    maxLevel: 5,
    baseCost: 75,
    costScaling: 1.6,
    effect: { type: "flood_bonus", baseValue: 0.5, perLevel: 0.5 },
    currency: "scrap",
  },
  {
    id: "win_bonus",
    name: "victory spoils",
    description: "+20% win bonus per level",
    maxLevel: 5,
    baseCost: 100,
    costScaling: 2.0,
    effect: { type: "win_bonus", baseValue: 0.2, perLevel: 0.2 },
    currency: "scrap",
  },
  {
    id: "flag_bonus",
    name: "ordnance pay",
    description: "+2 scrap per correct flag",
    maxLevel: 3,
    baseCost: 150,
    costScaling: 2.0,
    effect: { type: "flag_bonus", baseValue: 2, perLevel: 2 },
    currency: "scrap",
  },
  {
    id: "scrap_multi",
    name: "salvage mastery",
    description: "×1.25 all scrap earned",
    maxLevel: 3,
    baseCost: 250,
    costScaling: 2.5,
    effect: { type: "scrap_multiplier", baseValue: 1.25, perLevel: 0 },
    currency: "scrap",
  },
  {
    id: "board_size",
    name: "expanded grid",
    description: "larger board + higher scrap multiplier",
    maxLevel: 4,
    baseCost: 200,
    costScaling: 2.5,
    effect: { type: "board_size", baseValue: 1, perLevel: 1 },
    currency: "scrap",
  },
  {
    id: "starting_reveals",
    name: "recon drone",
    description: "auto-reveal safe cells at board start",
    maxLevel: 3,
    baseCost: 175,
    costScaling: 2.0,
    effect: { type: "starting_reveals", baseValue: 3, perLevel: 2 },
    currency: "scrap",
  },
  {
    id: "loss_shield",
    name: "salvage insurance",
    description: "keep 25% of win bonus on loss",
    maxLevel: 3,
    baseCost: 200,
    costScaling: 2.0,
    effect: { type: "loss_shield", baseValue: 0.25, perLevel: 0.25 },
    currency: "scrap",
  },
];

// cost calculation
// cost = baseCost * costScaling ^ currentLevel
export function getUpgradeCost(def: UpgradeDefinition, currentLevel: number): number {
  return Math.floor(def.baseCost * def.costScaling ** currentLevel);
}

// look up a definition by id
export function getUpgradeById(id: string): UpgradeDefinition | undefined {
  return UPGRADES.find((u) => u.id === id);
}
