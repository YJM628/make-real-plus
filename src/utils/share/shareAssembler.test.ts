/**
 * Unit tests for shareAssembler
 * Feature: share-app-link
 * Requirements: 2.2, 2.3, 2.4
 */

import { assembleShareHtml } from './shareAssembler';
import type { ProcessedPage, MockGenerationResult } from '../../types';

// Helper to create a minimal ProcessedPage
function makePage(name: string, html = '<div>Hello</div>', css = '', js = ''): ProcessedPage {
  return { name, html, css, js };
}

// Helper to create an empty MockGenerationResult
function emptyMock(): MockGenerationResult {
  return {
    endpoints: [],
    mockFiles: new Map(),
    interceptScript: '',
  };
}

// Helper to create a MockGenerationResult with data
function mockWithData(): MockGenerationResult {
  const mockFiles = new Map<string, string>();
  mockFiles.set('mock/api/users.json', JSON.stringify([{ id: 1, name: 'Alice' }]));
  return {
    endpoints: [
      { method: 'GET', path: '/api/users', mockData: [{ id: 1, name: 'Alice' }] },
    ],
    mockFiles,
    interceptScript: '(function(){ /* interceptor */ })();',
  };
}

describe('assembleShareHtml', () => {
  describe('single page', () => {
    it('should generate valid HTML for a single page', () => {
      const pages = [makePage('home', '<h1>Home</h1>')];
      const result = assembleShareHtml(pages, '', new Map(), { stylesheets: [], scripts: [] }, emptyMock(), 'TestApp');

      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<title>TestApp</title>');
      expect(result).toContain('<h1>Home</h1>');
    });

    it('should NOT include router script for single page (Req 2.2)', () => {
      const pages = [makePage('home')];
      const result = assembleShareHtml(pages, '', new Map(), { stylesheets: [], scripts: [] }, emptyMock(), 'App');

      expect(result).not.toContain('handleRoute');
      expect(result).not.toContain('hashchange');
      expect(result).not.toContain('page-container');
    });

    it('should inline page-specific CSS in <style> tag', () => {
      const pages = [makePage('home')];
      const pageCSS = new Map([['home', '.title { color: red; }']]);
      const result = assembleShareHtml(pages, '', pageCSS, { stylesheets: [], scripts: [] }, emptyMock(), 'App');

      expect(result).toContain('<style>');
      expect(result).toContain('.title { color: red; }');
    });

    it('should include page JS in <script> tag', () => {
      const pages = [makePage('home', '<div>Hi</div>', '', 'console.log("hello");')];
      const result = assembleShareHtml(pages, '', new Map(), { stylesheets: [], scripts: [] }, emptyMock(), 'App');

      expect(result).toContain('<script>');
      expect(result).toContain('console.log("hello");');
    });
  });

  describe('multi page', () => {
    it('should include all pages as hidden divs with page-container class (Req 2.2)', () => {
      const pages = [makePage('home', '<h1>Home</h1>'), makePage('about', '<h1>About</h1>')];
      const result = assembleShareHtml(pages, '', new Map(), { stylesheets: [], scripts: [] }, emptyMock(), 'App');

      expect(result).toContain('id="page-home"');
      expect(result).toContain('id="page-about"');
      expect(result).toContain('class="page-container"');
      expect(result).toContain('<h1>Home</h1>');
      expect(result).toContain('<h1>About</h1>');
    });

    it('should show first page by default and hide others', () => {
      const pages = [makePage('home'), makePage('about'), makePage('contact')];
      const result = assembleShareHtml(pages, '', new Map(), { stylesheets: [], scripts: [] }, emptyMock(), 'App');

      // First page visible
      expect(result).toContain('id="page-home" class="page-container" style="display: block;"');
      // Others hidden
      expect(result).toContain('id="page-about" class="page-container" style="display: none;"');
      expect(result).toContain('id="page-contact" class="page-container" style="display: none;"');
    });

    it('should include router script for multi-page (Req 2.2)', () => {
      const pages = [makePage('home'), makePage('about')];
      const result = assembleShareHtml(pages, '', new Map(), { stylesheets: [], scripts: [] }, emptyMock(), 'App');

      expect(result).toContain('handleRoute');
      expect(result).toContain('hashchange');
    });

    it('should include page-specific CSS for all pages', () => {
      const pages = [makePage('home'), makePage('about')];
      const pageCSS = new Map([
        ['home', '.home-title { color: blue; }'],
        ['about', '.about-title { color: green; }'],
      ]);
      const result = assembleShareHtml(pages, '', pageCSS, { stylesheets: [], scripts: [] }, emptyMock(), 'App');

      expect(result).toContain('.home-title { color: blue; }');
      expect(result).toContain('.about-title { color: green; }');
      expect(result).toContain('/* Page: home */');
      expect(result).toContain('/* Page: about */');
    });
  });

  describe('CSS inlining (Req 2.3)', () => {
    it('should inline shared CSS as <style> tag, NOT as <link> to css/shared.css', () => {
      const pages = [makePage('home')];
      const sharedCSS = 'body { margin: 0; }';
      const result = assembleShareHtml(pages, sharedCSS, new Map(), { stylesheets: [], scripts: [] }, emptyMock(), 'App');

      // Should have inline style
      expect(result).toContain('<style>');
      expect(result).toContain('body { margin: 0; }');
      // Should NOT reference external CSS file
      expect(result).not.toContain('css/shared.css');
      expect(result).not.toContain('href="css/shared.css"');
    });

    it('should not include empty shared CSS style tag', () => {
      const pages = [makePage('home')];
      const result = assembleShareHtml(pages, '   ', new Map(), { stylesheets: [], scripts: [] }, emptyMock(), 'App');

      // Count style tags — should only have page-level ones if any
      const headSection = result.split('<body>')[0];
      expect(headSection).not.toContain('<style>');
    });

    it('should still include CDN stylesheet links', () => {
      const pages = [makePage('home')];
      const deps = {
        stylesheets: ['https://cdn.example.com/bootstrap.css'],
        scripts: [],
      };
      const result = assembleShareHtml(pages, '', new Map(), deps, emptyMock(), 'App');

      expect(result).toContain('href="https://cdn.example.com/bootstrap.css"');
    });
  });

  describe('mock data inlining (Req 2.4)', () => {
    it('should inline mock interceptor and data as <script> tag, NOT reference external files', () => {
      const pages = [makePage('home')];
      const mock = mockWithData();
      const result = assembleShareHtml(pages, '', new Map(), { stylesheets: [], scripts: [] }, mock, 'App');

      // Should have inline script with mock data
      expect(result).toContain('Mock Interceptor');
      expect(result).toContain('mockData');
      // Should NOT reference external mock files
      expect(result).not.toContain('src="mock/interceptor.js"');
      expect(result).not.toContain('mock/api/');
    });

    it('should embed mock data as JSON in the script', () => {
      const pages = [makePage('home')];
      const mock = mockWithData();
      const result = assembleShareHtml(pages, '', new Map(), { stylesheets: [], scripts: [] }, mock, 'App');

      // The mock data should be embedded as JSON
      expect(result).toContain('GET:/api/users');
      expect(result).toContain('Alice');
    });

    it('should not include mock script when no mock data exists', () => {
      const pages = [makePage('home')];
      const result = assembleShareHtml(pages, '', new Map(), { stylesheets: [], scripts: [] }, emptyMock(), 'App');

      expect(result).not.toContain('Mock Interceptor');
      expect(result).not.toContain('mockData');
    });
  });

  describe('CDN dependencies', () => {
    it('should include CDN script tags', () => {
      const pages = [makePage('home')];
      const deps = {
        stylesheets: [],
        scripts: ['https://cdn.example.com/vue.js'],
      };
      const result = assembleShareHtml(pages, '', new Map(), deps, emptyMock(), 'App');

      expect(result).toContain('src="https://cdn.example.com/vue.js"');
    });
  });

  describe('HTML escaping', () => {
    it('should escape app name in title', () => {
      const pages = [makePage('home')];
      const result = assembleShareHtml(pages, '', new Map(), { stylesheets: [], scripts: [] }, emptyMock(), 'My <App> & "Test"');

      expect(result).toContain('<title>My &lt;App&gt; &amp; &quot;Test&quot;</title>');
    });
  });
});
