/**
 * Unit Tests for HtmlParser
 * Feature: ai-html-visual-editor
 * 
 * Tests the HTML parsing functionality including:
 * - Basic HTML parsing
 * - Element tree building
 * - Identifier extraction and generation
 * - Style extraction
 * - HTML validation
 * - External resource extraction
 * - Identifier injection
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 16.5
 */

import { HtmlParser } from '../../core/parser/HtmlParser';

describe('HtmlParser', () => {
  let parser: HtmlParser;

  beforeEach(() => {
    parser = new HtmlParser();
  });

  describe('parse()', () => {
    it('should parse simple HTML', () => {
      const html = '<div id="test">Hello World</div>';
      const result = parser.parse(html);

      expect(result.root).toBeDefined();
      expect(result.root.tagName).toBe('BODY');
      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].tagName).toBe('DIV');
      expect(result.root.children[0].attributes.id).toBe('test');
      expect(result.root.children[0].textContent).toBe('Hello World');
    });

    it('should extract styles from <style> tags', () => {
      const html = `
        <style>
          .test { color: red; }
        </style>
        <div class="test">Content</div>
      `;
      const result = parser.parse(html);

      expect(result.styles).toContain('.test { color: red; }');
    });

    it('should extract scripts from <script> tags', () => {
      const html = `
        <script>
          console.log('test');
        </script>
        <div>Content</div>
      `;
      const result = parser.parse(html);

      expect(result.scripts).toContain("console.log('test');");
    });

    it('should use provided CSS and JS instead of extracting', () => {
      const html = '<div>Content</div>';
      const css = 'body { margin: 0; }';
      const js = 'alert("test");';
      
      const result = parser.parse(html, css, js);

      expect(result.styles).toBe(css);
      expect(result.scripts).toBe(js);
    });

    it('should build element map with all elements', () => {
      const html = `
        <div id="parent">
          <span id="child1">Text 1</span>
          <span id="child2">Text 2</span>
        </div>
      `;
      const result = parser.parse(html);

      expect(result.elementMap.size).toBeGreaterThanOrEqual(3);
      expect(result.elementMap.has('parent')).toBe(true);
      expect(result.elementMap.has('child1')).toBe(true);
      expect(result.elementMap.has('child2')).toBe(true);
    });

    it('should throw error for invalid HTML', () => {
      const invalidHtml = '';
      
      expect(() => parser.parse(invalidHtml)).toThrow('Invalid HTML');
    });
  });

  describe('buildElementTree()', () => {
    it('should build nested element tree', () => {
      const html = `
        <div id="root">
          <div id="child1">
            <span id="grandchild">Text</span>
          </div>
          <div id="child2"></div>
        </div>
      `;
      const result = parser.parse(html);
      const rootDiv = result.root.children[0];

      expect(rootDiv.children).toHaveLength(2);
      expect(rootDiv.children[0].identifier).toBe('child1');
      expect(rootDiv.children[0].children).toHaveLength(1);
      expect(rootDiv.children[0].children[0].identifier).toBe('grandchild');
      expect(rootDiv.children[1].identifier).toBe('child2');
    });

    it('should preserve parent-child relationships', () => {
      const html = '<div id="parent"><span id="child">Text</span></div>';
      const result = parser.parse(html);
      const parent = result.root.children[0];
      const child = parent.children[0];

      expect(child.parent).toBe(parent);
      expect(parent.parent).toBe(result.root);
    });

    it('should extract all attributes', () => {
      const html = '<div id="test" class="foo bar" data-value="123" aria-label="Test">Content</div>';
      const result = parser.parse(html);
      const element = result.root.children[0];

      expect(element.attributes.id).toBe('test');
      expect(element.attributes.class).toBe('foo bar');
      expect(element.attributes['data-value']).toBe('123');
      expect(element.attributes['aria-label']).toBe('Test');
    });

    it('should extract text content correctly', () => {
      const html = '<div>Direct text<span>Child text</span>More direct text</div>';
      const result = parser.parse(html);
      const div = result.root.children[0];

      // Should only get direct text, not from children
      expect(div.textContent).toContain('Direct text');
      expect(div.textContent).toContain('More direct text');
      expect(div.children[0].textContent).toBe('Child text');
    });
  });

  describe('extractIdentifiers()', () => {
    it('should use existing id attribute', () => {
      const html = '<div id="existing-id">Content</div>';
      const result = parser.parse(html);
      const element = result.root.children[0];

      expect(element.identifier).toBe('existing-id');
    });

    it('should use existing data-uuid attribute', () => {
      const html = '<div data-uuid="existing-uuid">Content</div>';
      const result = parser.parse(html);
      const element = result.root.children[0];

      expect(element.identifier).toBe('existing-uuid');
    });

    it('should generate identifier if none exists', () => {
      const html = '<div>Content</div>';
      const result = parser.parse(html);
      const element = result.root.children[0];

      expect(element.identifier).toBeDefined();
      expect(element.identifier).toMatch(/^div-\d+-[a-z0-9]{8}$/);
    });

    it('should generate unique identifiers for multiple elements', () => {
      const html = '<div><span></span><span></span><span></span></div>';
      const result = parser.parse(html);
      const div = result.root.children[0];
      const identifiers = div.children.map(child => child.identifier);

      // All identifiers should be unique
      const uniqueIdentifiers = new Set(identifiers);
      expect(uniqueIdentifiers.size).toBe(identifiers.length);
    });
  });

  describe('generateIdentifier()', () => {
    it('should generate identifier with tag name prefix', () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString('<button>Click</button>', 'text/html');
      const button = doc.querySelector('button')!;

      const htmlParser = new HtmlParser();
      const identifier = htmlParser.generateIdentifier(button);

      expect(identifier).toMatch(/^button-\d+-[a-z0-9]{8}$/);
    });

    it('should generate unique identifiers on multiple calls', () => {
      const parser = new DOMParser();
      const doc = parser.parseFromString('<div></div>', 'text/html');
      const div = doc.querySelector('div')!;

      const htmlParser = new HtmlParser();
      const id1 = htmlParser.generateIdentifier(div);
      const id2 = htmlParser.generateIdentifier(div);
      const id3 = htmlParser.generateIdentifier(div);

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });
  });

  describe('generateSelector()', () => {
    it('should generate selector using id', () => {
      const html = '<div id="unique-id">Content</div>';
      const result = parser.parse(html);
      const element = result.root.children[0];

      expect(element.selector).toBe('#unique-id');
    });

    it('should generate selector using data-uuid', () => {
      const html = '<div data-uuid="unique-uuid">Content</div>';
      const result = parser.parse(html);
      const element = result.root.children[0];

      expect(element.selector).toBe('[data-uuid="unique-uuid"]');
    });

    it('should generate selector using tag and classes', () => {
      const html = '<div class="foo bar">Content</div>';
      const result = parser.parse(html);
      const element = result.root.children[0];

      expect(element.selector).toContain('div');
      expect(element.selector).toContain('.foo');
      expect(element.selector).toContain('.bar');
    });
  });

  describe('extractStyles()', () => {
    it('should extract inline styles', () => {
      const html = '<div style="color: red; font-size: 16px;">Content</div>';
      const result = parser.parse(html);
      const element = result.root.children[0];

      expect(element.inlineStyles.color).toBe('red');
      expect(element.inlineStyles.fontSize).toBe('16px');
    });

    it('should return empty object for elements without styles', () => {
      const html = '<div>Content</div>';
      const result = parser.parse(html);
      const element = result.root.children[0];

      expect(element.inlineStyles).toEqual({});
    });

    it('should handle complex style values', () => {
      const html = '<div style="background: linear-gradient(to right, red, blue); transform: translateX(10px);">Content</div>';
      const result = parser.parse(html);
      const element = result.root.children[0];

      expect(element.inlineStyles.background).toContain('linear-gradient');
      expect(element.inlineStyles.transform).toBe('translateX(10px)');
    });
  });

  describe('validate()', () => {
    it('should validate correct HTML', () => {
      const html = '<div><span>Text</span></div>';
      const result = parser.validate(html);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject empty HTML', () => {
      const result = parser.validate('');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject non-string HTML', () => {
      const result = parser.validate(null as any);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('HTML is empty or not a string');
    });

    it('should reject whitespace-only HTML', () => {
      const result = parser.validate('   \n\t   ');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('HTML is empty after trimming');
    });

    it('should detect mismatched tags', () => {
      const html = '<div><span>Text</div>';
      const result = parser.validate(html);

      // Note: DOMParser is lenient and may auto-correct some errors
      // This test checks if our validation catches the issue
      expect(result.valid).toBe(false);
      expect(result.errors.some(err => err.includes('Mismatched tags'))).toBe(true);
    });

    it('should allow self-closing tags', () => {
      const html = '<div><img src="test.jpg" /><br /><input type="text" /></div>';
      const result = parser.validate(html);

      expect(result.valid).toBe(true);
    });
  });

  describe('extractExternalResources()', () => {
    it('should extract stylesheet links', () => {
      const html = `
        <link rel="stylesheet" href="styles.css">
        <link rel="stylesheet" href="https://cdn.example.com/theme.css">
        <div>Content</div>
      `;
      const result = parser.parse(html);

      expect(result.externalResources.stylesheets).toContain('styles.css');
      expect(result.externalResources.stylesheets).toContain('https://cdn.example.com/theme.css');
    });

    it('should extract script sources', () => {
      const html = `
        <script src="app.js"></script>
        <script src="https://cdn.example.com/lib.js"></script>
        <div>Content</div>
      `;
      const result = parser.parse(html);

      expect(result.externalResources.scripts).toContain('app.js');
      expect(result.externalResources.scripts).toContain('https://cdn.example.com/lib.js');
    });

    it('should extract image sources', () => {
      const html = `
        <img src="logo.png">
        <img src="https://cdn.example.com/banner.jpg">
        <div>Content</div>
      `;
      const result = parser.parse(html);

      expect(result.externalResources.images).toContain('logo.png');
      expect(result.externalResources.images).toContain('https://cdn.example.com/banner.jpg');
    });

    it('should not include inline scripts or styles', () => {
      const html = `
        <style>.test { color: red; }</style>
        <script>console.log('test');</script>
        <div>Content</div>
      `;
      const result = parser.parse(html);

      expect(result.externalResources.scripts).toHaveLength(0);
      expect(result.externalResources.stylesheets).toHaveLength(0);
    });
  });

  describe('injectIdentifiers()', () => {
    it('should inject data-uuid for buttons without identifiers', () => {
      const html = '<button>Click me</button>';
      const result = parser.injectIdentifiers(html);

      expect(result).toContain('data-uuid=');
      expect(result).toContain('button-');
    });

    it('should inject data-uuid for links without identifiers', () => {
      const html = '<a href="#">Link</a>';
      const result = parser.injectIdentifiers(html);

      expect(result).toContain('data-uuid=');
      expect(result).toContain('a-');
    });

    it('should inject data-uuid for inputs without identifiers', () => {
      const html = '<input type="text" placeholder="Enter text">';
      const result = parser.injectIdentifiers(html);

      expect(result).toContain('data-uuid=');
      expect(result).toContain('input-');
    });

    it('should not inject identifier if element has id', () => {
      const html = '<button id="existing-id">Click me</button>';
      const result = parser.injectIdentifiers(html);

      expect(result).not.toContain('data-uuid=');
      expect(result).toContain('id="existing-id"');
    });

    it('should not inject identifier if element has data-uuid', () => {
      const html = '<button data-uuid="existing-uuid">Click me</button>';
      const result = parser.injectIdentifiers(html);

      // Should keep the existing data-uuid
      expect(result).toContain('data-uuid="existing-uuid"');
      // Count occurrences - should only have one data-uuid
      const matches = result.match(/data-uuid=/g);
      expect(matches).toHaveLength(1);
    });

    it('should inject identifiers for multiple interactive elements', () => {
      const html = `
        <button>Button 1</button>
        <button>Button 2</button>
        <a href="#">Link</a>
        <input type="text">
      `;
      const result = parser.injectIdentifiers(html);

      // Should have 4 data-uuid attributes
      const matches = result.match(/data-uuid=/g);
      expect(matches).toHaveLength(4);
    });

    it('should not inject identifiers for non-interactive elements', () => {
      const html = '<div><span>Text</span><p>Paragraph</p></div>';
      const result = parser.injectIdentifiers(html);

      expect(result).not.toContain('data-uuid=');
    });

    it('should inject identifiers for elements with event handlers', () => {
      const html = '<div onclick="handleClick()">Click me</div>';
      const result = parser.injectIdentifiers(html);

      expect(result).toContain('data-uuid=');
    });

    it('should preserve existing HTML structure', () => {
      const html = `
        <div class="container">
          <button class="btn primary">Submit</button>
          <a href="/home" class="link">Home</a>
        </div>
      `;
      const result = parser.injectIdentifiers(html);

      expect(result).toContain('class="container"');
      expect(result).toContain('class="btn primary"');
      expect(result).toContain('href="/home"');
      expect(result).toContain('class="link"');
    });
  });

  describe('edge cases', () => {
    it('should handle HTML with special characters', () => {
      const html = '<div>Text with &lt;special&gt; &amp; characters</div>';
      const result = parser.parse(html);

      expect(result.root.children[0].textContent).toContain('special');
      expect(result.root.children[0].textContent).toContain('&');
    });

    it('should handle HTML with comments', () => {
      const html = '<!-- Comment --><div>Content</div><!-- Another comment -->';
      const result = parser.parse(html);

      expect(result.root.children).toHaveLength(1);
      expect(result.root.children[0].tagName).toBe('DIV');
    });

    it('should handle deeply nested structures', () => {
      const html = '<div><div><div><div><div><span>Deep</span></div></div></div></div></div>';
      const result = parser.parse(html);

      let current = result.root.children[0];
      let depth = 0;
      while (current.children.length > 0) {
        current = current.children[0];
        depth++;
      }

      expect(depth).toBe(5);
      expect(current.textContent).toBe('Deep');
    });

    it('should handle empty elements', () => {
      const html = '<div></div><span></span><p></p>';
      const result = parser.parse(html);

      expect(result.root.children).toHaveLength(3);
      expect(result.root.children[0].textContent).toBe('');
      expect(result.root.children[1].textContent).toBe('');
      expect(result.root.children[2].textContent).toBe('');
    });

    it('should handle elements with only whitespace', () => {
      const html = '<div>   \n\t   </div>';
      const result = parser.parse(html);

      // Whitespace should be trimmed
      expect(result.root.children[0].textContent).toBe('');
    });
  });
});
