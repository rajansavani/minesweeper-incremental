import { applySaveMigrations } from "./migrations";
import type { SaveFile } from "./types";
import { CURRENT_SAVE_VERSION, SAVE_KEY } from "./types";

// reads the save file from localStorage, parses it, runs any necessary migrations, and returns the result
// returns null if no save exists, if parsing fails, or if migration fails
export function loadGame(): SaveFile | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") {
      console.warn("save file is not a valid object");
      return null;
    }

    // check version and apply migrations if needed
    const version = parsed.version ?? 0;

    if (version < CURRENT_SAVE_VERSION) {
      const migrated = applySaveMigrations(parsed, CURRENT_SAVE_VERSION);
      if (!migrated) {
        console.error("save migration failed — starting fresh");
        return null;
      }
      return validateSave(migrated);
    }

    return validateSave(parsed);
  } catch (err) {
    console.error("failed to load save:", err);
    return null;
  }
}

// validates that a parsed save has the expected shape
// fills in missing fields with defaults (to prevent crashes from old save or corruption)
function validateSave(data: Record<string, unknown>): SaveFile {
  const currencies = (data.currencies ?? {}) as Record<string, unknown>;
  const settings = (data.settings ?? {}) as Record<string, unknown>;

  return {
    version: CURRENT_SAVE_VERSION,
    timestamp: (data.timestamp as number) ?? Date.now(),
    currencies: {
      scrap: (currencies.scrap as number) ?? 0,
      lifetimeScrap: (currencies.lifetimeScrap as number) ?? 0,
      intel: (currencies.intel as number) ?? 0,
      totalIntelEarned: (currencies.totalIntelEarned as number) ?? 0,
    },
    upgrades: (data.upgrades as Record<string, number>) ?? {},
    prestigeCount: (data.prestigeCount as number) ?? 0,
    level: (data.level as number) ?? 1,
    xp: (data.xp as number) ?? 0,
    settings: {
      showTimer: (settings.showTimer as boolean) ?? true,
      showMineCount: (settings.showMineCount as boolean) ?? true,
      enableTooltips: (settings.enableTooltips as boolean) ?? true,
    },
  };
}
