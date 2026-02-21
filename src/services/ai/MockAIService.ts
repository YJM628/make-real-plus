/**
 * Mock AI Service implementation
 * Feature: ai-html-visual-editor
 * 
 * In production, this would connect to an actual AI service (OpenAI, Anthropic, etc.)
 * This mock service is used for testing and development without requiring API keys.
 */

import type {
  AIGenerationContext,
  AIGenerationChunk,
  AIGenerationResult,
  AIOptimizationResult,
  BatchGenerationResult,
  AppContext,
  PageSpec,
} from '../../types';
import type { AIService } from './AIService';
import { AIServiceError, TIMEOUT_CONFIG } from './AIService';
import { extractHtmlSections } from '../../utils/batch/buildPerPagePrompt';

/**
 * Streaming state for interruption recovery
 */
interface StreamingState {
  html: string;
  css: string;
  js: string;
  identifiers: string[];
  lastChunkTime: number;
  isComplete: boolean;
}

/**
 * Mock AI Service implementation
 */
export class MockAIService implements AIService {
  private streamingStates = new Map<string, StreamingState>();

  /**
   * Generate HTML/CSS/JS from natural language (streaming)
   */
  async *generateHtml(
    context: AIGenerationContext
  ): AsyncGenerator<AIGenerationChunk, AIGenerationResult, void> {
    const stateId = `gen-${Date.now()}`;
    const state: StreamingState = {
      html: '',
      css: '',
      js: '',
      identifiers: [],
      lastChunkTime: Date.now(),
      isComplete: false,
    };
    this.streamingStates.set(stateId, state);

    try {
      // Simulate streaming generation with timeout handling
      const startTime = Date.now();
      let progressDisplayed = false;

      // Generate HTML chunks
      const htmlChunks = this.generateMockHtml(context);
      for (const chunk of htmlChunks) {
        // Check for timeout
        const elapsed = Date.now() - startTime;
        if (elapsed > TIMEOUT_CONFIG.REQUEST_TIMEOUT) {
          throw new AIServiceError(
            'Request timeout after 30 seconds',
            'TIMEOUT',
            true
          );
        }

        // Display progress indicator after 10 seconds
        if (elapsed > TIMEOUT_CONFIG.PROGRESS_DISPLAY && !progressDisplayed) {
          progressDisplayed = true;
          console.log('AI generation in progress...');
        }

        state.html += chunk;
        state.lastChunkTime = Date.now();

        yield {
          type: 'html',
          content: chunk,
          isComplete: false,
        };

        // Simulate network delay (reduced for faster testing)
        await this.delay(10);
      }

      // Generate CSS chunks
      const cssChunks = this.generateMockCss(context);
      for (const chunk of cssChunks) {
        state.css += chunk;
        state.lastChunkTime = Date.now();

        yield {
          type: 'css',
          content: chunk,
          isComplete: false,
        };

        await this.delay(10);
      }

      // Generate JS chunks
      const jsChunks = this.generateMockJs(context);
      for (const chunk of jsChunks) {
        state.js += chunk;
        state.lastChunkTime = Date.now();

        yield {
          type: 'js',
          content: chunk,
          isComplete: false,
        };

        await this.delay(10);
      }

      // Extract identifiers from generated HTML
      state.identifiers = this.extractIdentifiers(state.html);
      state.isComplete = true;

      // Validate the response
      const result: AIGenerationResult = {
        html: state.html,
        css: state.css,
        js: state.js,
        identifiers: state.identifiers,
      };

      if (!this.validateResponse(result)) {
        throw new AIServiceError(
          'Generated content is invalid',
          'INVALID_RESPONSE',
          true
        );
      }

      return result;
    } catch (error) {
      // Handle interruption - preserve partial content
      if (error instanceof AIServiceError && error.retryable) {
        return {
          html: state.html,
          css: state.css,
          js: state.js,
          identifiers: state.identifiers,
          error: error.message,
        };
      }
      throw error;
    } finally {
      // Clean up streaming state
      this.streamingStates.delete(stateId);
    }
  }

  /**
   * Optimize an existing element
   */
  async optimizeElement(
    elementHtml: string,
    _optimizationPrompt: string,
    _screenshot?: Blob
  ): Promise<AIOptimizationResult> {
    return this.withRetry(async () => {
      const startTime = Date.now();

      // Simulate AI processing
      await this.delay(500);

      // Check timeout
      if (Date.now() - startTime > TIMEOUT_CONFIG.REQUEST_TIMEOUT) {
        throw new AIServiceError(
          'Optimization timeout after 30 seconds',
          'TIMEOUT',
          true
        );
      }

      // Mock optimization result
      const result: AIOptimizationResult = {
        html: elementHtml.replace(/class="[^"]*"/, 'class="optimized"'),
        styles: {
          'background-color': '#f0f0f0',
          padding: '16px',
          'border-radius': '8px',
        },
      };

      if (!this.validateResponse(result)) {
        throw new AIServiceError(
          'Optimization result is invalid',
          'INVALID_RESPONSE',
          true
        );
      }

      return result;
    });
  }

  /**
   * Generate multiple pages in batch
   * Per-page generation: each page gets self-contained HTML with inline CSS/JS
   * Feature: per-page-batch-generation
   * Requirements: 8.1, 8.2, 8.3
   */
  async *generateBatch(
    context: AIGenerationContext
  ): AsyncGenerator<import('../../types').BatchStreamEvent, BatchGenerationResult, void> {
    if (!context.batchGeneration) {
      throw new AIServiceError(
        'Batch generation context is required',
        'INVALID_RESPONSE',
        false
      );
    }

    const { appContext } = context.batchGeneration;

    // If no appContext, fall back to old behavior (for backward compatibility)
    if (!appContext) {
      const { count, pageTypes } = context.batchGeneration;
      const pages: BatchGenerationResult['pages'] = [];

      try {
        for (let i = 0; i < count; i++) {
          const pageType = pageTypes[i] || `page-${i + 1}`;
          const pageContext: AIGenerationContext = {
            ...context,
            prompt: `${context.prompt} - ${pageType}`,
            batchGeneration: undefined,
          };

          // Generate each page
          let pageHtml = '';
          let pageCss = '';
          let pageJs = '';

          for await (const chunk of this.generateHtml(pageContext)) {
            // Forward chunks to caller
            yield chunk;

            // Accumulate content
            if (chunk.type === 'html') pageHtml += chunk.content;
            if (chunk.type === 'css') pageCss += chunk.content;
            if (chunk.type === 'js') pageJs += chunk.content;
          }

          pages.push({
            name: pageType,
            html: pageHtml,
            css: pageCss,
            js: pageJs,
          });
        }

        return { pages };
      } catch (error) {
        return {
          pages,
          error: error instanceof Error ? error.message : 'Batch generation failed',
        };
      }
    }

    // Per-page batch generation with AppContext
    const pages: BatchGenerationResult['pages'] = [];
    const totalPages = appContext.pages.length;

    console.log('[MockAIService] Starting per-page batch generation with appContext:', {
      appName: appContext.appName,
      appType: appContext.appType,
      pageCount: totalPages,
    });

    for (let i = 0; i < totalPages; i++) {
      const pageSpec = appContext.pages[i];
      const selfContainedHtml = this.generateSelfContainedPage(pageSpec, appContext);
      const { html, css, js } = extractHtmlSections(selfContainedHtml);

      await this.delay(50);

      // Yield page-complete event
      yield {
        type: 'page-complete',
        page: { name: pageSpec.name, html, css, js },
        pageIndex: i,
        totalPages,
      } as import('../../types').BatchPageChunk;

      // Yield progress event
      yield {
        type: 'batch-progress',
        pagesCompleted: i + 1,
        totalPages,
      } as import('../../types').BatchProgressChunk;

      pages.push({ name: pageSpec.name, html, css, js });
    }

    console.log('[MockAIService] Per-page batch generation complete, pages:', pages.length);

    return { pages };
  }

  /**
   * Generate a self-contained HTML page with inline CSS and JS
   * Feature: per-page-batch-generation
   * Requirements: 8.1, 8.2
   */
  private generateSelfContainedPage(pageSpec: PageSpec, appContext: AppContext): string {
    const { appName, appType, pages: allPages } = appContext;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);

    // Theme colors based on app type
    const themeColors: Record<string, { primary: string; secondary: string; accent: string }> = {
      ecommerce: { primary: '#2563eb', secondary: '#7c3aed', accent: '#f59e0b' },
      blog: { primary: '#059669', secondary: '#0891b2', accent: '#dc2626' },
      dashboard: { primary: '#6366f1', secondary: '#8b5cf6', accent: '#ec4899' },
      portfolio: { primary: '#0ea5e9', secondary: '#06b6d4', accent: '#f97316' },
    };
    const colors = themeColors[appType] || themeColors.ecommerce;

    // Build navigation links with data-page-target
    const navLinks = allPages
      .map(page => `<a href="#" data-page-target="${page.name}">${page.role}</a>`)
      .join('\n          ');

    // Build contextual links for this page's linksTo targets
    const contextualLinks = pageSpec.linksTo.length > 0
      ? `<div style="margin-top: 24px; display: flex; gap: 8px;">
        ${pageSpec.linksTo.map(target =>
          `<a href="#" data-page-target="${target}" class="btn-primary">Go to ${target}</a>`
        ).join('\n        ')}
      </div>`
      : '';

    // Generate page-specific main content based on role
    let mainContent = '';
    if (pageSpec.name === 'home' || pageSpec.role.includes('首页') || pageSpec.role.includes('Home')) {
      mainContent = `<h1 data-uuid="heading-${timestamp}-${random}" style="font-size: 32px; font-weight: 700; margin-bottom: 16px;">
        Welcome to ${pageSpec.role}
      </h1>
      <p style="color: var(--text-secondary); margin-bottom: 24px;">
        This is the main landing page of the application. Explore the navigation above to visit other pages.
      </p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px;">
        <div style="padding: 24px; background: var(--surface-color); border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
          <h3 style="font-size: 18px; margin-bottom: 8px;">Feature 1</h3>
          <p style="color: var(--text-secondary);">Discover amazing features</p>
        </div>
        <div style="padding: 24px; background: var(--surface-color); border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
          <h3 style="font-size: 18px; margin-bottom: 8px;">Feature 2</h3>
          <p style="color: var(--text-secondary);">Explore more options</p>
        </div>
        <div style="padding: 24px; background: var(--surface-color); border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
          <h3 style="font-size: 18px; margin-bottom: 8px;">Feature 3</h3>
          <p style="color: var(--text-secondary);">Get started today</p>
        </div>
      </div>`;
    } else if (pageSpec.name.includes('product') || pageSpec.role.includes('产品')) {
      mainContent = `<h1 data-uuid="heading-${timestamp}-${random}" style="font-size: 32px; font-weight: 700; margin-bottom: 16px;">
        ${pageSpec.role}
      </h1>
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px;">
        ${[1, 2, 3, 4].map(i => `
        <div style="border: 1px solid var(--border-color); border-radius: 8px; padding: 16px; background: white;">
          <div style="width: 100%; height: 150px; background: var(--surface-color); border-radius: 4px; margin-bottom: 8px;"></div>
          <h3 style="font-size: 16px; margin-bottom: 4px;">Product ${i}</h3>
          <p style="color: var(--text-secondary); font-size: 14px;">${(i * 10 + 99).toFixed(2)}</p>
          <button class="btn-primary" style="width: 100%; margin-top: 8px;">Add to Cart</button>
        </div>
        `).join('')}
      </div>`;
    } else if (pageSpec.name.includes('cart') || pageSpec.role.includes('购物车')) {
      mainContent = `<h1 data-uuid="heading-${timestamp}-${random}" style="font-size: 32px; font-weight: 700; margin-bottom: 16px;">
        ${pageSpec.role}
      </h1>
      <div style="background: var(--surface-color); padding: 24px; border-radius: 12px;">
        <p style="color: var(--text-secondary);">Your cart is empty</p>
        <button class="btn-primary" style="margin-top: 16px;">Continue Shopping</button>
      </div>`;
    } else {
      mainContent = `<h1 data-uuid="heading-${timestamp}-${random}" style="font-size: 32px; font-weight: 700; margin-bottom: 16px;">
        ${pageSpec.role}
      </h1>
      <p style="color: var(--text-secondary); margin-bottom: 24px;">
        This is the ${pageSpec.role} page. Content specific to this page will be displayed here.
      </p>
      <div style="background: var(--surface-color); padding: 32px; border-radius: 12px; text-align: center;">
        <p>Page content goes here</p>
      </div>`;
    }

    // Build the complete self-contained HTML with inline <style> and <script>
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageSpec.role} - ${appName}</title>
  <style>
:root {
  --primary-color: ${colors.primary};
  --secondary-color: ${colors.secondary};
  --accent-color: ${colors.accent};
  --background-color: #ffffff;
  --surface-color: #f8fafc;
  --text-color: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: var(--font-family);
  font-size: 16px;
  color: var(--text-color);
  background-color: var(--background-color);
  line-height: 1.6;
}

a { color: var(--primary-color); text-decoration: none; transition: color 0.2s; }
a:hover { color: var(--secondary-color); }

button { font-family: var(--font-family); cursor: pointer; border: none; transition: all 0.2s; }

.btn-primary {
  background-color: var(--primary-color);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
}
.btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }

/* Page-specific styles for ${pageSpec.name} */
#main-content { animation: fadeIn 0.3s ease-in; }
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
  </style>
</head>
<body>
  <header style="background-color: var(--surface-color); border-bottom: 1px solid var(--border-color); padding: 16px 24px;">
    <nav style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;">
      <div style="font-size: 24px; font-weight: 700; color: var(--primary-color);">
        ${appName}
      </div>
      <div style="display: flex; gap: 16px;">
        ${navLinks}
      </div>
    </nav>
  </header>

  <main id="main-${timestamp}-${random}" style="max-width: 1200px; margin: 0 auto; padding: 32px;">
    ${mainContent}
    ${contextualLinks}
  </main>

  <footer style="background-color: var(--surface-color); border-top: 1px solid var(--border-color); padding: 24px; margin-top: 32px;">
    <div style="max-width: 1200px; margin: 0 auto; text-align: center; color: var(--text-secondary);">
      <p>&copy; 2024 ${appName}. All rights reserved.</p>
      <div style="margin-top: 8px; display: flex; justify-content: center; gap: 16px;">
        ${allPages.slice(0, 3).map(page => `<a href="#" data-page-target="${page.name}">${page.role}</a>`).join('\n        ')}
      </div>
    </div>
  </footer>

  <script>
// Page-specific JavaScript for ${pageSpec.name}
document.addEventListener('DOMContentLoaded', function() {
  console.log('${pageSpec.role} loaded');

  // Handle inter-page navigation
  document.querySelectorAll('[data-page-target]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var targetPage = this.getAttribute('data-page-target');
      console.log('Navigate to:', targetPage);
    });
  });
});
  </script>
</body>
</html>`;
  }

  /**
   * Parse application description to extract structured information
   * Feature: intelligent-app-context-parsing
   * Requirements: 5.1
   * 
   * Mock implementation that returns a generic multi-page application structure
   * based on common patterns. In production, this would use AI to analyze
   * the description and extract meaningful page structures.
   * 
   * @param prompt - Natural language application description
   * @returns Promise resolving to JSON string containing AppContext structure
   */
  async parseAppDescription(prompt: string): Promise<string> {
    // Simulate AI processing delay
    await this.delay(500);

    // Detect language (simple heuristic)
    const isChinese = /[\u4e00-\u9fa5]/.test(prompt);

    // Extract application type hints from prompt
    const lowerPrompt = prompt.toLowerCase();
    let appType = 'application';
    let pages: Array<{ name: string; role: string; linksTo: string[]; order: number }> = [];

    // Try to infer application type and pages from keywords
    if (lowerPrompt.includes('agent') || lowerPrompt.includes('task')) {
      appType = 'agent-system';
      pages = [
        {
          name: 'dashboard',
          role: isChinese ? '仪表板' : 'Dashboard',
          linksTo: ['agents', 'tasks', 'settings'],
          order: 0,
        },
        {
          name: 'agents',
          role: isChinese ? 'Agent 列表' : 'Agent List',
          linksTo: ['dashboard', 'agent-detail'],
          order: 1,
        },
        {
          name: 'agent-detail',
          role: isChinese ? 'Agent 详情' : 'Agent Details',
          linksTo: ['dashboard', 'agents'],
          order: 2,
        },
        {
          name: 'tasks',
          role: isChinese ? '任务管理' : 'Task Management',
          linksTo: ['dashboard', 'task-detail'],
          order: 3,
        },
        {
          name: 'task-detail',
          role: isChinese ? '任务详情' : 'Task Details',
          linksTo: ['dashboard', 'tasks'],
          order: 4,
        },
        {
          name: 'settings',
          role: isChinese ? '设置' : 'Settings',
          linksTo: ['dashboard'],
          order: 5,
        },
      ];
    } else if (lowerPrompt.includes('desktop') || lowerPrompt.includes('mac')) {
      appType = 'desktop-app';
      pages = [
        {
          name: 'home',
          role: isChinese ? '首页' : 'Home',
          linksTo: ['features', 'settings', 'about'],
          order: 0,
        },
        {
          name: 'features',
          role: isChinese ? '功能' : 'Features',
          linksTo: ['home', 'settings'],
          order: 1,
        },
        {
          name: 'settings',
          role: isChinese ? '设置' : 'Settings',
          linksTo: ['home'],
          order: 2,
        },
        {
          name: 'about',
          role: isChinese ? '关于' : 'About',
          linksTo: ['home'],
          order: 3,
        },
      ];
    } else {
      // Generic application structure
      pages = [
        {
          name: 'home',
          role: isChinese ? '首页' : 'Home',
          linksTo: ['features', 'about'],
          order: 0,
        },
        {
          name: 'features',
          role: isChinese ? '功能' : 'Features',
          linksTo: ['home'],
          order: 1,
        },
        {
          name: 'about',
          role: isChinese ? '关于' : 'About',
          linksTo: ['home'],
          order: 2,
        },
      ];
    }

    // Extract app name from prompt
    let appName = 'Application';
    const createMatch = prompt.match(/(?:创建|生成|制作|create|build|make)\s*(?:一个|an?|the)?\s*([^，,。.]+?)(?:应用|程序|网站|系统|app|application|website|system)/i);
    if (createMatch && createMatch[1]) {
      appName = createMatch[1].trim();
    }

    // Build AppContext response
    const appContext = {
      appName: appName || (isChinese ? '应用程序' : 'Application'),
      appType,
      pages,
      originalPrompt: prompt,
    };

    return JSON.stringify(appContext, null, 2);
  }

  /**
   * Validate AI response
   */
  validateResponse(response: unknown): boolean {
    if (!response || typeof response !== 'object') {
      return false;
    }

    // Validate AIGenerationResult
    if ('html' in response && 'css' in response && 'js' in response) {
      const result = response as AIGenerationResult;
      return (
        typeof result.html === 'string' &&
        typeof result.css === 'string' &&
        typeof result.js === 'string' &&
        result.html.trim().length > 0 // HTML must not be empty
      );
    }

    // Validate AIOptimizationResult
    if ('html' in response || 'styles' in response) {
      const result = response as AIOptimizationResult;
      return (
        (result.html !== undefined && typeof result.html === 'string' && result.html.trim().length > 0) ||
        (result.styles !== undefined && typeof result.styles === 'object' && Object.keys(result.styles).length > 0)
      );
    }

    // Validate BatchGenerationResult
    if ('pages' in response) {
      const result = response as BatchGenerationResult;
      return (
        Array.isArray(result.pages) &&
        result.pages.every(
          (page) =>
            typeof page.name === 'string' &&
            typeof page.html === 'string' &&
            typeof page.css === 'string' &&
            typeof page.js === 'string' &&
            page.html.trim().length > 0 // HTML must not be empty
        )
      );
    }

    return false;
  }

  /**
   * Retry wrapper for operations
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    retries = TIMEOUT_CONFIG.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry non-retryable errors
        if (error instanceof AIServiceError && !error.retryable) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === retries) {
          break;
        }

        // Wait before retrying
        await this.delay(TIMEOUT_CONFIG.RETRY_DELAY * (attempt + 1));
      }
    }

    throw new AIServiceError(
      `Operation failed after ${retries + 1} attempts: ${lastError?.message}`,
      'GENERATION_FAILED',
      false
    );
  }

  /**
   * Generate mock HTML chunks
   * In production, this would use the design system adapter to guide AI generation
   */
  private generateMockHtml(context: AIGenerationContext): string[] {
    const designSystem = context.designSystem || 'vanilla';
    const chunks: string[] = [];
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);

    chunks.push('<!DOCTYPE html>\n');
    chunks.push('<html lang="en">\n');
    chunks.push('<head>\n');
    chunks.push('  <meta charset="UTF-8">\n');
    chunks.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n');
    chunks.push(`  <title>${context.prompt}</title>\n`);
    
    // Add design system-specific CDN links
    if (designSystem === 'tailwind') {
      chunks.push('  <script src="https://cdn.tailwindcss.com"></script>\n');
    } else if (designSystem === 'material-ui') {
      chunks.push('  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap" />\n');
      chunks.push('  <link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons" />\n');
    } else if (designSystem === 'ant-design') {
      chunks.push('  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/antd@5/dist/reset.css" />\n');
    }
    
    chunks.push('</head>\n');
    chunks.push('<body>\n');
    
    // Generate design system-specific HTML
    if (designSystem === 'tailwind') {
      chunks.push(`  <div id="root-${timestamp}-${random}" class="container mx-auto p-4">\n`);
      chunks.push(`    <h1 data-uuid="heading-${timestamp}-${random}" class="text-3xl font-bold text-gray-900 mb-4">${context.prompt}</h1>\n`);
      chunks.push(`    <button id="btn-${timestamp}-${random}" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Click Me</button>\n`);
    } else if (designSystem === 'material-ui') {
      chunks.push(`  <div id="root-${timestamp}-${random}">\n`);
      chunks.push(`    <!-- Note: Material UI requires React. This is a simplified example. -->\n`);
      chunks.push(`    <h1 data-uuid="heading-${timestamp}-${random}" style="font-family: Roboto, sans-serif; font-size: 2rem; font-weight: 500; margin-bottom: 1rem;">${context.prompt}</h1>\n`);
      chunks.push(`    <button id="btn-${timestamp}-${random}" style="background-color: #1976d2; color: white; padding: 8px 16px; border: none; border-radius: 4px; font-family: Roboto, sans-serif; font-weight: 500; cursor: pointer;">Click Me</button>\n`);
    } else if (designSystem === 'ant-design') {
      chunks.push(`  <div id="root-${timestamp}-${random}" style="padding: 24px;">\n`);
      chunks.push(`    <!-- Note: Ant Design requires React. This is a simplified example. -->\n`);
      chunks.push(`    <h1 data-uuid="heading-${timestamp}-${random}" style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">${context.prompt}</h1>\n`);
      chunks.push(`    <button id="btn-${timestamp}-${random}" style="background-color: #1890ff; color: white; padding: 4px 15px; border: none; border-radius: 2px; font-size: 14px; cursor: pointer;">Click Me</button>\n`);
    } else {
      chunks.push(`  <div id="root-${timestamp}-${random}" class="${designSystem}">\n`);
      chunks.push(`    <h1 data-uuid="heading-${timestamp}-${random}">${context.prompt}</h1>\n`);
      chunks.push(`    <button id="btn-${timestamp}-${random}" class="primary">Click Me</button>\n`);
    }
    
    chunks.push('  </div>\n');
    chunks.push('</body>\n');
    chunks.push('</html>');

    return chunks;
  }

  /**
   * Generate mock CSS chunks
   */
  private generateMockCss(_context: AIGenerationContext): string[] {
    return [
      'body {\n',
      '  font-family: Arial, sans-serif;\n',
      '  margin: 0;\n',
      '  padding: 20px;\n',
      '}\n',
      '.primary {\n',
      '  background-color: #007bff;\n',
      '  color: white;\n',
      '  padding: 10px 20px;\n',
      '  border: none;\n',
      '  border-radius: 4px;\n',
      '  cursor: pointer;\n',
      '}\n',
    ];
  }

  /**
   * Generate mock JS chunks
   */
  private generateMockJs(_context: AIGenerationContext): string[] {
    return [
      'document.addEventListener("DOMContentLoaded", function() {\n',
      '  console.log("Page loaded");\n',
      '});\n',
    ];
  }

  /**
   * Extract identifiers from HTML
   */
  private extractIdentifiers(html: string): string[] {
    const identifiers: string[] = [];
    const idRegex = /id="([^"]+)"/g;
    const uuidRegex = /data-uuid="([^"]+)"/g;

    let match;
    while ((match = idRegex.exec(html)) !== null) {
      identifiers.push(match[1]);
    }
    while ((match = uuidRegex.exec(html)) !== null) {
      identifiers.push(match[1]);
    }

    return identifiers;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
