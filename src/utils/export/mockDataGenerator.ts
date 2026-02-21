/**
 * Mock Data Generator for API calls
 * Feature: export-deployable-project
 * Requirements: 7.1, 7.2, 7.3, 7.4
 */

import type { ProcessedPage, MockEndpoint, MockGenerationResult } from '../../types';

/**
 * Generate mock data files and interceptor script for API calls found in pages
 * 
 * Scans JavaScript code for fetch() and XMLHttpRequest calls, extracts API endpoints,
 * generates reasonable mock JSON data based on URL patterns, and creates an interceptor
 * script to redirect API calls to local mock files.
 * 
 * @param pages - Array of processed pages with JS code
 * @returns Mock generation result with endpoints, files, and interceptor script
 * 
 * Requirements:
 * - 7.1: Scan fetch and XMLHttpRequest calls in JS code
 * - 7.2: Generate mock data files based on API paths
 * - 7.3: Generate interceptor script to redirect API calls
 * - 7.4: Return empty result when no API calls found
 */
export function generateMockData(pages: ProcessedPage[]): MockGenerationResult {
  const endpoints: MockEndpoint[] = [];
  const seenPaths = new Set<string>();

  // Requirement 7.1: Scan all pages for API calls
  for (const page of pages) {
    if (!page.js) continue;

    // Extract fetch() calls
    const fetchEndpoints = extractFetchCalls(page.js);
    for (const endpoint of fetchEndpoints) {
      const key = `${endpoint.method}:${endpoint.path}`;
      if (!seenPaths.has(key)) {
        seenPaths.add(key);
        endpoints.push(endpoint);
      }
    }

    // Extract XMLHttpRequest calls
    const xhrEndpoints = extractXHRCalls(page.js);
    for (const endpoint of xhrEndpoints) {
      const key = `${endpoint.method}:${endpoint.path}`;
      if (!seenPaths.has(key)) {
        seenPaths.add(key);
        endpoints.push(endpoint);
      }
    }
  }

  // Requirement 7.4: Return empty result if no API calls found
  if (endpoints.length === 0) {
    return {
      endpoints: [],
      mockFiles: new Map(),
      interceptScript: '',
    };
  }

  // Requirement 7.2: Generate mock data files
  const mockFiles = new Map<string, string>();
  for (const endpoint of endpoints) {
    const filePath = `mock${endpoint.path}.json`;
    const mockData = generateMockDataForPath(endpoint.path, endpoint.method);
    mockFiles.set(filePath, JSON.stringify(mockData, null, 2));
  }

  // Requirement 7.3: Generate interceptor script
  const interceptScript = generateInterceptorScript(endpoints);

  return {
    endpoints,
    mockFiles,
    interceptScript,
  };
}

/**
 * Extract fetch() API calls from JavaScript code
 * 
 * Patterns matched:
 * - fetch('url')
 * - fetch("url")
 * - fetch(`url`)
 * - fetch('url', { method: 'POST' })
 * 
 * @param js - JavaScript code
 * @returns Array of extracted endpoints
 */
function extractFetchCalls(js: string): MockEndpoint[] {
  const endpoints: MockEndpoint[] = [];

  // Pattern: fetch('url', optional options object)
  // We need to handle multi-line options objects, so we'll use a more flexible approach
  const fetchPattern = /fetch\s*\(\s*['"`]([^'"`]+)['"`]/gi;
  
  let match;
  while ((match = fetchPattern.exec(js)) !== null) {
    const url = match[1];
    const matchIndex = match.index;
    
    // Try to find method in the options object after the URL
    // Look for the closing parenthesis of the fetch call
    const afterUrl = js.substring(matchIndex + match[0].length);
    let method = 'GET'; // Default
    
    // Check if there's an options object with method
    // Only look within the next 200 characters to avoid matching other fetch calls
    const searchWindow = afterUrl.substring(0, 200);
    
    // First check if there's a comma followed by an options object
    if (searchWindow.match(/^\s*,/)) {
      // There's an options object, try to find method
      const methodMatch = searchWindow.match(/[,\s]*\{[^}]*method\s*:\s*['"`](\w+)['"`]/i);
      if (methodMatch) {
        method = methodMatch[1].toUpperCase();
      }
    }
    
    // Extract path from URL (remove domain if present)
    const path = extractPathFromUrl(url);
    if (path) {
      const mockData = generateMockDataForPath(path, method);
      endpoints.push({ method, path, mockData });
    }
  }

  return endpoints;
}

/**
 * Extract XMLHttpRequest API calls from JavaScript code
 * 
 * Patterns matched:
 * - xhr.open('GET', 'url')
 * - xhr.open("POST", "url")
 * 
 * @param js - JavaScript code
 * @returns Array of extracted endpoints
 */
function extractXHRCalls(js: string): MockEndpoint[] {
  const endpoints: MockEndpoint[] = [];

  // Pattern: xhr.open('METHOD', 'url')
  const xhrPattern = /\.open\s*\(\s*['"`](\w+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)/gi;
  
  let match;
  while ((match = xhrPattern.exec(js)) !== null) {
    const method = match[1].toUpperCase();
    const url = match[2];
    
    // Extract path from URL
    const path = extractPathFromUrl(url);
    if (path) {
      const mockData = generateMockDataForPath(path, method);
      endpoints.push({ method, path, mockData });
    }
  }

  return endpoints;
}

/**
 * Extract path from URL (remove protocol, domain, query params)
 * 
 * Examples:
 * - 'https://api.example.com/users' -> '/users'
 * - '/api/products' -> '/api/products'
 * - 'api/products' -> '/api/products'
 * - '/users?page=1' -> '/users'
 * 
 * @param url - Full or partial URL
 * @returns Normalized path starting with /
 */
function extractPathFromUrl(url: string): string {
  try {
    // Remove query params and hash
    let path = url.split('?')[0].split('#')[0];
    
    // If it's a full URL, extract pathname
    if (path.startsWith('http://') || path.startsWith('https://')) {
      const urlObj = new URL(path);
      path = urlObj.pathname;
    }
    
    // Ensure path starts with /
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    
    return path;
  } catch (e) {
    // If URL parsing fails, try to extract path manually
    let path = url.split('?')[0].split('#')[0];
    if (!path.startsWith('/')) {
      path = '/' + path;
    }
    return path;
  }
}

/**
 * Generate reasonable mock data based on URL path patterns
 * 
 * Infers resource type from path and generates appropriate JSON structure.
 * 
 * Examples:
 * - /api/users -> array of user objects
 * - /api/products -> array of product objects
 * - /api/user/123 -> single user object
 * - /api/cart -> cart object with items
 * 
 * @param path - API path
 * @param method - HTTP method
 * @returns Mock data object
 */
function generateMockDataForPath(path: string, method: string): object {
  const pathLower = path.toLowerCase();
  
  // POST/PUT/DELETE typically return success messages
  if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
    return {
      success: true,
      message: `${method} request successful`,
      timestamp: new Date().toISOString(),
    };
  }
  
  // Detect resource type from path
  if (pathLower.includes('user')) {
    // Check if it's a single user (has ID in path)
    if (/\/\d+$/.test(path) || /\/[a-f0-9-]{36}$/.test(path)) {
      return generateSingleUser();
    }
    return generateUserList();
  }
  
  if (pathLower.includes('product')) {
    if (/\/\d+$/.test(path)) {
      return generateSingleProduct();
    }
    return generateProductList();
  }
  
  if (pathLower.includes('cart')) {
    return generateCart();
  }
  
  if (pathLower.includes('order')) {
    if (/\/\d+$/.test(path)) {
      return generateSingleOrder();
    }
    return generateOrderList();
  }
  
  if (pathLower.includes('post') || pathLower.includes('article') || pathLower.includes('blog')) {
    if (/\/\d+$/.test(path)) {
      return generateSinglePost();
    }
    return generatePostList();
  }
  
  if (pathLower.includes('comment')) {
    return generateCommentList();
  }
  
  // Generic list response
  return {
    data: [],
    total: 0,
    page: 1,
    pageSize: 10,
  };
}

/**
 * Generate mock user list
 */
function generateUserList(): object {
  return {
    data: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john@example.com',
        avatar: 'https://i.pravatar.cc/150?img=1',
        role: 'admin',
      },
      {
        id: 2,
        name: 'Jane Smith',
        email: 'jane@example.com',
        avatar: 'https://i.pravatar.cc/150?img=2',
        role: 'user',
      },
      {
        id: 3,
        name: 'Bob Johnson',
        email: 'bob@example.com',
        avatar: 'https://i.pravatar.cc/150?img=3',
        role: 'user',
      },
    ],
    total: 3,
    page: 1,
    pageSize: 10,
  };
}

/**
 * Generate mock single user
 */
function generateSingleUser(): object {
  return {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: 'admin',
    bio: 'Software developer and tech enthusiast',
    createdAt: '2024-01-01T00:00:00Z',
  };
}

/**
 * Generate mock product list
 */
function generateProductList(): object {
  return {
    data: [
      {
        id: 1,
        name: 'Wireless Headphones',
        price: 99.99,
        image: 'https://via.placeholder.com/300x300?text=Headphones',
        category: 'Electronics',
        inStock: true,
      },
      {
        id: 2,
        name: 'Smart Watch',
        price: 199.99,
        image: 'https://via.placeholder.com/300x300?text=Watch',
        category: 'Electronics',
        inStock: true,
      },
      {
        id: 3,
        name: 'Laptop Stand',
        price: 49.99,
        image: 'https://via.placeholder.com/300x300?text=Stand',
        category: 'Accessories',
        inStock: false,
      },
    ],
    total: 3,
    page: 1,
    pageSize: 10,
  };
}

/**
 * Generate mock single product
 */
function generateSingleProduct(): object {
  return {
    id: 1,
    name: 'Wireless Headphones',
    price: 99.99,
    image: 'https://via.placeholder.com/300x300?text=Headphones',
    category: 'Electronics',
    inStock: true,
    description: 'High-quality wireless headphones with noise cancellation',
    rating: 4.5,
    reviews: 128,
  };
}

/**
 * Generate mock cart
 */
function generateCart(): object {
  return {
    items: [
      {
        id: 1,
        productId: 1,
        name: 'Wireless Headphones',
        price: 99.99,
        quantity: 1,
        image: 'https://via.placeholder.com/100x100?text=Headphones',
      },
      {
        id: 2,
        productId: 2,
        name: 'Smart Watch',
        price: 199.99,
        quantity: 2,
        image: 'https://via.placeholder.com/100x100?text=Watch',
      },
    ],
    subtotal: 499.97,
    tax: 49.99,
    total: 549.96,
  };
}

/**
 * Generate mock order list
 */
function generateOrderList(): object {
  return {
    data: [
      {
        id: 1001,
        date: '2024-01-15',
        status: 'delivered',
        total: 549.96,
        items: 3,
      },
      {
        id: 1002,
        date: '2024-01-20',
        status: 'processing',
        total: 299.99,
        items: 2,
      },
    ],
    total: 2,
    page: 1,
    pageSize: 10,
  };
}

/**
 * Generate mock single order
 */
function generateSingleOrder(): object {
  return {
    id: 1001,
    date: '2024-01-15',
    status: 'delivered',
    items: [
      {
        id: 1,
        name: 'Wireless Headphones',
        price: 99.99,
        quantity: 1,
      },
      {
        id: 2,
        name: 'Smart Watch',
        price: 199.99,
        quantity: 2,
      },
    ],
    subtotal: 499.97,
    tax: 49.99,
    total: 549.96,
    shippingAddress: {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
    },
  };
}

/**
 * Generate mock post list
 */
function generatePostList(): object {
  return {
    data: [
      {
        id: 1,
        title: 'Getting Started with React',
        excerpt: 'Learn the basics of React in this comprehensive guide...',
        author: 'John Doe',
        date: '2024-01-15',
        image: 'https://via.placeholder.com/600x400?text=React',
        category: 'Tutorial',
      },
      {
        id: 2,
        title: 'Advanced TypeScript Patterns',
        excerpt: 'Explore advanced TypeScript patterns and best practices...',
        author: 'Jane Smith',
        date: '2024-01-20',
        image: 'https://via.placeholder.com/600x400?text=TypeScript',
        category: 'Tutorial',
      },
    ],
    total: 2,
    page: 1,
    pageSize: 10,
  };
}

/**
 * Generate mock single post
 */
function generateSinglePost(): object {
  return {
    id: 1,
    title: 'Getting Started with React',
    content: 'React is a JavaScript library for building user interfaces...',
    author: 'John Doe',
    date: '2024-01-15',
    image: 'https://via.placeholder.com/600x400?text=React',
    category: 'Tutorial',
    tags: ['react', 'javascript', 'frontend'],
    views: 1234,
  };
}

/**
 * Generate mock comment list
 */
function generateCommentList(): object {
  return {
    data: [
      {
        id: 1,
        author: 'Alice',
        content: 'Great article! Very helpful.',
        date: '2024-01-16',
        avatar: 'https://i.pravatar.cc/50?img=4',
      },
      {
        id: 2,
        author: 'Bob',
        content: 'Thanks for sharing this.',
        date: '2024-01-17',
        avatar: 'https://i.pravatar.cc/50?img=5',
      },
    ],
    total: 2,
  };
}

/**
 * Generate fetch interceptor script
 * 
 * Creates a JavaScript file that overrides window.fetch to intercept API calls
 * and redirect them to local mock JSON files.
 * 
 * @param endpoints - Array of API endpoints to intercept
 * @returns JavaScript code for the interceptor
 */
function generateInterceptorScript(endpoints: MockEndpoint[]): string {
  // Build route map: path -> mock file path
  const routeMap = endpoints.map(endpoint => {
    const mockFilePath = `mock${endpoint.path}.json`;
    return `  '${endpoint.method}:${endpoint.path}': '${mockFilePath}'`;
  }).join(',\n');

  return `/**
 * Mock API Interceptor
 * Automatically generated by export-deployable-project
 * 
 * This script intercepts fetch() calls and redirects them to local mock data files.
 */

(function() {
  'use strict';

  // Mock route mapping: 'METHOD:path' -> 'mock file path'
  const mockRoutes = {
${routeMap}
  };

  // Store original fetch
  const originalFetch = window.fetch;

  // Override fetch
  window.fetch = function(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    
    // Extract path from URL
    let path = url;
    try {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        const urlObj = new URL(url);
        path = urlObj.pathname;
      } else if (!url.startsWith('/')) {
        path = '/' + url;
      }
      // Remove query params
      path = path.split('?')[0].split('#')[0];
    } catch (e) {
      // If parsing fails, use url as-is
    }

    const routeKey = method + ':' + path;
    const mockFile = mockRoutes[routeKey];

    if (mockFile) {
      console.log('[Mock Interceptor] Intercepting:', method, path, '->', mockFile);
      
      // Return mock data from local file
      return originalFetch(mockFile)
        .then(response => {
          if (!response.ok) {
            console.warn('[Mock Interceptor] Mock file not found:', mockFile);
            // Fall back to original fetch
            return originalFetch(url, options);
          }
          return response;
        })
        .catch(error => {
          console.error('[Mock Interceptor] Error loading mock file:', error);
          // Fall back to original fetch
          return originalFetch(url, options);
        });
    }

    // No mock found, use original fetch
    return originalFetch(url, options);
  };

  // Also intercept XMLHttpRequest
  const OriginalXHR = window.XMLHttpRequest;
  window.XMLHttpRequest = function() {
    const xhr = new OriginalXHR();
    const originalOpen = xhr.open;

    xhr.open = function(method, url, ...args) {
      let path = url;
      try {
        if (url.startsWith('http://') || url.startsWith('https://')) {
          const urlObj = new URL(url);
          path = urlObj.pathname;
        } else if (!url.startsWith('/')) {
          path = '/' + url;
        }
        path = path.split('?')[0].split('#')[0];
      } catch (e) {
        // Use url as-is
      }

      const routeKey = method.toUpperCase() + ':' + path;
      const mockFile = mockRoutes[routeKey];

      if (mockFile) {
        console.log('[Mock Interceptor] Intercepting XHR:', method, path, '->', mockFile);
        return originalOpen.call(xhr, method, mockFile, ...args);
      }

      return originalOpen.call(xhr, method, url, ...args);
    };

    return xhr;
  };

  console.log('[Mock Interceptor] Initialized with', Object.keys(mockRoutes).length, 'routes');
})();
`;
}
