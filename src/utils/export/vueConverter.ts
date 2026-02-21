/**
 * Vue Project Converter
 * Feature: export-deployable-project
 * Requirements: 6.4, 6.5
 * 
 * Converts processed pages into a Vue project structure with:
 * - Vue Single File Components (SFC) for each page
 * - Vue Router for navigation
 * - v-html directive for HTML content
 * - mounted() hook for JavaScript execution
 */

import type { ProcessedPage, MockGenerationResult } from '../../types';

/**
 * Assemble a Vue project from processed pages
 * 
 * Generates a deployable Vue project with:
 * - package.json with Vue dependencies
 * - src/pages/ directory with Vue SFC for each page
 * - src/App.vue with Vue Router configuration
 * - src/main.js entry point
 * - src/router.js with route definitions
 * - src/styles/shared.css for common styles
 * - public/index.html template
 * - README.md with installation and startup instructions
 * 
 * Each page is converted to a Vue SFC that:
 * - Uses v-html directive to render the original HTML
 * - Injects page-specific CSS via <style> block
 * - Executes page-specific JS via mounted() lifecycle hook
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
 * - 6.4: Convert each page to Vue SFC with routing
 * - 6.5: Include README.md with npm install && npm run dev instructions
 */
export function assembleVueProject(
  pages: ProcessedPage[],
  sharedCSS: string,
  pageCSS: Map<string, string>,
  deps: { stylesheets: string[]; scripts: string[] },
  mockResult: MockGenerationResult,
  appName: string
): Map<string, string> {
  const files = new Map<string, string>();

  // Generate package.json
  const packageJson = generatePackageJson(appName);
  files.set('package.json', packageJson);

  // Generate page components (Vue SFC)
  for (const page of pages) {
    const componentName = toComponentName(page.name);
    const componentCode = generatePageComponent(
      page,
      componentName,
      pageCSS.get(page.name) || ''
    );
    files.set(`src/pages/${componentName}.vue`, componentCode);
  }

  // Generate App.vue with router-view
  const appCode = generateAppComponent(pages);
  files.set('src/App.vue', appCode);

  // Generate router.js with route definitions
  const routerCode = generateRouter(pages);
  files.set('src/router.js', routerCode);

  // Generate main.js entry point
  const mainCode = generateMainEntry();
  files.set('src/main.js', mainCode);

  // Generate shared CSS if exists
  if (sharedCSS.trim()) {
    files.set('src/styles/shared.css', sharedCSS);
  }

  // Generate public/index.html template
  const indexHtml = generatePublicIndexHtml(appName, deps);
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

  // Generate vite.config.js
  const viteConfig = generateViteConfig();
  files.set('vite.config.js', viteConfig);

  return files;
}

/**
 * Convert page name to valid Vue component name
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
 * Generate package.json with Vue dependencies
 * 
 * @param appName - Application name
 * @returns package.json content
 */
function generatePackageJson(appName: string): string {
  const packageName = appName.toLowerCase().replace(/\s+/g, '-');
  
  const pkg = {
    name: packageName,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: {
      'vue': '^3.3.0',
      'vue-router': '^4.2.0',
    },
    devDependencies: {
      '@vitejs/plugin-vue': '^4.5.0',
      'vite': '^5.0.0',
    },
  };

  return JSON.stringify(pkg, null, 2);
}

/**
 * Generate a Vue SFC for a page
 * 
 * Uses v-html directive to render the original HTML content,
 * injects page-specific CSS via <style> block, and executes JS via mounted() hook.
 * 
 * @param page - Processed page data
 * @param componentName - Component name (PascalCase)
 * @param pageCss - Page-specific CSS
 * @returns Vue SFC code
 */
function generatePageComponent(
  page: ProcessedPage,
  componentName: string,
  pageCss: string
): string {
  const parts: string[] = [];

  // Template section
  parts.push('<template>');
  parts.push('  <div class="page-container">');
  parts.push('    <div v-html="htmlContent"></div>');
  parts.push('  </div>');
  parts.push('</template>');
  parts.push('');

  // Script section
  parts.push('<script>');
  parts.push('export default {');
  parts.push(`  name: '${componentName}',`);
  parts.push('  data() {');
  parts.push('    return {');
  parts.push('      htmlContent: `');
  // Escape backticks in HTML content
  const escapedHtml = page.html.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  // Indent the HTML
  const indentedHtml = escapedHtml
    .split('\n')
    .map(line => '        ' + line)
    .join('\n');
  parts.push(indentedHtml);
  parts.push('      `');
  parts.push('    };');
  parts.push('  },');

  // Add mounted hook if there's JavaScript
  const hasJS = page.js && page.js.trim();
  if (hasJS) {
    parts.push('  mounted() {');
    parts.push('    // Execute page-specific JavaScript');
    parts.push('    try {');
    // Indent the JS code
    const indentedJS = page.js
      .split('\n')
      .map(line => '      ' + line)
      .join('\n');
    parts.push(indentedJS);
    parts.push('    } catch (error) {');
    parts.push('      console.error("Error executing page script:", error);');
    parts.push('    }');
    parts.push('  }');
  }

  parts.push('};');
  parts.push('</script>');
  parts.push('');

  // Style section (page-specific CSS)
  const hasCSS = pageCss && pageCss.trim();
  if (hasCSS) {
    parts.push('<style scoped>');
    parts.push(pageCss);
    parts.push('</style>');
  }

  return parts.join('\n');
}

/**
 * Generate App.vue with router-view
 * 
 * @param pages - Array of processed pages
 * @returns App.vue content
 */
function generateAppComponent(pages: ProcessedPage[]): string {
  const parts: string[] = [];

  // Template section
  parts.push('<template>');
  parts.push('  <div id="app">');

  // Navigation menu (if multiple pages)
  if (pages.length > 1) {
    parts.push('    <nav class="app-nav">');
    parts.push('      <ul>');
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const componentName = toComponentName(page.name);
      const routePath = toRoutePath(page.name, i === 0);
      parts.push(`        <li><router-link to="${routePath}">${componentName}</router-link></li>`);
    }
    parts.push('      </ul>');
    parts.push('    </nav>');
  }

  // Router view
  parts.push('    <router-view />');
  parts.push('  </div>');
  parts.push('</template>');
  parts.push('');

  // Script section
  parts.push('<script>');
  parts.push('export default {');
  parts.push("  name: 'App'");
  parts.push('};');
  parts.push('</script>');
  parts.push('');

  // Style section (navigation styles)
  if (pages.length > 1) {
    parts.push('<style>');
    parts.push('.app-nav {');
    parts.push('  background-color: #f5f5f5;');
    parts.push('  padding: 1rem;');
    parts.push('  margin-bottom: 2rem;');
    parts.push('}');
    parts.push('');
    parts.push('.app-nav ul {');
    parts.push('  list-style: none;');
    parts.push('  padding: 0;');
    parts.push('  margin: 0;');
    parts.push('  display: flex;');
    parts.push('  gap: 1rem;');
    parts.push('}');
    parts.push('');
    parts.push('.app-nav a {');
    parts.push('  text-decoration: none;');
    parts.push('  color: #333;');
    parts.push('  padding: 0.5rem 1rem;');
    parts.push('  border-radius: 4px;');
    parts.push('  transition: background-color 0.2s;');
    parts.push('}');
    parts.push('');
    parts.push('.app-nav a:hover {');
    parts.push('  background-color: #e0e0e0;');
    parts.push('}');
    parts.push('');
    parts.push('.app-nav a.router-link-active {');
    parts.push('  background-color: #007bff;');
    parts.push('  color: white;');
    parts.push('}');
    parts.push('</style>');
  }

  return parts.join('\n');
}

/**
 * Generate router.js with route definitions
 * 
 * @param pages - Array of processed pages
 * @returns router.js content
 */
function generateRouter(pages: ProcessedPage[]): string {
  const parts: string[] = [];

  parts.push("import { createRouter, createWebHistory } from 'vue-router';");
  parts.push('');

  // Import page components
  for (const page of pages) {
    const componentName = toComponentName(page.name);
    parts.push(`import ${componentName} from './pages/${componentName}.vue';`);
  }
  parts.push('');

  // Define routes
  parts.push('const routes = [');
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const componentName = toComponentName(page.name);
    const routePath = toRoutePath(page.name, i === 0);
    parts.push('  {');
    parts.push(`    path: '${routePath}',`);
    parts.push(`    name: '${componentName}',`);
    parts.push(`    component: ${componentName}`);
    parts.push(`  }${i < pages.length - 1 ? ',' : ''}`);
  }
  parts.push('];');
  parts.push('');

  // Create router instance
  parts.push('const router = createRouter({');
  parts.push('  history: createWebHistory(),');
  parts.push('  routes');
  parts.push('});');
  parts.push('');
  parts.push('export default router;');

  return parts.join('\n');
}

/**
 * Generate main.js entry point
 * 
 * @returns main.js content
 */
function generateMainEntry(): string {
  const parts: string[] = [];

  parts.push("import { createApp } from 'vue';");
  parts.push("import App from './App.vue';");
  parts.push("import router from './router';");
  parts.push("import './styles/shared.css';");
  parts.push('');
  parts.push('const app = createApp(App);');
  parts.push('app.use(router);');
  parts.push("app.mount('#app');");

  return parts.join('\n');
}

/**
 * Generate public/index.html template
 * 
 * @param appName - Application name
 * @param deps - Design system CDN dependencies
 * @returns index.html content
 */
function generatePublicIndexHtml(
  appName: string,
  deps: { stylesheets: string[]; scripts: string[] }
): string {
  const parts: string[] = [];

  parts.push('<!DOCTYPE html>');
  parts.push('<html lang="en">');
  parts.push('  <head>');
  parts.push('    <meta charset="UTF-8" />');
  parts.push('    <meta name="viewport" content="width=device-width, initial-scale=1.0" />');
  parts.push(`    <title>${escapeHtml(appName)}</title>`);
  parts.push('');

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
  parts.push('    <div id="app"></div>');
  parts.push('    <script type="module" src="/src/main.js"></script>');
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
  parts.push('This is a Vue 3 project generated by the AI-driven HTML Visual Editor.');
  parts.push('');

  // Project structure
  parts.push('## Project Structure');
  parts.push('');
  parts.push('```');
  parts.push('project/');
  parts.push('├── package.json        # Project dependencies and scripts');
  parts.push('├── vite.config.js      # Vite configuration');
  parts.push('├── public/');
  parts.push('│   ├── index.html      # HTML template');
  if (hasMockData) {
    parts.push('│   └── mock/           # Mock API data');
    parts.push('│       ├── interceptor.js');
    parts.push('│       └── api/        # Mock JSON files');
  }
  parts.push('├── src/');
  parts.push('│   ├── App.vue         # Main app component');
  parts.push('│   ├── main.js         # Entry point');
  parts.push('│   ├── router.js       # Vue Router configuration');
  parts.push('│   ├── pages/          # Page components (SFC)');
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
  parts.push('npm run dev');
  parts.push('');
  parts.push('# Using yarn');
  parts.push('yarn dev');
  parts.push('```');
  parts.push('');
  parts.push('The app will open at [http://localhost:5173](http://localhost:5173).');
  parts.push('');
  parts.push('The page will hot-reload when you make changes.');
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
  parts.push('The dist folder will contain the optimized production files ready for deployment.');
  parts.push('');

  // Preview
  parts.push('## Preview Production Build');
  parts.push('');
  parts.push('Preview the production build locally:');
  parts.push('');
  parts.push('```bash');
  parts.push('# Using npm');
  parts.push('npm run preview');
  parts.push('');
  parts.push('# Using yarn');
  parts.push('yarn preview');
  parts.push('```');
  parts.push('');

  // Deployment
  parts.push('## Deployment');
  parts.push('');
  parts.push('### Deploy to Netlify');
  parts.push('');
  parts.push('1. Build the project: `npm run build`');
  parts.push('2. Drag and drop the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)');
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
  parts.push('   "scripts": {');
  parts.push('     "predeploy": "npm run build",');
  parts.push('     "deploy": "gh-pages -d dist"');
  parts.push('   }');
  parts.push('   ```');
  parts.push('3. Update vite.config.js with base path:');
  parts.push('   ```js');
  parts.push('   export default {');
  parts.push('     base: "/repository-name/"');
  parts.push('   }');
  parts.push('   ```');
  parts.push('4. Deploy: `npm run deploy`');
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
  parts.push('- ✅ Vue 3 with Composition API support');
  parts.push('- ✅ Vue Router for navigation');
  parts.push('- ✅ Single File Components (SFC)');
  parts.push('- ✅ Vite for fast development and optimized builds');
  parts.push('- ✅ Hot Module Replacement (HMR)');
  if (hasMockData) {
    parts.push('- ✅ Mock API data for development');
  }
  parts.push('');

  // Learn More
  parts.push('## Learn More');
  parts.push('');
  parts.push('- [Vue 3 Documentation](https://vuejs.org/)');
  parts.push('- [Vue Router Documentation](https://router.vuejs.org/)');
  parts.push('- [Vite Documentation](https://vitejs.dev/)');
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
  parts.push('dist/');
  parts.push('dist-ssr/');
  parts.push('');
  parts.push('# Logs');
  parts.push('*.log');
  parts.push('npm-debug.log*');
  parts.push('yarn-debug.log*');
  parts.push('yarn-error.log*');
  parts.push('pnpm-debug.log*');
  parts.push('');
  parts.push('# Editor directories and files');
  parts.push('.vscode/');
  parts.push('.idea/');
  parts.push('*.suo');
  parts.push('*.ntvs*');
  parts.push('*.njsproj');
  parts.push('*.sln');
  parts.push('*.sw?');
  parts.push('');
  parts.push('# OS');
  parts.push('.DS_Store');
  parts.push('Thumbs.db');
  parts.push('');
  parts.push('# Environment');
  parts.push('.env');
  parts.push('.env.local');
  parts.push('.env.*.local');

  return parts.join('\n');
}

/**
 * Generate vite.config.js
 * 
 * @returns vite.config.js content
 */
function generateViteConfig(): string {
  const parts: string[] = [];

  parts.push("import { defineConfig } from 'vite';");
  parts.push("import vue from '@vitejs/plugin-vue';");
  parts.push('');
  parts.push('// https://vitejs.dev/config/');
  parts.push('export default defineConfig({');
  parts.push('  plugins: [vue()],');
  parts.push('  server: {');
  parts.push('    port: 5173,');
  parts.push('    open: true');
  parts.push('  },');
  parts.push('  build: {');
  parts.push('    outDir: \'dist\',');
  parts.push('    assetsDir: \'assets\',');
  parts.push('    sourcemap: false');
  parts.push('  }');
  parts.push('});');

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
