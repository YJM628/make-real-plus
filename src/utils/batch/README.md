# Batch Generation Utilities

This directory contains utilities for batch generation of multi-page applications with AI-powered HTML generation.

## Overview

The batch generation system allows users to generate complete multi-page applications from a single prompt. The system:

1. **Parses** the user's prompt to extract application context and page specifications
2. **Generates** individual pages using AI with consistent theming and navigation
3. **Collects** and organizes the generated pages
4. **Merges** pages into an interactive preview with client-side routing

## Core Modules

### Application Context & Parsing

- **`parseBatchRequest.ts`** - Parses user prompts to extract application structure
- **`parseMultiPageResponse.ts`** - Parses AI responses containing multiple pages

### Prompt Building

- **`buildCohesivePrompt.ts`** - Builds prompts for generating all pages in a single AI call
- **`buildPerPagePrompt.ts`** - Builds individual prompts for per-page generation with shared context

### Page Collection & Organization

- **`collectPages.ts`** - Collects and organizes generated pages from shape data
- **`extractHtmlSections.ts`** - Extracts HTML, CSS, and JS from generated content

### Navigation & Routing

- **`pageNameResolver.ts`** - Resolves page names with fuzzy matching and Chinese alias support
- **`mergePreviewRouter.ts`** - Injects client-side routing script for interactive navigation
- **`pageLinkHandler.ts`** - Handles page link interactions in the editor

### Incremental Processing

- **`incrementalParser.ts`** - Parses streaming AI responses incrementally

### Theme Management

- **`sharedThemeManager.ts`** - Manages shared theme CSS variables across pages

## Navigation System

### Overview

The navigation system enables seamless page-to-page navigation in the merge preview dialog. It consists of three key components:

1. **AI Prompt Enhancement** (`buildPerPagePrompt.ts`)
2. **Page Name Resolution** (`pageNameResolver.ts`)
3. **Client-Side Routing** (`mergePreviewRouter.ts`)

### 1. AI Prompt Enhancement

The `buildPerPagePrompt()` function generates comprehensive prompts that instruct the AI to include proper navigation attributes in the generated HTML.

#### Key Features

- **Navigation Rules Section**: Provides explicit instructions for using `data-page-target` attributes
- **Element Type Checklist**: Lists all element types that require navigation attributes (nav links, CTA buttons, product cards, etc.)
- **Concrete Examples**: Shows multiple HTML examples for each link target
- **Anti-Pattern Examples**: Demonstrates wrong vs. correct usage
- **Critical Constraints**: Emphasizes mandatory requirements

#### Navigation Rules Generation

The `buildNavigationRules()` function creates a detailed section in the AI prompt that includes:

```typescript
// Example output structure:
## Navigation Rules (MANDATORY)

**CRITICAL REQUIREMENT**: All inter-page navigation elements MUST use the `data-page-target` attribute...

### Element Types Requiring data-page-target
- Navigation bar links
- Call-to-action (CTA) buttons
- Product cards
- List item links
- Breadcrumb navigation
- Footer links

### HTML Examples for This Page's Link Targets
**For page "products":**
<a href="#" data-page-target="products">Products</a>
<button data-page-target="products">Products</button>
<div class="card" data-page-target="products">...</div>

### ❌ WRONG vs. ✅ CORRECT Examples
// Shows incorrect and correct usage patterns
```

This approach ensures the AI generates HTML with proper navigation attributes from the start, reducing the need for post-processing.

### 2. Page Name Resolution

The `pageNameResolver.ts` module provides fuzzy matching and normalization for page names, allowing flexible navigation even when page names don't match exactly.

#### Key Functions

**`normalizePageName(raw: string): string`**

Standardizes page names by:
- Removing file extensions (`.html`, `.htm`, etc.)
- Removing path prefixes (`/`, `./`, `../`, etc.)
- Removing query parameters and anchors (`?`, `#`)
- Converting to lowercase
- Converting camelCase/PascalCase to kebab-case

```typescript
normalizePageName('Products.html')      // → 'products'
normalizePageName('/pages/ProductList') // → 'product-list'
normalizePageName('myProductPage')      // → 'my-product-page'
```

**`resolvePageName(raw: string, validPageNames: string[], pageRoles?: Map<string, string>): string | null`**

Resolves page names using a three-tier priority system:

1. **Exact Match** (after normalization)
   ```typescript
   resolvePageName('Products.html', ['products']) // → 'products'
   ```

2. **Chinese Alias Mapping** (using `DEFAULT_ROLE_ALIASES`)
   ```typescript
   resolvePageName('首页', ['home'])      // → 'home'
   resolvePageName('产品列表', ['products']) // → 'products'
   ```

3. **Contains Match** (partial string matching)
   ```typescript
   resolvePageName('product', ['products', 'product-detail']) // → 'products'
   ```

#### Chinese Alias Support

The `DEFAULT_ROLE_ALIASES` constant provides mappings for common Chinese role names:

```typescript
{
  '首页': 'home',
  '主页': 'home',
  '产品列表': 'products',
  '产品': 'products',
  '产品详情': 'product-detail',
  '购物车': 'cart',
  '结账': 'checkout',
  // ... and more
}
```

This allows users to reference pages using Chinese names, which are automatically resolved to their English equivalents.

### 3. Client-Side Routing

The `mergePreviewRouter.ts` module injects a routing script into each page's HTML that intercepts navigation events and communicates with the parent window.

#### Routing Script Features

**Event Delegation Pattern**

Uses document-level event delegation for better performance and support for dynamically added elements:

```javascript
document.addEventListener('click', function(e) {
  // Find nearest ancestor with data-page-target
  const target = e.target.closest('[data-page-target]');
  if (target) {
    // Navigate to target page
  }
});
```

**Fallback href Resolution**

When an element doesn't have `data-page-target`, the router attempts to resolve the `href` attribute:

```javascript
const link = e.target.closest('a[href]');
if (link && !link.hasAttribute('data-page-target')) {
  const pageName = resolvePageName(link.getAttribute('href'));
  if (pageName && validPages.has(pageName)) {
    navigate(pageName);
  }
}
```

**Invalid Link Marking**

The router automatically marks invalid navigation links with visual feedback:

```javascript
// For links to non-existent pages:
link.style.opacity = '0.5';
link.style.cursor = 'not-allowed';
link.style.pointerEvents = 'none';
link.title = 'Page "xyz" not found';
```

**PostMessage Communication**

Navigation requests are sent to the parent window via `postMessage`:

```javascript
window.parent.postMessage({
  type: 'merge-navigate',
  targetPage: targetPage
}, '*');
```

#### Inlined Page Name Resolution

Since the routing script runs inside an iframe, it cannot import external modules. Therefore, the `normalizePageName()` and `resolvePageName()` logic from `pageNameResolver.ts` is inlined directly into the routing script.

This ensures the fallback href resolution mechanism has access to the same fuzzy matching capabilities as the rest of the application.

## Usage Examples

### Generating a Multi-Page Application

```typescript
import { buildPerPagePrompt } from './buildPerPagePrompt';
import { collectPages } from './collectPages';
import { buildMergePageHtml } from './mergePreviewRouter';

// 1. Build prompt for each page
const page: PageSpec = {
  name: 'home',
  role: '首页',
  linksTo: ['products', 'about'],
  order: 0
};

const appContext: AppContext = {
  appName: '电商网站',
  appType: 'ecommerce',
  pages: [page, ...otherPages],
  originalPrompt: '生成一个电商网站'
};

const prompt = buildPerPagePrompt(page, appContext);
// Send prompt to AI and get HTML response

// 2. Collect generated pages
const pages = collectPages(editor);

// 3. Build merge preview HTML with routing
const mergeHtml = buildMergePageHtml(pages[0], pages.map(p => p.name));
```

### Resolving Page Names

```typescript
import { resolvePageName, normalizePageName } from './pageNameResolver';

const validPages = ['home', 'products', 'product-detail', 'cart'];

// Exact match
resolvePageName('Products.html', validPages); // → 'products'

// Chinese alias
resolvePageName('首页', validPages); // → 'home'

// Partial match
resolvePageName('product', validPages); // → 'products'

// Normalization
normalizePageName('ProductList.html'); // → 'product-list'
```

## Design Principles

### 1. Source-First Approach

The navigation system prioritizes fixing issues at the source (AI generation) rather than post-processing. By providing comprehensive navigation instructions in the AI prompt, we ensure most generated HTML includes proper navigation attributes from the start.

### 2. Layered Fallbacks

The system provides multiple fallback mechanisms:
- Primary: `data-page-target` attributes (generated by AI)
- Secondary: href resolution with fuzzy matching
- Tertiary: Visual feedback for invalid links

### 3. Fuzzy Matching

The page name resolver supports multiple formats and naming conventions, making the system resilient to variations in how pages are referenced.

### 4. Inlined Dependencies

The routing script inlines all necessary logic to avoid external dependencies, ensuring it works correctly in the iframe context.

## Testing

The navigation system is thoroughly tested with:

- **Unit Tests**: Test individual functions in isolation
  - `src/__tests__/unit/page-name-resolver.test.ts` (51 tests)
  - `src/__tests__/unit/build-per-page-prompt.test.ts` (29 tests)
  - `src/__tests__/unit/merge-preview-router.test.ts` (28 tests)

- **Property-Based Tests**: Verify properties hold across all inputs using `fast-check`
  - `src/__tests__/property/page-name-resolver.property.test.ts` (23 tests, 100 iterations each)
  - `src/__tests__/property/build-per-page-prompt.property.test.ts` (23 tests, 100 iterations each)

- **Integration Tests**: Test the complete navigation flow end-to-end
  - `src/__tests__/integration/merge-preview-navigation.test.ts` (27 tests)

Total: 200+ tests ensuring robust navigation functionality.

See the `__tests__` directory for test implementations.

## Logging and Debugging

The navigation system includes comprehensive logging for troubleshooting:

**Log Prefixes**:
- `[pageNameResolver]` - Page name normalization and resolution
- `[buildPerPagePrompt]` - AI prompt generation
- `[buildNavigationRules]` - Navigation rules generation
- `[buildMergePageHtml]` - HTML construction
- `[MergeRouter]` - Client-side routing (runs in iframe)

**Log Levels**:
- **info**: Important events (initialization, navigation)
- **debug**: Detailed steps (normalization, resolution attempts)
- **warn**: Problems (invalid links, resolution failures)

**Quick Debug in Browser Console**:
```javascript
// Filter by module
[MergeRouter]

// Watch navigation flow
"Click event detected" → "Valid data-page-target navigation" → "Navigating to page"
```

**Documentation**:
- [LOGGING_GUIDE.md](../../.kiro/specs/merge-preview-navigation/LOGGING_GUIDE.md) - Complete logging documentation with troubleshooting scenarios
- [LOGGING_QUICK_REFERENCE.md](../../.kiro/specs/merge-preview-navigation/LOGGING_QUICK_REFERENCE.md) - Quick reference card for common issues

**Disable Debug Logs in Production**:
Edit `mergePreviewRouter.ts` and change `const DEBUG = true;` to `const DEBUG = false;` to reduce console noise while keeping info/warn logs.

## Related Features

- **Multi-Page Merge Preview** - The dialog that displays merged pages
- **Batch Generation** - The system that generates multiple pages from a single prompt
- **Theme Management** - Ensures visual consistency across pages

## Future Enhancements

Potential improvements to the navigation system:

1. **History API Integration** - Support browser back/forward buttons
2. **Deep Linking** - Allow direct links to specific pages
3. **Transition Animations** - Add smooth transitions between pages
4. **Preloading** - Preload adjacent pages for faster navigation
5. **Analytics** - Track navigation patterns for insights
