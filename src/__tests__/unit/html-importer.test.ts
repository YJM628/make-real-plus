/**
 * Unit tests for HTML Importer
 * Feature: ai-html-visual-editor
 * 
 * Tests the HTML import functionality including:
 * - File reading and parsing
 * - External resource detection
 * - Identifier injection
 * - Security warnings
 * - Auto-layout positioning
 * 
 * Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6
 */

import {
  importHtmlFile,
  calculateAutoLayoutPositions,
  promptForExternalResources,
} from '../../utils/import/htmlImporter';

describe('HTML Importer', () => {
  describe('importHtmlFile', () => {
    it('should import a simple HTML file', async () => {
      // Create a mock file
      const htmlContent = '<div><h1>Hello World</h1><p>Test content</p></div>';
      const file = new File([htmlContent], 'test.html', { type: 'text/html' });
      
      const result = await importHtmlFile(file);
      
      expect(result.filename).toBe('test.html');
      expect(result.parseResult).toBeDefined();
      expect(result.parseResult.root).toBeDefined();
      expect(result.warnings).toBeDefined();
    });

    it('should detect external stylesheets', async () => {
      const htmlContent = `
        <html>
          <head>
            <link rel="stylesheet" href="https://example.com/style.css">
          </head>
          <body>
            <div>Content</div>
          </body>
        </html>
      `;
      const file = new File([htmlContent], 'test.html', { type: 'text/html' });
      
      const result = await importHtmlFile(file);
      
      expect(result.warnings.externalStylesheets).toContain('https://example.com/style.css');
    });

    it('should detect external scripts', async () => {
      const htmlContent = `
        <html>
          <head>
            <script src="https://example.com/script.js"></script>
          </head>
          <body>
            <div>Content</div>
          </body>
        </html>
      `;
      const file = new File([htmlContent], 'test.html', { type: 'text/html' });
      
      const result = await importHtmlFile(file);
      
      expect(result.warnings.externalScripts).toContain('https://example.com/script.js');
    });

    it('should inject identifiers by default', async () => {
      const htmlContent = `
        <div>
          <button>Click me</button>
          <a href="#">Link</a>
          <input type="text">
        </div>
      `;
      const file = new File([htmlContent], 'test.html', { type: 'text/html' });
      
      const result = await importHtmlFile(file);
      
      expect(result.identifiersInjected).toBe(true);
      // Check that interactive elements have identifiers
      const elements = Array.from(result.parseResult.elementMap.values());
      const interactiveElements = elements.filter(el => 
        ['BUTTON', 'A', 'INPUT'].includes(el.tagName)
      );
      expect(interactiveElements.length).toBeGreaterThan(0);
      interactiveElements.forEach(el => {
        expect(el.identifier).toBeDefined();
        expect(el.identifier.length).toBeGreaterThan(0);
      });
    });

    it('should not inject identifiers when option is false', async () => {
      const htmlContent = '<div><button>Click me</button></div>';
      const file = new File([htmlContent], 'test.html', { type: 'text/html' });
      
      const result = await importHtmlFile(file, { injectIdentifiers: false });
      
      expect(result.identifiersInjected).toBe(false);
    });

    it('should remove external scripts by default', async () => {
      const htmlContent = `
        <div>
          <script src="https://example.com/script.js"></script>
          <script>console.log('inline');</script>
          <p>Content</p>
        </div>
      `;
      const file = new File([htmlContent], 'test.html', { type: 'text/html' });
      
      const result = await importHtmlFile(file);
      
      // External script should be detected in warnings
      expect(result.warnings.externalScripts.length).toBeGreaterThan(0);
      
      // But the parsed HTML should not contain external scripts
      // (inline scripts should remain)
      expect(result.parseResult.scripts).not.toContain('https://example.com/script.js');
    });

    it('should preserve external scripts when allowed', async () => {
      const htmlContent = `
        <div>
          <script src="https://example.com/script.js"></script>
          <p>Content</p>
        </div>
      `;
      const file = new File([htmlContent], 'test.html', { type: 'text/html' });
      
      const result = await importHtmlFile(file, { allowExternalScripts: true });
      
      expect(result.warnings.externalScripts).toContain('https://example.com/script.js');
    });

    it('should handle files with no external resources', async () => {
      const htmlContent = `
        <div>
          <style>.test { color: red; }</style>
          <script>console.log('test');</script>
          <p>Content</p>
        </div>
      `;
      const file = new File([htmlContent], 'test.html', { type: 'text/html' });
      
      const result = await importHtmlFile(file);
      
      expect(result.warnings.externalStylesheets).toHaveLength(0);
      expect(result.warnings.externalScripts).toHaveLength(0);
    });

    it('should handle empty HTML files', async () => {
      const htmlContent = '';
      const file = new File([htmlContent], 'empty.html', { type: 'text/html' });
      
      await expect(importHtmlFile(file)).rejects.toThrow();
    });

    it('should handle invalid HTML gracefully', async () => {
      const htmlContent = '<div><p>Unclosed paragraph<div>Nested incorrectly</p></div>';
      const file = new File([htmlContent], 'invalid.html', { type: 'text/html' });
      
      // Should either parse with auto-correction or throw a descriptive error
      try {
        const result = await importHtmlFile(file);
        expect(result).toBeDefined();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('Invalid HTML');
      }
    });
  });

  describe('calculateAutoLayoutPositions', () => {
    it('should calculate positions for single shape', () => {
      const positions = calculateAutoLayoutPositions(1, 800, 50);
      
      expect(positions).toHaveLength(1);
      expect(positions[0]).toEqual({ x: 0, y: 0 });
    });

    it('should calculate positions for multiple shapes with default spacing', () => {
      const positions = calculateAutoLayoutPositions(3, 800, 50);
      
      expect(positions).toHaveLength(3);
      expect(positions[0]).toEqual({ x: 0, y: 0 });
      expect(positions[1]).toEqual({ x: 850, y: 0 }); // 800 + 50
      expect(positions[2]).toEqual({ x: 1700, y: 0 }); // 1700 = 2 * (800 + 50)
    });

    it('should calculate positions with custom spacing', () => {
      const positions = calculateAutoLayoutPositions(2, 600, 100);
      
      expect(positions).toHaveLength(2);
      expect(positions[0]).toEqual({ x: 0, y: 0 });
      expect(positions[1]).toEqual({ x: 700, y: 0 }); // 600 + 100
    });

    it('should handle zero shapes', () => {
      const positions = calculateAutoLayoutPositions(0);
      
      expect(positions).toHaveLength(0);
    });

    it('should arrange shapes horizontally from left to right', () => {
      const positions = calculateAutoLayoutPositions(5, 400, 50);
      
      expect(positions).toHaveLength(5);
      
      // All shapes should be at y=0 (horizontal arrangement)
      positions.forEach(pos => {
        expect(pos.y).toBe(0);
      });
      
      // X positions should increase from left to right
      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].x).toBeGreaterThan(positions[i - 1].x);
      }
    });

    it('should maintain consistent spacing between shapes', () => {
      const shapeWidth = 500;
      const spacing = 75;
      const positions = calculateAutoLayoutPositions(4, shapeWidth, spacing);
      
      const expectedSpacing = shapeWidth + spacing;
      
      for (let i = 1; i < positions.length; i++) {
        const actualSpacing = positions[i].x - positions[i - 1].x;
        expect(actualSpacing).toBe(expectedSpacing);
      }
    });
  });

  describe('promptForExternalResources', () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    
    beforeEach(() => {
      window.confirm = jest.fn();
    });
    
    afterEach(() => {
      window.confirm = originalConfirm;
    });

    it('should not prompt when no external resources', async () => {
      const warnings = {
        externalStylesheets: [],
        externalScripts: [],
      };
      
      const result = await promptForExternalResources(warnings);
      
      expect(window.confirm).not.toHaveBeenCalled();
      expect(result.loadExternalStyles).toBe(false);
      expect(result.allowExternalScripts).toBe(false);
    });

    it('should prompt for external stylesheets', async () => {
      (window.confirm as jest.Mock).mockReturnValue(true);
      
      const warnings = {
        externalStylesheets: ['https://example.com/style.css'],
        externalScripts: [],
      };
      
      const result = await promptForExternalResources(warnings);
      
      expect(window.confirm).toHaveBeenCalledTimes(1);
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('external stylesheet')
      );
      expect(result.loadExternalStyles).toBe(true);
    });

    it('should prompt for external scripts with security warning', async () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      
      const warnings = {
        externalStylesheets: [],
        externalScripts: ['https://example.com/script.js'],
      };
      
      const result = await promptForExternalResources(warnings);
      
      expect(window.confirm).toHaveBeenCalledTimes(1);
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('SECURITY WARNING')
      );
      expect(result.allowExternalScripts).toBe(false);
    });

    it('should prompt for both stylesheets and scripts', async () => {
      (window.confirm as jest.Mock)
        .mockReturnValueOnce(true)  // Accept stylesheets
        .mockReturnValueOnce(false); // Reject scripts
      
      const warnings = {
        externalStylesheets: ['https://example.com/style.css'],
        externalScripts: ['https://example.com/script.js'],
      };
      
      const result = await promptForExternalResources(warnings);
      
      expect(window.confirm).toHaveBeenCalledTimes(2);
      expect(result.loadExternalStyles).toBe(true);
      expect(result.allowExternalScripts).toBe(false);
    });

    it('should list all external resources in prompts', async () => {
      (window.confirm as jest.Mock).mockReturnValue(false);
      
      const warnings = {
        externalStylesheets: [
          'https://example.com/style1.css',
          'https://example.com/style2.css',
        ],
        externalScripts: [
          'https://example.com/script1.js',
          'https://example.com/script2.js',
        ],
      };
      
      await promptForExternalResources(warnings);
      
      const calls = (window.confirm as jest.Mock).mock.calls;
      
      // Check stylesheet prompt includes all stylesheets
      expect(calls[0][0]).toContain('style1.css');
      expect(calls[0][0]).toContain('style2.css');
      
      // Check script prompt includes all scripts
      expect(calls[1][0]).toContain('script1.js');
      expect(calls[1][0]).toContain('script2.js');
    });
  });

  describe('Edge cases', () => {
    it('should handle HTML with special characters', async () => {
      const htmlContent = '<div><p>Special chars: &lt; &gt; &amp; &quot;</p></div>';
      const file = new File([htmlContent], 'special.html', { type: 'text/html' });
      
      const result = await importHtmlFile(file);
      
      expect(result.parseResult).toBeDefined();
    });

    it('should handle HTML with inline styles', async () => {
      const htmlContent = '<div style="color: red; font-size: 16px;"><p>Styled content</p></div>';
      const file = new File([htmlContent], 'styled.html', { type: 'text/html' });
      
      const result = await importHtmlFile(file);
      
      expect(result.parseResult).toBeDefined();
      const elements = Array.from(result.parseResult.elementMap.values());
      const styledElement = elements.find(el => el.tagName === 'DIV');
      expect(styledElement?.inlineStyles).toBeDefined();
    });

    it('should handle HTML with nested structures', async () => {
      const htmlContent = `
        <div>
          <header>
            <nav>
              <ul>
                <li><a href="#">Link 1</a></li>
                <li><a href="#">Link 2</a></li>
              </ul>
            </nav>
          </header>
          <main>
            <article>
              <h1>Title</h1>
              <p>Content</p>
            </article>
          </main>
        </div>
      `;
      const file = new File([htmlContent], 'nested.html', { type: 'text/html' });
      
      const result = await importHtmlFile(file);
      
      expect(result.parseResult).toBeDefined();
      expect(result.parseResult.elementMap.size).toBeGreaterThan(5);
    });

    it('should handle HTML with data attributes', async () => {
      const htmlContent = '<div data-id="123" data-name="test"><p>Content</p></div>';
      const file = new File([htmlContent], 'data-attrs.html', { type: 'text/html' });
      
      const result = await importHtmlFile(file);
      
      expect(result.parseResult).toBeDefined();
      const elements = Array.from(result.parseResult.elementMap.values());
      const divElement = elements.find(el => el.tagName === 'DIV');
      expect(divElement?.attributes['data-id']).toBe('123');
      expect(divElement?.attributes['data-name']).toBe('test');
    });
  });
});
