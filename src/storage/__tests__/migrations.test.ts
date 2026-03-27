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

vi.stubGlobal("localStorage", localStorageMock);

const { saveGame, deleteSave } = await import("../save");
const { loadGame } = await import("../load");

beforeEach(() => {
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
      level: 3,
      xp: 42,
    });

    expect(result).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(SAVE_KEY, expect.any(String));

    const saved = JSON.parse(mockStorage[SAVE_KEY]);
    expect(saved.version).toBe(CURRENT_SAVE_VERSION);
    expect(saved.currencies.scrap).toBe(100);
    expect(saved.level).toBe(3);
    expect(saved.xp).toBe(42);
  });
});

describe("loadGame", () => {
  it("returns null when no save exists", () => {
    expect(loadGame()).toBeNull();
  });

  it("loads a valid v2 save correctly", () => {
    mockStorage[SAVE_KEY] = JSON.stringify({
      version: 2,
      timestamp: Date.now(),
      currencies: { scrap: 200, lifetimeScrap: 1000, intel: 5, totalIntelEarned: 5 },
      upgrades: { scrap_per_reveal: 3 },
      prestigeCount: 2,
      level: 7,
      xp: 120,
      settings: { showTimer: true, showMineCount: true, enableTooltips: false },
    });

    const save = loadGame();
    expect(save).not.toBeNull();
    expect(save!.currencies.scrap).toBe(200);
    expect(save!.level).toBe(7);
    expect(save!.xp).toBe(120);
    expect(save!.prestigeCount).toBe(2);
  });

  it("fills in missing fields with defaults", () => {
    mockStorage[SAVE_KEY] = JSON.stringify({
      version: CURRENT_SAVE_VERSION,
    });

    const save = loadGame();
    expect(save).not.toBeNull();
    expect(save!.currencies.scrap).toBe(0);
    expect(save!.level).toBe(1);
    expect(save!.xp).toBe(0);
  });

  it("returns null for invalid JSON", () => {
    mockStorage[SAVE_KEY] = "not valid json!!!";
    expect(loadGame()).toBeNull();
  });
});

describe("deleteSave", () => {
  it("removes the save from localStorage", () => {
    mockStorage[SAVE_KEY] = JSON.stringify({ version: 2 });
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

  // test 0.1.0 -> 0.1.1 migration
  it("migrates v1 save to v2 by adding level and xp", () => {
    const v1Save = {
      version: 1,
      currencies: { scrap: 500, lifetimeScrap: 2000, intel: 10, totalIntelEarned: 10 },
      upgrades: { scrap_per_reveal: 2 },
      prestigeCount: 1,
    };

    const result = applySaveMigrations(v1Save, 2);
    expect(result).not.toBeNull();
    expect(result!.version).toBe(2);
    expect(result!.level).toBe(1);
    expect(result!.xp).toBe(0);
    // original data preserved
    expect((result!.currencies as Record<string, number>).scrap).toBe(500);
  });

  it("handles v0 saves by bumping to v1 then migrating", () => {
    const save = { version: 0, currencies: { scrap: 50 } };
    const result = applySaveMigrations(save, 2);
    expect(result).not.toBeNull();
    expect(result!.version).toBe(2);
    expect(result!.level).toBe(1);
  });

  it("warns but doesn't crash on future version saves", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const save = { version: 999 };
    const result = applySaveMigrations(save, CURRENT_SAVE_VERSION);
    expect(result).not.toBeNull();
    spy.mockRestore();
  });
});
