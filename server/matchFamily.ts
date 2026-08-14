export type MetadataCarrier = { metadata?: string | null };

/**
 * Reads the user-facing Match Family token from generation metadata.
 * Invalid legacy metadata is intentionally treated as ungrouped rather than an error.
 */
export function readMatchFamilyId(metadata?: string | null): string | null {
  if (!metadata) return null;
  try {
    const parsed = JSON.parse(metadata) as { matchFamilyId?: unknown };
    return typeof parsed.matchFamilyId === "string" && /^F-\d+$/.test(parsed.matchFamilyId)
      ? parsed.matchFamilyId
      : null;
  } catch {
    return null;
  }
}

/**
 * Creates the next compact family label for a creator. Families are intentionally
 * human-readable rather than database IDs: F-01, F-02, and so on.
 */
export function getNextMatchFamilyId(generations: MetadataCarrier[]): string {
  const highest = generations.reduce((max, generation) => {
    const family = readMatchFamilyId(generation.metadata);
    if (!family) return max;
    const value = Number.parseInt(family.slice(2), 10);
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);

  return `F-${String(highest + 1).padStart(2, "0")}`;
}
