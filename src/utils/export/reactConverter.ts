/**
 * React Project Converter
 * Feature: export-deployable-project
 * Requirements: 6.3, 6.5
 * 
 * Converts processed pages into a React project structure with:
 * - React function components for each page
 * - React Router for navigation
 * - Direct JSX generation for clean React code
 * - useEffect for JavaScript execution
 */

import React from 'react';
import type { ProcessedPage, MockGenerationResult } from '../../types';

/**
 * Assemble a React project from processed pages
 * 
 * Generates a deployable React project with:
 * - package.json with React dependencies including html-to-react
 * - src/pages/ directory with React components for each page
 * - src/styles/ directory with CSS files for each page
 * - src/App.jsx with React Router configuration
 * - src/index.jsx entry point
 * - src/styles/shared.css for common styles
 * - public/index.html template with global styles and link stylesheets
 * - README.md with installation and startup instructions
 * 
 * Each page is converted to a React function component that:
 * - Uses html-to-react Parser to convert HTML to React elements
 * - Uses custom ProcessingInstructions to convert internal links to Link components
 * - Imports page-specific CSS from separate file
 * - Executes page-specific JS via useEffect hook
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
 * - 1.1, 1.2: Use html-to-react for HTML conversion
 * - 2.1: Generate separate CSS files for each page
 * - 2.4: Extract and include link stylesheets in index.html
 * - 5.1, 5.2: Maintain function signature and file structure
 */
export function assembleReactProject(
  pages: ProcessedPage[],
  sharedCSS: string,
  pageCSS: Map<string, string>,
  deps: { stylesheets: string[]; scripts: string[] },
  mockResult: MockGenerationResult,
  appName: string
): Map<string, string> {
  const files = new Map<string, string>();
  const allLinkStylesheets: string[] = [];

  // Generate package.json with html-to-react dependency
  const packageJson = generatePackageJson(appName);
  files.set('package.json', packageJson);

  // Generate page components and CSS files
  for (const page of pages) {
    const componentName = toComponentName(page.name);
    
    // Extract link stylesheets from page HTML
    const { stylesheetUrls } = extractLinkStylesheets(page.html);
    allLinkStylesheets.push(...stylesheetUrls);
    
    // Extract CSS from <style> tags in page HTML
    const { extractedCSS } = extractStyleTags(page.html);
    
    // Combine page CSS: pageCSS (from cssExtractor) + extractedCSS (from <style> tags)
    const pageCssFromMap = pageCSS.get(page.name) || '';
    const combinedPageCSS = [pageCssFromMap, extractedCSS]
      .filter(css => css && css.trim())
      .join('\n\n');
    
    // Generate page component code
    const componentCode = generatePageComponent(
      page,
      componentName,
      combinedPageCSS
    );
    files.set(`src/pages/${componentName}.jsx`, componentCode);
    
    // Generate separate CSS file for this page if it has CSS
    if (combinedPageCSS.trim()) {
      files.set(`src/styles/${componentName}.css`, combinedPageCSS);
    }
  }

  // Generate App.jsx with routing
  const appCode = generateAppComponent(pages);
  files.set('src/App.jsx', appCode);

  // Generate index.jsx entry point
  const indexCode = generateIndexEntry();
  files.set('src/index.jsx', indexCode);

  // Generate shared CSS if exists
  if (sharedCSS.trim()) {
    files.set('src/styles/shared.css', sharedCSS);
  }

  // Generate public/index.html template with link stylesheets
  const indexHtml = generatePublicIndexHtml(appName, deps, allLinkStylesheets);
  files.set('public/index.html', indexHtml);

  // Add mock files if any API calls were detected
  if (mockResult.mockFiles.size > 0) {
    // Add interceptor script to public directory
    files.set('public/mock/interceptor.js', mockResult.interceptScript);

    // Add mock data files
    for (const [filePath, content] of mockResult.mockFiles.entries()) {
      // Adjust path to be relative to public directory
      const publicPath = filePath.startsWith('mock/') 
        ? `public/${filePath}` 
        : `public/mock/${filePath}`;
      files.set(publicPath, content);
    }
  }

  // Generate README.md
  const readme = generateReadme(appName, mockResult.mockFiles.size > 0);
  files.set('README.md', readme);

  // Generate .gitignore
  const gitignore = generateGitignore();
  files.set('.gitignore', gitignore);

  return files;
}

/**
 * Convert page name to valid React component name
 * Examples: "home" -> "Home", "product-list" -> "ProductList"
 * 
 * @param pageName - Page name
 * @returns PascalCase component name
 */
function toComponentName(pageName: string): string {
  return pageName
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Convert page name to valid route path
 * Examples: "home" -> "/", "product-list" -> "/product-list"
 * 
 * @param pageName - Page name
 * @param isFirst - Whether this is the first page (home route)
 * @returns Route path
 */
function toRoutePath(pageName: string, isFirst: boolean): string {
  if (isFirst) {
    return '/';
  }
  return `/${pageName.toLowerCase()}`;
}

/**
 * Generate package.json with React dependencies
 * 
 * @param appName - Application name
 * @returns package.json content
 * 
 * Requirements: 6.1, 6.2
 */
function generatePackageJson(appName: string): string {
  const packageName = appName.toLowerCase().replace(/\s+/g, '-');
  
  const pkg = {
    name: packageName,
    version: '0.1.0',
    private: true,
    dependencies: {
      'react': '^18.2.0',
      'react-dom': '^18.2.0',
      'react-router-dom': '^6.20.0',
    },
    scripts: {
      start: 'react-scripts start',
      build: 'react-scripts build',
      test: 'react-scripts test',
      eject: 'react-scripts eject',
    },
    devDependencies: {
      'react-scripts': '^5.0.1',
    },
    eslintConfig: {
      extends: ['react-app'],
    },
    browserslist: {
      production: ['>0.2%', 'not dead', 'not op_mini all'],
      development: ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version'],
    },
  };

  return JSON.stringify(pkg, null, 2);
}

/**
 * Convert HTML string to JSX string using html-to-react at build time
 * 
 * This function runs during the export process (build time in Node.js), not in the browser.
 * It uses html-to-react to parse HTML into React elements, then converts those
 * elements to JSX strings that will be embedded directly in the generated components.
 * 
 * @param html - HTML string
 * @returns JSX-compatible string
 */
function htmlToJSX(html: string): string {
  if (!html || !html.trim()) {
    return '';
  }
  
  // Check if html-to-react is available (only in Node.js environment)
  // In browser, we'll use the fallback
  const isNodeEnvironment = typeof process !== 'undefined' && process.versions && process.versions.node;
  
  if (!isNodeEnvironment) {
    // Browser environment - use fallback
    console.warn('html-to-react not available in browser, using fallback');
    return htmlToJSXFallback(html);
  }
  
  try {
    // Import html-to-react dynamically (only available in Node.js during build)
    // Using dynamic require to avoid bundling issues
    const htmlToReactModule = eval('require')('html-to-react');
    const { Parser } = htmlToReactModule;
    const reactElementToJSXStringModule = eval('require')('react-element-to-jsx-string');
    const reactElementToJSXString = reactElementToJSXStringModule.default || reactElementToJSXStringModule;
    
    // Clean HTML: extract body content only
    let cleanHtml = html;
    
    // Remove DOCTYPE
    cleanHtml = cleanHtml.replace(/<!DOCTYPE[^>]*>/gi, '');
    
    // Extract body content if present
    const bodyMatch = cleanHtml.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      cleanHtml = bodyMatch[1];
    } else {
      // If no body tag, try to extract content between html tags
      const htmlMatch = cleanHtml.match(/<html[^>]*>([\s\S]*)<\/html>/i);
      if (htmlMatch) {
        cleanHtml = htmlMatch[1];
        // Remove head tag if present
        cleanHtml = cleanHtml.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
      }
    }
    
    // Remove any remaining html, head, body tags
    cleanHtml = cleanHtml.replace(/<\/?html[^>]*>/gi, '');
    cleanHtml = cleanHtml.replace(/<\/?head[^>]*>/gi, '');
    cleanHtml = cleanHtml.replace(/<\/?body[^>]*>/gi, '');
    
    cleanHtml = cleanHtml.trim();
    
    if (!cleanHtml) {
      return '';
    }
    
    // Create parser instance
    const parser = new Parser();
    
    // Parse HTML to React elements
    const reactElement = parser.parse(cleanHtml);
    
    // html-to-react returns an array, we need to handle it
    if (Array.isArray(reactElement)) {
      // Convert each element to JSX and join
      const jsxParts = reactElement
        .filter(el => el != null)
        .map(el => {
          if (typeof el === 'string') {
            return el;
          }
          return reactElementToJSXString(el, {
            showFunctions: false,
            useBooleanShorthandSyntax: true,
            sortProps: false,
          });
        });
      return jsxParts.join('\n');
    } else if (reactElement) {
      // Single element
      return reactElementToJSXString(reactElement, {
        showFunctions: false,
        useBooleanShorthandSyntax: true,
        sortProps: false,
      });
    }
    
    return cleanHtml;
  } catch (error) {
    // Fallback: if parsing fails, use simple string conversion
    console.warn('html-to-react conversion failed, using fallback:', error);
    return htmlToJSXFallback(html);
  }
}

/**
 * Fallback HTML to JSX conversion (simple string replacement)
 * Used when html-to-react is not available or fails
 * 
 * @param html - HTML string
 * @returns JSX-compatible string
 */
function htmlToJSXFallback(html: string): string {
  let jsx = html;
  
  // Clean HTML: extract body content only
  jsx = jsx.replace(/<!DOCTYPE[^>]*>/gi, '');
  
  // Extract body content if present
  const bodyMatch = jsx.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (bodyMatch) {
    jsx = bodyMatch[1];
  } else {
    // If no body tag, try to extract content between html tags
    const htmlMatch = jsx.match(/<html[^>]*>([\s\S]*)<\/html>/i);
    if (htmlMatch) {
      jsx = htmlMatch[1];
      // Remove head tag if present
      jsx = jsx.replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '');
    }
  }
  
  // Remove any remaining html, head, body tags
  jsx = jsx.replace(/<\/?html[^>]*>/gi, '');
  jsx = jsx.replace(/<\/?head[^>]*>/gi, '');
  jsx = jsx.replace(/<\/?body[^>]*>/gi, '');
  
  jsx = jsx.trim();
  
  // Escape special characters that would break JSX template literals
  jsx = jsx.replace(/`/g, '\\`');
  jsx = jsx.replace(/\$/g, '\\$');
  
  // Convert class to className
  jsx = jsx.replace(/\sclass=/gi, ' className=');
  
  // Convert for to htmlFor
  jsx = jsx.replace(/\sfor=/gi, ' htmlFor=');
  
  // Convert style strings to objects (basic support)
  jsx = jsx.replace(/style="([^"]*)"/gi, (match, styleStr) => {
    const styles = styleStr.split(';')
      .filter((s: string) => s.trim())
      .map((s: string) => {
        const [prop, value] = s.split(':').map((p: string) => p.trim());
        if (!prop || !value) return '';
        const camelProp = prop.replace(/-([a-z])/g, (g: string) => g[1].toUpperCase());
        return `${camelProp}: '${value}'`;
      })
      .filter((s: string) => s)
      .join(', ');
    
    return styles ? `style={{ ${styles} }}` : '';
  });
  
  // Self-closing tags
  const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link'];
  selfClosingTags.forEach(tag => {
    jsx = jsx.replace(new RegExp(`<${tag}([^>]*?)>`, 'gi'), `<${tag}$1 />`);
  });
  
  return jsx;
}

/**
 * Generate a React component for a page with clean JSX
 * 
 * Generates a React component that renders HTML content as JSX.
 * Internal links are converted to React Router Link components.
 * Page-specific CSS is imported from a separate CSS file.
 * JavaScript is executed via useEffect hook.
 * 
 * @param page - Processed page data
 * @param componentName - Component name (PascalCase)
 * @param pageCss - Page-specific CSS (will be written to separate file)
 * @returns React component code
 * 
 * Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 4.2
 */
function generatePageComponent(
  page: ProcessedPage,
  componentName: string,
  pageCss: string
): string {
  const parts: string[] = [];

  // Step 1: Preprocess HTML - extract and remove style/script tags
  const { cleanedHtml: htmlAfterStyles } = extractStyleTags(page.html);
  const { cleanedHtml: cleanedHtml, extractedJS } = extractScriptTags(htmlAfterStyles);
  
  // Combine all JavaScript: extracted from <script> tags + page.js property
  const allJS = [extractedJS, page.js].filter(js => js && js.trim()).join('\n\n');
  const hasJS = allJS.trim().length > 0;
  
  // Check if we need to import Link component
  const needsLink = hasInternalLinks(cleanedHtml);
  
  // Check if we have CSS to import
  const hasCSS = pageCss && pageCss.trim();

  // Step 2: Convert internal links to Link components BEFORE converting to JSX
  let processedHtml = cleanedHtml;
  
  if (needsLink) {
    // Convert <a data-react-link="true" href="/path"> to <Link to="/path">
    processedHtml = processedHtml.replace(
      /<a\s+([^>]*?)data-react-link="true"([^>]*?)>/gi,
      (_match, before, after) => {
        // Extract href attribute
        const hrefMatch = (before + after).match(/href="([^"]*)"/i);
        const href = hrefMatch ? hrefMatch[1] : '/';
        
        // Remove data-react-link, data-page-target, and href attributes
        const cleanAttribs = (before + after)
          .replace(/data-react-link="true"/gi, '')
          .replace(/data-page-target="[^"]*"/gi, '')
          .replace(/href="[^"]*"/gi, '')
          .trim();
        
        // Use a placeholder that won't be affected by html-to-react
        return `<reactrouterlink data-to="${href}"${cleanAttribs ? ' ' + cleanAttribs : ''}>`;
      }
    );
    
    // Replace closing </a> tags with placeholder closing tags
    const linkCount = (processedHtml.match(/<reactrouterlink\s/gi) || []).length;
    let replacedCount = 0;
    processedHtml = processedHtml.replace(/<\/a>/gi, (match) => {
      if (replacedCount < linkCount) {
        replacedCount++;
        return '</reactrouterlink>';
      }
      return match;
    });
  }
  
  // Handle disabled links
  processedHtml = processedHtml.replace(
    /<a\s+([^>]*?)data-react-link-disabled="true"([^>]*?)>(.*?)<\/a>/gi,
    (_match, before, after, content) => {
      const cleanAttribs = (before + after)
        .replace(/href="[^"]*"/gi, '')
        .replace(/data-react-link-disabled="true"/gi, '')
        .trim();
      
      return `<span${cleanAttribs ? ' ' + cleanAttribs : ''} style="cursor: not-allowed; opacity: 0.6">${content}</span>`;
    }
  );

  // Step 3: Convert HTML to JSX using html-to-react at build time
  let jsxContent = htmlToJSX(processedHtml);
  
  // Step 4: Replace placeholders with actual Link components
  if (needsLink) {
    // Replace <reactrouterlink data-to="/path"> with <Link to="/path">
    jsxContent = jsxContent.replace(
      /<reactrouterlink\s+([^>]*?)data-to="([^"]*)"([^>]*?)>/gi,
      (_match, before, to, after) => {
        const cleanAttribs = (before + after).trim();
        return `<Link to="${to}"${cleanAttribs ? ' ' + cleanAttribs : ''}>`;
      }
    );
    
    // Replace closing tags
    jsxContent = jsxContent.replace(/<\/reactrouterlink>/gi, '</Link>');
  }

  // Step 5: Generate import statements
  parts.push("import React from 'react';");
  
  if (needsLink) {
    parts.push("import { Link } from 'react-router-dom';");
  }
  
  if (hasJS) {
    parts.push("import { useEffect } from 'react';");
  }
  
  if (hasCSS) {
    parts.push(`import './styles/${componentName}.css';`);
  }
  
  parts.push('');

  // Step 6: Generate component function
  parts.push(`const ${componentName} = () => {`);

  // useEffect for JavaScript execution
  if (hasJS) {
    parts.push('  useEffect(() => {');
    parts.push('    // Execute page-specific JavaScript');
    parts.push('    try {');
    // Indent the JS code
    const indentedJS = allJS
      .split('\n')
      .map(line => '      ' + line)
      .join('\n');
    parts.push(indentedJS);
    parts.push('    } catch (error) {');
    parts.push('      console.error("Error executing page script:", error);');
    parts.push('    }');
    parts.push('  }, []);');
    parts.push('');
  }

  // Step 7: Generate return JSX
  parts.push('  return (');
  parts.push('    <>');
  // Indent JSX content
  const indentedJSX = jsxContent
    .split('\n')
    .map(line => '      ' + line)
    .join('\n');
  parts.push(indentedJSX);
  parts.push('    </>');
  parts.push('  );');
  parts.push('};');
  parts.push('');

  // Export
  parts.push(`export default ${componentName};`);

  return parts.join('\n');
}

/**
 * Generate App.jsx with React Router configuration
 * 
 * @param pages - Array of processed pages
 * @returns App.jsx content
 */
function generateAppComponent(
  pages: ProcessedPage[]
): string {
  const parts: string[] = [];

  // Import statements
  parts.push("import React from 'react';");
  parts.push("import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';");
  
  // Import page components
  for (const page of pages) {
    const componentName = toComponentName(page.name);
    parts.push(`import ${componentName} from './pages/${componentName}';`);
  }
  
  // Import shared CSS if it exists
  parts.push("import './styles/shared.css';");
  parts.push('');

  // App component
  parts.push('function App() {');
  parts.push('  return (');
  parts.push('    <Router>');
  parts.push('      <div className="app">');

  // Navigation menu (if multiple pages)
  if (pages.length > 1) {
    parts.push('        <nav className="app-nav">');
    parts.push('          <ul>');
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const componentName = toComponentName(page.name);
      const routePath = toRoutePath(page.name, i === 0);
      const displayName = componentName;
      parts.push(`            <li><Link to="${routePath}">${displayName}</Link></li>`);
    }
    parts.push('          </ul>');
    parts.push('        </nav>');
    parts.push('');
  }

  // Routes
  parts.push('        <Routes>');
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const componentName = toComponentName(page.name);
    const routePath = toRoutePath(page.name, i === 0);
    parts.push(`          <Route path="${routePath}" element={<${componentName} />} />`);
  }
  parts.push('        </Routes>');
  parts.push('      </div>');
  parts.push('    </Router>');
  parts.push('  );');
  parts.push('}');
  parts.push('');
  parts.push('export default App;');

  return parts.join('\n');
}

/**
 * Generate index.jsx entry point
 * 
 * @returns index.jsx content
 */
function generateIndexEntry(): string {
  const parts: string[] = [];

  parts.push("import React from 'react';");
  parts.push("import ReactDOM from 'react-dom/client';");
  parts.push("import App from './App';");
  parts.push('');
  parts.push("const root = ReactDOM.createRoot(document.getElementById('root'));");
  parts.push('root.render(');
  parts.push('  <React.StrictMode>');
  parts.push('    <App />');
  parts.push('  </React.StrictMode>');
  parts.push(');');

  return parts.join('\n');
}

/**
 * Generate public/index.html template with global styles and link stylesheets
 * 
 * @param appName - Application name
 * @param deps - Design system CDN dependencies
 * @param linkStylesheets - Array of stylesheet URLs extracted from page HTML
 * @returns index.html content
 * 
 * Requirements: 2.4, 2.5
 */
function generatePublicIndexHtml(
  appName: string,
  deps: { stylesheets: string[]; scripts: string[] },
  linkStylesheets: string[] = []
): string {
  const parts: string[] = [];

  parts.push('<!DOCTYPE html>');
  parts.push('<html lang="en">');
  parts.push('  <head>');
  parts.push('    <meta charset="utf-8" />');
  parts.push('    <meta name="viewport" content="width=device-width, initial-scale=1" />');
  parts.push('    <meta name="theme-color" content="#000000" />');
  parts.push('    <meta name="description" content="Web application created with AI-driven HTML Visual Editor" />');
  parts.push(`    <title>${escapeHtml(appName)}</title>`);
  parts.push('');

  // Add global layout styles
  parts.push('    <!-- Global Layout Styles -->');
  parts.push('    <style>');
  parts.push('      body {');
  parts.push('        margin: 0;');
  parts.push('      }');
  parts.push('      *, *::before, *::after {');
  parts.push('        box-sizing: border-box;');
  parts.push('      }');
  parts.push('    </style>');
  parts.push('');

  // Add link stylesheets extracted from page HTML
  if (linkStylesheets.length > 0) {
    parts.push('    <!-- Page Stylesheets -->');
    for (const stylesheet of linkStylesheets) {
      parts.push(`    <link rel="stylesheet" href="${escapeHtml(stylesheet)}" />`);
    }
    parts.push('');
  }

  // Add design system CDN stylesheets
  if (deps.stylesheets.length > 0) {
    parts.push('    <!-- Design System CDN Stylesheets -->');
    for (const stylesheet of deps.stylesheets) {
      parts.push(`    <link rel="stylesheet" href="${escapeHtml(stylesheet)}" />`);
    }
    parts.push('');
  }

  // Add design system CDN scripts
  if (deps.scripts.length > 0) {
    parts.push('    <!-- Design System CDN Scripts -->');
    for (const script of deps.scripts) {
      parts.push(`    <script src="${escapeHtml(script)}"></script>`);
    }
    parts.push('');
  }

  parts.push('  </head>');
  parts.push('  <body>');
  parts.push('    <noscript>You need to enable JavaScript to run this app.</noscript>');
  parts.push('    <div id="root"></div>');
  parts.push('  </body>');
  parts.push('</html>');

  return parts.join('\n');
}

/**
 * Generate README.md with installation and startup instructions
 * 
 * @param appName - Application name
 * @param hasMockData - Whether mock data is included
 * @returns README.md content
 */
function generateReadme(appName: string, hasMockData: boolean): string {
  const parts: string[] = [];

  parts.push(`# ${appName}`);
  parts.push('');
  parts.push('This is a React project generated by the AI-driven HTML Visual Editor.');
  parts.push('');

  // Project structure
  parts.push('## Project Structure');
  parts.push('');
  parts.push('```');
  parts.push('project/');
  parts.push('├── package.json        # Project dependencies and scripts');
  parts.push('├── public/');
  parts.push('│   ├── index.html      # HTML template');
  if (hasMockData) {
    parts.push('│   └── mock/           # Mock API data');
    parts.push('│       ├── interceptor.js');
    parts.push('│       └── api/        # Mock JSON files');
  }
  parts.push('├── src/');
  parts.push('│   ├── App.jsx         # Main app component with routing');
  parts.push('│   ├── index.jsx       # Entry point');
  parts.push('│   ├── pages/          # Page components');
  parts.push('│   └── styles/');
  parts.push('│       └── shared.css  # Shared styles');
  parts.push('└── README.md           # This file');
  parts.push('```');
  parts.push('');

  // Installation
  parts.push('## Installation');
  parts.push('');
  parts.push('Install dependencies using npm or yarn:');
  parts.push('');
  parts.push('```bash');
  parts.push('# Using npm');
  parts.push('npm install');
  parts.push('');
  parts.push('# Using yarn');
  parts.push('yarn install');
  parts.push('```');
  parts.push('');

  // Development
  parts.push('## Development');
  parts.push('');
  parts.push('Start the development server:');
  parts.push('');
  parts.push('```bash');
  parts.push('# Using npm');
  parts.push('npm start');
  parts.push('');
  parts.push('# Using yarn');
  parts.push('yarn start');
  parts.push('```');
  parts.push('');
  parts.push('The app will open at [http://localhost:3000](http://localhost:3000).');
  parts.push('');
  parts.push('The page will reload when you make changes. You may also see lint errors in the console.');
  parts.push('');

  // Build
  parts.push('## Build for Production');
  parts.push('');
  parts.push('Create an optimized production build:');
  parts.push('');
  parts.push('```bash');
  parts.push('# Using npm');
  parts.push('npm run build');
  parts.push('');
  parts.push('# Using yarn');
  parts.push('yarn build');
  parts.push('```');
  parts.push('');
  parts.push('The build folder will contain the optimized production files ready for deployment.');
  parts.push('');

  // Deployment
  parts.push('## Deployment');
  parts.push('');
  parts.push('### Deploy to Netlify');
  parts.push('');
  parts.push('1. Build the project: `npm run build`');
  parts.push('2. Drag and drop the `build` folder to [Netlify Drop](https://app.netlify.com/drop)');
  parts.push('3. Your site will be live instantly');
  parts.push('');

  parts.push('### Deploy to Vercel');
  parts.push('');
  parts.push('```bash');
  parts.push('# Install Vercel CLI (one-time)');
  parts.push('npm install -g vercel');
  parts.push('');
  parts.push('# Deploy');
  parts.push('vercel');
  parts.push('```');
  parts.push('');

  parts.push('### Deploy to GitHub Pages');
  parts.push('');
  parts.push('1. Install gh-pages: `npm install --save-dev gh-pages`');
  parts.push('2. Add to package.json:');
  parts.push('   ```json');
  parts.push('   "homepage": "https://username.github.io/repository-name",');
  parts.push('   "scripts": {');
  parts.push('     "predeploy": "npm run build",');
  parts.push('     "deploy": "gh-pages -d build"');
  parts.push('   }');
  parts.push('   ```');
  parts.push('3. Deploy: `npm run deploy`');
  parts.push('');

  // Mock data info
  if (hasMockData) {
    parts.push('## Mock API Data');
    parts.push('');
    parts.push('This project includes mock API data for development:');
    parts.push('');
    parts.push('- `public/mock/interceptor.js` intercepts fetch() calls');
    parts.push('- Mock data files are in `public/mock/api/`');
    parts.push('- To use real APIs, remove the interceptor script from `public/index.html`');
    parts.push('');
  }

  // Features
  parts.push('## Features');
  parts.push('');
  parts.push('- ✅ React 18 with modern hooks');
  parts.push('- ✅ React Router for navigation');
  parts.push('- ✅ Component-based architecture');
  parts.push('- ✅ Hot module replacement in development');
  parts.push('- ✅ Optimized production builds');
  if (hasMockData) {
    parts.push('- ✅ Mock API data for development');
  }
  parts.push('');

  // Learn More
  parts.push('## Learn More');
  parts.push('');
  parts.push('- [React Documentation](https://react.dev/)');
  parts.push('- [React Router Documentation](https://reactrouter.com/)');
  parts.push('- [Create React App Documentation](https://create-react-app.dev/)');
  parts.push('');

  parts.push('---');
  parts.push('');
  parts.push('Generated by [AI-driven HTML Visual Editor](https://github.com/yourusername/your-repo)');

  return parts.join('\n');
}

/**
 * Generate .gitignore file
 * 
 * @returns .gitignore content
 */
function generateGitignore(): string {
  const parts: string[] = [];

  parts.push('# Dependencies');
  parts.push('node_modules/');
  parts.push('');
  parts.push('# Production build');
  parts.push('build/');
  parts.push('');
  parts.push('# Testing');
  parts.push('coverage/');
  parts.push('');
  parts.push('# Misc');
  parts.push('.DS_Store');
  parts.push('.env.local');
  parts.push('.env.development.local');
  parts.push('.env.test.local');
  parts.push('.env.production.local');
  parts.push('');
  parts.push('# Logs');
  parts.push('npm-debug.log*');
  parts.push('yarn-debug.log*');
  parts.push('yarn-error.log*');
  parts.push('');
  parts.push('# Editor');
  parts.push('.vscode/');
  parts.push('.idea/');
  parts.push('*.swp');
  parts.push('*.swo');

  return parts.join('\n');
}

/**
 * Extract all <style> tags from HTML and return cleaned HTML + extracted CSS
 * 
 * Handles:
 * - Multiple style tags
 * - Empty style tags
 * - Unclosed or malformed style tags (best effort)
 * 
 * @param html - HTML string potentially containing <style> tags
 * @returns Object with cleanedHtml (without style tags) and extractedCSS (combined CSS content)
 * 
 * Requirements: 2.3
 */
export function extractStyleTags(html: string): { cleanedHtml: string; extractedCSS: string } {
  const cssBlocks: string[] = [];
  
  // Match <style> tags with their content
  // This regex handles:
  // - Optional attributes on style tag: <style type="text/css">
  // - Content inside style tags (non-greedy)
  // - Case-insensitive matching
  // - Handles both properly closed and unclosed tags
  const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  
  let cleanedHtml = html;
  let match;
  
  // Extract all style tag contents
  while ((match = styleRegex.exec(html)) !== null) {
    const cssContent = match[1].trim();
    if (cssContent) {
      cssBlocks.push(cssContent);
    }
  }
  
  // Remove all style tags from HTML
  cleanedHtml = cleanedHtml.replace(styleRegex, '');
  
  // Handle unclosed style tags (best effort)
  // Match <style...> without closing tag, extract content until next tag or end
  const unclosedStyleRegex = /<style[^>]*>(?![\s\S]*?<\/style>)([\s\S]*?)(?=<[^/]|$)/gi;
  while ((match = unclosedStyleRegex.exec(cleanedHtml)) !== null) {
    const cssContent = match[1].trim();
    if (cssContent) {
      cssBlocks.push(cssContent);
    }
  }
  
  // Remove unclosed style tags
  cleanedHtml = cleanedHtml.replace(/<style[^>]*>(?![\s\S]*?<\/style>)[\s\S]*?(?=<[^/]|$)/gi, '');
  
  const extractedCSS = cssBlocks.join('\n\n');
  
  return {
    cleanedHtml: cleanedHtml.trim(),
    extractedCSS,
  };
}

/**
 * Extract all <script> tags from HTML and return cleaned HTML + extracted JS
 * 
 * Handles:
 * - Multiple script tags
 * - Empty script tags
 * - Ignores external scripts (with src attribute)
 * - Unclosed or malformed script tags (best effort)
 * 
 * @param html - HTML string potentially containing <script> tags
 * @returns Object with cleanedHtml (without script tags) and extractedJS (combined JS content)
 * 
 * Requirements: 4.1
 */
export function extractScriptTags(html: string): { cleanedHtml: string; extractedJS: string } {
  const jsBlocks: string[] = [];
  
  // Match <script> tags WITHOUT src attribute (inline scripts only)
  // This regex handles:
  // - Optional attributes on script tag (but NOT src attribute)
  // - Content inside script tags (non-greedy)
  // - Case-insensitive matching
  // - Properly closed tags
  const inlineScriptRegex = /<script(?![^>]*\bsrc\s*=)[^>]*>([\s\S]*?)<\/script>/gi;
  
  let cleanedHtml = html;
  let match;
  
  // Extract all inline script tag contents
  while ((match = inlineScriptRegex.exec(html)) !== null) {
    const jsContent = match[1].trim();
    if (jsContent) {
      jsBlocks.push(jsContent);
    }
  }
  
  // Remove all inline script tags from HTML
  cleanedHtml = cleanedHtml.replace(inlineScriptRegex, '');
  
  // Also remove external script tags (with src attribute) from HTML
  // We don't extract their content, just remove them from the HTML
  const externalScriptRegex = /<script[^>]*\bsrc\s*=[^>]*>[\s\S]*?<\/script>/gi;
  cleanedHtml = cleanedHtml.replace(externalScriptRegex, '');
  
  // Handle self-closing external scripts: <script src="..." />
  const selfClosingScriptRegex = /<script[^>]*\bsrc\s*=[^>]*\/>/gi;
  cleanedHtml = cleanedHtml.replace(selfClosingScriptRegex, '');
  
  const extractedJS = jsBlocks.join('\n\n');
  
  return {
    cleanedHtml: cleanedHtml.trim(),
    extractedJS,
  };
}

/**
 * Extract all <link rel="stylesheet"> tags from HTML and return cleaned HTML + stylesheet URLs
 * 
 * Handles:
 * - Multiple link tags
 * - Link tags with various attributes
 * - Only extracts stylesheet links (ignores other rel types like icon, preload, etc.)
 * - Self-closing and non-self-closing link tags
 * 
 * @param html - HTML string potentially containing <link rel="stylesheet"> tags
 * @returns Object with cleanedHtml (without link stylesheet tags) and stylesheetUrls (array of href values)
 * 
 * Requirements: 2.4
 */
export function extractLinkStylesheets(html: string): { cleanedHtml: string; stylesheetUrls: string[] } {
  const stylesheetUrls: string[] = [];
  
  // Match <link> tags with rel="stylesheet"
  // This regex handles:
  // - Optional attributes before and after rel
  // - Both single and double quotes for attribute values
  // - Case-insensitive matching
  // - Self-closing tags (with or without /)
  // - Captures the href attribute value
  const linkStylesheetRegex = /<link\s+(?:[^>]*?\s+)?rel\s*=\s*["']stylesheet["'](?:[^>]*?\s+)?href\s*=\s*["']([^"']*)["'][^>]*\/?>/gi;
  
  let cleanedHtml = html;
  let match;
  
  // Extract all stylesheet href values
  while ((match = linkStylesheetRegex.exec(html)) !== null) {
    const hrefValue = match[1];
    if (hrefValue && hrefValue.trim()) {
      stylesheetUrls.push(hrefValue.trim());
    }
  }
  
  // Remove all link stylesheet tags from HTML
  cleanedHtml = cleanedHtml.replace(linkStylesheetRegex, '');
  
  // Also handle the case where href comes before rel
  const linkStylesheetRegex2 = /<link\s+(?:[^>]*?\s+)?href\s*=\s*["']([^"']*)["'](?:[^>]*?\s+)?rel\s*=\s*["']stylesheet["'][^>]*\/?>/gi;
  
  while ((match = linkStylesheetRegex2.exec(html)) !== null) {
    const hrefValue = match[1];
    if (hrefValue && hrefValue.trim() && !stylesheetUrls.includes(hrefValue.trim())) {
      stylesheetUrls.push(hrefValue.trim());
    }
  }
  
  // Remove these link tags as well
  cleanedHtml = cleanedHtml.replace(linkStylesheetRegex2, '');
  
  return {
    cleanedHtml: cleanedHtml.trim(),
    stylesheetUrls,
  };
}

/**
 * Check if HTML contains internal links marked with data-react-link attribute
 * 
 * Internal links are <a> tags with data-react-link="true" attribute that should
 * be converted to React Router <Link> components.
 * 
 * @param html - HTML string to check
 * @returns true if HTML contains internal links, false otherwise
 * 
 * Requirements: 3.1
 */
export function hasInternalLinks(html: string): boolean {
  // Match <a> tags with data-react-link="true" attribute
  // This regex handles:
  // - Both single and double quotes for attribute values
  // - Case-insensitive matching
  // - Attribute can appear anywhere in the tag
  const internalLinkRegex = /<a\s+[^>]*data-react-link\s*=\s*["']true["'][^>]*>/i;
  
  return internalLinkRegex.test(html);
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
