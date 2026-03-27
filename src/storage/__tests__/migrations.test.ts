import { beforeEach, describe, expect, it, vi } from "vitest";
import { applySaveMigrations } from "../migrations";
import { CURRENT_SAVE_VERSION, SAVE_KEY } from "../types";

// mock localStorage for testing in node environment
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
};

// attach mock before importing save/load (they reference localStorage at call time)
vi.stubGlobal("localStorage", localStorageMock);

// import after mocking so they use our mock
const { saveGame, deleteSave } = await import("../save");
const { loadGame } = await import("../load");

beforeEach(() => {
  // clear mock storage between tests
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key];
  }
  vi.clearAllMocks();
});

describe("saveGame", () => {
  it("writes a valid JSON save to localStorage", () => {
    const result = saveGame({
      currencies: { scrap: 100, lifetimeScrap: 500, intel: 10, totalIntelEarned: 10 },
      upgrades: { scrap_per_reveal: 2 },
      prestigeCount: 1,
    });

    expect(result).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(SAVE_KEY, expect.any(String));

    const saved = JSON.parse(mockStorage[SAVE_KEY]);
    expect(saved.version).toBe(CURRENT_SAVE_VERSION);
    expect(saved.currencies.scrap).toBe(100);
    expect(saved.currencies.intel).toBe(10);
    expect(saved.upgrades.scrap_per_reveal).toBe(2);
    expect(saved.prestigeCount).toBe(1);
    expect(saved.timestamp).toBeGreaterThan(0);
  });

  it("includes default settings when none provided", () => {
    saveGame({
      currencies: { scrap: 0, lifetimeScrap: 0, intel: 0, totalIntelEarned: 0 },
      upgrades: {},
      prestigeCount: 0,
    });

    const saved = JSON.parse(mockStorage[SAVE_KEY]);
    expect(saved.settings.showTimer).toBe(true);
    expect(saved.settings.showMineCount).toBe(true);
    expect(saved.settings.enableTooltips).toBe(true);
  });
});

describe("loadGame", () => {
  it("returns null when no save exists", () => {
    expect(loadGame()).toBeNull();
  });

  it("loads a valid save correctly", () => {
    mockStorage[SAVE_KEY] = JSON.stringify({
      version: CURRENT_SAVE_VERSION,
      timestamp: Date.now(),
      currencies: { scrap: 200, lifetimeScrap: 1000, intel: 5, totalIntelEarned: 5 },
      upgrades: { flood_bonus: 3 },
      prestigeCount: 2,
      settings: { showTimer: true, showMineCount: true, enableTooltips: false },
    });

    const save = loadGame();
    expect(save).not.toBeNull();
    expect(save!.currencies.scrap).toBe(200);
    expect(save!.upgrades.flood_bonus).toBe(3);
    expect(save!.prestigeCount).toBe(2);
    expect(save!.settings.enableTooltips).toBe(false);
  });

  it("fills in missing fields with defaults", () => {
    mockStorage[SAVE_KEY] = JSON.stringify({
      version: CURRENT_SAVE_VERSION,
      // missing most fields
    });

    const save = loadGame();
    expect(save).not.toBeNull();
    expect(save!.currencies.scrap).toBe(0);
    expect(save!.currencies.intel).toBe(0);
    expect(save!.currencies.totalIntelEarned).toBe(0);
    expect(save!.upgrades).toEqual({});
    expect(save!.prestigeCount).toBe(0);
  });

  it("returns null for invalid JSON", () => {
    mockStorage[SAVE_KEY] = "not valid json!!!";
    expect(loadGame()).toBeNull();
  });
});

describe("deleteSave", () => {
  it("removes the save from localStorage", () => {
    mockStorage[SAVE_KEY] = JSON.stringify({ version: 1 });
    deleteSave();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith(SAVE_KEY);
  });
});

describe("applySaveMigrations", () => {
  it("returns save unchanged when already at target version", () => {
    const save = { version: CURRENT_SAVE_VERSION, scrap: 100 };
    const result = applySaveMigrations(save, CURRENT_SAVE_VERSION);
    expect(result).toEqual(save);
  });

  it("handles v0 saves by bumping to v1", () => {
    const save = { version: 0, currencies: { scrap: 50 } };
    const result = applySaveMigrations(save, 1);
    expect(result).not.toBeNull();
    expect(result!.version).toBe(1);
  });

  it("warns but doesn't crash on future version saves", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const save = { version: 999 };
    const result = applySaveMigrations(save, CURRENT_SAVE_VERSION);
    expect(result).not.toBeNull();
    spy.mockRestore();
  });
});
