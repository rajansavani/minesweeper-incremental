import type { Migration } from "./types";

export const migrations: Migration[] = [
  // future migrations go here
];

// applies all necessary migrations to bring a save up to the target version
// returns the migrated save object, or null if migration fails
export function applySaveMigrations(
  save: Record<string, unknown>,
  targetVersion: number,
): Record<string, unknown> | null {
  let current = { ...save };
  let version = (current.version as number) ?? 0;

  // don't migrate saves from the future
  if (version > targetVersion) {
    console.warn(
      `save version ${version} is newer than current ${targetVersion} — skipping migration`,
    );
    return current;
  }

  // apply each migration in order
  while (version < targetVersion) {
    const migrationIndex = version - 1; // v1→v2 is migrations[0]

    // if we're at v0 (very old or corrupted), jump to v1
    if (version === 0) {
      current = { ...current, version: 1 };
      version = 1;
      continue;
    }

    if (migrationIndex < 0 || migrationIndex >= migrations.length) {
      // no migration available for this version -> current
      break;
    }

    try {
      current = migrations[migrationIndex](current);
      version = (current.version as number) ?? version + 1;
    } catch (err) {
      console.error(`migration v${version} → v${version + 1} failed:`, err);
      return null;
    }
  }

  return current;
}
