/**
 * Splits a CSV cell holding several names, such as
 * "Yoram Globus and Menahem Golan" or "Producer A, Producer B and Producer C",
 * into individual, trimmed and de-duplicated names.
 *
 * Separators: commas and the standalone word "and" (case-insensitive).
 * Names that merely contain "and" (e.g. "Alexandra", "Andrew") are preserved.
 */
const SEPARATOR = /\s*,\s*(?:and\s+)?|\s+and\s+/i;

export function parseNameList(raw: string | undefined): string[] {
  if (!raw) return [];

  const names = raw
    .split(SEPARATOR)
    .map((name) => name.replace(/\s+/g, ' ').trim())
    .filter((name) => name.length > 0);

  return [...new Set(names)];
}
