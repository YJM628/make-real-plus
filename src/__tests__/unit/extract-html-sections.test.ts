/**
 * Unit tests for extractHtmlSections
 * Feature: per-page-batch-generation
 * Requirements: 2.4, 2.5
 */

import { extractHtmlSections } from '../../utils/batch/buildPerPagePrompt';

describe('extractHtmlSections', () => {
  describe('html field preservation (Req 2.5)', () => {
    it('should return the original HTML unchanged in the html field', () => {
      const rawHtml = `<!DOCTYPE html>
<html>
<head>
  <style>body { color: red; }</style>
</head>
<body>
  <h1>Hello</h1>
  <script>console.log("hi");</script>
</body>
</html>`;

      const result = extractHtmlSections(rawHtml);
      expect(result.html).toBe(rawHtml);
    });

    it('should return empty string html unchanged', () => {
      const result = extractHtmlSections('');
      expect(result.html).toBe('');
    });
  });

  describe('CSS extraction from <style> tags (Req 2.4)', () => {
    it('should extract content from a single <style> tag', () => {
      const rawHtml = `<html><head><style>body { margin: 0; }</style></head><body></body></html>`;
      const result = extractHtmlSections(rawHtml);
      expect(result.css).toBe('body { margin: 0; }');
    });

    it('should merge content from multiple <style> tags', () => {
      const rawHtml = `<html>
<head>
  <style>body { margin: 0; }</style>
  <style>.header { color: blue; }</style>
</head>
<body>
  <style>.footer { padding: 10px; }</style>
</body>
</html>`;

      const result = extractHtmlSections(rawHtml);
      expect(result.css).toBe('body { margin: 0; }\n.header { color: blue; }\n.footer { padding: 10px; }');
    });

    it('should return empty string when no <style> tags exist', () => {
      const rawHtml = `<html><head></head><body><p>No styles</p></body></html>`;
      const result = extractHtmlSections(rawHtml);
      expect(result.css).toBe('');
    });

    it('should skip empty <style> tags', () => {
      const rawHtml = `<html><head><style></style><style>  </style><style>.valid { color: red; }</style></head></html>`;
      const result = extractHtmlSections(rawHtml);
      expect(result.css).toBe('.valid { color: red; }');
    });

    it('should handle <style> tags with attributes', () => {
      const rawHtml = `<html><head><style type="text/css">body { color: green; }</style></head></html>`;
      const result = extractHtmlSections(rawHtml);
      expect(result.css).toBe('body { color: green; }');
    });
  });

  describe('JS extraction from inline <script> tags (Req 2.4, 2.5)', () => {
    it('should extract content from a single inline <script> tag', () => {
      const rawHtml = `<html><body><script>alert("hello");</script></body></html>`;
      const result = extractHtmlSections(rawHtml);
      expect(result.js).toBe('alert("hello");');
    });

    it('should merge content from multiple inline <script> tags', () => {
      const rawHtml = `<html>
<body>
  <script>var a = 1;</script>
  <script>var b = 2;</script>
</body>
</html>`;

      const result = extractHtmlSections(rawHtml);
      expect(result.js).toBe('var a = 1;\nvar b = 2;');
    });

    it('should exclude <script> tags with src attribute', () => {
      const rawHtml = `<html>
<body>
  <script src="external.js"></script>
  <script>var inline = true;</script>
  <script src="https://cdn.example.com/lib.js"></script>
</body>
</html>`;

      const result = extractHtmlSections(rawHtml);
      expect(result.js).toBe('var inline = true;');
    });

    it('should exclude <script> tags with src attribute regardless of attribute order', () => {
      const rawHtml = `<html>
<body>
  <script type="text/javascript" src="external.js"></script>
  <script type="text/javascript">var inline = true;</script>
</body>
</html>`;

      const result = extractHtmlSections(rawHtml);
      expect(result.js).toBe('var inline = true;');
    });

    it('should return empty string when no inline <script> tags exist', () => {
      const rawHtml = `<html><body><script src="app.js"></script></body></html>`;
      const result = extractHtmlSections(rawHtml);
      expect(result.js).toBe('');
    });

    it('should skip empty inline <script> tags', () => {
      const rawHtml = `<html><body><script></script><script>  </script><script>var x = 1;</script></body></html>`;
      const result = extractHtmlSections(rawHtml);
      expect(result.js).toBe('var x = 1;');
    });
  });

  describe('Complete HTML document extraction', () => {
    it('should correctly extract CSS and JS from a full self-contained HTML document', () => {
      const rawHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Test Page</title>
  <style>
    :root { --primary: #333; }
    body { font-family: sans-serif; }
  </style>
  <style>
    .container { max-width: 1200px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Hello World</h1>
  </div>
  <script src="https://cdn.example.com/vendor.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      console.log('ready');
    });
  </script>
</body>
</html>`;

      const result = extractHtmlSections(rawHtml);

      // html should be unchanged
      expect(result.html).toBe(rawHtml);

      // css should contain both style blocks
      expect(result.css).toContain(':root { --primary: #333; }');
      expect(result.css).toContain('.container { max-width: 1200px; margin: 0 auto; }');

      // js should only contain inline script, not external
      expect(result.js).toContain("console.log('ready')");
      expect(result.js).not.toContain('vendor.js');
    });

    it('should handle HTML with no style or script tags', () => {
      const rawHtml = `<!DOCTYPE html><html><head><title>Plain</title></head><body><p>Hello</p></body></html>`;
      const result = extractHtmlSections(rawHtml);

      expect(result.html).toBe(rawHtml);
      expect(result.css).toBe('');
      expect(result.js).toBe('');
    });
  });
});
