/**
 * Static Project Assembler
 * Feature: export-deployable-project
 * Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.2
 * 
 * Assembles a pure static HTML/CSS/JS project with SPA architecture.
 * All pages are embedded in a single index.html with hash-based routing.
 */

import type { ProcessedPage, MockGenerationResult } from '../../types';
import { generateRouterScript } from './routerScript';

/**
 * Assemble a static HTML project from processed pages
 * 
 * Generates a deployable static project with:
 * - Single index.html containing all pages (SPA architecture)
 * - Shared CSS file (if any common styles exist)
 * - Hash-based client-side routing (for multi-page projects)
 * - Mock data files and interceptor (if API calls detected)
 * - README.md with deployment instructions
 * 
 * @param pages - Array of processed pages with HTML/CSS/JS content
 * @param sharedCSS - Common CSS extracted from multiple pages
 * @param pageCSS - Page-specific CSS (page name -> CSS content)
 * @param deps - Design system CDN dependencies
 * @param mockResult - Mock data generation result (optional)
 * @param appName - Application name for the project
 * @returns Map of file paths to file contents
 * 
 * Requirements:
 * - 1.1: Generate project structure with index.html
 * - 1.2: Single page generates simplified structure (no routing)
 * - 1.3: First page is default route target
 * - 1.4: All pages embedded in index.html with routing logic
 * - 6.1: Default export as pure static HTML/CSS/JS
 * - 6.2: No build dependencies (zero npm install required)
 */
export function assembleStaticProject(
  pages: ProcessedPage[],
  sharedCSS: string,
  pageCSS: Map<string, string>,
  deps: { stylesheets: string[]; scripts: string[] },
  mockResult: MockGenerationResult,
  appName: string
): Map<string, string> {
  const files = new Map<string, string>();

  // Requirement 1.2: Single page simplified structure
  const isSinglePage = pages.length === 1;

  // Generate index.html
  const indexHtml = generateIndexHtml(
    pages,
    sharedCSS,
    pageCSS,
    deps,
    mockResult,
    appName,
    isSinglePage
  );
  files.set('index.html', indexHtml);

  // Add shared CSS file if there's any shared CSS
  if (sharedCSS.trim()) {
    files.set('css/shared.css', sharedCSS);
  }

  // Add mock files if any API calls were detected
  if (mockResult.mockFiles.size > 0) {
    // Add interceptor script
    files.set('mock/interceptor.js', mockResult.interceptScript);

    // Add mock data files
    for (const [filePath, content] of mockResult.mockFiles.entries()) {
      files.set(filePath, content);
    }
  }

  // Generate README.md with deployment instructions
  const readme = generateReadme(appName, isSinglePage, mockResult.mockFiles.size > 0);
  files.set('README.md', readme);

  return files;
}

/**
 * Generate the main index.html file
 * 
 * For multi-page projects: SPA architecture with all pages embedded as hidden divs
 * For single-page projects: Simplified structure with just the page content
 * 
 * @param pages - Array of processed pages
 * @param sharedCSS - Shared CSS content
 * @param pageCSS - Page-specific CSS map
 * @param deps - CDN dependencies
 * @param mockResult - Mock generation result
 * @param appName - Application name
 * @param isSinglePage - Whether this is a single-page project
 * @returns Complete index.html content
 */
function generateIndexHtml(
  pages: ProcessedPage[],
  sharedCSS: string,
  pageCSS: Map<string, string>,
  deps: { stylesheets: string[]; scripts: string[] },
  mockResult: MockGenerationResult,
  appName: string,
  isSinglePage: boolean
): string {
  // Requirement 1.3: First page is default
  const defaultPage = pages[0].name;

  // Build head section with CDN dependencies
  const headContent = buildHeadSection(
    appName,
    sharedCSS,
    deps,
    mockResult.mockFiles.size > 0
  );

  // Build body content based on single/multi-page
  let bodyContent: string;
  if (isSinglePage) {
    // Requirement 1.2: Simplified single-page structure
    bodyContent = buildSinglePageBody(pages[0], pageCSS);
  } else {
    // Requirement 1.4: Multi-page SPA with routing
    bodyContent = buildMultiPageBody(pages, pageCSS, defaultPage);
  }

  return `<!DOCTYPE html>
<html lang="en">
${headContent}
${bodyContent}
</html>`;
}

/**
 * Build the <head> section with all dependencies
 * 
 * @param appName - Application name
 * @param sharedCSS - Shared CSS content
 * @param deps - CDN dependencies
 * @param hasMockData - Whether mock data is included
 * @returns HTML head section
 */
function buildHeadSection(
  appName: string,
  sharedCSS: string,
  deps: { stylesheets: string[]; scripts: string[] },
  hasMockData: boolean
): string {
  const parts: string[] = [];

  parts.push('<head>');
  parts.push('  <meta charset="UTF-8">');
  parts.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
  parts.push(`  <title>${escapeHtml(appName)}</title>`);

  // Add design system CDN stylesheets
  for (const stylesheet of deps.stylesheets) {
    parts.push(`  <link rel="stylesheet" href="${escapeHtml(stylesheet)}">`);
  }

  // Add shared CSS if exists
  if (sharedCSS.trim()) {
    parts.push('  <link rel="stylesheet" href="css/shared.css">');
  }

  // Add design system CDN scripts
  for (const script of deps.scripts) {
    parts.push(`  <script src="${escapeHtml(script)}"></script>`);
  }

  // Add mock interceptor if mock data exists
  if (hasMockData) {
    parts.push('  <script src="mock/interceptor.js"></script>');
  }

  parts.push('</head>');

  return parts.join('\n');
}

/**
 * Build body content for single-page projects
 * 
 * Simple structure: just the page content with inline styles and scripts
 * 
 * @param page - The single page
 * @param pageCSS - Page-specific CSS map
 * @returns HTML body section
 */
function buildSinglePageBody(
  page: ProcessedPage,
  pageCSS: Map<string, string>
): string {
  const parts: string[] = [];

  parts.push('<body>');

  // Add page-specific CSS if exists
  const pageCss = pageCSS.get(page.name);
  if (pageCss && pageCss.trim()) {
    parts.push('  <style>');
    parts.push(indentText(pageCss, 4));
    parts.push('  </style>');
  }

  // Add page HTML content
  parts.push('');
  parts.push(indentText(page.html, 2));
  parts.push('');

  // Add page-specific JavaScript if exists
  if (page.js && page.js.trim()) {
    parts.push('  <script>');
    parts.push(indentText(page.js, 4));
    parts.push('  </script>');
  }

  parts.push('</body>');

  return parts.join('\n');
}

/**
 * Build body content for multi-page projects (SPA architecture)
 * 
 * All pages embedded as hidden divs, controlled by router script
 * 
 * @param pages - Array of all pages
 * @param pageCSS - Page-specific CSS map
 * @param defaultPage - Default page name
 * @returns HTML body section
 */
function buildMultiPageBody(
  pages: ProcessedPage[],
  pageCSS: Map<string, string>,
  defaultPage: string
): string {
  const parts: string[] = [];

  parts.push('<body>');

  // Add page-specific CSS for all pages
  const allPageCSS = Array.from(pageCSS.entries())
    .map(([pageName, css]) => {
      if (!css || !css.trim()) return '';
      return `    /* Page: ${pageName} */\n${indentText(css, 4)}`;
    })
    .filter(Boolean)
    .join('\n\n');

  if (allPageCSS) {
    parts.push('  <style>');
    parts.push(allPageCSS);
    parts.push('  </style>');
  }

  // Add page containers (all hidden by default, router will show the active one)
  parts.push('');
  parts.push('  <!-- Page containers -->');
  for (const page of pages) {
    const isDefault = page.name === defaultPage;
    const displayStyle = isDefault ? 'block' : 'none';
    
    parts.push(`  <div id="page-${escapeHtml(page.name)}" class="page-container" style="display: ${displayStyle};">`);
    parts.push(indentText(page.html, 4));
    parts.push('  </div>');
    parts.push('');
  }

  // Add page-specific JavaScript for all pages
  const hasAnyJS = pages.some(page => page.js && page.js.trim());
  if (hasAnyJS) {
    parts.push('  <script>');
    for (const page of pages) {
      if (page.js && page.js.trim()) {
        parts.push(`    // Page: ${page.name}`);
        parts.push(indentText(page.js, 4));
        parts.push('');
      }
    }
    parts.push('  </script>');
  }

  // Add router script for multi-page navigation
  const pageNames = pages.map(p => p.name);
  const routerScript = generateRouterScript(pageNames, defaultPage);
  parts.push('');
  parts.push('  <script>');
  parts.push(indentText(routerScript, 4));
  parts.push('  </script>');

  parts.push('</body>');

  return parts.join('\n');
}

/**
 * Generate README.md with deployment instructions
 * 
 * @param appName - Application name
 * @param isSinglePage - Whether this is a single-page project
 * @param hasMockData - Whether mock data is included
 * @returns README.md content
 */
function generateReadme(
  appName: string,
  isSinglePage: boolean,
  hasMockData: boolean
): string {
  const parts: string[] = [];

  parts.push(`# ${appName}`);
  parts.push('');
  parts.push('This is a static HTML/CSS/JavaScript project generated by the AI-driven HTML Visual Editor.');
  parts.push('');

  // Project structure
  parts.push('## Project Structure');
  parts.push('');
  parts.push('```');
  parts.push('project/');
  parts.push('├── index.html          # Main entry point');
  if (!isSinglePage) {
    parts.push('│                       # (Contains all pages with hash-based routing)');
  }
  parts.push('├── css/');
  parts.push('│   └── shared.css      # Shared styles across pages');
  if (hasMockData) {
    parts.push('├── mock/               # Mock API data');
    parts.push('│   ├── interceptor.js  # Fetch interceptor script');
    parts.push('│   └── api/            # Mock JSON data files');
  }
  parts.push('└── README.md           # This file');
  parts.push('```');
  parts.push('');

  // Deployment instructions
  parts.push('## Deployment');
  parts.push('');
  parts.push('This project requires **no build step** and can be deployed directly to any static hosting platform:');
  parts.push('');
  parts.push('### Option 1: Local Testing');
  parts.push('');
  parts.push('Simply open `index.html` in your web browser:');
  parts.push('');
  parts.push('```bash');
  parts.push('# Using Python (Python 3)');
  parts.push('python -m http.server 8000');
  parts.push('');
  parts.push('# Using Node.js (npx)');
  parts.push('npx serve');
  parts.push('');
  parts.push('# Using PHP');
  parts.push('php -S localhost:8000');
  parts.push('```');
  parts.push('');
  parts.push('Then open http://localhost:8000 in your browser.');
  parts.push('');

  parts.push('### Option 2: Deploy to Netlify');
  parts.push('');
  parts.push('1. Drag and drop the entire project folder to [Netlify Drop](https://app.netlify.com/drop)');
  parts.push('2. Your site will be live instantly with a unique URL');
  parts.push('');

  parts.push('### Option 3: Deploy to Vercel');
  parts.push('');
  parts.push('```bash');
  parts.push('# Install Vercel CLI (one-time)');
  parts.push('npm install -g vercel');
  parts.push('');
  parts.push('# Deploy');
  parts.push('vercel');
  parts.push('```');
  parts.push('');

  parts.push('### Option 4: Deploy to GitHub Pages');
  parts.push('');
  parts.push('1. Create a new GitHub repository');
  parts.push('2. Push this project to the repository');
  parts.push('3. Go to Settings → Pages');
  parts.push('4. Select the branch and root folder');
  parts.push('5. Your site will be live at `https://username.github.io/repository-name`');
  parts.push('');

  // Navigation info for multi-page
  if (!isSinglePage) {
    parts.push('## Navigation');
    parts.push('');
    parts.push('This is a Single Page Application (SPA) using hash-based routing:');
    parts.push('');
    parts.push('- All pages are embedded in `index.html`');
    parts.push('- Navigation uses URL hashes (e.g., `#/home`, `#/products`)');
    parts.push('- No server-side routing required');
    parts.push('- Browser back/forward buttons work correctly');
    parts.push('');
  }

  // Mock data info
  if (hasMockData) {
    parts.push('## Mock API Data');
    parts.push('');
    parts.push('This project includes mock API data for development and demonstration:');
    parts.push('');
    parts.push('- `mock/interceptor.js` intercepts fetch() calls and redirects them to local JSON files');
    parts.push('- Mock data files are in the `mock/` directory');
    parts.push('- To use real APIs, remove the interceptor script from `index.html`');
    parts.push('');
  }

  // Features
  parts.push('## Features');
  parts.push('');
  parts.push('- ✅ Zero dependencies - no npm install required');
  parts.push('- ✅ Works offline - all resources are self-contained');
  parts.push('- ✅ Fast loading - optimized static files');
  parts.push('- ✅ SEO-friendly - standard HTML structure');
  if (!isSinglePage) {
    parts.push('- ✅ Client-side routing - smooth page transitions');
  }
  if (hasMockData) {
    parts.push('- ✅ Mock API data - works without backend');
  }
  parts.push('');

  parts.push('## Customization');
  parts.push('');
  parts.push('Feel free to modify the HTML, CSS, and JavaScript files to customize your project:');
  parts.push('');
  parts.push('- Edit `index.html` to change page content');
  parts.push('- Edit `css/shared.css` to modify shared styles');
  if (hasMockData) {
    parts.push('- Edit files in `mock/` to change mock API responses');
  }
  parts.push('');

  parts.push('---');
  parts.push('');
  parts.push('Generated by [AI-driven HTML Visual Editor](https://github.com/yourusername/your-repo)');

  return parts.join('\n');
}

/**
 * Escape HTML special characters
 * 
 * @param text - Text to escape
 * @returns Escaped text
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Indent text by a specified number of spaces
 * 
 * @param text - Text to indent
 * @param spaces - Number of spaces to indent
 * @returns Indented text
 */
function indentText(text: string, spaces: number): string {
  const indent = ' '.repeat(spaces);
  return text
    .split('\n')
    .map(line => line ? indent + line : line)
    .join('\n');
}
