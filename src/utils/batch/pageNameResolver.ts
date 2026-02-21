/**
 * Page name resolver for merge preview navigation
 * Feature: merge-preview-navigation
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */

/**
 * Default mapping from Chinese role names to English page names
 * 
 * This mapping is used as a fallback when exact page name matching fails.
 * It allows users to reference pages using common Chinese role names,
 * which will be automatically resolved to their English equivalents.
 * 
 * @example
 * ```typescript
 * DEFAULT_ROLE_ALIASES['首页'] // Returns 'home'
 * DEFAULT_ROLE_ALIASES['产品列表'] // Returns 'products'
 * ```
 * 
 * Requirements:
 * - 3.3: Maintain Chinese role name to English page name alias mapping
 */
export const DEFAULT_ROLE_ALIASES: Record<string, string> = {
  '首页': 'home',
  '主页': 'home',
  '产品列表': 'products',
  '产品': 'products',
  '产品详情': 'product-detail',
  '购物车': 'cart',
  '结账': 'checkout',
  '博客': 'blog',
  '文章': 'post',
  '关于': 'about',
  '联系': 'contact',
  '登录': 'login',
  '注册': 'signup',
  '仪表板': 'dashboard',
  '设置': 'settings',
  '个人资料': 'profile',
  '作品集': 'portfolio',
  '项目详情': 'project-detail',
};

/**
 * Normalize a page name to a standard format
 * 
 * This function performs the following transformations:
 * 1. Removes file extensions (.html, .htm, etc.)
 * 2. Removes path prefixes (/, ./, ../, etc.)
 * 3. Removes query parameters and anchors (? and # and everything after)
 * 4. Converts to lowercase
 * 5. Converts camelCase and PascalCase to kebab-case
 * 
 * @param raw - Raw page name string to normalize
 * @returns Normalized page name in lowercase kebab-case format
 * 
 * @example
 * ```typescript
 * normalizePageName('Products.html') // Returns 'products'
 * normalizePageName('/pages/ProductList') // Returns 'product-list'
 * normalizePageName('./about.html?id=123') // Returns 'about'
 * normalizePageName('myProductPage') // Returns 'my-product-page'
 * normalizePageName('') // Returns ''
 * ```
 * 
 * Requirements:
 * - 3.1: Remove file extensions, path prefixes, query parameters, and anchors
 * - 3.2: Convert to lowercase and transform camelCase/PascalCase to kebab-case
 */
export function normalizePageName(raw: string): string {
  if (!raw || typeof raw !== 'string') {
    console.debug('[pageNameResolver] normalizePageName: Invalid input', { raw, type: typeof raw });
    return '';
  }

  let normalized = raw.trim();

  // Return empty string for empty or whitespace-only input
  if (normalized === '') {
    console.debug('[pageNameResolver] normalizePageName: Empty input after trim');
    return '';
  }

  console.debug('[pageNameResolver] normalizePageName: Starting normalization', { input: raw });

  // Remove query parameters and anchors (? and # and everything after)
  normalized = normalized.split('?')[0].split('#')[0];

  // Remove path prefixes (/, ./, ../, etc.)
  // Handle both forward slashes and backslashes
  normalized = normalized.replace(/^(?:\.\.\/|\.\/|\/|\\)+/, '');

  // Remove file extensions (.html, .htm, .php, .jsp, etc.)
  normalized = normalized.replace(/\.[a-zA-Z0-9]+$/, '');

  // Convert camelCase and PascalCase to kebab-case BEFORE lowercasing
  // Insert hyphen before uppercase letters that follow lowercase letters
  normalized = normalized.replace(/([a-z])([A-Z])/g, '$1-$2');
  // Insert hyphen before uppercase letters that are followed by lowercase letters
  normalized = normalized.replace(/([A-Z])([A-Z][a-z])/g, '$1-$2');

  // Convert to lowercase
  normalized = normalized.toLowerCase();

  // Clean up any multiple consecutive hyphens
  normalized = normalized.replace(/-+/g, '-');

  // Remove leading/trailing hyphens
  normalized = normalized.replace(/^-+|-+$/g, '');

  console.debug('[pageNameResolver] normalizePageName: Completed normalization', { 
    input: raw, 
    output: normalized 
  });

  return normalized;
}

/**
 * Resolve a raw page name to a valid page name from the provided list
 * 
 * This function attempts to match the raw page name using multiple strategies:
 * 1. Priority 1: Exact match (after normalization)
 * 2. Priority 2: Chinese alias mapping (using DEFAULT_ROLE_ALIASES or custom pageRoles)
 * 3. Priority 3: Contains match (partial string matching)
 * 
 * @param raw - Raw page name string to resolve
 * @param validPageNames - Array of valid page names to match against
 * @param pageRoles - Optional map of page names to their role descriptions for custom alias matching
 * @returns Resolved page name from validPageNames, or null if no match found
 * 
 * @example
 * ```typescript
 * const validPages = ['home', 'products', 'product-detail', 'cart'];
 * 
 * // Exact match (after normalization)
 * resolvePageName('Products.html', validPages) // Returns 'products'
 * resolvePageName('CART', validPages) // Returns 'cart'
 * 
 * // Chinese alias mapping
 * resolvePageName('首页', validPages) // Returns 'home'
 * resolvePageName('产品列表', validPages) // Returns 'products'
 * 
 * // Contains match
 * resolvePageName('product', validPages) // Returns 'products' (first match)
 * 
 * // No match
 * resolvePageName('nonexistent', validPages) // Returns null
 * 
 * // Custom role mapping
 * const roles = new Map([['home', '主页'], ['products', '商品']]);
 * resolvePageName('商品', validPages, roles) // Returns 'products'
 * ```
 * 
 * Requirements:
 * - 3.1: Support normalization of various page name formats
 * - 3.2: Perform case-insensitive matching
 * - 3.3: Use Chinese alias mapping as fallback
 * - 3.4: Ensure round-trip consistency for valid page names
 */
export function resolvePageName(
  raw: string,
  validPageNames: string[],
  pageRoles?: Map<string, string>
): string | null {
  console.debug('[pageNameResolver] resolvePageName: Starting resolution', { 
    raw, 
    validPageNames,
    hasPageRoles: !!pageRoles 
  });

  if (!raw || typeof raw !== 'string' || !validPageNames || validPageNames.length === 0) {
    console.debug('[pageNameResolver] resolvePageName: Invalid input parameters', {
      hasRaw: !!raw,
      rawType: typeof raw,
      hasValidPages: !!validPageNames,
      validPagesLength: validPageNames?.length
    });
    return null;
  }

  // Normalize the input
  const normalized = normalizePageName(raw);

  if (normalized === '') {
    console.debug('[pageNameResolver] resolvePageName: Empty normalized input');
    return null;
  }

  // Normalize all valid page names for comparison
  const normalizedValidPages = validPageNames.map(name => ({
    original: name,
    normalized: normalizePageName(name)
  }));

  // Priority 1: Exact match (after normalization)
  const exactMatch = normalizedValidPages.find(page => page.normalized === normalized);
  if (exactMatch) {
    console.debug('[pageNameResolver] resolvePageName: Found exact match', { 
      raw, 
      normalized, 
      matched: exactMatch.original 
    });
    return exactMatch.original;
  }
  console.debug('[pageNameResolver] resolvePageName: No exact match found', { normalized });

  // Priority 2: Chinese alias mapping
  // First check if the raw input is a Chinese alias
  const aliasMatch = DEFAULT_ROLE_ALIASES[raw];
  if (aliasMatch) {
    console.debug('[pageNameResolver] resolvePageName: Found Chinese alias', { 
      raw, 
      alias: aliasMatch 
    });
    const aliasNormalized = normalizePageName(aliasMatch);
    const aliasPage = normalizedValidPages.find(page => page.normalized === aliasNormalized);
    if (aliasPage) {
      console.debug('[pageNameResolver] resolvePageName: Chinese alias resolved', { 
        raw, 
        alias: aliasMatch, 
        matched: aliasPage.original 
      });
      return aliasPage.original;
    }
    console.debug('[pageNameResolver] resolvePageName: Chinese alias not found in valid pages', { 
      alias: aliasMatch, 
      aliasNormalized 
    });
  }

  // Also check custom pageRoles mapping (reverse lookup)
  if (pageRoles) {
    console.debug('[pageNameResolver] resolvePageName: Checking custom pageRoles', { 
      rolesCount: pageRoles.size 
    });
    for (const [pageName, role] of pageRoles.entries()) {
      if (role === raw || normalizePageName(role) === normalized) {
        console.debug('[pageNameResolver] resolvePageName: Found custom role match', { 
          raw, 
          pageName, 
          role 
        });
        const customMatch = normalizedValidPages.find(page => page.normalized === normalizePageName(pageName));
        if (customMatch) {
          console.debug('[pageNameResolver] resolvePageName: Custom role resolved', { 
            raw, 
            matched: customMatch.original 
          });
          return customMatch.original;
        }
      }
    }
  }

  // Priority 3: Contains match (partial string matching)
  // Check if normalized input is contained in any valid page name
  console.debug('[pageNameResolver] resolvePageName: Attempting contains match', { normalized });
  const containsMatch = normalizedValidPages.find(page => 
    page.normalized.includes(normalized) || normalized.includes(page.normalized)
  );
  if (containsMatch) {
    console.debug('[pageNameResolver] resolvePageName: Found contains match', { 
      raw, 
      normalized, 
      matched: containsMatch.original 
    });
    return containsMatch.original;
  }

  // No match found
  console.warn('[pageNameResolver] resolvePageName: No match found for page name', { 
    raw, 
    normalized, 
    validPageNames 
  });
  return null;
}
