/**
 * Unit tests for Mock Data Generator
 * Feature: export-deployable-project
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import { generateMockData } from './mockDataGenerator';
import type { ProcessedPage } from '../../types';

describe('mockDataGenerator', () => {
  describe('generateMockData', () => {
    it('should return empty result when no pages provided', () => {
      const result = generateMockData([]);

      expect(result.endpoints).toEqual([]);
      expect(result.mockFiles.size).toBe(0);
      expect(result.interceptScript).toBe('');
    });

    it('should return empty result when pages have no JS code', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: 'body { margin: 0; }',
          js: '',
        },
      ];

      const result = generateMockData(pages);

      // Requirement 7.4: No API calls = empty result
      expect(result.endpoints).toEqual([]);
      expect(result.mockFiles.size).toBe(0);
      expect(result.interceptScript).toBe('');
    });

    it('should return empty result when JS has no API calls', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '<div>Home</div>',
          css: '',
          js: 'console.log("Hello"); const x = 42;',
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints).toEqual([]);
      expect(result.mockFiles.size).toBe(0);
      expect(result.interceptScript).toBe('');
    });

    it('should extract fetch() call with single quotes', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users')",
        },
      ];

      const result = generateMockData(pages);

      // Requirement 7.1: Scan fetch calls
      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].method).toBe('GET');
      expect(result.endpoints[0].path).toBe('/api/users');
      expect(result.endpoints[0].mockData).toBeDefined();
    });

    it('should extract fetch() call with double quotes', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: 'fetch("/api/products")',
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].method).toBe('GET');
      expect(result.endpoints[0].path).toBe('/api/products');
    });

    it('should extract fetch() call with backticks', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: 'fetch(`/api/cart`)',
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].path).toBe('/api/cart');
    });

    it('should extract fetch() call with POST method', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users', { method: 'POST' })",
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].method).toBe('POST');
      expect(result.endpoints[0].path).toBe('/api/users');
    });

    it('should extract fetch() call with PUT method', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: 'fetch("/api/users/123", { method: "PUT" })',
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].method).toBe('PUT');
      expect(result.endpoints[0].path).toBe('/api/users/123');
    });

    it('should extract XMLHttpRequest.open() call', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "const xhr = new XMLHttpRequest(); xhr.open('GET', '/api/products');",
        },
      ];

      const result = generateMockData(pages);

      // Requirement 7.1: Scan XMLHttpRequest calls
      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].method).toBe('GET');
      expect(result.endpoints[0].path).toBe('/api/products');
    });

    it('should extract XMLHttpRequest.open() with POST method', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: 'xhr.open("POST", "/api/orders")',
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].method).toBe('POST');
      expect(result.endpoints[0].path).toBe('/api/orders');
    });

    it('should extract multiple API calls from same page', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: `
            fetch('/api/users');
            fetch('/api/products');
            xhr.open('GET', '/api/cart');
          `,
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(3);
      expect(result.endpoints.map(e => e.path)).toContain('/api/users');
      expect(result.endpoints.map(e => e.path)).toContain('/api/products');
      expect(result.endpoints.map(e => e.path)).toContain('/api/cart');
    });

    it('should extract API calls from multiple pages', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users')",
        },
        {
          name: 'products',
          html: '',
          css: '',
          js: "fetch('/api/products')",
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(2);
      expect(result.endpoints.map(e => e.path)).toContain('/api/users');
      expect(result.endpoints.map(e => e.path)).toContain('/api/products');
    });

    it('should deduplicate identical API calls', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users'); fetch('/api/users');",
        },
        {
          name: 'about',
          html: '',
          css: '',
          js: "fetch('/api/users')",
        },
      ];

      const result = generateMockData(pages);

      // Should only have one endpoint despite 3 calls
      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].path).toBe('/api/users');
    });

    it('should handle full URLs by extracting path', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('https://api.example.com/users')",
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].path).toBe('/users');
    });

    it('should handle URLs without leading slash', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('api/users')",
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].path).toBe('/api/users');
    });

    it('should remove query parameters from path', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users?page=1&limit=10')",
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].path).toBe('/api/users');
    });

    it('should remove hash from path', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users#section')",
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].path).toBe('/api/users');
    });

    it('should generate mock files for each endpoint', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users'); fetch('/api/products');",
        },
      ];

      const result = generateMockData(pages);

      // Requirement 7.2: Generate mock data files
      expect(result.mockFiles.size).toBe(2);
      expect(result.mockFiles.has('mock/api/users.json')).toBe(true);
      expect(result.mockFiles.has('mock/api/products.json')).toBe(true);
    });

    it('should generate valid JSON for mock files', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users')",
        },
      ];

      const result = generateMockData(pages);

      const mockFile = result.mockFiles.get('mock/api/users.json');
      expect(mockFile).toBeDefined();
      
      // Should be valid JSON
      expect(() => JSON.parse(mockFile!)).not.toThrow();
      
      const parsed = JSON.parse(mockFile!);
      expect(parsed).toHaveProperty('data');
      expect(Array.isArray(parsed.data)).toBe(true);
    });

    it('should generate user list mock data for /users path', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users')",
        },
      ];

      const result = generateMockData(pages);

      const mockFile = result.mockFiles.get('mock/api/users.json');
      const parsed = JSON.parse(mockFile!);
      
      expect(parsed.data).toBeDefined();
      expect(parsed.data.length).toBeGreaterThan(0);
      expect(parsed.data[0]).toHaveProperty('name');
      expect(parsed.data[0]).toHaveProperty('email');
    });

    it('should generate product list mock data for /products path', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/products')",
        },
      ];

      const result = generateMockData(pages);

      const mockFile = result.mockFiles.get('mock/api/products.json');
      const parsed = JSON.parse(mockFile!);
      
      expect(parsed.data).toBeDefined();
      expect(parsed.data.length).toBeGreaterThan(0);
      expect(parsed.data[0]).toHaveProperty('name');
      expect(parsed.data[0]).toHaveProperty('price');
    });

    it('should generate cart mock data for /cart path', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/cart')",
        },
      ];

      const result = generateMockData(pages);

      const mockFile = result.mockFiles.get('mock/api/cart.json');
      const parsed = JSON.parse(mockFile!);
      
      expect(parsed).toHaveProperty('items');
      expect(parsed).toHaveProperty('total');
      expect(Array.isArray(parsed.items)).toBe(true);
    });

    it('should generate single resource mock data for paths with ID', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users/123')",
        },
      ];

      const result = generateMockData(pages);

      const mockFile = result.mockFiles.get('mock/api/users/123.json');
      const parsed = JSON.parse(mockFile!);
      
      // Should be single object, not array
      expect(parsed).toHaveProperty('id');
      expect(parsed).toHaveProperty('name');
      expect(parsed).toHaveProperty('email');
      expect(parsed.data).toBeUndefined(); // Not a list
    });

    it('should generate success response for POST requests', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users', { method: 'POST' })",
        },
      ];

      const result = generateMockData(pages);

      const mockFile = result.mockFiles.get('mock/api/users.json');
      const parsed = JSON.parse(mockFile!);
      
      expect(parsed).toHaveProperty('success', true);
      expect(parsed).toHaveProperty('message');
      expect(parsed.message).toContain('POST');
    });

    it('should generate success response for PUT requests', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users/123', { method: 'PUT' })",
        },
      ];

      const result = generateMockData(pages);

      const mockFile = result.mockFiles.get('mock/api/users/123.json');
      const parsed = JSON.parse(mockFile!);
      
      expect(parsed).toHaveProperty('success', true);
      expect(parsed.message).toContain('PUT');
    });

    it('should generate success response for DELETE requests', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users/123', { method: 'DELETE' })",
        },
      ];

      const result = generateMockData(pages);

      const mockFile = result.mockFiles.get('mock/api/users/123.json');
      const parsed = JSON.parse(mockFile!);
      
      expect(parsed).toHaveProperty('success', true);
      expect(parsed.message).toContain('DELETE');
    });

    it('should generate interceptor script when endpoints exist', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users')",
        },
      ];

      const result = generateMockData(pages);

      // Requirement 7.3: Generate interceptor script
      expect(result.interceptScript).toBeTruthy();
      expect(result.interceptScript.length).toBeGreaterThan(0);
    });

    it('should include route mapping in interceptor script', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users'); fetch('/api/products');",
        },
      ];

      const result = generateMockData(pages);

      // Interceptor should contain route mappings
      expect(result.interceptScript).toContain('GET:/api/users');
      expect(result.interceptScript).toContain('GET:/api/products');
      expect(result.interceptScript).toContain('mock/api/users.json');
      expect(result.interceptScript).toContain('mock/api/products.json');
    });

    it('should override window.fetch in interceptor script', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/users')",
        },
      ];

      const result = generateMockData(pages);

      expect(result.interceptScript).toContain('window.fetch');
      expect(result.interceptScript).toContain('originalFetch');
    });

    it('should override XMLHttpRequest in interceptor script', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "xhr.open('GET', '/api/users')",
        },
      ];

      const result = generateMockData(pages);

      expect(result.interceptScript).toContain('XMLHttpRequest');
      expect(result.interceptScript).toContain('OriginalXHR');
    });

    it('should handle complex real-world JS code', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: `
            async function loadUsers() {
              try {
                const response = await fetch('/api/users');
                const data = await response.json();
                return data;
              } catch (error) {
                console.error(error);
              }
            }
            
            function createUser(userData) {
              return fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
              });
            }
          `,
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(2);
      
      const getEndpoint = result.endpoints.find(e => e.method === 'GET');
      const postEndpoint = result.endpoints.find(e => e.method === 'POST');
      
      expect(getEndpoint).toBeDefined();
      expect(getEndpoint?.path).toBe('/api/users');
      
      expect(postEndpoint).toBeDefined();
      expect(postEndpoint?.path).toBe('/api/users');
    });

    it('should handle fetch with template literals', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: 'const userId = 123; fetch(`/api/users/${userId}`);',
        },
      ];

      const result = generateMockData(pages);

      // Should extract the base path pattern
      expect(result.endpoints.length).toBe(1);
      // Note: Template literal variables won't be resolved, but path should be extracted
      expect(result.endpoints[0].path).toContain('/api/users/');
    });

    it('should handle order-related endpoints', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'orders',
          html: '',
          css: '',
          js: "fetch('/api/orders')",
        },
      ];

      const result = generateMockData(pages);

      const mockFile = result.mockFiles.get('mock/api/orders.json');
      const parsed = JSON.parse(mockFile!);
      
      expect(parsed.data).toBeDefined();
      expect(parsed.data[0]).toHaveProperty('id');
      expect(parsed.data[0]).toHaveProperty('status');
      expect(parsed.data[0]).toHaveProperty('total');
    });

    it('should handle blog/post-related endpoints', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'blog',
          html: '',
          css: '',
          js: "fetch('/api/posts')",
        },
      ];

      const result = generateMockData(pages);

      const mockFile = result.mockFiles.get('mock/api/posts.json');
      const parsed = JSON.parse(mockFile!);
      
      expect(parsed.data).toBeDefined();
      expect(parsed.data[0]).toHaveProperty('title');
      expect(parsed.data[0]).toHaveProperty('author');
      // Should have either content or excerpt
      expect(parsed.data[0].content || parsed.data[0].excerpt).toBeDefined();
    });

    it('should handle comment-related endpoints', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'post',
          html: '',
          css: '',
          js: "fetch('/api/comments')",
        },
      ];

      const result = generateMockData(pages);

      const mockFile = result.mockFiles.get('mock/api/comments.json');
      const parsed = JSON.parse(mockFile!);
      
      expect(parsed.data).toBeDefined();
      expect(parsed.data[0]).toHaveProperty('author');
      expect(parsed.data[0]).toHaveProperty('content');
    });

    it('should generate generic mock data for unknown paths', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch('/api/unknown-resource')",
        },
      ];

      const result = generateMockData(pages);

      const mockFile = result.mockFiles.get('mock/api/unknown-resource.json');
      const parsed = JSON.parse(mockFile!);
      
      // Should have generic structure
      expect(parsed).toHaveProperty('data');
      expect(parsed).toHaveProperty('total');
      expect(parsed).toHaveProperty('page');
    });

    it('should handle whitespace variations in fetch calls', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: "fetch  (  '/api/users'  )",
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].path).toBe('/api/users');
    });

    it('should handle method option with different quote styles', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: `fetch('/api/users', { method: "POST" })`,
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(1);
      expect(result.endpoints[0].method).toBe('POST');
    });

    it('should differentiate same path with different methods', () => {
      const pages: ProcessedPage[] = [
        {
          name: 'home',
          html: '',
          css: '',
          js: `
            fetch('/api/users'); // GET
            fetch('/api/users', { method: 'POST' }); // POST
          `,
        },
      ];

      const result = generateMockData(pages);

      expect(result.endpoints.length).toBe(2);
      
      const getEndpoint = result.endpoints.find(e => e.method === 'GET');
      const postEndpoint = result.endpoints.find(e => e.method === 'POST');
      
      expect(getEndpoint).toBeDefined();
      expect(postEndpoint).toBeDefined();
      expect(getEndpoint?.path).toBe('/api/users');
      expect(postEndpoint?.path).toBe('/api/users');
    });
  });
});
