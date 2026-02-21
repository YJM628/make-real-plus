/**
 * CSS Variable Parser and Serializer
 * Parses CSS custom properties from :root blocks and classifies them by category.
 * Feature: global-theme-editor
 * Requirements: 2.1
 */

/**
 * Represents a parsed CSS custom property with its classification.
 */
export interface CssVariable {
  /** CSS variable name, e.g. "--primary-color" */
  name: string;
  /** Current value, e.g. "#3b82f6" */
  value: string;
  /** Auto-classified category */
  category: 'color' | 'font' | 'spacing' | 'other';
}

/**
 * Classify a CSS variable based on its name and value.
 *
 * Classification rules (evaluated in order):
 * 1. color: variable name contains "color", "bg", "background",
 *    OR value matches hex (#xxx/#xxxxxx), rgb(, or hsl( patterns
 * 2. font: variable name contains "font" or "text" (excluding names that
 *    also match color, e.g. "text-color")
 * 3. spacing: variable name contains "spacing", "gap", "margin", "padding", or "radius"
 * 4. other: everything else
 *
 * @param name - CSS variable name (e.g. "--primary-color")
 * @param value - CSS variable value (e.g. "#3b82f6")
 * @returns The classified category
 */
export function classifyVariable(name: string, value: string): CssVariable['category'] {
  const lowerName = name.toLowerCase();
  const lowerValue = value.toLowerCase().trim();

  // Color: name contains color/bg/background OR value matches color patterns
  if (
    lowerName.includes('color') ||
    lowerName.includes('bg') ||
    lowerName.includes('background')
  ) {
    return 'color';
  }

  // Check value for color patterns: hex, rgb(, hsl(
  if (isColorValue(lowerValue)) {
    return 'color';
  }

  // Font: name contains "font" or "text" (but not if it already matched color above)
  // "text-color" would have been caught by the color check above since it contains "color"
  if (lowerName.includes('font') || lowerName.includes('text')) {
    return 'font';
  }

  // Spacing: name contains spacing/gap/margin/padding/radius
  if (
    lowerName.includes('spacing') ||
    lowerName.includes('gap') ||
    lowerName.includes('margin') ||
    lowerName.includes('padding') ||
    lowerName.includes('radius')
  ) {
    return 'spacing';
  }

  return 'other';
}

/**
 * Check if a value string represents a CSS color.
 * Matches hex colors (#xxx, #xxxx, #xxxxxx, #xxxxxxxx), rgb(, rgba(, hsl(, hsla( patterns.
 *
 * @param value - Lowercased, trimmed CSS value
 * @returns true if the value looks like a color
 */
function isColorValue(value: string): boolean {
  // Hex color: #xxx, #xxxx, #xxxxxx, #xxxxxxxx
  if (/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
    return true;
  }

  // rgb( or rgba( or hsl( or hsla(
  if (/^(rgb|rgba|hsl|hsla)\s*\(/.test(value)) {
    return true;
  }

  return false;
}

/**
 * Parse CSS custom properties from a CSS text string.
 * Extracts variables defined within `:root { ... }` blocks.
 *
 * @param cssText - CSS text potentially containing :root blocks with custom properties
 * @returns Array of parsed and classified CSS variables
 */
export function parseCssVariables(cssText: string): CssVariable[] {
  if (!cssText || cssText.trim() === '') {
    return [];
  }

  const variables: CssVariable[] = [];

  // Match :root { ... } blocks (handles nested braces are unlikely in :root, but be safe)
  const rootBlockRegex = /:root\s*\{([^}]*)\}/gi;
  let rootMatch: RegExpExecArray | null;

  while ((rootMatch = rootBlockRegex.exec(cssText)) !== null) {
    const blockContent = rootMatch[1];

    // Match CSS custom property declarations: --name: value;
    // Value can contain anything except semicolons (handles complex values)
    const varRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let varMatch: RegExpExecArray | null;

    while ((varMatch = varRegex.exec(blockContent)) !== null) {
      const name = varMatch[1].trim();
      const value = varMatch[2].trim();

      variables.push({
        name,
        value,
        category: classifyVariable(name, value),
      });
    }
  }

  return variables;
}

/**
 * Serialize an array of CSS variables back into a CSS :root block string.
 *
 * @param variables - Array of CSS variables to serialize
 * @returns CSS text with variables inside a :root block
 */
export function serializeCssVariables(variables: CssVariable[]): string {
  if (variables.length === 0) {
    return ':root {\n}';
  }

  const lines = variables.map((v) => `  ${v.name}: ${v.value};`);
  return `:root {\n${lines.join('\n')}\n}`;
}
