/**
 * Unit tests for batch generation logic
 * Feature: ai-html-visual-editor
 * Requirements: 3.1, 3.2, 3.6
 */

import {
  parseBatchRequest,
  createBatchContext,
  parseAppContext,
} from '../../utils/batch';

describe('parseBatchRequest', () => {
  describe('explicit count patterns', () => {
    it('should parse "3 pages" pattern', () => {
      const result = parseBatchRequest('Create 3 pages');
      expect(result.isBatch).toBe(true);
      expect(result.count).toBe(3);
      expect(result.pageTypes).toHaveLength(3);
      expect(result.pageTypes).toEqual(['page-1', 'page-2', 'page-3']);
    });

    it('should parse "generate 5" pattern', () => {
      const result = parseBatchRequest('Generate 5 pages for my website');
      expect(result.isBatch).toBe(true);
      expect(result.count).toBe(5);
      expect(result.pageTypes).toHaveLength(5);
    });

    it('should parse Chinese "3个页面" pattern', () => {
      const result = parseBatchRequest('生成3个页面');
      expect(result.isBatch).toBe(true);
      expect(result.count).toBe(3);
      expect(result.pageTypes).toHaveLength(3);
    });

    it('should parse "make 2 pages" pattern', () => {
      const result = parseBatchRequest('Make 2 pages');
      expect(result.isBatch).toBe(true);
      expect(result.count).toBe(2);
    });
  });

  describe('page type extraction', () => {
    it('should extract common page types', () => {
      const result = parseBatchRequest('Create home, about, and contact pages');
      expect(result.isBatch).toBe(true);
      expect(result.count).toBe(3);
      expect(result.pageTypes).toContain('home');
      expect(result.pageTypes).toContain('about');
      expect(result.pageTypes).toContain('contact');
    });

    it('should extract page types with explicit count', () => {
      const result = parseBatchRequest('Create 3 pages: home, about, contact');
      expect(result.isBatch).toBe(true);
      expect(result.count).toBe(3);
      expect(result.pageTypes).toEqual(['home', 'about', 'contact']);
    });

    it('should extract page types with explicit count and English keywords', () => {
      const result = parseBatchRequest('Create 3 pages: home, about, contact');
      expect(result.isBatch).toBe(true);
      expect(result.count).toBe(3);
      expect(result.pageTypes).toEqual(['home', 'about', 'contact']);
    });

    it('should handle page types when count exceeds identified types', () => {
      const result = parseBatchRequest('Create 2 pages with home');
      expect(result.isBatch).toBe(true);
      expect(result.pageTypes).toContain('home');
    });

    it('should extract portfolio-related page types', () => {
      const result = parseBatchRequest('Build a portfolio with projects and blog');
      expect(result.isBatch).toBe(true);
      expect(result.pageTypes).toContain('portfolio');
      expect(result.pageTypes).toContain('blog');
    });
  });

  describe('count and page type reconciliation', () => {
    it('should use page type count when explicit count is missing', () => {
      const result = parseBatchRequest('Create home, about, services pages');
      expect(result.isBatch).toBe(true);
      expect(result.count).toBe(3);
      expect(result.pageTypes).toHaveLength(3);
    });

    it('should fill in generic page types when count exceeds identified types', () => {
      const result = parseBatchRequest('Create 5 pages: home, about');
      expect(result.isBatch).toBe(true);
      expect(result.count).toBe(5);
      expect(result.pageTypes).toHaveLength(5);
      expect(result.pageTypes[0]).toBe('home');
      expect(result.pageTypes[1]).toBe('about');
      expect(result.pageTypes[2]).toMatch(/^page-\d+$/);
    });

    it('should use all identified page types even when count is specified', () => {
      const result = parseBatchRequest('Create 2 pages: home, about, contact');
      expect(result.isBatch).toBe(true);
      expect(result.count).toBe(2);
      // All identified types are kept
      expect(result.pageTypes).toContain('home');
      expect(result.pageTypes).toContain('about');
      expect(result.pageTypes).toContain('contact');
    });
  });

  describe('single page requests', () => {
    it('should identify single page request', () => {
      const result = parseBatchRequest('Create a login form');
      expect(result.isBatch).toBe(false);
      expect(result.count).toBe(1);
      expect(result.pageTypes).toEqual([]);
    });

    it('should identify single page with "1 page"', () => {
      const result = parseBatchRequest('Create 1 page');
      expect(result.isBatch).toBe(false);
      expect(result.count).toBe(1);
    });

    it('should handle simple prompts', () => {
      const result = parseBatchRequest('A beautiful landing page');
      expect(result.isBatch).toBe(false);
      expect(result.count).toBe(1);
      expect(result.cleanPrompt).toBe('A beautiful landing page');
    });
  });

  describe('clean prompt extraction', () => {
    it('should remove count pattern from prompt', () => {
      const result = parseBatchRequest('Create 3 pages for my portfolio');
      expect(result.cleanPrompt).not.toContain('3 pages');
      expect(result.cleanPrompt).toContain('portfolio');
    });

    it('should remove trailing colons', () => {
      const result = parseBatchRequest('Create 3 pages: home, about, contact');
      expect(result.cleanPrompt).not.toMatch(/:\s*$/);
    });

    it('should normalize whitespace', () => {
      const result = parseBatchRequest('Create   3   pages   with   lots   of   spaces');
      expect(result.cleanPrompt).not.toMatch(/\s{2,}/);
    });

    it('should preserve original prompt when no patterns match', () => {
      const result = parseBatchRequest('A simple website');
      expect(result.cleanPrompt).toBe('A simple website');
    });
  });

  describe('edge cases', () => {
    it('should handle empty prompt', () => {
      const result = parseBatchRequest('');
      expect(result.isBatch).toBe(false);
      expect(result.count).toBe(1);
      expect(result.pageTypes).toEqual([]);
    });

    it('should handle very large counts', () => {
      const result = parseBatchRequest('Create 100 pages');
      expect(result.isBatch).toBe(true);
      expect(result.count).toBe(100);
      expect(result.pageTypes).toHaveLength(100);
    });

    it('should handle zero count', () => {
      const result = parseBatchRequest('Create 0 pages');
      expect(result.isBatch).toBe(false);
      expect(result.count).toBe(1);
    });

    it('should match "homepage" as home page type', () => {
      const result = parseBatchRequest('Create 2 pages: homepage and about');
      expect(result.pageTypes).toContain('home');
      expect(result.pageTypes).toContain('about');
    });

    it('should handle duplicate page types', () => {
      const result = parseBatchRequest('Create 3 pages: home, home, and home');
      // Should only include "home" once
      expect(result.pageTypes.filter(t => t === 'home')).toHaveLength(1);
    });
  });
});

describe('createBatchContext', () => {
  it('should create batch context for batch request', () => {
    const context = createBatchContext('Create 3 pages: home, about, contact');
    
    expect(context.prompt).not.toContain('3 pages');
    expect(context.batchGeneration).toBeDefined();
    expect(context.batchGeneration?.count).toBe(3);
    expect(context.batchGeneration?.pageTypes).toEqual(['home', 'about', 'contact']);
  });

  it('should create simple context for single page request', () => {
    const context = createBatchContext('Create a login form');
    
    expect(context.prompt).toBe('Create a login form');
    expect(context.batchGeneration).toBeUndefined();
  });

  it('should include design system in context', () => {
    const context = createBatchContext('Create 2 pages', 'tailwind');
    
    expect(context.designSystem).toBe('tailwind');
    expect(context.batchGeneration).toBeDefined();
  });

  it('should handle design system for single page', () => {
    const context = createBatchContext('Create a form', 'material-ui');
    
    expect(context.designSystem).toBe('material-ui');
    expect(context.batchGeneration).toBeUndefined();
  });

  it('should preserve clean prompt in batch context', () => {
    const context = createBatchContext('Generate 5 pages for my website');
    
    expect(context.prompt).not.toContain('5 pages');
    expect(context.prompt).toContain('website');
  });
});

describe('integration scenarios', () => {
  it('should handle complete website generation request', () => {
    const result = parseBatchRequest(
      'Create a complete website with home, about, services, portfolio, and contact pages'
    );
    
    expect(result.isBatch).toBe(true);
    expect(result.count).toBe(5);
    expect(result.pageTypes).toContain('home');
    expect(result.pageTypes).toContain('about');
    expect(result.pageTypes).toContain('services');
    expect(result.pageTypes).toContain('portfolio');
    expect(result.pageTypes).toContain('contact');
  });

  it('should handle e-commerce website request', () => {
    const result = parseBatchRequest(
      'Build an e-commerce site with home, products, and contact'
    );
    
    expect(result.isBatch).toBe(true);
    expect(result.count).toBe(3);
    expect(result.pageTypes).toContain('home');
    expect(result.pageTypes).toContain('products');
    expect(result.pageTypes).toContain('contact');
  });

  it('should handle blog website request', () => {
    const result = parseBatchRequest(
      'Create a blog with home, blog, and about pages'
    );
    
    expect(result.isBatch).toBe(true);
    expect(result.count).toBe(3);
    expect(result.pageTypes).toContain('home');
    expect(result.pageTypes).toContain('blog');
    expect(result.pageTypes).toContain('about');
  });

  it('should handle admin dashboard request', () => {
    const result = parseBatchRequest(
      'Generate 4 pages: dashboard, profile, settings, and login'
    );
    
    expect(result.isBatch).toBe(true);
    expect(result.count).toBe(4);
    expect(result.pageTypes).toContain('dashboard');
    expect(result.pageTypes).toContain('profile');
    expect(result.pageTypes).toContain('settings');
    expect(result.pageTypes).toContain('login');
  });
});


describe('parseAppContext', () => {
  describe('multi-page application parsing', () => {
    it('should parse explicit page list with Chinese input', () => {
      const result = parseAppContext('生成电商网站：首页、产品列表、购物车');
      
      expect(result).not.toBeNull();
      expect(result?.appName).toContain('电商');
      expect(result?.appType).toBe('ecommerce');
      expect(result?.pages.length).toBeGreaterThanOrEqual(2);
      expect(result?.originalPrompt).toBe('生成电商网站：首页、产品列表、购物车');
    });

    it('should parse page count specification', () => {
      const result = parseAppContext('生成 5 个页面的博客网站');
      
      expect(result).not.toBeNull();
      expect(result?.appType).toBe('blog');
      expect(result?.pages.length).toBeGreaterThanOrEqual(2);
    });

    it('should parse English ecommerce request', () => {
      const result = parseAppContext('Create an ecommerce website');
      
      expect(result).not.toBeNull();
      expect(result?.appType).toBe('ecommerce');
      expect(result?.pages.length).toBeGreaterThanOrEqual(2);
    });

    it('should parse explicit page list in English', () => {
      const result = parseAppContext('Create 3 pages: home, about, contact');
      
      expect(result).not.toBeNull();
      expect(result?.pages.length).toBe(3);
      expect(result?.pages.map(p => p.name)).toContain('home');
      expect(result?.pages.map(p => p.name)).toContain('about');
      expect(result?.pages.map(p => p.name)).toContain('contact');
    });
  });

  describe('application type inference', () => {
    it('should infer ecommerce type from keywords', () => {
      const result = parseAppContext('Build a shop with 3 pages');
      
      expect(result).not.toBeNull();
      expect(result?.appType).toBe('ecommerce');
    });

    it('should infer blog type from keywords', () => {
      const result = parseAppContext('Create a blog with 3 pages');
      
      expect(result).not.toBeNull();
      expect(result?.appType).toBe('blog');
    });

    it('should infer dashboard type from keywords', () => {
      const result = parseAppContext('Generate admin panel with 3 pages');
      
      expect(result).not.toBeNull();
      expect(result?.appType).toBe('dashboard');
    });

    it('should infer portfolio type from keywords', () => {
      const result = parseAppContext('Make a portfolio with 3 pages');
      
      expect(result).not.toBeNull();
      expect(result?.appType).toBe('portfolio');
    });
  });

  describe('default page composition', () => {
    it('should use default ecommerce pages when type is known', () => {
      const result = parseAppContext('Create an ecommerce website');
      
      expect(result).not.toBeNull();
      expect(result?.appType).toBe('ecommerce');
      expect(result?.pages.some(p => p.name === 'home')).toBe(true);
      expect(result?.pages.some(p => p.name === 'products')).toBe(true);
    });

    it('should use default blog pages when type is known', () => {
      const result = parseAppContext('Generate a blog website');
      
      expect(result).not.toBeNull();
      expect(result?.appType).toBe('blog');
      expect(result?.pages.some(p => p.name === 'home')).toBe(true);
      expect(result?.pages.some(p => p.name === 'blog')).toBe(true);
    });

    it('should use default dashboard pages when type is known', () => {
      const result = parseAppContext('Create a dashboard with 3 pages');
      
      expect(result).not.toBeNull();
      expect(result?.appType).toBe('dashboard');
      expect(result?.pages.some(p => p.name === 'dashboard')).toBe(true);
    });

    it('should use default portfolio pages when type is known', () => {
      const result = parseAppContext('Build a portfolio site');
      
      expect(result).not.toBeNull();
      expect(result?.appType).toBe('portfolio');
      expect(result?.pages.some(p => p.name === 'home')).toBe(true);
      expect(result?.pages.some(p => p.name === 'portfolio')).toBe(true);
    });
  });

  describe('page relationships (linksTo)', () => {
    it('should calculate linksTo for home page', () => {
      const result = parseAppContext('Create home, about, contact pages');
      
      expect(result).not.toBeNull();
      const homePage = result?.pages.find(p => p.name === 'home');
      expect(homePage).toBeDefined();
      expect(homePage?.linksTo.length).toBeGreaterThan(0);
    });

    it('should link all pages to home', () => {
      const result = parseAppContext('Create home, about, contact pages');
      
      expect(result).not.toBeNull();
      const nonHomePages = result?.pages.filter(p => p.name !== 'home');
      nonHomePages?.forEach(page => {
        expect(page.linksTo).toContain('home');
      });
    });

    it('should link products to product-detail in ecommerce', () => {
      const result = parseAppContext('Create an ecommerce website');
      
      expect(result).not.toBeNull();
      const productsPage = result?.pages.find(p => p.name === 'products');
      const detailPage = result?.pages.find(p => p.name === 'product-detail');
      
      if (productsPage && detailPage) {
        expect(productsPage.linksTo).toContain(detailPage.name);
      }
    });

    it('should link pages to about and contact if they exist', () => {
      const result = parseAppContext('Create home, about, contact, products pages');
      
      expect(result).not.toBeNull();
      const productsPage = result?.pages.find(p => p.name === 'products');
      
      if (productsPage) {
        expect(productsPage.linksTo).toContain('about');
        expect(productsPage.linksTo).toContain('contact');
      }
    });
  });

  describe('page ordering', () => {
    it('should place home page first', () => {
      const result = parseAppContext('Create contact, about, home pages');
      
      expect(result).not.toBeNull();
      expect(result?.pages[0].name).toBe('home');
    });

    it('should order pages logically', () => {
      const result = parseAppContext('Create an ecommerce website');
      
      expect(result).not.toBeNull();
      const pageNames = result?.pages.map(p => p.name) || [];
      const homeIndex = pageNames.indexOf('home');
      const productsIndex = pageNames.indexOf('products');
      
      // Home should come before products
      if (homeIndex >= 0 && productsIndex >= 0) {
        expect(homeIndex).toBeLessThan(productsIndex);
      }
    });

    it('should place detail pages after list pages', () => {
      const result = parseAppContext('Create an ecommerce website');
      
      expect(result).not.toBeNull();
      const pageNames = result?.pages.map(p => p.name) || [];
      const productsIndex = pageNames.indexOf('products');
      const detailIndex = pageNames.indexOf('product-detail');
      
      // Products should come before product-detail
      if (productsIndex >= 0 && detailIndex >= 0) {
        expect(productsIndex).toBeLessThan(detailIndex);
      }
    });
  });

  describe('single-page fallback', () => {
    it('should return null for single page request', () => {
      const result = parseAppContext('Create a login form');
      
      expect(result).toBeNull();
    });

    it('should return null for simple prompts', () => {
      const result = parseAppContext('A beautiful landing page');
      
      expect(result).toBeNull();
    });

    it('should return null for "1 page" request', () => {
      const result = parseAppContext('Create 1 page');
      
      expect(result).toBeNull();
    });

    it('should return null for empty prompt', () => {
      const result = parseAppContext('');
      
      expect(result).toBeNull();
    });
  });

  describe('application name extraction', () => {
    it('should extract Chinese app name', () => {
      const result = parseAppContext('生成电商网站：首页、产品');
      
      expect(result).not.toBeNull();
      expect(result?.appName).toContain('电商');
    });

    it('should extract English app name', () => {
      const result = parseAppContext('Create a shopping website with 3 pages');
      
      expect(result).not.toBeNull();
      expect(result?.appName).toBeTruthy();
    });

    it('should use app type as fallback name', () => {
      const result = parseAppContext('Generate 3 pages for ecommerce');
      
      expect(result).not.toBeNull();
      expect(result?.appName).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle mixed Chinese and English input', () => {
      const result = parseAppContext('生成 ecommerce 网站：home、产品列表、cart');
      
      expect(result).not.toBeNull();
      expect(result?.appType).toBe('ecommerce');
      expect(result?.pages.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle large page counts', () => {
      const result = parseAppContext('Create 10 pages for a blog');
      
      expect(result).not.toBeNull();
      expect(result?.pages.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle unknown app type with explicit pages', () => {
      const result = parseAppContext('Create 3 pages: page1, page2, page3');
      
      expect(result).not.toBeNull();
      expect(result?.pages.length).toBe(3);
    });

    it('should preserve original prompt', () => {
      const prompt = 'Generate a complete ecommerce website';
      const result = parseAppContext(prompt);
      
      expect(result).not.toBeNull();
      expect(result?.originalPrompt).toBe(prompt);
    });
  });

  describe('backward compatibility', () => {
    it('should not break existing parseBatchRequest functionality', () => {
      const batchResult = parseBatchRequest('Create 3 pages: home, about, contact');
      const appResult = parseAppContext('Create 3 pages: home, about, contact');
      
      expect(batchResult.isBatch).toBe(true);
      expect(appResult).not.toBeNull();
      expect(appResult?.pages.length).toBe(batchResult.count);
    });
  });
});
