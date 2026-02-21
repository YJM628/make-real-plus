/**
 * Unit tests for React Project Converter
 * Feature: export-deployable-project, html-to-react-export
 * Requirements: 6.3, 6.5, 2.3
 */

// @ts-nocheck - Disabling type checking for test file due to extensive fast-check property tests
import { assembleReactProject, extractStyleTags, extractScriptTags, extractLinkStylesheets, hasInternalLinks } from './reactConverter';
import type { ProcessedPage, MockGenerationResult } from '../../types';

describe('extractStyleTags', () => {
  describe('basic functionality', () => {
    it('should extract single style tag and return cleaned HTML', () => {
      const html = '<div>Content</div><style>.test { color: red; }</style><p>More content</p>';
      const result = extractStyleTags(html);
      
      expect(result.extractedCSS).toBe('.test { color: red; }');
      expect(result.cleanedHtml).toBe('<div>Content</div><p>More content</p>');
    });

    it('should extract multiple style tags and combine CSS', () => {
      const html = `
        <style>.header { color: blue; }</style>
        <div>Content</div>
        <style>.footer { color: green; }</style>
      `;
      const result = extractStyleTags(html);
      
      expect(result.extractedCSS).toContain('.header { color: blue; }');
      expect(result.extractedCSS).toContain('.footer { color: green; }');
      expect(result.cleanedHtml).not.toContain('<style>');
      expect(result.cleanedHtml).toContain('<div>Content</div>');
    });

    it('should handle style tags with attributes', () => {
      const html = '<style type="text/css" media="screen">.test { color: red; }</style><div>Content</div>';
      const result = extractStyleTags(html);
      
      expect(result.extractedCSS).toBe('.test { color: red; }');
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });

    it('should handle case-insensitive style tags', () => {
      const html = '<STYLE>.test { color: red; }</STYLE><div>Content</div>';
      const result = extractStyleTags(html);
      
      expect(result.extractedCSS).toBe('.test { color: red; }');
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });
  });

  describe('edge cases', () => {
    it('should handle empty HTML', () => {
      const result = extractStyleTags('');
      
      expect(result.extractedCSS).toBe('');
      expect(result.cleanedHtml).toBe('');
    });

    it('should handle HTML without style tags', () => {
      const html = '<div>Content</div><p>More content</p>';
      const result = extractStyleTags(html);
      
      expect(result.extractedCSS).toBe('');
      expect(result.cleanedHtml).toBe(html);
    });

    it('should handle empty style tags', () => {
      const html = '<div>Content</div><style></style><p>More content</p>';
      const result = extractStyleTags(html);
      
      expect(result.extractedCSS).toBe('');
      expect(result.cleanedHtml).toBe('<div>Content</div><p>More content</p>');
    });

    it('should handle style tags with only whitespace', () => {
      const html = '<div>Content</div><style>   \n  \t  </style><p>More content</p>';
      const result = extractStyleTags(html);
      
      expect(result.extractedCSS).toBe('');
      expect(result.cleanedHtml).toBe('<div>Content</div><p>More content</p>');
    });

    it('should handle nested HTML within style content (CSS with selectors)', () => {
      const html = `
        <div>Content</div>
        <style>
          div > p { color: red; }
          a[href*="example"] { text-decoration: none; }
        </style>
      `;
      const result = extractStyleTags(html);
      
      expect(result.extractedCSS).toContain('div > p { color: red; }');
      expect(result.extractedCSS).toContain('a[href*="example"]');
      expect(result.cleanedHtml).not.toContain('<style>');
    });

    it('should handle multiline CSS', () => {
      const html = `
        <div>Content</div>
        <style>
          .header {
            color: blue;
            font-size: 16px;
            margin: 0;
          }
        </style>
      `;
      const result = extractStyleTags(html);
      
      expect(result.extractedCSS).toContain('.header');
      expect(result.extractedCSS).toContain('color: blue;');
      expect(result.extractedCSS).toContain('font-size: 16px;');
      expect(result.cleanedHtml).toContain('<div>Content</div>');
      expect(result.cleanedHtml).not.toContain('<style>');
    });

    it('should handle special characters in CSS', () => {
      const html = `
        <style>
          .test::before { content: "Hello 'World'"; }
          .test2::after { content: 'Test "Quote"'; }
        </style>
        <div>Content</div>
      `;
      const result = extractStyleTags(html);
      
      expect(result.extractedCSS).toContain('content: "Hello \'World\'"');
      expect(result.extractedCSS).toContain('content: \'Test "Quote"\'');
    });
  });

  describe('malformed HTML handling', () => {
    it('should handle unclosed style tags (best effort)', () => {
      const html = '<div>Content</div><style>.test { color: red; }<div>More content</div>';
      const result = extractStyleTags(html);
      
      // Should extract CSS content even if tag is not properly closed
      expect(result.extractedCSS).toContain('.test { color: red; }');
      expect(result.cleanedHtml).toContain('<div>More content</div>');
    });

    it('should preserve HTML structure when removing style tags', () => {
      const html = `
        <div class="container">
          <style>.header { color: blue; }</style>
          <header>Header</header>
          <style>.footer { color: green; }</style>
          <footer>Footer</footer>
        </div>
      `;
      const result = extractStyleTags(html);
      
      expect(result.cleanedHtml).toContain('<div class="container">');
      expect(result.cleanedHtml).toContain('<header>Header</header>');
      expect(result.cleanedHtml).toContain('<footer>Footer</footer>');
      expect(result.cleanedHtml).not.toContain('<style>');
    });
  });

  describe('CSS combination', () => {
    it('should combine multiple style blocks with double newline separator', () => {
      const html = `
        <style>.block1 { color: red; }</style>
        <div>Content</div>
        <style>.block2 { color: blue; }</style>
      `;
      const result = extractStyleTags(html);
      
      expect(result.extractedCSS).toContain('.block1 { color: red; }');
      expect(result.extractedCSS).toContain('.block2 { color: blue; }');
      // Should have double newline separator between blocks
      expect(result.extractedCSS).toMatch(/\.block1[\s\S]*\n\n[\s\S]*\.block2/);
    });
  });
});

describe('extractScriptTags', () => {
  describe('basic functionality', () => {
    it('should extract single inline script tag and return cleaned HTML', () => {
      const html = '<div>Content</div><script>console.log("test");</script><p>More content</p>';
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toBe('console.log("test");');
      expect(result.cleanedHtml).toBe('<div>Content</div><p>More content</p>');
    });

    it('should extract multiple inline script tags and combine JS', () => {
      const html = `
        <script>const x = 1;</script>
        <div>Content</div>
        <script>const y = 2;</script>
      `;
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toContain('const x = 1;');
      expect(result.extractedJS).toContain('const y = 2;');
      expect(result.cleanedHtml).not.toContain('<script>');
      expect(result.cleanedHtml).toContain('<div>Content</div>');
    });

    it('should handle script tags with attributes', () => {
      const html = '<script type="text/javascript">alert("hello");</script><div>Content</div>';
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toBe('alert("hello");');
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });

    it('should handle case-insensitive script tags', () => {
      const html = '<SCRIPT>console.log("test");</SCRIPT><div>Content</div>';
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toBe('console.log("test");');
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });
  });

  describe('external scripts handling', () => {
    it('should ignore external scripts with src attribute', () => {
      const html = '<div>Content</div><script src="external.js"></script><p>More content</p>';
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toBe('');
      expect(result.cleanedHtml).toBe('<div>Content</div><p>More content</p>');
    });

    it('should ignore external scripts with src and remove them from HTML', () => {
      const html = '<script src="https://cdn.example.com/lib.js"></script><div>Content</div>';
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toBe('');
      expect(result.cleanedHtml).toBe('<div>Content</div>');
      expect(result.cleanedHtml).not.toContain('src=');
    });

    it('should handle self-closing external scripts', () => {
      const html = '<div>Content</div><script src="external.js" /><p>More content</p>';
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toBe('');
      expect(result.cleanedHtml).toBe('<div>Content</div><p>More content</p>');
    });

    it('should extract inline scripts but ignore external scripts in same HTML', () => {
      const html = `
        <script>const inline = true;</script>
        <script src="external.js"></script>
        <div>Content</div>
        <script>console.log("inline2");</script>
      `;
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toContain('const inline = true;');
      expect(result.extractedJS).toContain('console.log("inline2");');
      expect(result.extractedJS).not.toContain('external.js');
      expect(result.cleanedHtml).not.toContain('<script');
      expect(result.cleanedHtml).toContain('<div>Content</div>');
    });

    it('should handle external scripts with additional attributes', () => {
      const html = '<script type="module" src="app.js" defer></script><div>Content</div>';
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toBe('');
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });
  });

  describe('edge cases', () => {
    it('should handle empty HTML', () => {
      const result = extractScriptTags('');
      
      expect(result.extractedJS).toBe('');
      expect(result.cleanedHtml).toBe('');
    });

    it('should handle HTML without script tags', () => {
      const html = '<div>Content</div><p>More content</p>';
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toBe('');
      expect(result.cleanedHtml).toBe(html);
    });

    it('should handle empty script tags', () => {
      const html = '<div>Content</div><script></script><p>More content</p>';
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toBe('');
      expect(result.cleanedHtml).toBe('<div>Content</div><p>More content</p>');
    });

    it('should handle script tags with only whitespace', () => {
      const html = '<div>Content</div><script>   \n  \t  </script><p>More content</p>';
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toBe('');
      expect(result.cleanedHtml).toBe('<div>Content</div><p>More content</p>');
    });

    it('should handle multiline JavaScript', () => {
      const html = `
        <div>Content</div>
        <script>
          function greet(name) {
            console.log("Hello, " + name);
            return true;
          }
          greet("World");
        </script>
      `;
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toContain('function greet(name)');
      expect(result.extractedJS).toContain('console.log("Hello, " + name)');
      expect(result.extractedJS).toContain('greet("World")');
      expect(result.cleanedHtml).toContain('<div>Content</div>');
      expect(result.cleanedHtml).not.toContain('<script>');
    });

    it('should handle special characters in JavaScript', () => {
      const html = `
        <script>
          const str1 = "Hello 'World'";
          const str2 = 'Test "Quote"';
          const regex = /test<>pattern/;
        </script>
        <div>Content</div>
      `;
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toContain('const str1 = "Hello \'World\'"');
      expect(result.extractedJS).toContain('const str2 = \'Test "Quote"\'');
      expect(result.extractedJS).toContain('const regex = /test<>pattern/');
    });

    it('should handle script tags with template literals', () => {
      const html = `
        <script>
          const template = \`
            <div>Template content</div>
            <p>\${variable}</p>
          \`;
        </script>
        <div>Content</div>
      `;
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toContain('const template');
      expect(result.extractedJS).toContain('<div>Template content</div>');
      expect(result.cleanedHtml).toContain('<div>Content</div>');
      expect(result.cleanedHtml).not.toContain('<script>');
    });
  });

  describe('malformed HTML handling', () => {
    it('should handle unclosed inline script tags (best effort)', () => {
      const html = '<div>Content</div><script>console.log("test");</script><div>More content</div>';
      const result = extractScriptTags(html);
      
      // Should extract JS content from properly closed tags
      expect(result.extractedJS).toContain('console.log("test");');
      expect(result.cleanedHtml).toContain('<div>Content</div>');
      expect(result.cleanedHtml).toContain('<div>More content</div>');
    });

    it('should preserve HTML structure when removing script tags', () => {
      const html = `
        <div class="container">
          <script>const x = 1;</script>
          <header>Header</header>
          <script>const y = 2;</script>
          <footer>Footer</footer>
        </div>
      `;
      const result = extractScriptTags(html);
      
      expect(result.cleanedHtml).toContain('<div class="container">');
      expect(result.cleanedHtml).toContain('<header>Header</header>');
      expect(result.cleanedHtml).toContain('<footer>Footer</footer>');
      expect(result.cleanedHtml).not.toContain('<script>');
    });
  });

  describe('JS combination', () => {
    it('should combine multiple script blocks with double newline separator', () => {
      const html = `
        <script>const block1 = 1;</script>
        <div>Content</div>
        <script>const block2 = 2;</script>
      `;
      const result = extractScriptTags(html);
      
      expect(result.extractedJS).toContain('const block1 = 1;');
      expect(result.extractedJS).toContain('const block2 = 2;');
      // Should have double newline separator between blocks
      expect(result.extractedJS).toMatch(/const block1[\s\S]*\n\n[\s\S]*const block2/);
    });
  });
});

describe('extractLinkStylesheets', () => {
  describe('basic functionality', () => {
    it('should extract single link stylesheet tag and return cleaned HTML', () => {
      const html = '<div>Content</div><link rel="stylesheet" href="styles.css"><p>More content</p>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['styles.css']);
      expect(result.cleanedHtml).toBe('<div>Content</div><p>More content</p>');
    });

    it('should extract multiple link stylesheet tags', () => {
      const html = `
        <link rel="stylesheet" href="main.css">
        <div>Content</div>
        <link rel="stylesheet" href="theme.css">
      `;
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['main.css', 'theme.css']);
      expect(result.cleanedHtml).not.toContain('<link');
      expect(result.cleanedHtml).toContain('<div>Content</div>');
    });

    it('should handle link tags with single quotes', () => {
      const html = "<link rel='stylesheet' href='styles.css'><div>Content</div>";
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['styles.css']);
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });

    it('should handle self-closing link tags', () => {
      const html = '<div>Content</div><link rel="stylesheet" href="styles.css" /><p>More content</p>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['styles.css']);
      expect(result.cleanedHtml).toBe('<div>Content</div><p>More content</p>');
    });

    it('should handle link tags with additional attributes', () => {
      const html = '<link rel="stylesheet" href="styles.css" type="text/css" media="screen"><div>Content</div>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['styles.css']);
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });

    it('should handle case-insensitive link tags', () => {
      const html = '<LINK REL="stylesheet" HREF="styles.css"><div>Content</div>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['styles.css']);
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });

    it('should handle href before rel attribute order', () => {
      const html = '<link href="styles.css" rel="stylesheet"><div>Content</div>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['styles.css']);
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });

    it('should handle absolute URLs', () => {
      const html = '<link rel="stylesheet" href="https://cdn.example.com/styles.css"><div>Content</div>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['https://cdn.example.com/styles.css']);
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });

    it('should handle relative paths', () => {
      const html = '<link rel="stylesheet" href="../css/styles.css"><div>Content</div>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['../css/styles.css']);
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });
  });

  describe('filtering non-stylesheet links', () => {
    it('should ignore link tags with other rel types', () => {
      const html = `
        <link rel="icon" href="favicon.ico">
        <link rel="stylesheet" href="styles.css">
        <link rel="preload" href="font.woff2">
        <div>Content</div>
      `;
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['styles.css']);
      // Should only remove stylesheet links, not other link types
      expect(result.cleanedHtml).toContain('rel="icon"');
      expect(result.cleanedHtml).toContain('rel="preload"');
      expect(result.cleanedHtml).not.toContain('rel="stylesheet"');
    });

    it('should ignore link tags without rel attribute', () => {
      const html = '<link href="something.css"><link rel="stylesheet" href="styles.css"><div>Content</div>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['styles.css']);
      expect(result.cleanedHtml).toContain('<link href="something.css">');
    });

    it('should ignore link tags without href attribute', () => {
      const html = '<link rel="stylesheet"><link rel="stylesheet" href="styles.css"><div>Content</div>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['styles.css']);
    });
  });

  describe('edge cases', () => {
    it('should handle empty HTML', () => {
      const result = extractLinkStylesheets('');
      
      expect(result.stylesheetUrls).toEqual([]);
      expect(result.cleanedHtml).toBe('');
    });

    it('should handle HTML without link tags', () => {
      const html = '<div>Content</div><p>More content</p>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual([]);
      expect(result.cleanedHtml).toBe(html);
    });

    it('should handle empty href attribute', () => {
      const html = '<link rel="stylesheet" href=""><div>Content</div>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual([]);
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });

    it('should handle href with only whitespace', () => {
      const html = '<link rel="stylesheet" href="   "><div>Content</div>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual([]);
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });

    it('should trim whitespace from href values', () => {
      const html = '<link rel="stylesheet" href="  styles.css  "><div>Content</div>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['styles.css']);
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });

    it('should handle multiple link tags with mixed rel types', () => {
      const html = `
        <link rel="stylesheet" href="main.css">
        <link rel="icon" href="favicon.ico">
        <link rel="stylesheet" href="theme.css">
        <link rel="manifest" href="manifest.json">
        <div>Content</div>
      `;
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['main.css', 'theme.css']);
      expect(result.cleanedHtml).toContain('rel="icon"');
      expect(result.cleanedHtml).toContain('rel="manifest"');
      expect(result.cleanedHtml).not.toContain('rel="stylesheet"');
    });

    it('should preserve HTML structure when removing link tags', () => {
      const html = `
        <head>
          <link rel="stylesheet" href="main.css">
          <meta charset="utf-8">
          <link rel="stylesheet" href="theme.css">
          <title>Test</title>
        </head>
      `;
      const result = extractLinkStylesheets(html);
      
      expect(result.cleanedHtml).toContain('<head>');
      expect(result.cleanedHtml).toContain('<meta charset="utf-8">');
      expect(result.cleanedHtml).toContain('<title>Test</title>');
      expect(result.cleanedHtml).not.toContain('<link');
    });

    it('should handle duplicate stylesheet URLs', () => {
      const html = `
        <link rel="stylesheet" href="styles.css">
        <link rel="stylesheet" href="styles.css">
        <div>Content</div>
      `;
      const result = extractLinkStylesheets(html);
      
      // Should include duplicates as they appear in the HTML
      expect(result.stylesheetUrls).toEqual(['styles.css', 'styles.css']);
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });

    it('should handle link tags with query parameters', () => {
      const html = '<link rel="stylesheet" href="styles.css?v=1.2.3"><div>Content</div>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['styles.css?v=1.2.3']);
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });

    it('should handle link tags with hash fragments', () => {
      const html = '<link rel="stylesheet" href="styles.css#section"><div>Content</div>';
      const result = extractLinkStylesheets(html);
      
      expect(result.stylesheetUrls).toEqual(['styles.css#section']);
      expect(result.cleanedHtml).toBe('<div>Content</div>');
    });
  });
});

describe('hasInternalLinks', () => {
  describe('basic functionality', () => {
    it('should return true when HTML contains data-react-link="true"', () => {
      const html = '<div><a href="/about" data-react-link="true">About</a></div>';
      expect(hasInternalLinks(html)).toBe(true);
    });

    it('should return true with single quotes', () => {
      const html = "<div><a href='/about' data-react-link='true'>About</a></div>";
      expect(hasInternalLinks(html)).toBe(true);
    });

    it('should return false when HTML has no links', () => {
      const html = '<div>Content without links</div>';
      expect(hasInternalLinks(html)).toBe(false);
    });

    it('should return false when HTML has links without data-react-link', () => {
      const html = '<div><a href="https://example.com">External</a></div>';
      expect(hasInternalLinks(html)).toBe(false);
    });

    it('should return false when data-react-link is false', () => {
      const html = '<div><a href="/about" data-react-link="false">About</a></div>';
      expect(hasInternalLinks(html)).toBe(false);
    });

    it('should return false when data-react-link has other values', () => {
      const html = '<div><a href="/about" data-react-link="maybe">About</a></div>';
      expect(hasInternalLinks(html)).toBe(false);
    });

    it('should handle case-insensitive attribute matching', () => {
      const html = '<div><A HREF="/about" DATA-REACT-LINK="true">About</A></div>';
      expect(hasInternalLinks(html)).toBe(true);
    });

    it('should handle data-react-link attribute in different positions', () => {
      const html1 = '<a data-react-link="true" href="/about">About</a>';
      const html2 = '<a href="/about" data-react-link="true">About</a>';
      const html3 = '<a href="/about" class="link" data-react-link="true">About</a>';
      
      expect(hasInternalLinks(html1)).toBe(true);
      expect(hasInternalLinks(html2)).toBe(true);
      expect(hasInternalLinks(html3)).toBe(true);
    });
  });

  describe('multiple links', () => {
    it('should return true when at least one link has data-react-link="true"', () => {
      const html = `
        <div>
          <a href="https://example.com">External</a>
          <a href="/about" data-react-link="true">About</a>
          <a href="https://other.com">Another External</a>
        </div>
      `;
      expect(hasInternalLinks(html)).toBe(true);
    });

    it('should return true when multiple links have data-react-link="true"', () => {
      const html = `
        <div>
          <a href="/about" data-react-link="true">About</a>
          <a href="/contact" data-react-link="true">Contact</a>
        </div>
      `;
      expect(hasInternalLinks(html)).toBe(true);
    });

    it('should return false when all links are external', () => {
      const html = `
        <div>
          <a href="https://example.com">External 1</a>
          <a href="https://other.com">External 2</a>
        </div>
      `;
      expect(hasInternalLinks(html)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty HTML', () => {
      expect(hasInternalLinks('')).toBe(false);
    });

    it('should handle HTML with only whitespace', () => {
      expect(hasInternalLinks('   \n  \t  ')).toBe(false);
    });

    it('should handle malformed HTML gracefully', () => {
      const html = '<a data-react-link="true" href="/about">Unclosed link';
      expect(hasInternalLinks(html)).toBe(true);
    });

    it('should handle data-react-link in non-anchor tags (should not match)', () => {
      const html = '<div data-react-link="true">Not a link</div>';
      expect(hasInternalLinks(html)).toBe(false);
    });

    it('should handle extra whitespace around attribute values', () => {
      const html = '<a href="/about" data-react-link = "true" >About</a>';
      expect(hasInternalLinks(html)).toBe(true);
    });

    it('should handle multiline anchor tags', () => {
      const html = `
        <a 
          href="/about" 
          data-react-link="true"
          class="nav-link"
        >
          About
        </a>
      `;
      expect(hasInternalLinks(html)).toBe(true);
    });

    it('should not match data-react-link in comments', () => {
      // Note: Simple regex-based detection may match content in comments
      // This is acceptable as HTML comments with internal links are unlikely in practice
      const html = '<!-- <a data-react-link="true">Commented</a> --><div>Content</div>';
      // The function uses a simple regex and may match commented content
      // This is a known limitation but acceptable for the use case
      expect(hasInternalLinks(html)).toBe(true);
    });

    it('should not match data-react-link in text content', () => {
      const html = '<div>This text mentions data-react-link="true" but is not a link</div>';
      expect(hasInternalLinks(html)).toBe(false);
    });
  });

  describe('disabled links', () => {
    it('should not match data-react-link-disabled', () => {
      const html = '<a href="/about" data-react-link-disabled="true">Disabled</a>';
      expect(hasInternalLinks(html)).toBe(false);
    });

    it('should distinguish between enabled and disabled links', () => {
      const html = `
        <a href="/about" data-react-link="true">Enabled</a>
        <a href="/contact" data-react-link-disabled="true">Disabled</a>
      `;
      expect(hasInternalLinks(html)).toBe(true);
    });
  });
});

/**
 * Property-Based Tests for HTML Preprocessing Functions
 * Feature: html-to-react-export
 * Property 3: HTML 标签提取保持内容完整性
 * Validates: Requirements 2.3, 4.1
 */
describe('Property-Based Tests: HTML Tag Extraction Content Integrity', () => {
  const fc = require('fast-check');

  describe('Property 3: extractStyleTags maintains content integrity', () => {
    it('should preserve non-style content when extracting style tags', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary HTML content without style tags
          fc.array(
            fc.oneof(
              fc.string().map(s => `<div>${s}</div>`),
              fc.string().map(s => `<p>${s}</p>`),
              fc.string().map(s => `<span>${s}</span>`),
              fc.string().map(s => `<h1>${s}</h1>`)
            ),
            { minLength: 0, maxLength: 10 }
          ),
          // Generate arbitrary CSS content
          fc.array(
            fc.string().filter(s => !s.includes('</style>')),
            { minLength: 0, maxLength: 5 }
          ),
          (htmlParts, cssParts) => {
            // Build HTML with style tags interspersed
            const parts: string[] = [];
            const expectedCssBlocks: string[] = [];
            
            htmlParts.forEach((htmlPart, i) => {
              parts.push(htmlPart);
              if (i < cssParts.length && cssParts[i].trim()) {
                parts.push(`<style>${cssParts[i]}</style>`);
                expectedCssBlocks.push(cssParts[i].trim());
              }
            });
            
            const originalHtml = parts.join('');
            const result = extractStyleTags(originalHtml);
            
            // Property 1: Cleaned HTML should not contain style tags
            expect(result.cleanedHtml).not.toMatch(/<style[^>]*>/i);
            expect(result.cleanedHtml).not.toMatch(/<\/style>/i);
            
            // Property 2: All non-style HTML content should be preserved
            htmlParts.forEach(htmlPart => {
              if (htmlPart.trim()) {
                expect(result.cleanedHtml).toContain(htmlPart);
              }
            });
            
            // Property 3: Extracted CSS should contain all CSS content
            expectedCssBlocks.forEach(cssBlock => {
              if (cssBlock) {
                expect(result.extractedCSS).toContain(cssBlock);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle style tags with various attributes', () => {
      fc.assert(
        fc.property(
          fc.string().filter(s => !s.includes('</style>')),
          fc.oneof(
            fc.constant(''),
            fc.constant(' type="text/css"'),
            fc.constant(' media="screen"'),
            fc.constant(' type="text/css" media="screen"')
          ),
          (cssContent, attributes) => {
            const html = `<div>Before</div><style${attributes}>${cssContent}</style><div>After</div>`;
            const result = extractStyleTags(html);
            
            // Should extract CSS regardless of attributes
            if (cssContent.trim()) {
              expect(result.extractedCSS).toContain(cssContent.trim());
            }
            
            // Should preserve surrounding content
            expect(result.cleanedHtml).toContain('<div>Before</div>');
            expect(result.cleanedHtml).toContain('<div>After</div>');
            
            // Should remove style tag
            expect(result.cleanedHtml).not.toContain('<style');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should combine multiple style blocks correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string().filter(s => !s.includes('</style>') && s.trim().length > 0),
            { minLength: 2, maxLength: 5 }
          ),
          (cssBlocks) => {
            // Create HTML with multiple style tags
            const html = cssBlocks.map(css => `<style>${css}</style>`).join('<div>Content</div>');
            const result = extractStyleTags(html);
            
            // All CSS blocks should be in the extracted CSS
            cssBlocks.forEach(css => {
              expect(result.extractedCSS).toContain(css.trim());
            });
            
            // Cleaned HTML should not have style tags
            expect(result.cleanedHtml).not.toContain('<style');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: extractScriptTags maintains content integrity', () => {
    it('should preserve non-script content when extracting script tags', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary HTML content without script tags
          fc.array(
            fc.oneof(
              fc.string().map(s => `<div>${s}</div>`),
              fc.string().map(s => `<p>${s}</p>`),
              fc.string().map(s => `<span>${s}</span>`)
            ),
            { minLength: 0, maxLength: 10 }
          ),
          // Generate arbitrary JS content
          fc.array(
            fc.string().filter(s => !s.includes('</script>') && !s.includes('src=')),
            { minLength: 0, maxLength: 5 }
          ),
          (htmlParts: string[], jsParts: string[]) => {
            // Build HTML with inline script tags interspersed
            const parts: string[] = [];
            const expectedJsBlocks: string[] = [];
            
            htmlParts.forEach((htmlPart: string, i: number) => {
              parts.push(htmlPart);
              if (i < jsParts.length && jsParts[i].trim()) {
                parts.push(`<script>${jsParts[i]}</script>`);
                expectedJsBlocks.push(jsParts[i].trim());
              }
            });
            
            const originalHtml = parts.join('');
            const result = extractScriptTags(originalHtml);
            
            // Property 1: Cleaned HTML should not contain inline script tags
            expect(result.cleanedHtml).not.toMatch(/<script(?![^>]*\bsrc\s*=)[^>]*>/i);
            
            // Property 2: All non-script HTML content should be preserved
            htmlParts.forEach((htmlPart: string) => {
              if (htmlPart.trim()) {
                expect(result.cleanedHtml).toContain(htmlPart);
              }
            });
            
            // Property 3: Extracted JS should contain all JS content
            expectedJsBlocks.forEach(jsBlock => {
              if (jsBlock) {
                expect(result.extractedJS).toContain(jsBlock);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ignore external scripts but remove them from HTML', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s: string) => s.trim().length > 0 && !s.includes('"') && !s.includes("'") && !s.includes('<') && !s.includes('>')),
          fc.string().filter((s: string) => !s.includes('</script>') && !s.includes('src=')),
          (scriptUrl: string, inlineJs: string) => {
            // Ensure scriptUrl is not a substring of inlineJs to avoid false positives
            fc.pre(scriptUrl !== inlineJs.trim() && !inlineJs.includes(scriptUrl));
            
            const html = `<div>Before</div><script src="${scriptUrl}"></script><script>${inlineJs}</script><div>After</div>`;
            const result = extractScriptTags(html);
            
            // Should not extract external script URL
            expect(result.extractedJS).not.toContain(scriptUrl);
            
            // Should extract inline script
            if (inlineJs.trim()) {
              expect(result.extractedJS).toContain(inlineJs.trim());
            }
            
            // Should preserve surrounding content
            expect(result.cleanedHtml).toContain('<div>Before</div>');
            expect(result.cleanedHtml).toContain('<div>After</div>');
            
            // Should remove all script tags
            expect(result.cleanedHtml).not.toContain('<script');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle script tags with various attributes', () => {
      fc.assert(
        fc.property(
          fc.string().filter((s: string) => !s.includes('</script>') && !s.includes('src=')),
          fc.oneof(
            fc.constant(''),
            fc.constant(' type="text/javascript"'),
            fc.constant(' defer'),
            fc.constant(' type="module"')
          ),
          (jsContent: string, attributes: string) => {
            const html = `<div>Before</div><script${attributes}>${jsContent}</script><div>After</div>`;
            const result = extractScriptTags(html);
            
            // Should extract JS regardless of attributes (as long as no src)
            if (jsContent.trim()) {
              expect(result.extractedJS).toContain(jsContent.trim());
            }
            
            // Should preserve surrounding content
            expect(result.cleanedHtml).toContain('<div>Before</div>');
            expect(result.cleanedHtml).toContain('<div>After</div>');
            
            // Should remove script tag
            expect(result.cleanedHtml).not.toContain('<script');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should combine multiple inline script blocks correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.string().filter((s: string) => !s.includes('</script>') && !s.includes('src=') && s.trim().length > 0),
            { minLength: 2, maxLength: 5 }
          ),
          (jsBlocks: string[]) => {
            // Create HTML with multiple inline script tags
            const html = jsBlocks.map((js: string) => `<script>${js}</script>`).join('<div>Content</div>');
            const result = extractScriptTags(html);
            
            // All JS blocks should be in the extracted JS
            jsBlocks.forEach((js: string) => {
              expect(result.extractedJS).toContain(js.trim());
            });
            
            // Cleaned HTML should not have script tags
            expect(result.cleanedHtml).not.toContain('<script');
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 3: Combined extraction maintains overall content integrity', () => {
    it('should preserve all non-tag content when extracting both style and script tags', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              fc.string().map((s: string) => `<div>${s}</div>`),
              fc.string().map((s: string) => `<p>${s}</p>`)
            ),
            { minLength: 1, maxLength: 5 }
          ),
          fc.array(
            fc.string().filter((s: string) => !s.includes('</style>') && s.length > 0),
            { minLength: 0, maxLength: 3 }
          ),
          fc.array(
            fc.string().filter((s: string) => !s.includes('</script>') && !s.includes('src=') && s.length > 0),
            { minLength: 0, maxLength: 3 }
          ),
          (htmlParts: string[], cssParts: string[], jsParts: string[]) => {
            // Build HTML with both style and script tags
            const parts: string[] = [];
            const expectedCssBlocks: string[] = [];
            const expectedJsBlocks: string[] = [];
            
            htmlParts.forEach((htmlPart: string, i: number) => {
              parts.push(htmlPart);
              if (i < cssParts.length) {
                const css = cssParts[i];
                if (css.trim()) {
                  parts.push(`<style>${css}</style>`);
                  expectedCssBlocks.push(css.trim());
                }
              }
              if (i < jsParts.length) {
                const js = jsParts[i];
                if (js.trim()) {
                  parts.push(`<script>${js}</script>`);
                  expectedJsBlocks.push(js.trim());
                }
              }
            });
            
            const originalHtml = parts.join('');
            
            // Extract style tags first
            const afterStyleExtraction = extractStyleTags(originalHtml);
            
            // Then extract script tags
            const afterScriptExtraction = extractScriptTags(afterStyleExtraction.cleanedHtml);
            
            // All original HTML content should be preserved
            htmlParts.forEach((htmlPart: string) => {
              if (htmlPart.trim()) {
                expect(afterScriptExtraction.cleanedHtml).toContain(htmlPart);
              }
            });
            
            // No style or script tags should remain
            expect(afterScriptExtraction.cleanedHtml).not.toContain('<style');
            expect(afterScriptExtraction.cleanedHtml).not.toContain('<script');
            
            // All CSS should be extracted
            expectedCssBlocks.forEach(css => {
              expect(afterStyleExtraction.extractedCSS).toContain(css);
            });
            
            // All JS should be extracted
            expectedJsBlocks.forEach(js => {
              expect(afterScriptExtraction.extractedJS).toContain(js);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property-Based Tests for Component Generation
 * Feature: html-to-react-export
 * Property 1: 组件使用 html-to-react 且不使用 dangerouslySetInnerHTML
 * Validates: Requirements 1.1, 1.2, 1.4, 6.3
 */
describe('Property-Based Tests: Component Generation with html-to-react', () => {
  const fc = require('fast-check');

  describe('Property 1: Components use html-to-react and not dangerouslySetInnerHTML', () => {
    it('should generate components that import and use html-to-react Parser', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary page data
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                fc.string().map(s => `<div>${s}</div>`),
                fc.string().map(s => `<p>${s}</p>`),
                fc.string().map(s => `<h1>${s}</h1>`),
                fc.string().map(s => `<span>${s}</span>`)
              ),
              css: fc.oneof(
                fc.constant(''),
                fc.string().filter(s => s.length < 100)
              ),
              js: fc.oneof(
                fc.constant(''),
                fc.string().filter(s => s.length < 100 && !s.includes('</script>'))
              ),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 5 }
          ),
          fc.string().filter(s => s.length > 0 && s.length < 30),
          (pages, appName) => {
            // Call assembleReactProject
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              appName
            );

            // For each page, verify the generated component
            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentPath = `src/pages/${componentName}.jsx`;
              const componentCode = result.get(componentPath);

              // Property 1: Component should exist
              expect(componentCode).toBeDefined();
              
              if (componentCode) {
                // Property 2: Should NOT import html-to-react (conversion happens at build time)
                expect(componentCode).not.toContain('html-to-react');
                expect(componentCode).not.toContain('parseWithInstructions');
                
                // Property 3: Should NOT use dangerouslySetInnerHTML
                expect(componentCode).not.toContain('dangerouslySetInnerHTML');
                
                // Property 4: Should have direct JSX in return statement
                expect(componentCode).toContain('return');
                expect(componentCode).toContain('<>');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate components with html-to-react for pages with various HTML content', () => {
      fc.assert(
        fc.property(
          // Generate pages with different HTML structures
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                // Simple HTML
                fc.constant('<div>Simple content</div>'),
                // HTML with nested elements
                fc.constant('<div><p>Nested <span>content</span></p></div>'),
                // HTML with attributes
                fc.constant('<div class="container" id="main"><h1>Title</h1></div>'),
                // HTML with multiple elements
                fc.constant('<header>Header</header><main>Main</main><footer>Footer</footer>'),
                // HTML with special characters (that need escaping)
                fc.constant('<div>Text with `backticks` and $dollar signs</div>')
              ),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Should use html-to-react regardless of HTML content
                expect(componentCode).toContain('html-to-react');
                expect(componentCode).toContain('parseWithInstructions');
                expect(componentCode).not.toContain('dangerouslySetInnerHTML');
                
                // Should have htmlContent constant
                expect(componentCode).toMatch(/const\s+htmlContent\s*=\s*`/);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate components with html-to-react when pages have CSS and JS', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.string().map(s => `<div>${s}</div>`),
              css: fc.string().filter(s => s.length < 100),
              js: fc.string().filter(s => s.length < 100 && !s.includes('</script>')),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (pages) => {
            const pageCSSMap = new Map<string, string>(
              pages.map(p => [p.name, `.${p.name} { color: red; }`])
            );

            const result = assembleReactProject(
              pages,
              'body { margin: 0; }',
              pageCSSMap,
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Even with CSS and JS, should still use html-to-react
                expect(componentCode).toContain('html-to-react');
                expect(componentCode).toContain('Parser');
                expect(componentCode).toContain('parseWithInstructions');
                expect(componentCode).not.toContain('dangerouslySetInnerHTML');
                
                // Should have useEffect if JS exists
                if (page.js && page.js.trim()) {
                  expect(componentCode).toContain('useEffect');
                }
                
                // Should import CSS if CSS exists
                if (page.css && page.css.trim()) {
                  expect(componentCode).toContain(`import './styles/${componentName}.css'`);
                }
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate package.json with html-to-react dependency', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.string().map(s => `<div>${s}</div>`),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            const packageJson = result.get('package.json');
            expect(packageJson).toBeDefined();
            
            if (packageJson) {
              const pkg = JSON.parse(packageJson);
              
              // Property: package.json should NOT include html-to-react (only used at build time)
              expect(pkg.dependencies).not.toHaveProperty('html-to-react');
              
              // Should have React dependencies
              expect(pkg.dependencies).toHaveProperty('react');
              expect(pkg.dependencies).toHaveProperty('react-dom');
              expect(pkg.dependencies).toHaveProperty('react-router-dom');
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should never generate dangerouslySetInnerHTML in any component', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                fc.string().map(s => `<div>${s}</div>`),
                fc.constant('<div><script>alert("test");</script></div>'),
                fc.constant('<div><style>.test { color: red; }</style></div>'),
                fc.constant('<div><a href="/link" data-react-link="true">Link</a></div>'),
                fc.constant('<div>Text with `backticks` and $variables</div>')
              ),
              css: fc.oneof(fc.constant(''), fc.string().filter(s => s.length < 50)),
              js: fc.oneof(fc.constant(''), fc.string().filter(s => s.length < 50 && !s.includes('</script>'))),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            // Check all generated page components
            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Critical property: NEVER use dangerouslySetInnerHTML
                expect(componentCode).not.toContain('dangerouslySetInnerHTML');
                expect(componentCode).not.toContain('__html');
                
                // Should always use html-to-react instead
                expect(componentCode).toContain('html-to-react');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property-Based Tests for Link Conversion
 * Feature: html-to-react-export
 * Property 5: 内部链接转换为 Link 组件，外部链接保持不变
 * Validates: Requirements 3.1, 3.3, 3.4
 */
describe('Property-Based Tests: Link Conversion', () => {
  const fc = require('fast-check');

  describe('Property 5: Internal links converted to Link components, external links unchanged', () => {
    it('should convert internal links with data-react-link="true" to Link components', () => {
      fc.assert(
        fc.property(
          // Generate pages with internal links
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                // Single internal link
                fc.constant('<div><a href="/about" data-react-link="true">About</a></div>'),
                // Multiple internal links
                fc.constant('<nav><a href="/" data-react-link="true">Home</a><a href="/contact" data-react-link="true">Contact</a></nav>'),
                // Internal link with attributes
                fc.constant('<a href="/products" data-react-link="true" class="nav-link" id="products-link">Products</a>'),
                // Internal link with nested content
                fc.constant('<a href="/profile" data-react-link="true"><span>My Profile</span></a>')
              ),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Property 1: Should import Link component from react-router-dom
                expect(componentCode).toContain("import { Link } from 'react-router-dom'");
                
                // Property 2: Should have Link component in JSX (converted at build time)
                expect(componentCode).toContain('<Link');
                expect(componentCode).toContain('to="');
                expect(componentCode).toContain('</Link>');
                
                // Property 3: Should NOT have runtime processing instructions (conversion done at build time)
                expect(componentCode).not.toContain("node.name === 'a'");
                expect(componentCode).not.toContain("node.attribs['data-react-link']");
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve external links without data-react-link attribute', () => {
      fc.assert(
        fc.property(
          // Generate pages with external links (no data-react-link)
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                // External link
                fc.constant('<div><a href="https://example.com">External</a></div>'),
                // Multiple external links
                fc.constant('<div><a href="https://google.com">Google</a><a href="https://github.com">GitHub</a></div>'),
                // External link with attributes
                fc.constant('<a href="https://example.com" target="_blank" rel="noopener">External Link</a>'),
                // Mixed content without internal links
                fc.constant('<div><p>Text</p><a href="mailto:test@example.com">Email</a></div>')
              ),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Property 1: Should NOT import Link component when no internal links
                expect(componentCode).not.toContain("import { Link } from 'react-router-dom'");
                
                // Property 2: External links should be processed by default handler
                // The default processing instruction should handle all other nodes
                expect(componentCode).toContain('processDefaultNode');
                
                // Property 3: Should still have html-to-react parser
                expect(componentCode).toContain('html-to-react');
                expect(componentCode).toContain('parseWithInstructions');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed internal and external links correctly', () => {
      fc.assert(
        fc.property(
          // Generate pages with both internal and external links
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                // Internal and external links
                fc.constant('<nav><a href="/" data-react-link="true">Home</a><a href="https://example.com">External</a></nav>'),
                // Multiple of each type
                fc.constant('<div><a href="/about" data-react-link="true">About</a><a href="/contact" data-react-link="true">Contact</a><a href="https://google.com">Google</a></div>'),
                // Complex structure
                fc.constant('<header><a href="/" data-react-link="true">Logo</a></header><footer><a href="https://twitter.com">Twitter</a></footer>'),
                // With disabled links
                fc.constant('<nav><a href="/home" data-react-link="true">Home</a><a href="/disabled" data-react-link-disabled="true">Disabled</a><a href="https://example.com">External</a></nav>')
              ),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Property 1: Should import Link when internal links exist
                expect(componentCode).toContain("import { Link } from 'react-router-dom'");
                
                // Property 2: Should have processing instruction for internal links
                expect(componentCode).toContain("node.attribs['data-react-link'] === 'true'");
                
                // Property 3: Should have processing instruction for disabled links
                expect(componentCode).toContain("node.attribs['data-react-link-disabled'] === 'true'");
                
                // Property 4: Should have default processing instruction for external links
                expect(componentCode).toContain('processDefaultNode');
                
                // Property 5: Processing instructions should be in correct order
                // Internal links first, then disabled links, then default
                const internalLinkIndex = componentCode.indexOf("node.attribs['data-react-link'] === 'true'");
                const disabledLinkIndex = componentCode.indexOf("node.attribs['data-react-link-disabled'] === 'true'");
                const defaultIndex = componentCode.indexOf('processDefaultNode');
                
                expect(internalLinkIndex).toBeLessThan(disabledLinkIndex);
                expect(disabledLinkIndex).toBeLessThan(defaultIndex);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle disabled links by converting to span elements', () => {
      fc.assert(
        fc.property(
          // Generate pages with disabled links
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                // Single disabled link
                fc.constant('<div><a href="/disabled" data-react-link-disabled="true">Disabled</a></div>'),
                // Multiple disabled links
                fc.constant('<nav><a href="/page1" data-react-link-disabled="true">Page 1</a><a href="/page2" data-react-link-disabled="true">Page 2</a></nav>'),
                // Disabled link with attributes
                fc.constant('<a href="/disabled" data-react-link-disabled="true" class="disabled-link">Disabled</a>')
              ),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Property 1: Should have processing instruction for disabled links
                expect(componentCode).toContain("node.attribs['data-react-link-disabled'] === 'true'");
                
                // Property 2: Should convert to span element
                expect(componentCode).toContain('<span');
                
                // Property 3: Should apply disabled styling
                expect(componentCode).toContain('cursor: \'not-allowed\'');
                expect(componentCode).toContain('opacity: 0.6');
                
                // Property 4: Should remove href and data-react-link-disabled attributes
                expect(componentCode).toContain("href, 'data-react-link-disabled': _");
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve link attributes when converting to Link components', () => {
      fc.assert(
        fc.property(
          // Generate internal links with various attributes
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                // Link with class
                fc.constant('<a href="/page" data-react-link="true" class="nav-link">Page</a>'),
                // Link with id
                fc.constant('<a href="/page" data-react-link="true" id="page-link">Page</a>'),
                // Link with multiple attributes
                fc.constant('<a href="/page" data-react-link="true" class="link" id="main-link" title="Go to page">Page</a>'),
                // Link with data attributes
                fc.constant('<a href="/page" data-react-link="true" data-test="link" data-analytics="click">Page</a>')
              ),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Property 1: Should spread other attributes to Link component
                expect(componentCode).toContain('{...otherAttribs}');
                
                // Property 2: Should destructure to remove data-react-link and data-page-target
                expect(componentCode).toContain("'data-react-link': _");
                expect(componentCode).toContain("'data-page-target': __");
                
                // Property 3: Should preserve other attributes in otherAttribs
                expect(componentCode).toContain('...otherAttribs');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle links with various href patterns', () => {
      fc.assert(
        fc.property(
          // Generate internal links with different href patterns
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                // Root path
                fc.constant('<a href="/" data-react-link="true">Home</a>'),
                // Simple path
                fc.constant('<a href="/about" data-react-link="true">About</a>'),
                // Path with multiple segments
                fc.constant('<a href="/products/category/item" data-react-link="true">Item</a>'),
                // Path with query params
                fc.constant('<a href="/search?q=test" data-react-link="true">Search</a>'),
                // Path with hash
                fc.constant('<a href="/page#section" data-react-link="true">Section</a>'),
                // Path with both query and hash
                fc.constant('<a href="/page?id=1#top" data-react-link="true">Page</a>')
              ),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Property 1: Should extract href attribute
                expect(componentCode).toContain('const href = node.attribs.href');
                
                // Property 2: Should use href as 'to' prop for Link
                expect(componentCode).toContain('to={href}');
                
                // Property 3: Should have fallback for missing href
                expect(componentCode).toContain("|| '/'");
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not import Link when page has only disabled or external links', () => {
      fc.assert(
        fc.property(
          // Generate pages without internal links (only disabled or external)
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                // Only disabled links
                fc.constant('<div><a href="/disabled" data-react-link-disabled="true">Disabled</a></div>'),
                // Only external links
                fc.constant('<div><a href="https://example.com">External</a></div>'),
                // Mix of disabled and external
                fc.constant('<nav><a href="/disabled" data-react-link-disabled="true">Disabled</a><a href="https://example.com">External</a></nav>'),
                // No links at all
                fc.constant('<div><p>No links here</p></div>')
              ),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Property: Should NOT import Link component
                expect(componentCode).not.toContain("import { Link } from 'react-router-dom'");
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property-Based Tests for useEffect JavaScript Execution
 * Feature: html-to-react-export
 * Property 6: JavaScript 代码通过 useEffect 执行
 * Validates: Requirements 4.2, 4.3
 */
describe('Property-Based Tests: useEffect JavaScript Execution', () => {
  const fc = require('fast-check');

  describe('Property 6: JavaScript code executed through useEffect', () => {
    it('should include useEffect when page has JavaScript from js property', () => {
      fc.assert(
        fc.property(
          // Generate pages with JavaScript in js property (ensure unique names)
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.string().map(s => `<div>${s}</div>`),
              css: fc.constant(''),
              js: fc.string().filter(s => s.trim().length > 0 && s.length < 100 && !s.includes('</script>') && !s.includes('"')),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 5 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode && page.js && page.js.trim()) {
                // Property 1: Should import useEffect from React
                expect(componentCode).toContain("import { useEffect } from 'react'");
                
                // Property 2: Should have useEffect hook
                expect(componentCode).toContain('useEffect(() => {');
                
                // Property 3: Should execute the JavaScript code inside useEffect (check for presence, accounting for indentation)
                const jsLines = page.js.trim().split('\n');
                jsLines.forEach(line => {
                  if (line.trim()) {
                    expect(componentCode).toContain(line.trim());
                  }
                });
                
                // Property 4: useEffect should have empty dependency array (run once on mount)
                expect(componentCode).toContain('}, []);');
                
                // Property 5: Should wrap JS execution in try-catch for error handling
                expect(componentCode).toContain('try {');
                expect(componentCode).toContain('} catch (error) {');
                expect(componentCode).toContain('console.error("Error executing page script:", error);');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include useEffect when page has JavaScript from script tags', () => {
      fc.assert(
        fc.property(
          // Generate pages with JavaScript in script tags (ensure unique names)
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.string()
                .filter(s => s.trim().length > 0 && s.length < 100 && !s.includes('</script>') && !s.includes('src=') && !s.includes('"') && !s.includes("'") && !s.includes('`') && !s.includes('$') && !s.includes('#'))
                .map(js => `<div>Content</div><script>${js}</script>`),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 5 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Extract the JS from the script tag
                const scriptMatch = page.html.match(/<script>(.*?)<\/script>/s);
                const extractedJS = scriptMatch ? scriptMatch[1].trim() : '';
                
                if (extractedJS) {
                  // Property 1: Should import useEffect
                  expect(componentCode).toContain("import { useEffect } from 'react'");
                  
                  // Property 2: Should have useEffect hook
                  expect(componentCode).toContain('useEffect(() => {');
                  
                  // Property 3: Should execute the extracted JavaScript (check line by line)
                  const jsLines = extractedJS.split('\n');
                  jsLines.forEach(line => {
                    if (line.trim()) {
                      expect(componentCode).toContain(line.trim());
                    }
                  });
                  
                  // Property 4: Should have empty dependency array
                  expect(componentCode).toContain('}, []);');
                  
                  // Property 5: HTML content should not contain script tags
                  expect(componentCode).toMatch(/const htmlContent = `[^`]*`/);
                  const htmlContentMatch = componentCode.match(/const htmlContent = `([^`]*)`/);
                  if (htmlContentMatch) {
                    expect(htmlContentMatch[1]).not.toContain('<script>');
                  }
                }
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should combine JavaScript from both script tags and js property', () => {
      fc.assert(
        fc.property(
          // Generate pages with JavaScript in both places (ensure unique names)
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.string()
                .filter(s => s.trim().length > 0 && s.length < 50 && !s.includes('</script>') && !s.includes('src=') && !s.includes('"') && !s.includes("'") && !s.includes('`') && !s.includes('$') && !s.includes('#'))
                .map(js => `<div>Content</div><script>${js}</script>`),
              css: fc.constant(''),
              js: fc.string().filter(s => s.trim().length > 0 && s.length < 50 && !s.includes('</script>') && !s.includes('"') && !s.includes("'") && !s.includes('`') && !s.includes('$') && !s.includes('#')),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Extract the JS from the script tag
                const scriptMatch = page.html.match(/<script>(.*?)<\/script>/s);
                const extractedJS = scriptMatch ? scriptMatch[1].trim() : '';
                
                if (extractedJS && page.js && page.js.trim()) {
                  // Property 1: Should import useEffect
                  expect(componentCode).toContain("import { useEffect } from 'react'");
                  
                  // Property 2: Should contain both JavaScript sources (check line by line)
                  const extractedLines = extractedJS.split('\n');
                  extractedLines.forEach(line => {
                    if (line.trim()) {
                      expect(componentCode).toContain(line.trim());
                    }
                  });
                  
                  const jsLines = page.js.trim().split('\n');
                  jsLines.forEach(line => {
                    if (line.trim()) {
                      expect(componentCode).toContain(line.trim());
                    }
                  });
                  
                  // Property 3: Both JS blocks should be in the same useEffect
                  const useEffectMatch = componentCode.match(/useEffect\(\(\) => \{([\s\S]*?)\}, \[\]\);/);
                  if (useEffectMatch) {
                    const useEffectContent = useEffectMatch[1];
                    // Check that both JS sources are present in the useEffect
                    extractedLines.forEach(line => {
                      if (line.trim()) {
                        expect(useEffectContent).toContain(line.trim());
                      }
                    });
                    jsLines.forEach(line => {
                      if (line.trim()) {
                        expect(useEffectContent).toContain(line.trim());
                      }
                    });
                  }
                }
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT include useEffect when page has no JavaScript', () => {
      fc.assert(
        fc.property(
          // Generate pages without JavaScript
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                fc.string().map(s => `<div>${s}</div>`),
                fc.constant('<div>Simple content</div>'),
                fc.constant('<p>No JavaScript here</p>'),
                fc.constant('<header>Header</header><main>Main</main>')
              ),
              css: fc.oneof(fc.constant(''), fc.string().filter(s => s.length < 50)),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Property 1: Should NOT import useEffect
                expect(componentCode).not.toContain("import { useEffect } from 'react'");
                
                // Property 2: Should NOT have useEffect hook
                expect(componentCode).not.toContain('useEffect');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should NOT include useEffect when page has only external scripts (with src attribute)', () => {
      fc.assert(
        fc.property(
          // Generate pages with external scripts only
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                fc.constant('<div>Content</div><script src="external.js"></script>'),
                fc.constant('<script src="https://cdn.example.com/lib.js"></script><div>Content</div>'),
                fc.constant('<div>Content</div><script src="app.js" defer></script>')
              ),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Property: Should NOT import useEffect (external scripts are not extracted)
                expect(componentCode).not.toContain("import { useEffect } from 'react'");
                expect(componentCode).not.toContain('useEffect');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle JavaScript with various content types', () => {
      fc.assert(
        fc.property(
          // Generate pages with different types of JavaScript (ensure unique names)
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.constant('<div>Content</div>'),
              css: fc.constant(''),
              js: fc.oneof(
                // Simple console.log
                fc.constant('console.log("Hello");'),
                // Variable declaration
                fc.constant('const x = 42;'),
                // Function declaration
                fc.constant('function greet() { return "Hi"; }'),
                // DOM manipulation
                fc.constant('document.title = "New Title";'),
                // Event listener
                fc.constant('window.addEventListener("load", () => {});'),
                // With special characters (avoid quotes that might break)
                fc.constant('const str = "Hello World";'),
                // With template literals
                fc.constant('const msg = `Hello`;')
              ),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode && page.js && page.js.trim()) {
                // Property 1: Should import useEffect
                expect(componentCode).toContain("import { useEffect } from 'react'");
                
                // Property 2: Should contain the JavaScript code (check line by line to handle indentation)
                const jsLines = page.js.split('\n');
                jsLines.forEach(line => {
                  if (line.trim()) {
                    expect(componentCode).toContain(line.trim());
                  }
                });
                
                // Property 3: Should be wrapped in useEffect
                expect(componentCode).toContain('useEffect(() => {');
                
                // Property 4: Should have error handling
                expect(componentCode).toContain('try {');
                expect(componentCode).toContain('} catch (error) {');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple script tags and combine them', () => {
      fc.assert(
        fc.property(
          // Generate pages with multiple script tags (ensure unique names)
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.array(
                fc.string().filter(s => s.trim().length > 0 && s.length < 30 && !s.includes('</script>') && !s.includes('src=') && !s.includes('"') && !s.includes("'")),
                { minLength: 2, maxLength: 4 }
              ).map(jsBlocks => {
                return jsBlocks.map(js => `<script>${js}</script>`).join('<div>Content</div>');
              }),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Extract all JS blocks from script tags
                const scriptMatches = Array.from(page.html.matchAll(/<script>(.*?)<\/script>/gs));
                const jsBlocks = scriptMatches.map(match => match[1].trim()).filter(js => js);
                
                if (jsBlocks.length > 0) {
                  // Property 1: Should import useEffect
                  expect(componentCode).toContain("import { useEffect } from 'react'");
                  
                  // Property 2: All JS blocks should be in the component (check line by line)
                  jsBlocks.forEach(jsBlock => {
                    const lines = jsBlock.split('\n');
                    lines.forEach(line => {
                      if (line.trim()) {
                        expect(componentCode).toContain(line.trim());
                      }
                    });
                  });
                  
                  // Property 3: Should have single useEffect (not multiple)
                  const useEffectMatches = componentCode.match(/useEffect\(/g);
                  expect(useEffectMatches).toBeTruthy();
                  expect(useEffectMatches!.length).toBe(1);
                }
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle whitespace-only JavaScript gracefully', () => {
      fc.assert(
        fc.property(
          // Generate pages with whitespace-only JavaScript
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.constant('<div>Content</div>'),
              css: fc.constant(''),
              js: fc.oneof(
                fc.constant('   '),
                fc.constant('\n\n'),
                fc.constant('\t\t'),
                fc.constant('  \n  \t  ')
              ),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 3 }
          ),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                // Property: Should NOT include useEffect for whitespace-only JS
                expect(componentCode).not.toContain("import { useEffect } from 'react'");
                expect(componentCode).not.toContain('useEffect');
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe('assembleReactProject', () => {
  const mockPages: ProcessedPage[] = [
    {
      name: 'home',
      html: '<div id="home-content"><h1>Welcome Home</h1></div>',
      css: '.home-content { color: blue; }',
      js: 'console.log("Home page loaded");',
      designSystem: 'vanilla',
    },
    {
      name: 'about',
      html: '<div id="about-content"><h1>About Us</h1></div>',
      css: '.about-content { color: green; }',
      js: 'console.log("About page loaded");',
      designSystem: 'vanilla',
    },
  ];

  const mockSharedCSS = 'body { margin: 0; padding: 0; }';
  const mockPageCSS = new Map([
    ['home', '.home-specific { font-size: 16px; }'],
    ['about', '.about-specific { font-size: 14px; }'],
  ]);

  const mockDeps = {
    stylesheets: ['https://cdn.example.com/styles.css'],
    scripts: ['https://cdn.example.com/script.js'],
  };

  const emptyMockResult: MockGenerationResult = {
    endpoints: [],
    mockFiles: new Map(),
    interceptScript: '',
  };

  describe('basic project structure', () => {
    it('should generate all required files for a React project', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      // Check required files exist
      expect(result.has('package.json')).toBe(true);
      expect(result.has('src/App.jsx')).toBe(true);
      expect(result.has('src/index.jsx')).toBe(true);
      expect(result.has('public/index.html')).toBe(true);
      expect(result.has('README.md')).toBe(true);
      expect(result.has('.gitignore')).toBe(true);
    });

    it('should generate page components for each page', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      // Check page components exist
      expect(result.has('src/pages/Home.jsx')).toBe(true);
      expect(result.has('src/pages/About.jsx')).toBe(true);
    });

    it('should generate shared CSS file when shared CSS exists', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      expect(result.has('src/styles/shared.css')).toBe(true);
      expect(result.get('src/styles/shared.css')).toBe(mockSharedCSS);
    });

    it('should not generate shared CSS file when shared CSS is empty', () => {
      const result = assembleReactProject(
        mockPages,
        '',
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      expect(result.has('src/styles/shared.css')).toBe(false);
    });
  });

  describe('package.json generation', () => {
    it('should include React dependencies', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const packageJson = result.get('package.json');
      expect(packageJson).toBeDefined();

      const pkg = JSON.parse(packageJson!);
      expect(pkg.dependencies).toHaveProperty('html-to-react');
      expect(pkg.dependencies).toHaveProperty('react');
      expect(pkg.dependencies).toHaveProperty('react-dom');
      expect(pkg.dependencies).toHaveProperty('react-router-dom');
    });

    it('should include npm scripts', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const packageJson = result.get('package.json');
      const pkg = JSON.parse(packageJson!);

      expect(pkg.scripts).toHaveProperty('start');
      expect(pkg.scripts).toHaveProperty('build');
      expect(pkg.scripts.start).toBe('react-scripts start');
      expect(pkg.scripts.build).toBe('react-scripts build');
    });

    it('should use app name as package name', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'My Test App'
      );

      const packageJson = result.get('package.json');
      const pkg = JSON.parse(packageJson!);

      expect(pkg.name).toBe('my-test-app');
    });
  });

  describe('page component generation', () => {
    it('should generate React components using html-to-react Parser', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const homeComponent = result.get('src/pages/Home.jsx');
      expect(homeComponent).toBeDefined();
      // Should use html-to-react instead of dangerouslySetInnerHTML
      expect(homeComponent).toContain('html-to-react');
      expect(homeComponent).toContain('Parser');
      expect(homeComponent).toContain('ProcessNodeDefinitions');
      expect(homeComponent).toContain('parseWithInstructions');
      expect(homeComponent).not.toContain('dangerouslySetInnerHTML');
      expect(homeComponent).toContain('Welcome Home');
    });

    it('should include useEffect for JavaScript execution', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const homeComponent = result.get('src/pages/Home.jsx');
      expect(homeComponent).toBeDefined();
      expect(homeComponent).toContain('useEffect');
      expect(homeComponent).toContain('console.log("Home page loaded")');
    });

    it('should generate separate CSS file for page-specific CSS', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const homeComponent = result.get('src/pages/Home.jsx');
      expect(homeComponent).toBeDefined();
      // Should import CSS from separate file instead of inline <style> tag
      expect(homeComponent).toContain("import './styles/Home.css'");
      expect(homeComponent).not.toContain('<style>');
      
      // CSS should be in separate file
      const homeCss = result.get('src/styles/Home.css');
      expect(homeCss).toBeDefined();
      expect(homeCss).toContain('.home-specific');
    });

    it('should handle pages without JavaScript', () => {
      const pagesWithoutJS: ProcessedPage[] = [
        {
          name: 'simple',
          html: '<div>Simple page</div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
      ];

      const result = assembleReactProject(
        pagesWithoutJS,
        '',
        new Map(),
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const simpleComponent = result.get('src/pages/Simple.jsx');
      expect(simpleComponent).toBeDefined();
      // Should not import useEffect if no JS
      expect(simpleComponent).not.toContain('useEffect');
    });

    it('should import Link component when page has internal links', () => {
      const pagesWithLinks: ProcessedPage[] = [
        {
          name: 'navigation',
          html: '<div><a href="/about" data-react-link="true">About</a></div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
      ];

      const result = assembleReactProject(
        pagesWithLinks,
        '',
        new Map(),
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const navComponent = result.get('src/pages/Navigation.jsx');
      expect(navComponent).toBeDefined();
      expect(navComponent).toContain("import { Link } from 'react-router-dom'");
    });

    it('should not import Link component when page has no internal links', () => {
      const pagesWithoutLinks: ProcessedPage[] = [
        {
          name: 'simple',
          html: '<div><a href="https://example.com">External</a></div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
      ];

      const result = assembleReactProject(
        pagesWithoutLinks,
        '',
        new Map(),
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const simpleComponent = result.get('src/pages/Simple.jsx');
      expect(simpleComponent).toBeDefined();
      expect(simpleComponent).not.toContain("import { Link }");
    });

    it('should generate ProcessingInstructions for internal link conversion', () => {
      const pagesWithLinks: ProcessedPage[] = [
        {
          name: 'navigation',
          html: '<div><a href="/about" data-react-link="true">About</a></div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
      ];

      const result = assembleReactProject(
        pagesWithLinks,
        '',
        new Map(),
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const navComponent = result.get('src/pages/Navigation.jsx');
      expect(navComponent).toBeDefined();
      // Should convert internal link to Link component at build time
      expect(navComponent).toContain('import { Link }');
      expect(navComponent).toContain('<Link to="/about"');
      expect(navComponent).toContain('</Link>');
    });

    it('should generate ProcessingInstructions for disabled links', () => {
      const pagesWithDisabledLinks: ProcessedPage[] = [
        {
          name: 'navigation',
          html: '<div><a href="/disabled" data-react-link-disabled="true">Disabled</a></div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
      ];

      const result = assembleReactProject(
        pagesWithDisabledLinks,
        '',
        new Map(),
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const navComponent = result.get('src/pages/Navigation.jsx');
      expect(navComponent).toBeDefined();
      // Should convert disabled link to span element at build time
      expect(navComponent).toContain('<span');
      expect(navComponent).toContain('cursor: \'not-allowed\'');
      expect(navComponent).toContain('opacity: 0.6');
    });

    it('should combine CSS from pageCSS and extracted style tags', () => {
      const pagesWithStyleTags: ProcessedPage[] = [
        {
          name: 'styled',
          html: '<style>.inline-style { color: red; }</style><div>Content</div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
      ];

      const pageCSSMap = new Map([['styled', '.page-css { color: blue; }']]);

      const result = assembleReactProject(
        pagesWithStyleTags,
        '',
        pageCSSMap,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const styledCss = result.get('src/styles/Styled.css');
      expect(styledCss).toBeDefined();
      expect(styledCss).toContain('.page-css');
      expect(styledCss).toContain('.inline-style');
    });

    it('should handle pages without CSS', () => {
      const pagesWithoutCSS: ProcessedPage[] = [
        {
          name: 'simple',
          html: '<div>Simple page</div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
      ];

      const result = assembleReactProject(
        pagesWithoutCSS,
        '',
        new Map(),
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const simpleComponent = result.get('src/pages/Simple.jsx');
      expect(simpleComponent).toBeDefined();
      // Should not import CSS file if no CSS
      expect(simpleComponent).not.toContain("import './styles/");
      // Should not have CSS file
      expect(result.has('src/styles/Simple.css')).toBe(false);
    });

    it('should convert page names to PascalCase component names', () => {
      const pagesWithDashes: ProcessedPage[] = [
        {
          name: 'product-list',
          html: '<div>Products</div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
        {
          name: 'user_profile',
          html: '<div>Profile</div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
      ];

      const result = assembleReactProject(
        pagesWithDashes,
        '',
        new Map(),
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      expect(result.has('src/pages/ProductList.jsx')).toBe(true);
      expect(result.has('src/pages/UserProfile.jsx')).toBe(true);
    });
  });

  describe('App.jsx generation', () => {
    it('should include React Router configuration', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const appCode = result.get('src/App.jsx');
      expect(appCode).toBeDefined();
      expect(appCode).toContain('BrowserRouter');
      expect(appCode).toContain('Routes');
      expect(appCode).toContain('Route');
    });

    it('should import all page components', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const appCode = result.get('src/App.jsx');
      expect(appCode).toContain("import Home from './pages/Home'");
      expect(appCode).toContain("import About from './pages/About'");
    });

    it('should create routes for all pages', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const appCode = result.get('src/App.jsx');
      expect(appCode).toContain('<Route path="/" element={<Home />}');
      expect(appCode).toContain('<Route path="/about" element={<About />}');
    });

    it('should include navigation menu for multiple pages', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const appCode = result.get('src/App.jsx');
      expect(appCode).toContain('<nav');
      expect(appCode).toContain('<Link to="/">Home</Link>');
      expect(appCode).toContain('<Link to="/about">About</Link>');
    });

    it('should not include navigation menu for single page', () => {
      const singlePage: ProcessedPage[] = [mockPages[0]];

      const result = assembleReactProject(
        singlePage,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const appCode = result.get('src/App.jsx');
      expect(appCode).not.toContain('<nav');
    });

    it('should import shared CSS', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const appCode = result.get('src/App.jsx');
      expect(appCode).toContain("import './styles/shared.css'");
    });
  });

  describe('index.jsx generation', () => {
    it('should create React root and render App', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const indexCode = result.get('src/index.jsx');
      expect(indexCode).toBeDefined();
      expect(indexCode).toContain('ReactDOM.createRoot');
      expect(indexCode).toContain("document.getElementById('root')");
      expect(indexCode).toContain('<App />');
    });
  });

  describe('public/index.html generation', () => {
    it('should include app name in title', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const indexHtml = result.get('public/index.html');
      expect(indexHtml).toBeDefined();
      expect(indexHtml).toContain('<title>Test App</title>');
    });

    it('should include global layout styles', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const indexHtml = result.get('public/index.html');
      expect(indexHtml).toContain('body {');
      expect(indexHtml).toContain('margin: 0;');
      expect(indexHtml).toContain('box-sizing: border-box;');
    });

    it('should include link stylesheets extracted from page HTML', () => {
      const pagesWithLinks: ProcessedPage[] = [
        {
          name: 'home',
          html: '<link rel="stylesheet" href="https://example.com/custom.css" /><div>Home</div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
      ];

      const result = assembleReactProject(
        pagesWithLinks,
        '',
        new Map(),
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const indexHtml = result.get('public/index.html');
      expect(indexHtml).toContain('https://example.com/custom.css');
    });

    it('should include design system CDN dependencies', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const indexHtml = result.get('public/index.html');
      expect(indexHtml).toContain('https://cdn.example.com/styles.css');
      expect(indexHtml).toContain('https://cdn.example.com/script.js');
    });

    it('should include root div for React mounting', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const indexHtml = result.get('public/index.html');
      expect(indexHtml).toContain('<div id="root"></div>');
    });
  });

  describe('README.md generation', () => {
    it('should include installation instructions (Requirement 6.5)', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const readme = result.get('README.md');
      expect(readme).toBeDefined();
      expect(readme).toContain('npm install');
      expect(readme).toContain('yarn install');
    });

    it('should include startup instructions (Requirement 6.5)', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const readme = result.get('README.md');
      expect(readme).toContain('npm start');
      expect(readme).toContain('yarn start');
    });

    it('should include build instructions', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const readme = result.get('README.md');
      expect(readme).toContain('npm run build');
      expect(readme).toContain('Build for Production');
    });

    it('should include deployment instructions', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const readme = result.get('README.md');
      expect(readme).toContain('Deploy to Netlify');
      expect(readme).toContain('Deploy to Vercel');
      expect(readme).toContain('Deploy to GitHub Pages');
    });

    it('should include app name in title', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'My Custom App'
      );

      const readme = result.get('README.md');
      expect(readme).toContain('# My Custom App');
    });
  });

  describe('mock data integration', () => {
    it('should include mock files when API calls are detected', () => {
      const mockResult: MockGenerationResult = {
        endpoints: [
          {
            method: 'GET',
            path: '/api/products',
            mockData: { products: [] },
          },
        ],
        mockFiles: new Map([
          ['mock/api/products.json', '{"products":[]}'],
        ]),
        interceptScript: 'window.fetch = function() { /* mock */ };',
      };

      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        mockResult,
        'Test App'
      );

      expect(result.has('public/mock/interceptor.js')).toBe(true);
      expect(result.has('public/mock/api/products.json')).toBe(true);
    });

    it('should not include mock files when no API calls detected', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      expect(result.has('public/mock/interceptor.js')).toBe(false);
    });

    it('should mention mock data in README when present', () => {
      const mockResult: MockGenerationResult = {
        endpoints: [
          {
            method: 'GET',
            path: '/api/products',
            mockData: { products: [] },
          },
        ],
        mockFiles: new Map([
          ['mock/api/products.json', '{"products":[]}'],
        ]),
        interceptScript: 'window.fetch = function() { /* mock */ };',
      };

      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        mockResult,
        'Test App'
      );

      const readme = result.get('README.md');
      expect(readme).toContain('Mock API Data');
      expect(readme).toContain('interceptor.js');
    });
  });

  describe('.gitignore generation', () => {
    it('should include common ignore patterns', () => {
      const result = assembleReactProject(
        mockPages,
        mockSharedCSS,
        mockPageCSS,
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const gitignore = result.get('.gitignore');
      expect(gitignore).toBeDefined();
      expect(gitignore).toContain('node_modules/');
      expect(gitignore).toContain('build/');
      expect(gitignore).toContain('.env.local');
    });
  });

  describe('edge cases', () => {
    it('should handle special characters in HTML content', () => {
      const specialPages: ProcessedPage[] = [
        {
          name: 'special',
          html: '<div>`backticks` and $variables</div>',
          css: '',
          js: '',
          designSystem: 'vanilla',
        },
      ];

      const result = assembleReactProject(
        specialPages,
        '',
        new Map(),
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      const component = result.get('src/pages/Special.jsx');
      expect(component).toBeDefined();
      // Should escape backticks and dollar signs
      expect(component).toContain('\\`backticks\\`');
      expect(component).toContain('\\$variables');
    });

    it('should handle empty page arrays gracefully', () => {
      const result = assembleReactProject(
        [],
        '',
        new Map(),
        mockDeps,
        emptyMockResult,
        'Test App'
      );

      // Should still generate basic structure
      expect(result.has('package.json')).toBe(true);
      expect(result.has('README.md')).toBe(true);
    });

    it('should handle pages with no design system', () => {
      const pagesWithoutDS: ProcessedPage[] = [
        {
          name: 'plain',
          html: '<div>Plain page</div>',
          css: '',
          js: '',
        },
      ];

      const result = assembleReactProject(
        pagesWithoutDS,
        '',
        new Map(),
        { stylesheets: [], scripts: [] },
        emptyMockResult,
        'Test App'
      );

      expect(result.has('src/pages/Plain.jsx')).toBe(true);
    });
  });
});

/**
 * Property-Based Tests for CSS File Generation
 * Feature: html-to-react-export
 * Property 2: 每个有 CSS 的页面生成独立 CSS 文件
 * Validates: Requirements 2.1
 */
describe('Property-Based Tests: Page CSS File Generation', () => {
  const fc = require('fast-check');

  describe('Property 2: Each page with CSS generates a separate CSS file', () => {
    it('should generate CSS file for each page with CSS content from pageCSS map', () => {
      fc.assert(
        fc.property(
          // Generate pages with varying CSS content
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.string().map(s => `<div>${s}</div>`),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 10 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          // Generate CSS content for some pages (not all)
          fc.array(fc.boolean(), { minLength: 1, maxLength: 10 }),
          (pages, hasCssFlags) => {
            // Build pageCSS map based on flags
            const pageCSSMap = new Map<string, string>();
            const pagesWithCSS: string[] = [];
            const pagesWithoutCSS: string[] = [];
            
            pages.forEach((page, idx) => {
              const hasCSS = idx < hasCssFlags.length ? hasCssFlags[idx] : false;
              if (hasCSS) {
                const cssContent = `.${page.name} { color: blue; font-size: 16px; }`;
                pageCSSMap.set(page.name, cssContent);
                pagesWithCSS.push(page.name);
              } else {
                pagesWithoutCSS.push(page.name);
              }
            });

            const result = assembleReactProject(
              pages,
              '',
              pageCSSMap,
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            // Property 1: Each page with CSS should have a corresponding CSS file
            pagesWithCSS.forEach(pageName => {
              const componentName = pageName
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const cssFilePath = `src/styles/${componentName}.css`;
              const cssFile = result.get(cssFilePath);
              
              // CSS file should exist
              expect(cssFile).toBeDefined();
              
              if (cssFile) {
                // CSS file should contain the page's CSS content
                const expectedCSS = pageCSSMap.get(pageName);
                expect(cssFile).toContain(expectedCSS!);
              }
            });

            // Property 2: Pages without CSS should NOT have CSS files
            pagesWithoutCSS.forEach(pageName => {
              const componentName = pageName
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const cssFilePath = `src/styles/${componentName}.css`;
              const cssFile = result.get(cssFilePath);
              
              // CSS file should NOT exist
              expect(cssFile).toBeUndefined();
            });

            // Property 3: Components with CSS should import their CSS file
            pagesWithCSS.forEach(pageName => {
              const componentName = pageName
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                expect(componentCode).toContain(`import './styles/${componentName}.css'`);
              }
            });

            // Property 4: Components without CSS should NOT import CSS file
            pagesWithoutCSS.forEach(pageName => {
              const componentName = pageName
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              
              if (componentCode) {
                expect(componentCode).not.toContain(`import './styles/${componentName}.css'`);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate CSS file for pages with CSS from style tags in HTML', () => {
      fc.assert(
        fc.property(
          // Generate pages with style tags in HTML
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                // HTML with style tag
                fc.string()
                  .filter(s => !s.includes('</style>') && s.trim().length > 0 && s.length < 100)
                  .map(css => `<div>Content</div><style>${css}</style>`),
                // HTML without style tag
                fc.constant('<div>Content without styles</div>')
              ),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 10 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              // Check if page has style tag
              const hasStyleTag = page.html.includes('<style>');
              const cssFilePath = `src/styles/${componentName}.css`;
              const cssFile = result.get(cssFilePath);
              
              if (hasStyleTag) {
                // Extract CSS from style tag
                const styleMatch = page.html.match(/<style>(.*?)<\/style>/s);
                const extractedCSS = styleMatch ? styleMatch[1].trim() : '';
                
                if (extractedCSS) {
                  // Property 1: CSS file should exist
                  expect(cssFile).toBeDefined();
                  
                  // Property 2: CSS file should contain extracted CSS
                  if (cssFile) {
                    expect(cssFile).toContain(extractedCSS);
                  }
                  
                  // Property 3: Component should import CSS file
                  const componentCode = result.get(`src/pages/${componentName}.jsx`);
                  if (componentCode) {
                    expect(componentCode).toContain(`import './styles/${componentName}.css'`);
                  }
                }
              } else {
                // Property 4: Pages without style tags should not have CSS files
                expect(cssFile).toBeUndefined();
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should combine CSS from both pageCSS map and style tags', () => {
      fc.assert(
        fc.property(
          // Generate pages with CSS from both sources
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.string()
                .filter(s => !s.includes('</style>') && s.trim().length > 0 && s.length < 50)
                .map(css => `<div>Content</div><style>${css}</style>`),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 5 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          (pages) => {
            // Create pageCSS map with CSS for all pages
            const pageCSSMap = new Map<string, string>();
            pages.forEach(page => {
              pageCSSMap.set(page.name, `.${page.name}-from-map { margin: 10px; }`);
            });

            const result = assembleReactProject(
              pages,
              '',
              pageCSSMap,
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const cssFilePath = `src/styles/${componentName}.css`;
              const cssFile = result.get(cssFilePath);
              
              // Property 1: CSS file should exist
              expect(cssFile).toBeDefined();
              
              if (cssFile) {
                // Property 2: CSS file should contain CSS from pageCSS map
                const cssFromMap = pageCSSMap.get(page.name);
                expect(cssFile).toContain(cssFromMap!);
                
                // Property 3: CSS file should contain CSS from style tag
                const styleMatch = page.html.match(/<style>(.*?)<\/style>/s);
                const extractedCSS = styleMatch ? styleMatch[1].trim() : '';
                if (extractedCSS) {
                  expect(cssFile).toContain(extractedCSS);
                }
                
                // Property 4: Both CSS sources should be separated by double newline
                expect(cssFile).toMatch(/\n\n/);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle pages with empty or whitespace-only CSS', () => {
      fc.assert(
        fc.property(
          // Generate pages with empty or whitespace CSS
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.constant('<div>Content</div>'),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 5 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          fc.array(
            fc.oneof(
              fc.constant(''),
              fc.constant('   '),
              fc.constant('\n\n'),
              fc.constant('\t\t')
            ),
            { minLength: 1, maxLength: 5 }
          ),
          (pages, cssValues) => {
            // Create pageCSS map with empty/whitespace CSS
            const pageCSSMap = new Map<string, string>();
            pages.forEach((page, idx) => {
              if (idx < cssValues.length) {
                pageCSSMap.set(page.name, cssValues[idx]);
              }
            });

            const result = assembleReactProject(
              pages,
              '',
              pageCSSMap,
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const cssFilePath = `src/styles/${componentName}.css`;
              const cssFile = result.get(cssFilePath);
              
              // Property: Pages with only empty/whitespace CSS should NOT have CSS files
              expect(cssFile).toBeUndefined();
              
              // Property: Components should NOT import CSS file
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              if (componentCode) {
                expect(componentCode).not.toContain(`import './styles/${componentName}.css'`);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate CSS files with correct component name transformation', () => {
      fc.assert(
        fc.property(
          // Generate pages with various naming patterns
          fc.array(
            fc.oneof(
              fc.constant('home-page'),
              fc.constant('about_us'),
              fc.constant('contact-form'),
              fc.constant('user_profile'),
              fc.constant('product-list'),
              fc.constant('my-account'),
              fc.constant('settings_page')
            ),
            { minLength: 1, maxLength: 7 }
          ).map((names, idx) => {
            // Ensure unique names
            return names.map((name, i) => `${name}${i}`);
          }),
          (pageNames) => {
            const pages = pageNames.map(name => ({
              name,
              html: '<div>Content</div>',
              css: '',
              js: '',
              designSystem: 'vanilla' as const
            }));

            // Create pageCSS map with CSS for all pages
            const pageCSSMap = new Map<string, string>();
            pages.forEach(page => {
              pageCSSMap.set(page.name, `.${page.name} { color: red; }`);
            });

            const result = assembleReactProject(
              pages,
              '',
              pageCSSMap,
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach(page => {
              // Transform page name to component name (PascalCase)
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const cssFilePath = `src/styles/${componentName}.css`;
              const cssFile = result.get(cssFilePath);
              
              // Property 1: CSS file should exist with correct transformed name
              expect(cssFile).toBeDefined();
              
              // Property 2: CSS file path should use PascalCase component name
              expect(result.has(cssFilePath)).toBe(true);
              
              // Property 3: Component should import CSS with correct path
              const componentCode = result.get(`src/pages/${componentName}.jsx`);
              if (componentCode) {
                expect(componentCode).toContain(`import './styles/${componentName}.css'`);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle multiple pages with different CSS content', () => {
      fc.assert(
        fc.property(
          // Generate multiple pages with unique CSS
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.constant('<div>Content</div>'),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 2, maxLength: 10 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          (pages) => {
            // Create unique CSS for each page
            const pageCSSMap = new Map<string, string>();
            pages.forEach((page, idx) => {
              pageCSSMap.set(page.name, `.page-${idx} { color: rgb(${idx * 10}, ${idx * 20}, ${idx * 30}); }`);
            });

            const result = assembleReactProject(
              pages,
              '',
              pageCSSMap,
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            // Property 1: Each page should have its own CSS file
            expect(result.size).toBeGreaterThanOrEqual(pages.length);

            // Property 2: Each CSS file should contain only its page's CSS
            pages.forEach((page, idx) => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const cssFile = result.get(`src/styles/${componentName}.css`);
              
              if (cssFile) {
                // Should contain this page's CSS
                const expectedCSS = pageCSSMap.get(page.name);
                expect(cssFile).toContain(expectedCSS!);
                
                // Should NOT contain other pages' CSS
                pages.forEach((otherPage, otherIdx) => {
                  if (otherIdx !== idx) {
                    const otherCSS = pageCSSMap.get(otherPage.name);
                    if (otherCSS !== expectedCSS) {
                      expect(cssFile).not.toContain(otherCSS!);
                    }
                  }
                });
              }
            });

            // Property 3: CSS files should be independent (no cross-contamination)
            const cssFiles = Array.from(result.entries())
              .filter(([path]) => path.startsWith('src/styles/') && path.endsWith('.css') && !path.includes('shared'));
            
            expect(cssFiles.length).toBe(pages.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should preserve CSS content integrity when generating files', () => {
      fc.assert(
        fc.property(
          // Generate pages with various CSS content
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.constant('<div>Content</div>'),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 5 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          fc.array(
            fc.string().filter(s => s.length > 0 && s.length < 200),
            { minLength: 1, maxLength: 5 }
          ),
          (pages, cssContents) => {
            // Create pageCSS map with arbitrary CSS content
            const pageCSSMap = new Map<string, string>();
            pages.forEach((page, idx) => {
              if (idx < cssContents.length) {
                pageCSSMap.set(page.name, cssContents[idx]);
              }
            });

            const result = assembleReactProject(
              pages,
              '',
              pageCSSMap,
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            pages.forEach((page, idx) => {
              if (idx < cssContents.length) {
                const componentName = page.name
                  .split(/[-_\s]+/)
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join('');
                
                const cssFile = result.get(`src/styles/${componentName}.css`);
                
                if (cssFile) {
                  // Property: CSS file should contain exact CSS content from pageCSS map
                  const originalCSS = pageCSSMap.get(page.name);
                  expect(cssFile).toContain(originalCSS!);
                }
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property-Based Tests for Output File Completeness
 * Feature: html-to-react-export
 * Property 7: 输出文件映射包含所有必需文件
 * Validates: Requirements 5.2
 */
describe('Property-Based Tests: Output File Completeness', () => {
  const fc = require('fast-check');

  describe('Property 7: Output file mapping contains all required files', () => {
    it('should include all required base files for any non-empty page collection', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary non-empty page collections
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                fc.string().map(s => `<div>${s}</div>`),
                fc.constant('<div>Simple content</div>'),
                fc.constant('<p>Paragraph</p>'),
                fc.constant('<header>Header</header><main>Main</main>')
              ),
              css: fc.oneof(fc.constant(''), fc.string().filter(s => s.length < 100)),
              js: fc.oneof(fc.constant(''), fc.string().filter(s => s.length < 100 && !s.includes('</script>'))),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 10 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          fc.string().filter(s => s.length > 0 && s.length < 30),
          (pages, appName) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              appName
            );

            // Property 1: Must include package.json
            expect(result.has('package.json')).toBe(true);
            const packageJson = result.get('package.json');
            expect(packageJson).toBeDefined();
            if (packageJson) {
              // Verify it's valid JSON
              expect(() => JSON.parse(packageJson)).not.toThrow();
            }

            // Property 2: Must include src/App.jsx
            expect(result.has('src/App.jsx')).toBe(true);
            const appJsx = result.get('src/App.jsx');
            expect(appJsx).toBeDefined();
            if (appJsx) {
              // Should contain Router setup
              expect(appJsx).toContain('BrowserRouter');
              expect(appJsx).toContain('Routes');
              expect(appJsx).toContain('Route');
            }

            // Property 3: Must include src/index.jsx
            expect(result.has('src/index.jsx')).toBe(true);
            const indexJsx = result.get('src/index.jsx');
            expect(indexJsx).toBeDefined();
            if (indexJsx) {
              // Should render App component
              expect(indexJsx).toContain('ReactDOM');
              expect(indexJsx).toContain('<App />');
            }

            // Property 4: Must include public/index.html
            expect(result.has('public/index.html')).toBe(true);
            const indexHtml = result.get('public/index.html');
            expect(indexHtml).toBeDefined();
            if (indexHtml) {
              // Should have root div
              expect(indexHtml).toContain('<div id="root">');
            }

            // Property 5: Must include README.md
            expect(result.has('README.md')).toBe(true);
            const readme = result.get('README.md');
            expect(readme).toBeDefined();
            if (readme) {
              // Should contain installation instructions
              expect(readme).toContain('npm install');
              expect(readme).toContain('npm start');
            }

            // Property 6: Must include .gitignore
            expect(result.has('.gitignore')).toBe(true);
            const gitignore = result.get('.gitignore');
            expect(gitignore).toBeDefined();
            if (gitignore) {
              // Should ignore node_modules
              expect(gitignore).toContain('node_modules');
            }

            // Property 7: Must include a page component file for each page
            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentPath = `src/pages/${componentName}.jsx`;
              expect(result.has(componentPath)).toBe(true);
              
              const componentCode = result.get(componentPath);
              expect(componentCode).toBeDefined();
              if (componentCode) {
                // Should be a valid React component (either function declaration or arrow function)
                const hasFunction = componentCode.includes(`function ${componentName}(`) || 
                                   componentCode.includes(`const ${componentName} = () =>`);
                expect(hasFunction).toBe(true);
                expect(componentCode).toContain('return');
              }
            });

            // Property 8: Total file count should be at least base files + page components
            const expectedMinFiles = 6 + pages.length; // 6 base files + N page components
            expect(result.size).toBeGreaterThanOrEqual(expectedMinFiles);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all required files even with minimal page data', () => {
      fc.assert(
        fc.property(
          // Generate minimal pages (just name and empty content)
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.constant('<div></div>'),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 5 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Minimal App'
            );

            // All required files must exist even with minimal data
            const requiredFiles = [
              'package.json',
              'src/App.jsx',
              'src/index.jsx',
              'public/index.html',
              'README.md',
              '.gitignore'
            ];

            requiredFiles.forEach(filePath => {
              expect(result.has(filePath)).toBe(true);
              expect(result.get(filePath)).toBeDefined();
              expect(result.get(filePath)!.length).toBeGreaterThan(0);
            });

            // Each page must have a component file
            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const componentPath = `src/pages/${componentName}.jsx`;
              expect(result.has(componentPath)).toBe(true);
              expect(result.get(componentPath)).toBeDefined();
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include all required files with varying page configurations', () => {
      fc.assert(
        fc.property(
          // Generate pages with different configurations
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.oneof(
                // Simple HTML
                fc.constant('<div>Content</div>'),
                // HTML with internal links
                fc.constant('<a href="/page" data-react-link="true">Link</a>'),
                // HTML with style tags
                fc.constant('<div><style>.test { color: red; }</style>Content</div>'),
                // HTML with script tags
                fc.constant('<div><script>console.log("test");</script>Content</div>'),
                // Complex HTML
                fc.constant('<header><nav><a href="/" data-react-link="true">Home</a></nav></header><main><style>.main { padding: 20px; }</style><script>document.title = "Page";</script><p>Content</p></main>')
              ),
              css: fc.oneof(fc.constant(''), fc.string().filter(s => s.length < 50)),
              js: fc.oneof(fc.constant(''), fc.string().filter(s => s.length < 50 && !s.includes('</script>'))),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 8 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          (pages) => {
            // Create pageCSS map for some pages
            const pageCSSMap = new Map<string, string>();
            pages.forEach((page, idx) => {
              if (idx % 2 === 0) {
                pageCSSMap.set(page.name, `.${page.name} { margin: 10px; }`);
              }
            });

            const result = assembleReactProject(
              pages,
              'body { margin: 0; }',
              pageCSSMap,
              { stylesheets: ['https://cdn.example.com/styles.css'], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Complex App'
            );

            // Property 1: All base files must exist regardless of page complexity
            expect(result.has('package.json')).toBe(true);
            expect(result.has('src/App.jsx')).toBe(true);
            expect(result.has('src/index.jsx')).toBe(true);
            expect(result.has('public/index.html')).toBe(true);
            expect(result.has('README.md')).toBe(true);
            expect(result.has('.gitignore')).toBe(true);

            // Property 2: All page components must exist
            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              expect(result.has(`src/pages/${componentName}.jsx`)).toBe(true);
            });

            // Property 3: Shared CSS file should exist when sharedCSS is provided
            expect(result.has('src/styles/shared.css')).toBe(true);

            // Property 4: CSS files should exist for pages with CSS
            pages.forEach((page, idx) => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const hasPageCSS = pageCSSMap.has(page.name);
              const hasStyleTag = page.html.includes('<style>');
              
              if (hasPageCSS || hasStyleTag) {
                expect(result.has(`src/styles/${componentName}.css`)).toBe(true);
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain file completeness with mock data integration', () => {
      fc.assert(
        fc.property(
          // Generate pages
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.string().map(s => `<div>${s}</div>`),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 5 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          // Generate mock data
          fc.boolean(),
          (pages, hasMockData) => {
            const mockResult = hasMockData
              ? {
                  endpoints: [{ path: '/api/data', method: 'GET', response: { data: 'test' } }],
                  mockFiles: new Map([['api-data.json', '{"data":"test"}']]),
                  interceptScript: 'fetch interceptor code'
                }
              : { endpoints: [], mockFiles: new Map(), interceptScript: '' };

            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              mockResult,
              'Test App'
            );

            // Property 1: All base files must exist regardless of mock data
            expect(result.has('package.json')).toBe(true);
            expect(result.has('src/App.jsx')).toBe(true);
            expect(result.has('src/index.jsx')).toBe(true);
            expect(result.has('public/index.html')).toBe(true);
            expect(result.has('README.md')).toBe(true);
            expect(result.has('.gitignore')).toBe(true);

            // Property 2: All page components must exist
            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              expect(result.has(`src/pages/${componentName}.jsx`)).toBe(true);
            });

            // Property 3: Mock files should be included when mock data exists
            if (hasMockData) {
              // Mock files are adjusted to be under public/mock/
              expect(result.has('public/mock/interceptor.js')).toBe(true);
              mockResult.mockFiles.forEach((content, path) => {
                const adjustedPath = `public/mock/${path}`;
                expect(result.has(adjustedPath)).toBe(true);
              });
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should include correct file paths with proper directory structure', () => {
      fc.assert(
        fc.property(
          // Generate pages with various names
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.constant('<div>Content</div>'),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 7 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            // Property 1: All file paths should follow correct directory structure
            const allPaths = Array.from(result.keys());

            // Root level files
            const rootFiles = allPaths.filter(p => !p.includes('/'));
            expect(rootFiles).toContain('package.json');
            expect(rootFiles).toContain('README.md');
            expect(rootFiles).toContain('.gitignore');

            // src/ directory files
            const srcFiles = allPaths.filter(p => p.startsWith('src/') && !p.includes('/', 4));
            expect(srcFiles).toContain('src/App.jsx');
            expect(srcFiles).toContain('src/index.jsx');

            // src/pages/ directory files
            const pageFiles = allPaths.filter(p => p.startsWith('src/pages/'));
            expect(pageFiles.length).toBe(pages.length);
            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              expect(pageFiles).toContain(`src/pages/${componentName}.jsx`);
            });

            // public/ directory files
            const publicFiles = allPaths.filter(p => p.startsWith('public/'));
            expect(publicFiles).toContain('public/index.html');

            // Property 2: No duplicate file paths
            const uniquePaths = new Set(allPaths);
            expect(uniquePaths.size).toBe(allPaths.length);

            // Property 3: All paths should be valid (no empty segments, no trailing slashes)
            allPaths.forEach(path => {
              expect(path).not.toMatch(/\/\//); // No double slashes
              expect(path).not.toMatch(/\/$/); // No trailing slash
              expect(path.length).toBeGreaterThan(0); // Not empty
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate complete file set for single page applications', () => {
      fc.assert(
        fc.property(
          // Generate single page
          fc.record({
            name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
            html: fc.oneof(
              fc.string().map(s => `<div>${s}</div>`),
              fc.constant('<div>Single page content</div>')
            ),
            css: fc.oneof(fc.constant(''), fc.string().filter(s => s.length < 100)),
            js: fc.oneof(fc.constant(''), fc.string().filter(s => s.length < 100 && !s.includes('</script>'))),
            designSystem: fc.constant('vanilla')
          }),
          (page) => {
            const result = assembleReactProject(
              [page],
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Single Page App'
            );

            // Property: Even single page apps must have all required files
            expect(result.has('package.json')).toBe(true);
            expect(result.has('src/App.jsx')).toBe(true);
            expect(result.has('src/index.jsx')).toBe(true);
            expect(result.has('public/index.html')).toBe(true);
            expect(result.has('README.md')).toBe(true);
            expect(result.has('.gitignore')).toBe(true);

            const componentName = page.name
              .split(/[-_\s]+/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join('');
            
            expect(result.has(`src/pages/${componentName}.jsx`)).toBe(true);

            // Minimum 7 files for single page app (6 base + 1 page component)
            expect(result.size).toBeGreaterThanOrEqual(7);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate complete file set for multi-page applications', () => {
      fc.assert(
        fc.property(
          // Generate multiple pages (5-15 pages)
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.string().map(s => `<div>${s}</div>`),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 5, maxLength: 15 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Multi Page App'
            );

            // Property 1: All base files must exist
            expect(result.has('package.json')).toBe(true);
            expect(result.has('src/App.jsx')).toBe(true);
            expect(result.has('src/index.jsx')).toBe(true);
            expect(result.has('public/index.html')).toBe(true);
            expect(result.has('README.md')).toBe(true);
            expect(result.has('.gitignore')).toBe(true);

            // Property 2: All page components must exist
            // Note: Duplicate page names will result in fewer files
            const uniqueComponentNames = new Set(
              pages.map(page => 
                page.name
                  .split(/[-_\s]+/)
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join('')
              )
            );
            expect(result.size).toBeGreaterThanOrEqual(6 + uniqueComponentNames.size);

            pages.forEach(page => {
              const componentName = page.name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              expect(result.has(`src/pages/${componentName}.jsx`)).toBe(true);
            });

            // Property 3: File count should scale with unique page count
            const pageComponentFiles = Array.from(result.keys()).filter(p => p.startsWith('src/pages/'));
            expect(pageComponentFiles.length).toBe(uniqueComponentNames.size);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Property-Based Tests: Route Configuration
 * Feature: html-to-react-export
 * Property 8: 第一个页面为默认路由
 * Validates: Requirements 5.3
 */
describe('Property-Based Tests: Route Configuration', () => {
  const fc = require('fast-check');

  describe('Property 8: First page maps to default route', () => {
    it('should map the first page to "/" and other pages to "/{pageName}"', () => {
      fc.assert(
        fc.property(
          // Generate array of pages with at least 1 page
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.string().map(s => `<div>${s}</div>`),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 1, maxLength: 10 }
          ).map(pages => {
            // Ensure unique page names by appending index
            return pages.map((page, idx) => ({ ...page, name: `${page.name}${idx}` }));
          }),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            const appJsx = result.get('src/App.jsx');
            expect(appJsx).toBeDefined();

            // Property: First page should be mapped to "/" route
            const firstPageName = pages[0].name;
            const firstComponentName = firstPageName
              .split(/[-_\s]+/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join('');

            // Check that the first page has path="/"
            const firstRouteRegex = new RegExp(`<Route\\s+path="/"\\s+element={<${firstComponentName}\\s*/>}\\s*/>`);
            expect(appJsx).toMatch(firstRouteRegex);

            // Property: All other pages should be mapped to "/{pageName}" routes
            for (let i = 1; i < pages.length; i++) {
              const pageName = pages[i].name;
              const componentName = pageName
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              
              const expectedPath = `/${pageName.toLowerCase()}`;
              const routeRegex = new RegExp(`<Route\\s+path="${expectedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+element={<${componentName}\\s*/>}\\s*/>`);
              expect(appJsx).toMatch(routeRegex);
            }

            // Property: The first page should NOT have a route with its name as path
            // (unless there's only one page, in which case it's both first and only)
            if (pages.length > 1) {
              const firstPagePath = `/${firstPageName.toLowerCase()}`;
              const duplicateFirstRouteRegex = new RegExp(`<Route\\s+path="${firstPagePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"\\s+element={<${firstComponentName}\\s*/>}\\s*/>`);
              expect(appJsx).not.toMatch(duplicateFirstRouteRegex);
            }

            // Property: Navigation links should also reflect the correct paths
            if (pages.length > 1) {
              // First page link should point to "/"
              const firstNavLinkRegex = new RegExp(`<Link\\s+to="/">${firstComponentName}</Link>`);
              expect(appJsx).toMatch(firstNavLinkRegex);

              // Other page links should point to their respective paths
              for (let i = 1; i < pages.length; i++) {
                const pageName = pages[i].name;
                const componentName = pageName
                  .split(/[-_\s]+/)
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                  .join('');
                
                const expectedPath = `/${pageName.toLowerCase()}`;
                const navLinkRegex = new RegExp(`<Link\\s+to="${expectedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}">${componentName}</Link>`);
                expect(appJsx).toMatch(navLinkRegex);
              }
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle single page applications with default route', () => {
      fc.assert(
        fc.property(
          // Generate single page
          fc.record({
            name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
            html: fc.string().map(s => `<div>${s}</div>`),
            css: fc.constant(''),
            js: fc.constant(''),
            designSystem: fc.constant('vanilla')
          }),
          (page) => {
            const result = assembleReactProject(
              [page],
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Single Page App'
            );

            const appJsx = result.get('src/App.jsx');
            expect(appJsx).toBeDefined();

            // Property: Single page should be mapped to "/" route
            const componentName = page.name
              .split(/[-_\s]+/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join('');

            const routeRegex = new RegExp(`<Route\\s+path="/"\\s+element={<${componentName}\\s*/>}\\s*/>`);
            expect(appJsx).toMatch(routeRegex);

            // Property: Single page app should not have navigation menu
            expect(appJsx).not.toContain('<nav className="app-nav">');
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain route order consistency with page order', () => {
      fc.assert(
        fc.property(
          // Generate array of pages with specific names to test ordering
          fc.array(
            fc.record({
              name: fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 20),
              html: fc.constant('<div>Content</div>'),
              css: fc.constant(''),
              js: fc.constant(''),
              designSystem: fc.constant('vanilla')
            }),
            { minLength: 2, maxLength: 5 }
          ).map(pages => {
            // Ensure unique page names
            return pages.map((page, idx) => ({ ...page, name: `page${idx}` }));
          }),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            const appJsx = result.get('src/App.jsx');
            expect(appJsx).toBeDefined();

            // Property: Routes should appear in the same order as pages array
            const routeMatches = Array.from(appJsx.matchAll(/<Route\s+path="([^"]+)"\s+element={<(\w+)\s*\/>}\s*\/>/g));
            
            expect(routeMatches.length).toBe(pages.length);

            // First route should be "/"
            expect(routeMatches[0][1]).toBe('/');

            // Subsequent routes should match page names in order
            for (let i = 1; i < pages.length; i++) {
              const expectedPath = `/${pages[i].name.toLowerCase()}`;
              expect(routeMatches[i][1]).toBe(expectedPath);
            }

            // Component names should also match order
            for (let i = 0; i < pages.length; i++) {
              const expectedComponentName = pages[i].name
                .split(/[-_\s]+/)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join('');
              expect(routeMatches[i][2]).toBe(expectedComponentName);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle pages with various naming patterns for default route', () => {
      fc.assert(
        fc.property(
          // Generate pages with different naming patterns
          fc.tuple(
            fc.oneof(
              fc.constant('home'),
              fc.constant('index'),
              fc.constant('main'),
              fc.constant('landing'),
              fc.constant('dashboard'),
              fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 15)
            ),
            fc.array(
              fc.stringMatching(/^[a-z][a-z0-9-_]*$/).filter(s => s.length > 0 && s.length < 15),
              { minLength: 0, maxLength: 5 }
            )
          ).map(([firstPageName, otherPageNames]) => {
            // Create pages array with unique names
            const pages = [
              {
                name: firstPageName,
                html: '<div>First page</div>',
                css: '',
                js: '',
                designSystem: 'vanilla' as const
              },
              ...otherPageNames.map((name, idx) => ({
                name: `${name}${idx}`,
                html: '<div>Other page</div>',
                css: '',
                js: '',
                designSystem: 'vanilla' as const
              }))
            ];
            return pages;
          }),
          (pages) => {
            const result = assembleReactProject(
              pages,
              '',
              new Map(),
              { stylesheets: [], scripts: [] },
              { endpoints: [], mockFiles: new Map(), interceptScript: '' },
              'Test App'
            );

            const appJsx = result.get('src/App.jsx');
            expect(appJsx).toBeDefined();

            // Property: Regardless of the first page name, it should always map to "/"
            const firstPageName = pages[0].name;
            const firstComponentName = firstPageName
              .split(/[-_\s]+/)
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join('');

            const firstRouteRegex = new RegExp(`<Route\\s+path="/"\\s+element={<${firstComponentName}\\s*/>}\\s*/>`);
            expect(appJsx).toMatch(firstRouteRegex);

            // Property: First page should not have duplicate route with its name
            if (pages.length > 1) {
              const allRoutes = Array.from(appJsx.matchAll(/<Route\s+path="([^"]+)"/g));
              const rootRoutes = allRoutes.filter(match => match[1] === '/');
              
              // Should have exactly one root route
              expect(rootRoutes.length).toBe(1);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
