/**
 * Per-page prompt builder for independent AI calls
 * Feature: per-page-batch-generation
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 *
 * Builds a self-contained prompt for a single page that includes
 * shared context (theme, navigation, page relationships) so the AI
 * can generate a visually consistent, self-contained HTML document.
 */

import type { PageSpec, AppContext } from '../../types';

/**
 * Color scheme definitions keyed by application type.
 * Each scheme provides CSS custom properties that ensure visual
 * consistency across all pages of the same application.
 */
const COLOR_SCHEMES: Record<string, string> = {
  ecommerce: `  --primary-color: #e63946;
  --secondary-color: #457b9d;
  --accent-color: #f4a261;
  --background-color: #f1faee;
  --surface-color: #ffffff;
  --text-color: #1d3557;
  --text-secondary: #6c757d;
  --border-color: #dee2e6;
  --font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --heading-font: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --spacing-unit: 8px;
  --border-radius: 8px;`,

  blog: `  --primary-color: #2d6a4f;
  --secondary-color: #52b788;
  --accent-color: #b7e4c7;
  --background-color: #f8f9fa;
  --surface-color: #ffffff;
  --text-color: #212529;
  --text-secondary: #6c757d;
  --border-color: #dee2e6;
  --font-family: 'Georgia', 'Times New Roman', serif;
  --heading-font: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --spacing-unit: 8px;
  --border-radius: 4px;`,

  dashboard: `  --primary-color: #4361ee;
  --secondary-color: #3a0ca3;
  --accent-color: #f72585;
  --background-color: #f0f1f3;
  --surface-color: #ffffff;
  --text-color: #212529;
  --text-secondary: #6c757d;
  --border-color: #dee2e6;
  --font-family: 'Inter', 'Segoe UI', Roboto, sans-serif;
  --heading-font: 'Inter', 'Segoe UI', Roboto, sans-serif;
  --spacing-unit: 8px;
  --border-radius: 6px;`,

  portfolio: `  --primary-color: #6c63ff;
  --secondary-color: #3f3d56;
  --accent-color: #ff6584;
  --background-color: #fafafa;
  --surface-color: #ffffff;
  --text-color: #2f2e41;
  --text-secondary: #6c757d;
  --border-color: #e0e0e0;
  --font-family: 'Helvetica Neue', Arial, sans-serif;
  --heading-font: 'Helvetica Neue', Arial, sans-serif;
  --spacing-unit: 8px;
  --border-radius: 12px;`,
};

/** Fallback color scheme for unknown application types */
const DEFAULT_COLOR_SCHEME = `  --primary-color: #0d6efd;
  --secondary-color: #6c757d;
  --accent-color: #ffc107;
  --background-color: #f8f9fa;
  --surface-color: #ffffff;
  --text-color: #212529;
  --text-secondary: #6c757d;
  --border-color: #dee2e6;
  --font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --heading-font: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --spacing-unit: 8px;
  --border-radius: 8px;`;

/**
 * Build the shared theme CSS variables section based on the application type.
 *
 * @param appType - The application type (e.g. "ecommerce", "blog")
 * @returns A formatted string containing the :root CSS variable block
 */
export function buildThemeSection(appType: string): string {
  const scheme = COLOR_SCHEMES[appType] || DEFAULT_COLOR_SCHEME;
  return `:root {
${scheme}
}`;
}

/**
 * Build the navigation structure section listing all pages.
 * Each page is represented as a link with a `data-page-target` attribute.
 *
 * @param pages - All pages in the application
 * @returns A formatted string describing the navigation structure
 */
export function buildNavigationSection(pages: PageSpec[]): string {
  const navItems = pages
    .map(p => `  <a href="#" data-page-target="${p.name}">${p.role || p.name}</a>`)
    .join('\n');

  return `<nav>
${navItems}
</nav>`;
}

/**
 * Build the navigation rules section with comprehensive guidance on using data-page-target.
 * 
 * This function generates detailed instructions for the AI to ensure all navigation elements
 * include the data-page-target attribute. This is the core of the navigation enhancement
 * strategy - by providing explicit, detailed instructions in the AI prompt, we ensure the
 * AI generates HTML with proper navigation attributes from the start, reducing the need
 * for post-processing or fallback mechanisms.
 * 
 * The generated section includes:
 * 
 * 1. **Mandatory Rules Declaration**: Emphasizes that data-page-target is REQUIRED for
 *    all inter-page navigation elements
 * 
 * 2. **Element Type Checklist**: Lists all element types that need navigation attributes:
 *    - Navigation bar links
 *    - Call-to-action (CTA) buttons
 *    - Product cards
 *    - List item links
 *    - Breadcrumb navigation
 *    - Footer links
 * 
 * 3. **Concrete HTML Examples**: For each page in the current page's linksTo array,
 *    generates at least two different element type examples (link, button, card) showing
 *    the correct usage of data-page-target. This helps the AI understand the pattern
 *    across different HTML structures.
 * 
 * 4. **Anti-Pattern Examples**: Shows side-by-side comparisons of WRONG (using file paths
 *    like "products.html") vs. CORRECT (using data-page-target) approaches. This helps
 *    the AI avoid common mistakes.
 * 
 * 5. **CRITICAL Constraint Declaration**: A prominent warning that navigation elements
 *    without data-page-target will NOT work, emphasizing the importance of this requirement.
 * 
 * Design Rationale:
 * - Source-first approach: Fix navigation at generation time, not post-processing
 * - Multiple examples: Helps AI generalize the pattern to different contexts
 * - Explicit constraints: Reduces ambiguity and improves AI compliance
 * - Visual emphasis: Uses markdown formatting (bold, code blocks) to highlight key points
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 *
 * @param page - The current page specification with linksTo targets
 * @param pages - All pages in the application (used to get display names for targets)
 * @returns A formatted markdown string containing comprehensive navigation rules
 * 
 * @example
 * ```typescript
 * const page: PageSpec = {
 *   name: 'home',
 *   role: '首页',
 *   linksTo: ['products', 'about'],
 *   order: 0
 * };
 * const pages: PageSpec[] = [
 *   page,
 *   { name: 'products', role: '产品列表', linksTo: [], order: 1 },
 *   { name: 'about', role: '关于我们', linksTo: [], order: 2 }
 * ];
 * 
 * const rules = buildNavigationRules(page, pages);
 * // Returns a comprehensive markdown section with:
 * // - Element type checklist
 * // - Examples for "products" and "about" pages
 * // - Anti-pattern comparisons
 * // - Critical constraint warning
 * ```
 */
export function buildNavigationRules(page: PageSpec, pages: PageSpec[]): string {
  console.debug('[buildNavigationRules] Generating navigation rules', { 
    pageName: page.name,
    linksToCount: page.linksTo.length,
    linksTo: page.linksTo
  });

  // Element types that require data-page-target
  const elementTypes = [
    'Navigation bar links',
    'Call-to-action (CTA) buttons',
    'Product cards',
    'List item links',
    'Breadcrumb navigation',
    'Footer links',
  ];

  const elementTypesList = elementTypes.map(type => `- ${type}`).join('\n');

  // Generate HTML examples for each linksTo target
  let examplesSection = '';
  if (page.linksTo.length > 0) {
    const examples = page.linksTo.map(target => {
      const targetPage = pages.find(p => p.name === target);
      const displayName = targetPage?.role || target;
      
      return `**For page "${target}" (${displayName}):**

\`\`\`html
<!-- Example 1: Link element -->
<a href="#" data-page-target="${target}">${displayName}</a>

<!-- Example 2: Button element -->
<button data-page-target="${target}">${displayName}</button>

<!-- Example 3: Card with nested content -->
<div class="card" data-page-target="${target}">
  <h3>${displayName}</h3>
  <p>Click anywhere on this card to navigate</p>
</div>
\`\`\``;
    }).join('\n\n');

    examplesSection = `\n\n### HTML Examples for This Page's Link Targets

${examples}`;
  }

  // Anti-pattern examples
  const antiPatternSection = `\n\n### ❌ WRONG vs. ✅ CORRECT Examples

**WRONG - Do NOT use file paths or relative URLs:**
\`\`\`html
<!-- ❌ WRONG: Using file path -->
<a href="products.html">Products</a>

<!-- ❌ WRONG: Using relative path -->
<a href="/products">Products</a>

<!-- ❌ WRONG: Missing data-page-target -->
<button onclick="goToProducts()">Products</button>
\`\`\`

**CORRECT - Always use data-page-target:**
\`\`\`html
<!-- ✅ CORRECT: Link with data-page-target -->
<a href="#" data-page-target="products">Products</a>

<!-- ✅ CORRECT: Button with data-page-target -->
<button data-page-target="products">Products</button>

<!-- ✅ CORRECT: Any element with data-page-target -->
<div class="product-card" data-page-target="product-detail">
  <img src="..." alt="Product">
  <h3>Product Name</h3>
</div>
\`\`\``;

  const result = `## Navigation Rules (MANDATORY)

**CRITICAL REQUIREMENT**: All inter-page navigation elements MUST use the \`data-page-target\` attribute with the exact target page name. Navigation elements without this attribute will NOT work.

### Element Types Requiring data-page-target

The following element types MUST include \`data-page-target\` when they navigate to another page:

${elementTypesList}

### Usage Rules

1. **Mandatory Attribute**: Every clickable element that navigates to another page MUST have \`data-page-target="page-name"\`
2. **Exact Page Names**: The attribute value must be the exact page name (e.g., "products", "cart", "home")
3. **Link href Values**: For \`<a>\` tags, set \`href="#"\` — do NOT use file paths like "products.html" or relative paths like "/products"
4. **Any Element Type**: You can use \`data-page-target\` on any HTML element (links, buttons, divs, cards, etc.)${examplesSection}${antiPatternSection}

### 🚨 CRITICAL CONSTRAINT

**Every clickable inter-page navigation element MUST include the \`data-page-target\` attribute with the exact target page name. Elements without this attribute will not function correctly in the application.**`;

  console.debug('[buildNavigationRules] Navigation rules generated', { 
    pageName: page.name,
    rulesLength: result.length,
    hasExamples: !!examplesSection
  });

  return result;
}

/**
 * Build a prompt for a single page that includes all shared context
 * needed for the AI to generate a visually consistent, self-contained HTML page.
 *
 * The prompt includes:
 * - Page role, application name, and application type (Req 1.1)
 * - Shared theme CSS variables based on appType (Req 1.2)
 * - Navigation structure for all pages with data-page-target (Req 1.3)
 * - The page's linksTo targets (Req 1.4)
 * - Design system specifications if present (Req 1.5)
 * - Instruction to return self-contained HTML with inline CSS/JS (Req 1.6)
 *
 * @param page - The page specification to generate a prompt for
 * @param appContext - The full application context
 * @returns A formatted prompt string for AI generation
 *
 * @example
 * ```typescript
 * const page: PageSpec = { name: 'home', role: '首页', linksTo: ['products', 'about'], order: 0 };
 * const ctx: AppContext = {
 *   appName: '电商网站',
 *   appType: 'ecommerce',
 *   pages: [page, { name: 'products', role: '产品列表', linksTo: ['home'], order: 1 }],
 *   originalPrompt: '生成电商网站',
 * };
 * const prompt = buildPerPagePrompt(page, ctx);
 * ```
 */
export function buildPerPagePrompt(page: PageSpec, appContext: AppContext): string {
  console.debug('[buildPerPagePrompt] Starting prompt generation', { 
    pageName: page.name, 
    pageRole: page.role,
    appName: appContext.appName,
    appType: appContext.appType,
    linksToCount: page.linksTo.length
  });

  const { appName, appType, pages, designSystem } = appContext;

  // --- Section 1: Page identity & application context (Req 1.1) ---
  const identitySection = `# Page Generation Task

## Application Context
- **Application Name**: ${appName}
- **Application Type**: ${appType}

## Current Page
- **Page Name**: ${page.name}
- **Page Role**: ${page.role}`;

  // --- Section 2: Shared theme CSS variables (Req 1.2) ---
  const themeCSS = buildThemeSection(appType);
  const themeSection = `## Shared Theme (CSS Variables)

Use the following CSS variables in your styles to ensure visual consistency with other pages of this application:

\`\`\`css
${themeCSS}
\`\`\`

You MUST include these CSS variables in a \`<style>\` tag inside the HTML and use them throughout your styles.`;

  // --- Section 3: Navigation structure for all pages (Req 1.3) ---
  const navigationHTML = buildNavigationSection(pages);
  const navigationSection = `## Navigation Structure

Include the following navigation structure in the page header so users can navigate between all pages. Each link MUST use the \`data-page-target\` attribute with the exact page name:

\`\`\`html
${navigationHTML}
\`\`\`

All navigation links must use the \`data-page-target\` attribute. Example: \`<a href="#" data-page-target="home">Home</a>\``;

  // --- Section 3.5: Navigation rules (Req 1.1, 1.2, 1.3, 1.4, 1.5) ---
  const navigationRulesSection = buildNavigationRules(page, pages);

  // --- Section 4: linksTo targets (Req 1.4) ---
  let linksToSection = '';
  if (page.linksTo.length > 0) {
    const linksList = page.linksTo
      .map(target => `- \`${target}\` (use \`data-page-target="${target}"\`)`)
      .join('\n');
    linksToSection = `\n\n## Page Link Targets

In addition to the shared navigation, this page's content MUST include contextual links to the following pages:

${linksList}

Integrate these links naturally into the page content (e.g., call-to-action buttons, content cards, or inline links).`;
  }

  // --- Section 5: Design system (Req 1.5) ---
  let designSystemSection = '';
  if (designSystem) {
    designSystemSection = `\n\n## Design System

Use the **${designSystem}** design system for this page. Follow ${designSystem}'s component patterns, utility classes, and design conventions. Ensure all UI elements conform to ${designSystem}'s specifications.`;
  }

  // --- Section 6: Self-contained HTML requirement (Req 1.6) ---
  const outputSection = `## Output Requirements

Generate a **self-contained HTML document** for this page. The output MUST:

1. Be a complete HTML document starting with \`<!DOCTYPE html>\`
2. Include ALL CSS in inline \`<style>\` tags within the \`<head>\` — do NOT use external stylesheets
3. Include ALL JavaScript in inline \`<script>\` tags — do NOT use external script files
4. Include the shared theme CSS variables defined above
5. Include the navigation structure with \`data-page-target\` attributes
6. Be fully functional and visually complete as a standalone page
7. Use responsive design principles
8. **CRITICAL**: Every clickable inter-page navigation element MUST include the \`data-page-target\` attribute with the exact target page name. Navigation elements without this attribute will NOT work.

Return ONLY the HTML document. Do not wrap it in code fences or add any explanation.`;

  // --- Assemble the full prompt ---
  const fullPrompt = [
    identitySection,
    themeSection,
    navigationSection,
    navigationRulesSection,
    linksToSection,
    designSystemSection,
    outputSection,
  ]
    .filter(Boolean)
    .join('\n\n');

  console.debug('[buildPerPagePrompt] Prompt generation complete', { 
    pageName: page.name,
    promptLength: fullPrompt.length,
    sections: {
      hasIdentity: !!identitySection,
      hasTheme: !!themeSection,
      hasNavigation: !!navigationSection,
      hasNavigationRules: !!navigationRulesSection,
      hasLinksTo: !!linksToSection,
      hasDesignSystem: !!designSystemSection,
      hasOutput: !!outputSection
    }
  });

  return fullPrompt;
}

/**
 * Extract CSS and JS sections from a self-contained HTML document.
 *
 * This function parses raw HTML to separate out the CSS (from `<style>` tags)
 * and JavaScript (from inline `<script>` tags without a `src` attribute).
 * The original HTML is returned unchanged in the `html` field.
 *
 * Requirements: 2.4, 2.5
 *
 * @param rawHtml - The complete self-contained HTML document
 * @returns An object with `html` (original unchanged), `css` (merged style contents),
 *          and `js` (merged inline script contents)
 *
 * @example
 * ```typescript
 * const result = extractHtmlSections(`
 *   <!DOCTYPE html>
 *   <html>
 *   <head>
 *     <style>body { color: red; }</style>
 *     <style>.header { font-size: 16px; }</style>
 *   </head>
 *   <body>
 *     <script>console.log("hello");</script>
 *     <script src="external.js"></script>
 *   </body>
 *   </html>
 * `);
 * // result.html === original rawHtml (unchanged)
 * // result.css === 'body { color: red; }\n.header { font-size: 16px; }'
 * // result.js === 'console.log("hello");'
 * ```
 */
export function extractHtmlSections(rawHtml: string): { html: string; css: string; js: string } {
  // Extract all <style> tag contents and merge them
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const cssBlocks: string[] = [];
  let styleMatch: RegExpExecArray | null;
  while ((styleMatch = styleRegex.exec(rawHtml)) !== null) {
    const content = styleMatch[1].trim();
    if (content) {
      cssBlocks.push(content);
    }
  }

  // Extract all inline <script> tag contents (exclude those with src attribute)
  // Matches <script> or <script type="...">, but NOT <script src="...">
  const scriptRegex = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
  const jsBlocks: string[] = [];
  let scriptMatch: RegExpExecArray | null;
  while ((scriptMatch = scriptRegex.exec(rawHtml)) !== null) {
    const content = scriptMatch[1].trim();
    if (content) {
      jsBlocks.push(content);
    }
  }

  return {
    html: rawHtml,
    css: cssBlocks.join('\n'),
    js: jsBlocks.join('\n'),
  };
}

