/**
 * Utility functions for parsing batch generation requests
 * Feature: ai-html-visual-editor, batch-html-redesign
 * Requirements: 3.1, 3.6, 1.1, 1.2, 1.3, 1.4, 1.5
 */

import type { AppContext, PageSpec } from '../../types';

/**
 * Result of parsing a batch generation request
 */
export interface BatchRequestParseResult {
  /** Whether this is a batch generation request */
  isBatch: boolean;
  /** Number of pages to generate */
  count: number;
  /** Types/names of pages to generate */
  pageTypes: string[];
  /** Original prompt without batch indicators */
  cleanPrompt: string;
}

/**
 * Common page type keywords and their variations
 */
const PAGE_TYPE_KEYWORDS: Record<string, string[]> = {
  home: ['home', 'homepage', 'landing', 'index', '首页', '主页'],
  about: ['about', 'about us', '关于', '关于我们'],
  contact: ['contact', 'contact us', '联系', '联系我们'],
  services: ['services', 'service', '服务'],
  products: ['products', 'product', '产品'],
  portfolio: ['portfolio', 'work', 'projects', '作品', '项目'],
  blog: ['blog', 'news', 'articles', '博客', '新闻'],
  pricing: ['pricing', 'plans', '价格', '定价'],
  faq: ['faq', 'help', 'support', '帮助', '支持'],
  login: ['login', 'signin', 'sign in', '登录'],
  signup: ['signup', 'register', 'sign up', '注册'],
  dashboard: ['dashboard', 'admin', '仪表板', '管理'],
  profile: ['profile', 'account', '个人资料', '账户'],
  settings: ['settings', 'preferences', '设置'],
  detail: ['detail', 'details', '详情'],
};

/**
 * Patterns to detect batch generation requests
 */
const BATCH_PATTERNS = [
  // English patterns
  /(\d+)\s*pages?/i,
  /generate\s+(\d+)/i,
  /create\s+(\d+)/i,
  /make\s+(\d+)/i,
  /build\s+(\d+)/i,
  // Chinese patterns
  /(\d+)\s*个?页面/i,
  /生成\s*(\d+)/i,
  /创建\s*(\d+)/i,
  /制作\s*(\d+)/i,
];

/**
 * Parse a user request to identify if it's a batch generation request
 * and extract the number of pages and their types
 * 
 * @param prompt - User's natural language request
 * @returns Parsed batch request information
 * 
 * @example
 * ```typescript
 * // Explicit count
 * parseBatchRequest('Create 3 pages: home, about, contact')
 * // => { isBatch: true, count: 3, pageTypes: ['home', 'about', 'contact'], cleanPrompt: 'Create pages' }
 * 
 * // Implicit count from page types
 * parseBatchRequest('Create home, about, and contact pages')
 * // => { isBatch: true, count: 3, pageTypes: ['home', 'about', 'contact'], cleanPrompt: 'Create pages' }
 * 
 * // Single page (not batch)
 * parseBatchRequest('Create a login form')
 * // => { isBatch: false, count: 1, pageTypes: [], cleanPrompt: 'Create a login form' }
 * ```
 * 
 * Requirements:
 * - 3.1: Identify and generate multiple independent HTML files
 * - 3.6: Generate specified number of pages when user specifies count
 */
export function parseBatchRequest(prompt: string): BatchRequestParseResult {
  let count = 0;
  const pageTypes: string[] = [];
  let cleanPrompt = prompt;

  // Step 1: Try to extract explicit count from patterns
  for (const pattern of BATCH_PATTERNS) {
    const match = prompt.match(pattern);
    if (match && match[1]) {
      count = parseInt(match[1], 10);
      // Remove the count pattern from the prompt
      cleanPrompt = prompt.replace(pattern, '').trim();
      break;
    }
  }

  // Step 2: Extract page types from the prompt
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for explicit page type lists (e.g., "home, about, contact")
  const pageTypeMatches = extractPageTypes(lowerPrompt);
  pageTypes.push(...pageTypeMatches);

  // Step 3: Determine if this is a batch request
  const isBatch = count > 1 || pageTypes.length > 1;

  // Step 4: If count is not specified but we have multiple page types, use that count
  if (count === 0 && pageTypes.length > 0) {
    count = pageTypes.length;
  }

  // Step 5: If count is specified but no page types, generate generic page types
  if (count > 0 && pageTypes.length === 0) {
    for (let i = 0; i < count; i++) {
      pageTypes.push(`page-${i + 1}`);
    }
  }

  // Step 6: If we have count but fewer page types, fill in the rest
  if (count > pageTypes.length) {
    const remaining = count - pageTypes.length;
    for (let i = 0; i < remaining; i++) {
      pageTypes.push(`page-${pageTypes.length + i + 1}`);
    }
  }

  // Step 7: Clean up the prompt
  cleanPrompt = cleanPrompt
    .replace(/[:：]\s*$/, '') // Remove trailing colons
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  return {
    isBatch,
    count: isBatch ? count : 1,
    pageTypes: isBatch ? pageTypes : [],
    cleanPrompt: cleanPrompt || prompt,
  };
}

/**
 * Extract page types from a prompt string
 * 
 * @param prompt - Lowercase prompt string
 * @returns Array of identified page types
 */
function extractPageTypes(prompt: string): string[] {
  const found: string[] = [];
  const foundSet = new Set<string>();

  // Check each page type and its variations
  for (const [pageType, variations] of Object.entries(PAGE_TYPE_KEYWORDS)) {
    for (const variation of variations) {
      // Use word boundaries to avoid partial matches
      const regex = new RegExp(`\\b${escapeRegex(variation)}\\b`, 'i');
      if (regex.test(prompt) && !foundSet.has(pageType)) {
        found.push(pageType);
        foundSet.add(pageType);
        break;
      }
    }
  }

  return found;
}

/**
 * Escape special regex characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Create an AIGenerationContext for batch generation
 * 
 * @param prompt - User's natural language request
 * @param designSystem - Optional design system preference
 * @returns AIGenerationContext configured for batch generation
 * 
 * @example
 * ```typescript
 * const context = createBatchContext('Create 3 pages: home, about, contact', 'tailwind');
 * // => {
 * //   prompt: 'Create pages',
 * //   designSystem: 'tailwind',
 * //   batchGeneration: { count: 3, pageTypes: ['home', 'about', 'contact'] }
 * // }
 * ```
 */
export function createBatchContext(
  prompt: string,
  designSystem?: string
): import('../../types').AIGenerationContext {
  const parsed = parseBatchRequest(prompt);

  if (!parsed.isBatch) {
    // Not a batch request, return simple context
    return {
      prompt,
      designSystem,
    };
  }

  // Batch request, return context with batch configuration
  return {
    prompt: parsed.cleanPrompt,
    designSystem,
    batchGeneration: {
      count: parsed.count,
      pageTypes: parsed.pageTypes,
    },
  };
}

/**
 * Known application types and their default page compositions
 */
const APP_TYPE_DEFAULTS: Record<string, { pages: Array<{ name: string; role: string }> }> = {
  ecommerce: {
    pages: [
      { name: 'home', role: '首页' },
      { name: 'products', role: '产品列表' },
      { name: 'product-detail', role: '产品详情' },
      { name: 'cart', role: '购物车' },
      { name: 'checkout', role: '结账' },
    ],
  },
  blog: {
    pages: [
      { name: 'home', role: '首页' },
      { name: 'blog', role: '博客列表' },
      { name: 'post', role: '文章详情' },
      { name: 'about', role: '关于' },
    ],
  },
  dashboard: {
    pages: [
      { name: 'dashboard', role: '仪表板' },
      { name: 'profile', role: '个人资料' },
      { name: 'settings', role: '设置' },
      { name: 'login', role: '登录' },
    ],
  },
  portfolio: {
    pages: [
      { name: 'home', role: '首页' },
      { name: 'portfolio', role: '作品集' },
      { name: 'project-detail', role: '项目详情' },
      { name: 'about', role: '关于' },
      { name: 'contact', role: '联系' },
    ],
  },
};

/**
 * Application type keywords for detection
 */
const APP_TYPE_KEYWORDS: Record<string, string[]> = {
  ecommerce: ['ecommerce', 'e-commerce', 'shop', 'store', '电商', '商城', '商店'],
  blog: ['blog', 'news', 'article', '博客', '新闻', '文章'],
  dashboard: ['dashboard', 'admin', 'panel', '仪表板', '管理', '后台'],
  portfolio: ['portfolio', 'showcase', '作品集', '展示'],
};

/**
 * Parse user input to construct an AppContext for cohesive multi-page generation
 * 
 * Enhanced with AI-driven parsing for non-standard application types.
 * Uses a two-tier parsing strategy:
 * 1. First try rule-based parser (fast)
 * 2. If fails, try AI parser (intelligent)
 * 3. If both fail, return null (fallback to single-page mode)
 * 
 * @param prompt - User's natural language request
 * @param aiParser - Optional AI parser service for intelligent parsing
 * @returns Promise<AppContext | null>
 * 
 * @example
 * ```typescript
 * // With explicit page list
 * const ctx1 = await parseAppContext('生成电商网站：首页、产品列表、购物车');
 * // => { appName: '电商网站', appType: 'ecommerce', pages: [...], originalPrompt: '...' }
 * 
 * // With AI parser for non-standard apps
 * const parser = new AIParserService(aiService);
 * const ctx2 = await parseAppContext('Create a multi-agent desktop app', parser);
 * // => { appName: 'multi-agent desktop app', appType: 'agent-system', pages: [...], originalPrompt: '...' }
 * 
 * // Single page (returns null)
 * const ctx3 = await parseAppContext('Create a login form');
 * // => null
 * ```
 * 
 * Requirements:
 * - 1.1: Parse complete App_Context including app name, page list, and app type
 * - 1.2: Support page count specification (e.g., "generate 5 pages")
 * - 1.3: Support explicit page list (e.g., "home, products, cart")
 * - 1.4: Infer reasonable page composition based on app type
 * - 1.5: Return null for single-page requests (fallback to single-page mode)
 * - 4.1: Fallback to rule parser when AI parser fails
 * - 4.2: Use rule parser first for known patterns (performance)
 * - 4.3: Use AI parser for unknown patterns
 * - 4.4: Return null when all parsers fail
 */
export async function parseAppContext(
  prompt: string,
  aiParser?: import('./aiParserService').AIParserService
): Promise<AppContext | null> {
  console.log('[parseAppContext] Starting parse with aiParser:', !!aiParser);
  
  // Step 1: Try rule-based parser first (fast path)
  const ruleResult = parseAppContextWithRules(prompt);
  
  if (ruleResult) {
    // Rule parser succeeded
    console.log('[parseAppContext] Rule parser succeeded');
    return ruleResult;
  }

  console.log('[parseAppContext] Rule parser failed');

  // Step 2: If rule parser failed and AI parser is available, try AI parser
  if (aiParser) {
    console.log('[parseAppContext] Trying AI parser...');
    
    try {
      const aiResult = await aiParser.parseWithAI(prompt);
      
      if (aiResult) {
        console.log('[parseAppContext] AI parser succeeded');
        return aiResult;
      }
      
      console.log('[parseAppContext] AI parser returned null');
    } catch (error) {
      console.error('[parseAppContext] AI parser error:', error);
    }
  } else {
    console.log('[parseAppContext] No AI parser available');
  }

  // Step 3: Both parsers failed, return null
  console.log('[parseAppContext] All parsers failed, returning null');
  return null;
}

/**
 * Parse user input using rule-based logic (original implementation)
 * 
 * This is the fast path for known application types and patterns.
 * Extracted from the original parseAppContext function.
 * 
 * @param prompt - User's natural language request
 * @returns AppContext or null if parsing fails
 */
function parseAppContextWithRules(prompt: string): AppContext | null {
  // First, check if this is a batch request
  const batchResult = parseBatchRequest(prompt);
  
  // Extract application name and type
  const appName = extractAppName(prompt);
  const appType = detectAppType(prompt);

  // Build page specifications
  let pages: PageSpec[] = [];

  // Case 1: Explicit page list provided
  if (batchResult.isBatch && batchResult.pageTypes.length > 0 && !batchResult.pageTypes[0].startsWith('page-')) {
    pages = buildPageSpecsFromTypes(batchResult.pageTypes);
  }
  // Case 2: Count specified with known app type - use defaults
  else if (batchResult.isBatch && appType && APP_TYPE_DEFAULTS[appType]) {
    const defaultPages = APP_TYPE_DEFAULTS[appType].pages;
    if (batchResult.count > 0 && batchResult.count <= defaultPages.length) {
      // Use first N default pages
      pages = defaultPages.slice(0, batchResult.count).map((p, idx) => ({
        name: p.name,
        role: p.role,
        linksTo: [],
        order: idx,
      }));
    } else {
      // Use all default pages
      pages = defaultPages.map((p, idx) => ({
        name: p.name,
        role: p.role,
        linksTo: [],
        order: idx,
      }));
    }
  }
  // Case 3: Count specified without known app type - generate generic pages
  else if (batchResult.isBatch && batchResult.count >= 2) {
    pages = Array.from({ length: batchResult.count }, (_, i) => ({
      name: `page-${i + 1}`,
      role: `页面 ${i + 1}`,
      linksTo: [],
      order: i,
    }));
  }
  // Case 4: Known app type without explicit count - use default pages
  else if (!batchResult.isBatch && appType && APP_TYPE_DEFAULTS[appType]) {
    const defaultPages = APP_TYPE_DEFAULTS[appType].pages;
    pages = defaultPages.map((p, idx) => ({
      name: p.name,
      role: p.role,
      linksTo: [],
      order: idx,
    }));
  }

  // If we still don't have at least 2 pages, return null
  if (pages.length < 2) {
    return null;
  }

  // Calculate linksTo relationships
  pages = calculatePageLinks(pages);

  // Sort pages by logical order
  pages = sortPagesByLogicalOrder(pages);

  return {
    appName,
    appType: appType || 'website',
    pages,
    originalPrompt: prompt,
  };
}

/**
 * Extract application name from prompt
 */
function extractAppName(prompt: string): string {
  // Try to extract name from patterns like "生成XXX网站" or "Create XXX website"
  const chineseMatch = prompt.match(/(?:生成|创建|制作)([^：:，,。.]+?)(?:网站|应用|系统)/);
  if (chineseMatch && chineseMatch[1]) {
    return chineseMatch[1].trim() + '网站';
  }

  const englishMatch = prompt.match(/(?:create|generate|build|make)\s+(?:a|an)?\s*([^:,.\n]+?)(?:website|site|app|application)/i);
  if (englishMatch && englishMatch[1]) {
    return englishMatch[1].trim() + ' website';
  }

  // Fallback: use app type or generic name
  const appType = detectAppType(prompt);
  if (appType) {
    return appType.charAt(0).toUpperCase() + appType.slice(1) + ' Website';
  }

  return 'Web Application';
}

/**
 * Detect application type from prompt
 */
function detectAppType(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  for (const [type, keywords] of Object.entries(APP_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerPrompt.includes(keyword.toLowerCase())) {
        return type;
      }
    }
  }

  return '';
}

/**
 * Build PageSpec array from page type names
 */
function buildPageSpecsFromTypes(pageTypes: string[]): PageSpec[] {
  return pageTypes.map((type, index) => {
    // Try to find a role translation
    let role = type;
    
    // Check if it's a known page type
    for (const [pageType, variations] of Object.entries(PAGE_TYPE_KEYWORDS)) {
      if (variations.some(v => v.toLowerCase() === type.toLowerCase())) {
        role = pageType;
        break;
      }
    }

    return {
      name: type,
      role: role.charAt(0).toUpperCase() + role.slice(1),
      linksTo: [],
      order: index,
    };
  });
}

/**
 * Calculate linksTo relationships between pages
 * Common patterns:
 * - All pages link to home
 * - List pages link to detail pages
 * - All pages link to common pages (about, contact)
 */
function calculatePageLinks(pages: PageSpec[]): PageSpec[] {
  const pageNames = pages.map(p => p.name);
  const homePage = pages.find(p => p.name === 'home' || p.name.includes('home'));
  const aboutPage = pages.find(p => p.name === 'about' || p.name.includes('about'));
  const contactPage = pages.find(p => p.name === 'contact' || p.name.includes('contact'));

  return pages.map(page => {
    const linksTo: string[] = [];

    // Home page links to all other pages
    if (page.name === 'home' || page.name.includes('home')) {
      linksTo.push(...pageNames.filter(name => name !== page.name));
    } else {
      // All other pages link to home (if exists)
      if (homePage && page.name !== homePage.name) {
        linksTo.push(homePage.name);
      }

      // List pages link to detail pages
      if (page.name === 'products' || page.name === 'blog' || page.name === 'portfolio') {
        const detailPage = pages.find(p => 
          p.name.includes('detail') || 
          p.name === 'product-detail' || 
          p.name === 'post' || 
          p.name === 'project-detail'
        );
        if (detailPage) {
          linksTo.push(detailPage.name);
        }
      }

      // All pages link to about and contact (if they exist)
      if (aboutPage && page.name !== aboutPage.name && !linksTo.includes(aboutPage.name)) {
        linksTo.push(aboutPage.name);
      }
      if (contactPage && page.name !== contactPage.name && !linksTo.includes(contactPage.name)) {
        linksTo.push(contactPage.name);
      }

      // Shopping flow: products -> cart -> checkout
      if (page.name === 'products') {
        const cartPage = pages.find(p => p.name === 'cart');
        if (cartPage && !linksTo.includes(cartPage.name)) {
          linksTo.push(cartPage.name);
        }
      }
      if (page.name === 'cart') {
        const checkoutPage = pages.find(p => p.name === 'checkout');
        if (checkoutPage && !linksTo.includes(checkoutPage.name)) {
          linksTo.push(checkoutPage.name);
        }
      }
    }

    return {
      ...page,
      linksTo,
    };
  });
}

/**
 * Sort pages by logical order for canvas layout
 * Priority: home > list pages > detail pages > utility pages (about, contact) > auth pages
 */
function sortPagesByLogicalOrder(pages: PageSpec[]): PageSpec[] {
  const orderPriority: Record<string, number> = {
    home: 0,
    products: 10,
    blog: 10,
    portfolio: 10,
    'product-detail': 20,
    post: 20,
    'project-detail': 20,
    detail: 20,
    cart: 30,
    checkout: 40,
    dashboard: 5,
    profile: 50,
    about: 60,
    contact: 70,
    settings: 80,
    login: 90,
    signup: 91,
  };

  return pages
    .map(page => ({
      ...page,
      order: orderPriority[page.name] ?? 100,
    }))
    .sort((a, b) => a.order - b.order);
}
