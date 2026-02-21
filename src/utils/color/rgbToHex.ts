/**
 * Color conversion utility: RGB/RGBA to Hex
 *
 * Converts CSS color strings from rgb()/rgba() format to #rrggbb hex format.
 * Extracted from FloatingEditPanel component for independent reuse and testing.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

/**
 * Converts an RGB or RGBA color string to a hexadecimal color string.
 *
 * - `rgb(r, g, b)` → `#rrggbb`
 * - `rgba(r, g, b, a)` → `#rrggbb` (alpha channel is ignored)
 * - `#...` (already hex) → returned as-is
 * - Unrecognized format → `#000000`
 *
 * @param rgb - A CSS color string in rgb(), rgba(), or hex format
 * @returns The corresponding `#rrggbb` hex string
 */
export function rgbToHex(rgb: string): string {
  // Handle rgb() format
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (match) {
    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  // Handle rgba() format
  const matchAlpha = rgb.match(/^rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)$/);
  if (matchAlpha) {
    const r = parseInt(matchAlpha[1]);
    const g = parseInt(matchAlpha[2]);
    const b = parseInt(matchAlpha[3]);
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  // If already hex, return as is; otherwise return default
  return rgb.startsWith('#') ? rgb : '#000000';
}
