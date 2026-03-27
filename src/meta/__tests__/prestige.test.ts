import { describe, expect, it } from "vitest";
import { computeIntelGain, computeIntelOnPrestige, performPrestige } from "../prestige";
import type { Currencies, UpgradeState } from "../types";

describe("computeIntelGain", () => {
  it("returns 0 for 0 scrap", () => {
    expect(computeIntelGain(0)).toBe(0);
  });

  it("returns 0 for negative scrap", () => {
    expect(computeIntelGain(-500)).toBe(0);
  });

  it("returns 0 below the 800 scrap threshold", () => {
    expect(computeIntelGain(799)).toBe(0);
  });

  it("returns 1 for exactly 800 scrap (first prestige gate)", () => {
    // floor(sqrt(800/800)) = floor(1) = 1
    expect(computeIntelGain(800)).toBe(1);
  });

  it("returns 2 for 3200 scrap", () => {
    // floor(sqrt(3200/800)) = floor(sqrt(4)) = 2
    expect(computeIntelGain(3200)).toBe(2);
  });

  it("returns 3 for 7200 scrap", () => {
    // floor(sqrt(7200/800)) = floor(sqrt(9)) = 3
    expect(computeIntelGain(7200)).toBe(3);
  });

  it("returns 10 for 80000 scrap", () => {
    // floor(sqrt(80000/800)) = floor(sqrt(100)) = 10
    expect(computeIntelGain(80000)).toBe(10);
  });

  it("shows diminishing returns (each intel costs more scrap than the last)", () => {
    const at800 = computeIntelGain(800); // 1
    const at3200 = computeIntelGain(3200); // 2
    const at7200 = computeIntelGain(7200); // 3
    expect(at3200).toBeGreaterThan(at800);
    expect(at7200).toBeGreaterThan(at3200);
    // quadrupling scrap only doubles intel (sqrt scaling)
    expect(computeIntelGain(3200)).toBeLessThan(computeIntelGain(800) * 4);
  });
});

describe("computeIntelOnPrestige", () => {
  it("returns intel gain based on current scrap", () => {
    expect(computeIntelOnPrestige(800)).toBe(1);
    expect(computeIntelOnPrestige(3200)).toBe(2);
  });

  it("returns 0 below the threshold", () => {
    expect(computeIntelOnPrestige(799)).toBe(0);
  });

  it("returns 0 for 0 scrap", () => {
    expect(computeIntelOnPrestige(0)).toBe(0);
  });
});

describe("performPrestige", () => {
  const baseCurrencies: Currencies = {
    scrap: 6000,
    lifetimeScrap: 10000,
    intel: 0,
    totalIntelEarned: 0,
  };

  const scrapUpgrades: UpgradeState = {
    scrap_per_reveal: 3,
    win_bonus: 2,
  };

  it("resets scrap to 0", () => {
    const result = performPrestige(baseCurrencies, scrapUpgrades, 0);
    expect(result.currencies.scrap).toBe(0);
  });

  it("keeps lifetimeScrap unchanged", () => {
    const result = performPrestige(baseCurrencies, scrapUpgrades, 0);
    expect(result.currencies.lifetimeScrap).toBe(10000);
  });

  it("awards intel based on current scrap", () => {
    const result = performPrestige(baseCurrencies, scrapUpgrades, 0);
    // floor(sqrt(6000/800)) = floor(sqrt(7.5)) = floor(2.739) = 2
    expect(result.currencies.intel).toBe(2);
  });

  it("tracks totalIntelEarned", () => {
    const result = performPrestige(baseCurrencies, scrapUpgrades, 0);
    expect(result.currencies.totalIntelEarned).toBe(2);
  });

  it("increments prestige count", () => {
    const result = performPrestige(baseCurrencies, scrapUpgrades, 0);
    expect(result.prestigeCount).toBe(1);
  });

  it("resets all scrap-costed upgrades", () => {
    const result = performPrestige(baseCurrencies, scrapUpgrades, 0);
    expect(result.upgrades.scrap_per_reveal).toBeUndefined();
    expect(result.upgrades.win_bonus).toBeUndefined();
  });

  it("keeps intel-costed upgrades", () => {
    const upgrades: UpgradeState = {
      scrap_per_reveal: 3,
      intel_scrap_multi: 2,
      intel_starting_scrap: 1,
    };
    const result = performPrestige(baseCurrencies, upgrades, 0);
    expect(result.upgrades.intel_scrap_multi).toBe(2);
    expect(result.upgrades.intel_starting_scrap).toBe(1);
    expect(result.upgrades.scrap_per_reveal).toBeUndefined();
  });

  it("does nothing if below the 800 scrap threshold", () => {
    const poorCurrencies: Currencies = {
      scrap: 500,
      lifetimeScrap: 5000,
      intel: 0,
      totalIntelEarned: 0,
    };
    const result = performPrestige(poorCurrencies, {}, 0);
    expect(result.currencies.scrap).toBe(500);
    expect(result.prestigeCount).toBe(0);
  });

  it("two prestiges at same scrap level both give the same intel", () => {
    const first = performPrestige(baseCurrencies, scrapUpgrades, 0);
    expect(first.currencies.intel).toBe(2);

    // reset back to same scrap level
    const sameScrap: Currencies = {
      scrap: 6000,
      lifetimeScrap: 16000,
      intel: first.currencies.intel,
      totalIntelEarned: first.currencies.totalIntelEarned,
    };
    const second = performPrestige(sameScrap, {}, first.prestigeCount);
    expect(second.currencies.intel).toBe(2 + 2); // gains another 2
    expect(second.prestigeCount).toBe(2);
  });

  it("more scrap = more intel on prestige", () => {
    const richCurrencies: Currencies = {
      scrap: 13500,
      lifetimeScrap: 20000,
      intel: 0,
      totalIntelEarned: 0,
    };
    const result = performPrestige(richCurrencies, {}, 0);
    // floor(sqrt(13500/800)) = floor(sqrt(16.875)) = floor(4.107) = 4
    expect(result.currencies.intel).toBe(4);
  });

  it("applies starting scrap from intel upgrade on prestige", () => {
    const upgrades: UpgradeState = {
      scrap_per_reveal: 2,
      intel_starting_scrap: 2,
    };
    const result = performPrestige(baseCurrencies, upgrades, 0);
    expect(result.currencies.scrap).toBe(0);
    expect(result.upgrades.intel_starting_scrap).toBe(2);
  });
});
