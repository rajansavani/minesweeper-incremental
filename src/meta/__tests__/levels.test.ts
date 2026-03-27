import { describe, expect, it } from "vitest";
import { computeXpGain, processXpGain, xpToNextLevel } from "../levels";

describe("computeXpGain", () => {
  it("returns 20% of scrap earned, floored", () => {
    expect(computeXpGain(100)).toBe(20);
    expect(computeXpGain(55)).toBe(11);
    expect(computeXpGain(3)).toBe(0);
  });

  it("returns 0 for 0 scrap", () => {
    expect(computeXpGain(0)).toBe(0);
  });
});

describe("xpToNextLevel", () => {
  it("returns 25 for level 1", () => {
    // floor(17 * 1.5^1) = 25
    expect(xpToNextLevel(1)).toBe(25);
  });

  it("returns 38 for level 2", () => {
    // floor(17 * 1.5^2) = 38
    expect(xpToNextLevel(2)).toBe(38);
  });

  it("scales exponentially", () => {
    const lvl5 = xpToNextLevel(5);
    const lvl10 = xpToNextLevel(10);
    expect(lvl10).toBeGreaterThan(lvl5 * 2);
  });
});

describe("processXpGain", () => {
  it("adds XP without leveling up", () => {
    const result = processXpGain(1, 0, 20);
    expect(result.level).toBe(1);
    expect(result.xp).toBe(20);
    expect(result.levelsGained).toBe(0);
  });

  it("levels up when XP exceeds threshold", () => {
    // level 1 needs 25 XP
    const result = processXpGain(1, 15, 15);
    expect(result.level).toBe(2);
    expect(result.xp).toBe(5); // 30 - 25 = 5 leftover
    expect(result.levelsGained).toBe(1);
  });

  it("handles multiple level-ups at once", () => {
    // level 1 needs 25, level 2 needs 38. total = 63
    const result = processXpGain(1, 0, 70);
    expect(result.level).toBe(3);
    expect(result.xp).toBe(7); // 70 - 25 - 38 = 7
    expect(result.levelsGained).toBe(2);
  });

  it("handles exact threshold (no leftover)", () => {
    const result = processXpGain(1, 0, 25);
    expect(result.level).toBe(2);
    expect(result.xp).toBe(0);
    expect(result.levelsGained).toBe(1);
  });

  it("handles 0 XP gain", () => {
    const result = processXpGain(5, 100, 0);
    expect(result.level).toBe(5);
    expect(result.xp).toBe(100);
    expect(result.levelsGained).toBe(0);
  });
});
