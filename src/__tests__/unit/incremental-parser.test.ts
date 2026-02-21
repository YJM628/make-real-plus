/**
 * Tests for IncrementalParser
 * Feature: streaming-batch-render
 */

import { IncrementalParser } from '../../utils/batch/incrementalParser';

describe('IncrementalParser', () => {
  let parser: IncrementalParser;

  beforeEach(() => {
    parser = new IncrementalParser();
  });

  describe('append', () => {
    it('should extract a complete page from buffer', () => {
      const pageJson = JSON.stringify({
        name: 'home',
        html: '<div>Home</div>',
        css: '.home { color: red; }',
        js: 'console.log("home");',
      });

      const buffer = `{"pages": [${pageJson}]}`;
      const result = parser.append(buffer);

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].name).toBe('home');
      expect(result.pages[0].html).toBe('<div>Home</div>');
    });

    it('should extract multiple complete pages', () => {
      const page1 = JSON.stringify({
        name: 'home',
        html: '<div>Home</div>',
        css: '',
        js: '',
      });
      const page2 = JSON.stringify({
        name: 'about',
        html: '<div>About</div>',
        css: '',
        js: '',
      });

      const buffer = `{"pages": [${page1}, ${page2}]}`;
      const result = parser.append(buffer);

      expect(result.pages).toHaveLength(2);
      expect(result.pages[0].name).toBe('home');
      expect(result.pages[1].name).toBe('about');
    });

    it('should not extract incomplete pages', () => {
      const incompleteBuffer = '{"pages": [{"name": "home", "html": "<div>Home';
      const result = parser.append(incompleteBuffer);

      expect(result.pages).toHaveLength(0);
    });

    it('should handle incremental streaming with complete objects', () => {
      // First chunk - complete first page
      let result = parser.append('{"pages": [{"name": "home", "html": "<div>Home</div>", "css": "", "js": ""}');
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].name).toBe('home');
      
      // Second chunk - complete second page
      result = parser.append(', {"name": "about", "html": "<div>About</div>", "css": "", "js": ""}]}');
      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].name).toBe('about');
      
      // Verify all pages were extracted
      const allPages = parser.getAllExtractedPages();
      expect(allPages).toHaveLength(2);
    });

    it('should extract sharedTheme', () => {
      const buffer = '{"sharedTheme": ":root { --primary: blue; }", "pages": []}';
      const result = parser.append(buffer);

      expect(result.sharedTheme).toBe(':root { --primary: blue; }');
    });

    it('should handle escaped characters in JSON strings', () => {
      const pageJson = JSON.stringify({
        name: 'home',
        html: '<div class="test">Home</div>',
        css: '.test { content: "{\\"nested\\": true}"; }',
        js: '',
      });

      const buffer = `{"pages": [${pageJson}]}`;
      const result = parser.append(buffer);

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].html).toContain('class="test"');
    });

    it('should handle markdown code block wrappers', () => {
      const pageJson = JSON.stringify({
        name: 'home',
        html: '<div>Home</div>',
        css: 'body {}',
        js: '',
      });

      const buffer = `\`\`\`json\n{"pages": [${pageJson}]}\n\`\`\``;
      const result = parser.append(buffer);

      expect(result.pages).toHaveLength(1);
      expect(result.pages[0].name).toBe('home');
      expect(result.pages[0].html).toBe('<div>Home</div>');
    });
  });

  describe('getAllExtractedPages', () => {
    it('should return all pages extracted so far', () => {
      parser.append('{"pages": [{"name": "home", "html": "<div>Home</div>", "css": "", "js": ""}');
      parser.append(', {"name": "about", "html": "<div>About</div>", "css": "", "js": ""}]}');

      const allPages = parser.getAllExtractedPages();
      expect(allPages).toHaveLength(2);
      expect(allPages[0].name).toBe('home');
      expect(allPages[1].name).toBe('about');
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      parser.append('{"pages": [{"name": "home", "html": "<div>Home</div>", "css": "", "js": ""}]}');
      expect(parser.getAllExtractedPages()).toHaveLength(1);

      parser.reset();
      expect(parser.getAllExtractedPages()).toHaveLength(0);
    });
  });

  describe('formatPage', () => {
    it('should format page as pretty-printed JSON', () => {
      const page = {
        name: 'home',
        html: '<div>Home</div>',
        css: '.home { color: red; }',
        js: 'console.log("home");',
      };

      const formatted = IncrementalParser.formatPage(page);
      expect(formatted).toContain('"name": "home"');
      expect(formatted).toContain('"html": "<div>Home</div>"');
      
      // Should be pretty-printed (contains newlines)
      expect(formatted).toContain('\n');
    });
  });
});
