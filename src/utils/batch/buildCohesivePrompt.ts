/**
 * AI prompt builder for cohesive multi-page generation
 * Feature: batch-html-redesign
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import type { AppContext } from '../../types';

/**
 * Build a comprehensive AI prompt for generating cohesive multi-page applications
 * 
 * The prompt instructs the AI to:
 * - Generate all pages in a single response
 * - Create a unified shared theme (CSS variables)
 * - Create shared navigation components (header/footer)
 * - Include inter-page links based on PageSpec.linksTo
 * - Return results in structured JSON format
 * 
 * @param appContext - Complete application context with pages and relationships
 * @returns Formatted prompt string for AI generation
 * 
 * @example
 * ```typescript
 * const context: AppContext = {
 *   appName: '电商网站',
 *   appType: 'ecommerce',
 *   pages: [
 *     { name: 'home', role: '首页', linksTo: ['products', 'cart'], order: 0 },
 *     { name: 'products', role: '产品列表', linksTo: ['home', 'product-detail'], order: 1 },
 *   ],
 *   originalPrompt: '生成电商网站',
 * };
 * 
 * const prompt = buildCohesivePrompt(context);
 * // Returns a comprehensive prompt with all requirements
 * ```
 * 
 * Requirements:
 * - 6.1: Include complete App_Context (app name, type, all pages and roles)
 * - 6.2: Explicitly require unified Shared_Theme and Shared_Navigation
 * - 6.3: Specify Inter_Page_Link targets for each page
 * - 6.4: Require structured format (JSON with sharedTheme, sharedNavigation, pages)
 * - 6.5: Include Design_System specifications when provided
 */
export function buildCohesivePrompt(appContext: AppContext): string {
  const {
    appName,
    appType,
    pages,
    originalPrompt,
    designSystem,
  } = appContext;

  // Build page descriptions with link targets
  const pageDescriptions = pages.map(page => {
    const linkTargets = page.linksTo.length > 0
      ? ` This page should link to: ${page.linksTo.join(', ')}.`
      : '';
    return `- **${page.name}** (${page.role})${linkTargets}`;
  }).join('\n');

  // Build design system section if specified
  const designSystemSection = designSystem
    ? `\n\n## Design System\n\nUse **${designSystem}** for all pages. Follow ${designSystem}'s component patterns, utility classes, and design tokens consistently across all pages.`
    : '';

  // Build the comprehensive prompt
  const prompt = `# Multi-Page Web Application Generation

You are tasked with generating a complete, cohesive multi-page web application with consistent design and navigation.

## Application Overview

- **Application Name**: ${appName}
- **Application Type**: ${appType}
- **User Request**: ${originalPrompt}

## Pages to Generate

${pageDescriptions}

## Requirements

### 1. Shared Theme
Create a unified CSS theme that will be used across ALL pages. The shared theme must include:
- CSS custom properties (variables) for colors, fonts, spacing, etc.
- At minimum, define: \`--primary-color\`, \`--secondary-color\`, \`--background-color\`, \`--text-color\`, \`--font-family\`, \`--spacing-unit\`
- Common base styles (body, headings, links, buttons)
- Responsive design utilities

### 2. Shared Navigation
Create consistent navigation components that will appear on ALL pages:
- **Header**: A navigation bar with links to all pages. Use \`data-page-target="page-name"\` attribute for inter-page links.
- **Footer**: A footer with site information and links to key pages.

### 3. Inter-Page Links
For each page, include navigation links to the specified target pages using the \`data-page-target\` attribute:
- Example: \`<a href="#" data-page-target="products">Products</a>\`
- The \`data-page-target\` value must match the page name exactly
- Include these links in the shared navigation AND in page-specific content where appropriate

### 4. Page-Specific Content
For each page, generate:
- Complete HTML structure (<!DOCTYPE html>, <html>, <head>, <body>)
- Page-specific content that fulfills the page's role
- Page-specific CSS (in addition to the shared theme)
- Page-specific JavaScript if needed for interactivity

### 5. Design Consistency
Ensure all pages:
- Use the same shared theme CSS variables
- Have the same navigation structure
- Follow the same layout patterns
- Maintain visual consistency (typography, spacing, colors)${designSystemSection}

## Output Format

Return your response as a JSON object with the following structure:

\`\`\`json
{
  "appName": "${appName}",
  "sharedTheme": "/* CSS with :root variables and common styles */",
  "sharedNavigation": {
    "header": "<!-- Header HTML with data-page-target links -->",
    "footer": "<!-- Footer HTML -->"
  },
  "pages": [
    {
      "name": "page-name",
      "html": "<!DOCTYPE html>...",
      "css": "/* Page-specific styles */",
      "js": "// Page-specific scripts (optional)"
    }
  ]
}
\`\`\`

## Important Notes

1. The \`sharedTheme\` CSS will be automatically injected into each page's styles
2. The \`sharedNavigation\` components should be referenced or included in each page's HTML
3. All inter-page links MUST use the \`data-page-target\` attribute with the exact page name
4. Generate complete, production-ready HTML/CSS/JS for each page
5. Ensure the JSON is valid and properly escaped
6. Each page should be fully functional and visually complete

Generate the complete multi-page application now.`;

  return prompt;
}
