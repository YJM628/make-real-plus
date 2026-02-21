/**
 * Compares two style objects and returns only the properties that have changed.
 *
 * Iterates over all keys in `current`. If a value differs from the corresponding
 * key in `initial`, it is included in the result. This approach automatically
 * detects changes for any new style properties without requiring modifications
 * to the comparison logic.
 *
 * @param initial - The original style state
 * @param current - The current (possibly modified) style state
 * @returns An object containing only the properties whose values differ
 */
export function getStyleDiff(
  initial: Record<string, string>,
  current: Record<string, string>
): Record<string, string> {
  const diff: Record<string, string> = {};

  for (const key of Object.keys(current)) {
    if (current[key] !== initial[key]) {
      diff[key] = current[key];
    }
  }

  return diff;
}
