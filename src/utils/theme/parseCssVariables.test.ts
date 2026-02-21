/**
 * Unit tests and property-based tests for parseCssVariables
 * Feature: global-theme-editor
 * Requirements: 2.1
 */

import * as fc from 'fast-check';
import {
  parseCssVariables,
  serializeCssVariables,
  classifyVariable,
  type CssVariable,
} from './parseCssVariables';

describe('parseCssVariables', () => {
  describe('parseCssVariables()', () => {
    it('should return empty array for empty string', () => {
      expect(parseCssVariables('')).toEqual([]);
    });

    it('should return empty array for whitespace-only string', () => {
      expect(parseCssVariables('   \n\t  ')).toEqual([]);
    });

    it('should return empty array when no :root block exists', () => {
      const css = 'body { margin: 0; } .container { padding: 10px; }';
      expect(parseCssVariables(css)).toEqual([]);
    });

    it('should parse a single CSS variable from :root', () => {
      const css = ':root { --primary-color: #3b82f6; }';
      const result = parseCssVariables(css);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        name: '--primary-color',
        value: '#3b82f6',
        category: 'color',
      });
    });

    it('should parse multiple CSS variables from :root', () => {
      const css = `:root {
        --primary-color: #3b82f6;
        --font-family: 'Inter', sans-serif;
        --spacing-md: 16px;
        --border-width: 1px;
      }`;
      const result = parseCssVariables(css);

      expect(result).toHaveLength(4);
      expect(result[0].name).toBe('--primary-color');
      expect(result[1].name).toBe('--font-family');
      expect(result[2].name).toBe('--spacing-md');
      expect(result[3].name).toBe('--border-width');
    });

    it('should handle :root block with extra whitespace', () => {
      const css = '  :root  {  --my-var:  hello  ;  }  ';
      const result = parseCssVariables(css);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('--my-var');
      expect(result[0].value).toBe('hello');
    });

    it('should handle multiple :root blocks', () => {
      const css = ':root { --a: 1px; } :root { --b: 2px; }';
      const result = parseCssVariables(css);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('--a');
      expect(result[1].name).toBe('--b');
    });

    it('should ignore non-custom-property declarations in :root', () => {
      const css = ':root { color: red; --my-var: blue; font-size: 16px; }';
      const result = parseCssVariables(css);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('--my-var');
    });

    it('should handle CSS with :root and other selectors', () => {
      const css = `
        body { margin: 0; }
        :root { --primary: #ff0000; }
        .container { padding: 10px; }
      `;
      const result = parseCssVariables(css);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('--primary');
      expect(result[0].value).toBe('#ff0000');
    });

    it('should handle values with spaces (e.g. font families)', () => {
      const css = `:root { --font-family: 'Inter', sans-serif; }`;
      const result = parseCssVariables(css);

      expect(result).toHaveLength(1);
      expect(result[0].value).toBe("'Inter', sans-serif");
    });

    it('should handle rgb/hsl values', () => {
      const css = ':root { --accent: rgb(59, 130, 246); --highlight: hsl(210, 100%, 50%); }';
      const result = parseCssVariables(css);

      expect(result).toHaveLength(2);
      expect(result[0].category).toBe('color');
      expect(result[1].category).toBe('color');
    });
  });

  describe('classifyVariable()', () => {
    // Color classification
    it('should classify variables with "color" in name as color', () => {
      expect(classifyVariable('--primary-color', '16px')).toBe('color');
      expect(classifyVariable('--text-color', '#fff')).toBe('color');
      expect(classifyVariable('--color-accent', 'blue')).toBe('color');
    });

    it('should classify variables with "bg" in name as color', () => {
      expect(classifyVariable('--bg-primary', '#fff')).toBe('color');
      expect(classifyVariable('--card-bg', '#f0f0f0')).toBe('color');
    });

    it('should classify variables with "background" in name as color', () => {
      expect(classifyVariable('--background-main', '#fff')).toBe('color');
      expect(classifyVariable('--page-background', 'white')).toBe('color');
    });

    it('should classify variables with hex values as color', () => {
      expect(classifyVariable('--accent', '#3b82f6')).toBe('color');
      expect(classifyVariable('--accent', '#fff')).toBe('color');
      expect(classifyVariable('--accent', '#aabbccdd')).toBe('color');
    });

    it('should classify variables with rgb/hsl values as color', () => {
      expect(classifyVariable('--accent', 'rgb(59, 130, 246)')).toBe('color');
      expect(classifyVariable('--accent', 'rgba(59, 130, 246, 0.5)')).toBe('color');
      expect(classifyVariable('--accent', 'hsl(210, 100%, 50%)')).toBe('color');
      expect(classifyVariable('--accent', 'hsla(210, 100%, 50%, 0.5)')).toBe('color');
    });

    // Font classification
    it('should classify variables with "font" in name as font', () => {
      expect(classifyVariable('--font-family', 'Inter')).toBe('font');
      expect(classifyVariable('--font-size-lg', '18px')).toBe('font');
      expect(classifyVariable('--heading-font', 'Georgia')).toBe('font');
    });

    it('should classify variables with "text" in name as font (when not color)', () => {
      expect(classifyVariable('--text-size', '14px')).toBe('font');
      expect(classifyVariable('--text-weight', '600')).toBe('font');
    });

    it('should classify "text-color" as color (color takes priority)', () => {
      expect(classifyVariable('--text-color', '#333')).toBe('color');
    });

    // Spacing classification
    it('should classify variables with "spacing" in name as spacing', () => {
      expect(classifyVariable('--spacing-sm', '8px')).toBe('spacing');
      expect(classifyVariable('--spacing-md', '16px')).toBe('spacing');
    });

    it('should classify variables with "gap" in name as spacing', () => {
      expect(classifyVariable('--gap-sm', '8px')).toBe('spacing');
      expect(classifyVariable('--grid-gap', '16px')).toBe('spacing');
    });

    it('should classify variables with "margin" in name as spacing', () => {
      expect(classifyVariable('--margin-top', '10px')).toBe('spacing');
      expect(classifyVariable('--section-margin', '24px')).toBe('spacing');
    });

    it('should classify variables with "padding" in name as spacing', () => {
      expect(classifyVariable('--padding-sm', '8px')).toBe('spacing');
      expect(classifyVariable('--card-padding', '16px')).toBe('spacing');
    });

    it('should classify variables with "radius" in name as spacing', () => {
      expect(classifyVariable('--border-radius', '4px')).toBe('spacing');
      expect(classifyVariable('--radius-lg', '12px')).toBe('spacing');
    });

    // Other classification
    it('should classify unmatched variables as other', () => {
      expect(classifyVariable('--border-width', '1px')).toBe('other');
      expect(classifyVariable('--z-index', '100')).toBe('other');
      expect(classifyVariable('--transition-speed', '0.3s')).toBe('other');
      expect(classifyVariable('--opacity', '0.8')).toBe('other');
    });
  });

  describe('serializeCssVariables()', () => {
    it('should serialize empty array to empty :root block', () => {
      expect(serializeCssVariables([])).toBe(':root {\n}');
    });

    it('should serialize a single variable', () => {
      const variables: CssVariable[] = [
        { name: '--primary-color', value: '#3b82f6', category: 'color' },
      ];
      const result = serializeCssVariables(variables);

      expect(result).toBe(':root {\n  --primary-color: #3b82f6;\n}');
    });

    it('should serialize multiple variables', () => {
      const variables: CssVariable[] = [
        { name: '--primary-color', value: '#3b82f6', category: 'color' },
        { name: '--font-family', value: "'Inter', sans-serif", category: 'font' },
        { name: '--spacing-md', value: '16px', category: 'spacing' },
      ];
      const result = serializeCssVariables(variables);

      expect(result).toContain('--primary-color: #3b82f6;');
      expect(result).toContain("--font-family: 'Inter', sans-serif;");
      expect(result).toContain('--spacing-md: 16px;');
      expect(result).toMatch(/^:root \{/);
      expect(result).toMatch(/\}$/);
    });
  });

  describe('round-trip consistency', () => {
    it('should preserve variables through serialize → parse round-trip', () => {
      const original: CssVariable[] = [
        { name: '--primary-color', value: '#3b82f6', category: 'color' },
        { name: '--font-family', value: 'Inter', category: 'font' },
        { name: '--spacing-md', value: '16px', category: 'spacing' },
        { name: '--border-width', value: '1px', category: 'other' },
      ];

      const serialized = serializeCssVariables(original);
      const parsed = parseCssVariables(serialized);

      expect(parsed).toHaveLength(original.length);
      for (let i = 0; i < original.length; i++) {
        expect(parsed[i].name).toBe(original[i].name);
        expect(parsed[i].value).toBe(original[i].value);
      }
    });

    it('should preserve variables through parse → serialize → parse round-trip', () => {
      const css = `:root {
        --primary-color: #3b82f6;
        --font-family: Inter;
        --spacing-md: 16px;
      }`;

      const parsed1 = parseCssVariables(css);
      const serialized = serializeCssVariables(parsed1);
      const parsed2 = parseCssVariables(serialized);

      expect(parsed2).toHaveLength(parsed1.length);
      for (let i = 0; i < parsed1.length; i++) {
        expect(parsed2[i].name).toBe(parsed1[i].name);
        expect(parsed2[i].value).toBe(parsed1[i].value);
      }
    });
  });

  // ============================================================
  // Property-Based Tests (fast-check)
  // ============================================================

  describe('Property-Based Tests', () => {
    // Helper: build a string from an array of characters
    const stringFromChars = (chars: string, minLen: number, maxLen: number) =>
      fc
        .array(fc.constantFrom(...chars.split('')), {
          minLength: minLen,
          maxLength: maxLen,
        })
        .map((arr: string[]) => arr.join(''));

    // Feature: global-theme-editor, Property 1: CSS 变量解析往返一致性
    // **Validates: Requirements 2.1**
    describe('Property 1: CSS variable round-trip consistency', () => {
      /**
       * Generator for a valid CSS variable name segment.
       * Produces lowercase alphanumeric strings suitable for CSS custom property names.
       */
      const cssNameSegment = stringFromChars(
        'abcdefghijklmnopqrstuvwxyz0123456789',
        1,
        10
      ).filter((s: string) => /^[a-z]/.test(s));

      /**
       * Generator for a valid CSS variable name (e.g. "--my-var-name").
       * Uses 1-3 segments joined by hyphens, prefixed with "--".
       */
      const cssVarName = fc
        .array(cssNameSegment, { minLength: 1, maxLength: 3 })
        .map((segments: string[]) => `--${segments.join('-')}`);

      /**
       * Generator for a valid CSS variable value.
       * Values must not contain semicolons, closing braces, or newlines
       * (which would break the CSS parser). Also must not be empty or whitespace-only.
       */
      const cssVarValue = stringFromChars(
        'abcdefghijklmnopqrstuvwxyz0123456789 .,#()%_-+/',
        1,
        30
      ).filter((s: string) => s.trim().length > 0);

      /**
       * Generator for a valid CssVariable object.
       */
      const cssVariableArb: fc.Arbitrary<CssVariable> = fc
        .tuple(cssVarName, cssVarValue)
        .map(([name, value]: [string, string]) => ({
          name,
          value: value.trim(),
          category: classifyVariable(name, value.trim()),
        }))
        .filter((v: CssVariable) => v.value.length > 0);

      /**
       * Generator for an array of CssVariables with unique names.
       */
      const cssVariableArrayArb = fc
        .array(cssVariableArb, { minLength: 1, maxLength: 10 })
        .map((vars: CssVariable[]) => {
          const seen = new Set<string>();
          return vars.filter((v: CssVariable) => {
            if (seen.has(v.name)) return false;
            seen.add(v.name);
            return true;
          });
        })
        .filter((vars: CssVariable[]) => vars.length > 0);

      it('should preserve variable names and values through serialize → parse round-trip', () => {
        fc.assert(
          fc.property(cssVariableArrayArb, (variables: CssVariable[]) => {
            const serialized = serializeCssVariables(variables);
            const parsed = parseCssVariables(serialized);

            // Same number of variables
            expect(parsed).toHaveLength(variables.length);

            // Each variable's name and value should be preserved
            for (let i = 0; i < variables.length; i++) {
              expect(parsed[i].name).toBe(variables[i].name);
              expect(parsed[i].value).toBe(variables[i].value);
            }
          }),
          { numRuns: 100 }
        );
      });

      it('should produce idempotent results: parse(serialize(parse(serialize(vars)))) === parse(serialize(vars))', () => {
        fc.assert(
          fc.property(cssVariableArrayArb, (variables: CssVariable[]) => {
            const serialized1 = serializeCssVariables(variables);
            const parsed1 = parseCssVariables(serialized1);
            const serialized2 = serializeCssVariables(parsed1);
            const parsed2 = parseCssVariables(serialized2);

            expect(parsed2).toHaveLength(parsed1.length);
            for (let i = 0; i < parsed1.length; i++) {
              expect(parsed2[i].name).toBe(parsed1[i].name);
              expect(parsed2[i].value).toBe(parsed1[i].value);
              expect(parsed2[i].category).toBe(parsed1[i].category);
            }
          }),
          { numRuns: 100 }
        );
      });
    });

    // Feature: global-theme-editor, Property 2: CSS 变量分类正确性
    // **Validates: Requirements 2.1**
    describe('Property 2: CSS variable classification correctness', () => {
      /**
       * Generator for a CSS variable name segment (no category keywords).
       */
      const neutralSegment = stringFromChars(
        'abcdefghijklmnopqrstuvwxyz',
        2,
        8
      ).filter(
        (s: string) =>
          !s.includes('color') &&
          !s.includes('bg') &&
          !s.includes('background') &&
          !s.includes('font') &&
          !s.includes('text') &&
          !s.includes('spacing') &&
          !s.includes('gap') &&
          !s.includes('margin') &&
          !s.includes('padding') &&
          !s.includes('radius')
      );

      /**
       * Generator for a non-color value (no hex/rgb/hsl patterns).
       */
      const nonColorValue = stringFromChars(
        'abcdefghijklmnopqrstuvwxyz0123456789 px%em',
        1,
        20
      ).filter(
        (s: string) =>
          s.trim().length > 0 &&
          !/^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s.trim()) &&
          !/^(rgb|rgba|hsl|hsla)\s*\(/.test(s.trim())
      );

      /**
       * Generator for hex color values.
       */
      const hexColor = fc
        .constantFrom(3, 4, 6, 8)
        .chain((len: number) =>
          stringFromChars('0123456789abcdef', len, len).map(
            (hex: string) => `#${hex}`
          )
        );

      /**
       * Generator for rgb/hsl color values.
       */
      const funcColor = fc
        .tuple(
          fc.constantFrom('rgb', 'rgba', 'hsl', 'hsla'),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 }),
          fc.integer({ min: 0, max: 255 })
        )
        .map(
          ([fn, a, b, c]: [string, number, number, number]) =>
            `${fn}(${a}, ${b}, ${c})`
        );

      const colorValue = fc.oneof(hexColor, funcColor);

      // Color keyword segments for variable names
      const colorKeyword = fc.constantFrom('color', 'bg', 'background');

      // Font keyword segments for variable names
      const fontKeyword = fc.constantFrom('font');

      // Spacing keyword segments for variable names
      const spacingKeyword = fc.constantFrom(
        'spacing',
        'gap',
        'margin',
        'padding',
        'radius'
      );

      it('should classify names containing color/bg/background as "color"', () => {
        fc.assert(
          fc.property(
            colorKeyword,
            neutralSegment,
            nonColorValue,
            (keyword: string, segment: string, value: string) => {
              const name = `--${segment}-${keyword}`;
              const result = classifyVariable(name, value.trim());
              expect(result).toBe('color');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should classify values matching color formats as "color" (when name is neutral)', () => {
        fc.assert(
          fc.property(
            neutralSegment,
            colorValue,
            (segment: string, value: string) => {
              const name = `--${segment}`;
              const result = classifyVariable(name, value);
              expect(result).toBe('color');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should classify names containing "font" as "font" (when name has no color keywords and value is not a color)', () => {
        fc.assert(
          fc.property(
            fontKeyword,
            neutralSegment,
            nonColorValue,
            (keyword: string, segment: string, value: string) => {
              const name = `--${segment}-${keyword}`;
              const result = classifyVariable(name, value.trim());
              expect(result).toBe('font');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should classify names containing spacing/gap/margin/padding/radius as "spacing" (when name has no color or font keywords and value is not a color)', () => {
        fc.assert(
          fc.property(
            spacingKeyword,
            neutralSegment,
            nonColorValue,
            (keyword: string, segment: string, value: string) => {
              const name = `--${segment}-${keyword}`;
              const lowerName = name.toLowerCase();
              // Skip if name accidentally contains higher-priority keywords
              fc.pre(
                !lowerName.includes('color') &&
                  !lowerName.includes('bg') &&
                  !lowerName.includes('background') &&
                  !lowerName.includes('font') &&
                  !lowerName.includes('text')
              );
              const result = classifyVariable(name, value.trim());
              expect(result).toBe('spacing');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should classify variables with no matching keywords and non-color values as "other"', () => {
        fc.assert(
          fc.property(
            neutralSegment,
            nonColorValue,
            (segment: string, value: string) => {
              const name = `--${segment}`;
              const lowerName = name.toLowerCase();
              // Ensure no category keywords are present
              fc.pre(
                !lowerName.includes('color') &&
                  !lowerName.includes('bg') &&
                  !lowerName.includes('background') &&
                  !lowerName.includes('font') &&
                  !lowerName.includes('text') &&
                  !lowerName.includes('spacing') &&
                  !lowerName.includes('gap') &&
                  !lowerName.includes('margin') &&
                  !lowerName.includes('padding') &&
                  !lowerName.includes('radius')
              );
              const result = classifyVariable(name, value.trim());
              expect(result).toBe('other');
            }
          ),
          { numRuns: 100 }
        );
      });

      it('should ensure color classification takes priority over font and spacing', () => {
        fc.assert(
          fc.property(
            fc.constantFrom(
              'font',
              'spacing',
              'gap',
              'margin',
              'padding',
              'radius'
            ),
            colorKeyword,
            neutralSegment,
            nonColorValue,
            (
              otherKeyword: string,
              colorKw: string,
              segment: string,
              value: string
            ) => {
              // Name contains both a color keyword and another keyword
              const name = `--${segment}-${colorKw}-${otherKeyword}`;
              const result = classifyVariable(name, value.trim());
              expect(result).toBe('color');
            }
          ),
          { numRuns: 100 }
        );
      });
    });
  });
});
