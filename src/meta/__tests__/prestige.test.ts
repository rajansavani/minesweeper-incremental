import { describe, expect, it } from "vitest";
import { computeIntelGain, computeIntelOnPrestige, performPrestige } from "../prestige";
import type { Currencies, UpgradeState } from "../types";

describe("computeIntelGain", () => {
  it("returns 0 for 0 lifetime scrap", () => {
    expect(computeIntelGain(0)).toBe(0);
  });

  it("returns 0 for negative lifetime scrap", () => {
    expect(computeIntelGain(-500)).toBe(0);
  });

  it("returns 10 intel for 1000 lifetime scrap", () => {
    expect(computeIntelGain(1000)).toBe(10);
  });

  it("returns 22 intel for 5000 lifetime scrap", () => {
    // floor(10 * sqrt(5)) = floor(22.36) = 22
    expect(computeIntelGain(5000)).toBe(22);
  });

  it("returns 31 intel for 10000 lifetime scrap", () => {
    // floor(10 * sqrt(10)) = floor(31.62) = 31
    expect(computeIntelGain(10000)).toBe(31);
  });

  it("returns 70 intel for 50000 lifetime scrap", () => {
    // floor(10 * sqrt(50)) = floor(70.71) = 70
    expect(computeIntelGain(50000)).toBe(70);
  });

  it("shows diminishing returns (each intel costs more scrap)", () => {
    const at1k = computeIntelGain(1000);
    const at4k = computeIntelGain(4000);
    const at9k = computeIntelGain(9000);

    // 4x the scrap should NOT give 4x the intel
    expect(at4k).toBeLessThan(at1k * 4);
    // should still give more tho
    expect(at4k).toBeGreaterThan(at1k);
    expect(at9k).toBeGreaterThan(at4k);
  });
});

describe("computeIntelOnPrestige", () => {
  it("returns full intel gain on first prestige", () => {
    // first prestige: currentIntel is 0
    expect(computeIntelOnPrestige(1000, 0)).toBe(10);
  });

  it("returns only the difference on subsequent prestiges", () => {
    // already have 10 intel from first prestige at 1000 scrap.
    // now at 5000 total -> 22 total intel -> gain is 22 - 10 = 12
    expect(computeIntelOnPrestige(5000, 10)).toBe(12);
  });

  it("returns 0 if no new intel would be earned", () => {
    // have 10 intel, lifetime is 1000 -> total would be 10 -> gain is 0
    expect(computeIntelOnPrestige(1000, 10)).toBe(0);
  });

  it("never returns negative", () => {
    // edge case: somehow have more intel than formula suggests
    expect(computeIntelOnPrestige(100, 50)).toBe(0);
  });
});

describe("performPrestige", () => {
  const baseCurrencies: Currencies = {
    scrap: 500,
    lifetimeScrap: 2000,
    intel: 0,
    totalIntelEarned: 0,
  };

  const scrapUpgrades: UpgradeState = {
    scrap_per_reveal: 3,
    flood_bonus: 2,
    board_size: 1,
  };

  it("resets scrap to 0", () => {
    const result = performPrestige(baseCurrencies, scrapUpgrades, 0);
    expect(result.currencies.scrap).toBe(0);
  });

  it("keeps lifetimeScrap unchanged", () => {
    const result = performPrestige(baseCurrencies, scrapUpgrades, 0);
    expect(result.currencies.lifetimeScrap).toBe(2000);
  });

  it("awards intel based on formula", () => {
    const result = performPrestige(baseCurrencies, scrapUpgrades, 0);
    // floor(10 * sqrt(2000/1000)) = floor(10 * 1.414) = 14
    expect(result.currencies.intel).toBe(14);
  });

  it("increments prestige count", () => {
    const result = performPrestige(baseCurrencies, scrapUpgrades, 0);
    expect(result.prestigeCount).toBe(1);
  });

  it("resets all scrap-costed upgrades", () => {
    const result = performPrestige(baseCurrencies, scrapUpgrades, 0);
    expect(result.upgrades.scrap_per_reveal).toBeUndefined();
    expect(result.upgrades.flood_bonus).toBeUndefined();
    expect(result.upgrades.board_size).toBeUndefined();
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

  it("does nothing if intel gain would be 0", () => {
    const poorCurrencies: Currencies = {
      scrap: 50,
      lifetimeScrap: 5,
      intel: 0,
      totalIntelEarned: 0,
    };
    const result = performPrestige(poorCurrencies, {}, 0);
    // no change -> can't prestige for 0 intel
    expect(result.currencies.scrap).toBe(50);
    expect(result.prestigeCount).toBe(0);
  });

  it("second prestige gives incremental intel", () => {
    // first prestige at 2000 lifetime: 14 intel
    const first = performPrestige(baseCurrencies, scrapUpgrades, 0);
    expect(first.currencies.intel).toBe(14);

    // play more, now at 8000 lifetime scrap
    const afterMore: Currencies = {
      scrap: 1200,
      lifetimeScrap: 8000,
      intel: first.currencies.intel,
      totalIntelEarned: first.currencies.totalIntelEarned,
    };
    const second = performPrestige(afterMore, {}, first.prestigeCount);
    // total at 8000: floor(10 * sqrt(8)) = floor(28.28) = 28
    // already have 14, so gain is 28 - 14 = 14 more
    expect(second.currencies.intel).toBe(28);
    expect(second.prestigeCount).toBe(2);
  });

  it("applies starting scrap from intel upgrade on prestige", () => {
    // the supply cache upgrade gives starting scrap
    // but we verify performPrestige resets scrap to 0 (store adds starting scrap after)
    const upgrades: UpgradeState = {
      scrap_per_reveal: 2,
      intel_starting_scrap: 2,
    };
    const result = performPrestige(baseCurrencies, upgrades, 0);
    // scrap resets to 0 (store will add starting scrap separately)
    expect(result.currencies.scrap).toBe(0);
    // intel upgrade persists
    expect(result.upgrades.intel_starting_scrap).toBe(2);
  });
});
