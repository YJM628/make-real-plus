/**
 * OpenAI Service Implementation
 * Feature: ai-html-visual-editor
 * 
 * Real AI service implementation using OpenAI API
 */

import type {
  AIGenerationContext,
  AIGenerationChunk,
  AIGenerationResult,
  AIOptimizationResult,
  BatchGenerationResult,
  BatchStreamEvent,
  BatchPageChunk,
  BatchProgressChunk,
} from '../../types';
import type { AIService } from './AIService';
import { AIServiceError, TIMEOUT_CONFIG } from './AIService';
import { buildPerPagePrompt, extractHtmlSections } from '../../utils/batch/buildPerPagePrompt';
import { loadPrompt } from './promptLoader';

/**
 * OpenAI API Configuration
 */
export interface OpenAIConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  organization?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * OpenAI Service Implementation
 */
export class OpenAIService implements AIService {
  private config: Required<OpenAIConfig>;

  constructor(config: OpenAIConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'gpt-4-turbo-preview',
      baseURL: config.baseURL || 'https://api.openai.com/v1',
      organization: config.organization || '',
      maxTokens: config.maxTokens || 4000,
      temperature: config.temperature || 0.7,
    };

    if (!this.config.apiKey) {
      throw new AIServiceError(
        'OpenAI API key is required',
        'INVALID_RESPONSE',
        false
      );
    }
  }

  /**
   * Generate HTML/CSS/JS from natural language (streaming)
   */
  async *generateHtml(
    context: AIGenerationContext
  ): AsyncGenerator<AIGenerationChunk, AIGenerationResult, void> {
    const startTime = Date.now();
    let progressDisplayed = false;

    try {
      const prompt = this.buildGenerationPrompt(context);
      
      // Accumulate the full response (same as batch generation)
      let rawResponse = '';
      
      for await (const chunk of this.streamCompletion(prompt)) {
        // Check timeout (60 seconds, same as batch generation)
        const elapsed = Date.now() - startTime;
        if (elapsed > TIMEOUT_CONFIG.REQUEST_TIMEOUT) {
          throw new AIServiceError(
            `Request timeout after ${TIMEOUT_CONFIG.REQUEST_TIMEOUT / 1000} seconds`,
            'TIMEOUT',
            true
          );
        }

        // Display progress indicator
        if (elapsed > TIMEOUT_CONFIG.PROGRESS_DISPLAY && !progressDisplayed) {
          progressDisplayed = true;
          console.log('AI generation in progress...');
        }

        rawResponse += chunk;
        
        // Don't yield chunks during streaming - we'll return the parsed result at the end
        // This prevents showing raw markdown content to the user
      }

      // Parse sections once at the end (same as batch generation)
      const sections = this.parseSections(rawResponse);
      
      const result: AIGenerationResult = {
        html: sections.html,
        css: sections.css,
        js: sections.js,
        identifiers: this.extractIdentifiers(sections.html),
      };

      // Validate response
      if (!this.validateResponse(result)) {
        throw new AIServiceError(
          'Generated content is invalid or empty',
          'INVALID_RESPONSE',
          true
        );
      }

      return result;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceError(
        `OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GENERATION_FAILED',
        true
      );
    }
  }

  /**
   * Optimize an existing element
   */
  async optimizeElement(
    elementHtml: string,
    optimizationPrompt: string,
    screenshot?: Blob
  ): Promise<AIOptimizationResult> {
    try {
      const prompt = this.buildOptimizationPrompt(elementHtml, optimizationPrompt);
      
      let messages: any[] = [
        {
          role: 'system',
          content: loadPrompt('optimization-system'),
        },
        {
          role: 'user',
          content: prompt,
        },
      ];

      // Add screenshot if provided (requires GPT-4 Vision)
      if (screenshot) {
        const base64Image = await this.blobToBase64(screenshot);
        messages = [
          {
            role: 'system',
            content: loadPrompt('vision-optimization-system'),
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: base64Image } },
            ],
          },
        ];
      }

      const response = await this.callAPI('/chat/completions', {
        model: screenshot ? 'gpt-4-vision-preview' : this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new AIServiceError(
          'Empty response from OpenAI',
          'INVALID_RESPONSE',
          true
        );
      }

      // Parse JSON response
      const result = JSON.parse(content) as AIOptimizationResult;

      if (!this.validateResponse(result)) {
        throw new AIServiceError(
          'Invalid optimization result',
          'INVALID_RESPONSE',
          true
        );
      }

      return result;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      throw new AIServiceError(
        `Optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GENERATION_FAILED',
        true
      );
    }
  }

  /**
   * Generate multiple pages in batch (per-page independent AI calls)
   * 
   * This method generates pages one at a time, each with an independent AI call.
   * It completely bypasses IncrementalParser and JSON parsing for reliability.
   * 
   * Requirements: 2.1, 2.2, 2.3, 2.5, 3.1, 3.2, 3.3, 7.1, 7.2, 7.3
   */
  async *generateBatch(
    context: AIGenerationContext
  ): AsyncGenerator<BatchStreamEvent, BatchGenerationResult, void> {
    if (!context.batchGeneration) {
      throw new AIServiceError(
        'Batch generation context is required',
        'INVALID_RESPONSE',
        false
      );
    }

    const pages: BatchGenerationResult['pages'] = [];

    try {
      // Check if we have an AppContext for per-page generation
      const appContext = context.batchGeneration.appContext;

      if (!appContext) {
        // Fallback to old behavior if no AppContext provided
        const { count, pageTypes } = context.batchGeneration;

        for (let i = 0; i < count; i++) {
          const pageType = pageTypes[i] || `page-${i + 1}`;
          const pageContext: AIGenerationContext = {
            ...context,
            prompt: `${context.prompt} - ${pageType}`,
            batchGeneration: undefined,
          };

          let pageHtml = '';
          let pageCss = '';
          let pageJs = '';

          for await (const chunk of this.generateHtml(pageContext)) {
            yield chunk;

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
      }

      // Per-page batch generation: independent AI call for each page
      const totalPages = appContext.pages.length;

      for (let i = 0; i < totalPages; i++) {
        const pageSpec = appContext.pages[i];
        try {
          // Build per-page prompt with shared context
          const prompt = buildPerPagePrompt(pageSpec, appContext);

          // Stream completion and accumulate full HTML
          let rawHtml = '';
          for await (const chunk of this.streamCompletion(prompt)) {
            rawHtml += chunk;
          }

          // Extract CSS/JS from self-contained HTML
          const { html, css, js } = extractHtmlSections(rawHtml);

          // Yield page-complete event immediately
          yield {
            type: 'page-complete',
            page: { name: pageSpec.name, html, css, js },
            pageIndex: i,
            totalPages,
          } as BatchPageChunk;

          // Yield progress event
          yield {
            type: 'batch-progress',
            pagesCompleted: i + 1,
            totalPages,
          } as BatchProgressChunk;

          pages.push({ name: pageSpec.name, html, css, js });
        } catch (error) {
          // Error isolation: log and continue with remaining pages
          console.error(`[OpenAIService] Page "${pageSpec.name}" failed:`, error);
        }
      }

      return { pages };

    } catch (error) {
      // Handle top-level failures
      if (error instanceof AIServiceError) {
        throw error;
      }

      return {
        pages,
        error: error instanceof Error ? error.message : 'Batch generation failed',
      };
    }
  }

  /**
   * Parse application description to extract structured information
   * Feature: intelligent-app-context-parsing
   * Requirements: 5.1, 5.2
   * 
   * Uses OpenAI GPT to analyze a natural language application description
   * and extract structured information about the application including
   * app name, type, and page structure.
   * 
   * @param prompt - Natural language application description
   * @returns Promise resolving to JSON string containing AppContext structure
   */
  async parseAppDescription(prompt: string): Promise<string> {
    try {
      const systemPrompt = `You are an expert at analyzing application descriptions and extracting structured information.

Your task is to analyze the user's application description and extract:
1. Application name
2. Application type (e.g., "ecommerce", "blog", "dashboard", "agent-system", "desktop-app", etc.)
3. List of pages with their roles and navigation relationships

Rules:
- Generate 2-8 pages based on the application description
- Page names must be in kebab-case format (lowercase, hyphens only)
- Page roles should be descriptive and human-readable
- If the description is in Chinese, use Chinese for page roles
- If the description is in English, use English for page roles
- Infer reasonable page relationships (linksTo) based on common patterns
- Home/dashboard pages should link to all other pages
- List pages should link to detail pages
- All pages should link back to home/dashboard

You MUST respond with ONLY a valid JSON object, no markdown, no explanation, no code fences.

Output format:
{
  "appName": "string",
  "appType": "string",
  "pages": [
    {
      "name": "kebab-case-name",
      "role": "Human Readable Role",
      "linksTo": ["other-page-name"],
      "order": 0
    }
  ],
  "originalPrompt": "original user input"
}`;

      const userPrompt = `Analyze this application description and extract structured information:

${prompt}

Return ONLY the JSON object, no markdown formatting or explanation.`;

      // Add abort controller for timeout (30 seconds)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        // Call OpenAI-compatible API
        const response = await fetch(`${this.config.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.apiKey}`,
            ...(this.config.organization && { 'OpenAI-Organization': this.config.organization }),
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              {
                role: 'system',
                content: systemPrompt,
              },
              {
                role: 'user',
                content: userPrompt,
              },
            ],
            max_tokens: 2000,
            temperature: 0.3,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
          throw new AIServiceError(
            `OpenAI API error: ${error.error?.message || response.statusText}`,
            'NETWORK',
            true
          );
        }

        const data = await response.json();
        
        // Extract content from response
        const content = data.choices?.[0]?.message?.content;
        if (!content) {
          throw new AIServiceError(
            'Empty response from OpenAI API',
            'INVALID_RESPONSE',
            false
          );
        }

        // Clean up content - remove markdown code fences if present
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.slice(7);
        } else if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.slice(3);
        }
        if (cleanContent.endsWith('```')) {
          cleanContent = cleanContent.slice(0, -3);
        }
        cleanContent = cleanContent.trim();

        // Parse and validate JSON
        const parsed = JSON.parse(cleanContent);
        if (!parsed.appName || !parsed.appType || !Array.isArray(parsed.pages)) {
          throw new AIServiceError(
            'Invalid AppContext structure in response',
            'INVALID_RESPONSE',
            false
          );
        }

        return cleanContent;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceError(
          'Application description parsing timed out',
          'TIMEOUT',
          true
        );
      }
      
      throw new AIServiceError(
        `Failed to parse application description: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'GENERATION_FAILED',
        false
      );
    }
  }

  /**
   * Validate AI response
   */
  validateResponse(response: unknown): boolean {
    if (!response || typeof response !== 'object') {
      return false;
    }

    if ('html' in response && 'css' in response && 'js' in response) {
      const result = response as AIGenerationResult;
      return (
        typeof result.html === 'string' &&
        typeof result.css === 'string' &&
        typeof result.js === 'string' &&
        result.html.trim().length > 0
      );
    }

    if ('html' in response || 'styles' in response) {
      const result = response as AIOptimizationResult;
      return (
        (result.html !== undefined && typeof result.html === 'string' && result.html.trim().length > 0) ||
        (result.styles !== undefined && typeof result.styles === 'object' && Object.keys(result.styles).length > 0)
      );
    }

    if ('pages' in response) {
      const result = response as BatchGenerationResult;
      return (
        Array.isArray(result.pages) &&
        result.pages.every(
          (page) =>
            typeof page.name === 'string' &&
            typeof page.html === 'string' &&
            page.html.trim().length > 0
        )
      );
    }

    return false;
  }

  /**
   * Build generation prompt with design system context
   */
  private buildGenerationPrompt(context: AIGenerationContext): string {
    let designSystemInstructions = '';

    // Add design system instructions
    if (context.designSystem && context.designSystem !== 'vanilla') {
      designSystemInstructions += `Use ${context.designSystem} design system.\n`;
      
      if (context.designSystem === 'tailwind') {
        designSystemInstructions += 'Use Tailwind CSS utility classes. Include the Tailwind CDN in the head.\n';
      } else if (context.designSystem === 'material-ui') {
        designSystemInstructions += 'Use Material Design principles. Include Material Icons and Roboto font.\n';
      } else if (context.designSystem === 'ant-design') {
        designSystemInstructions += 'Use Ant Design components and styling principles.\n';
      }
    }

    return loadPrompt('generation-user', {
      userPrompt: context.prompt,
      designSystemInstructions,
    });
  }

  /**
   * Build optimization prompt
   */
  private buildOptimizationPrompt(elementHtml: string, optimizationPrompt: string): string {
    return loadPrompt('optimization-user', {
      elementHtml,
      optimizationPrompt,
    });
  }

  /**
   * Stream completion from OpenAI
   */
  private async *streamCompletion(prompt: string): AsyncGenerator<string, void, void> {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_CONFIG.REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${this.config.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          ...(this.config.organization && { 'OpenAI-Organization': this.config.organization }),
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: loadPrompt('generation-system'),
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        clearTimeout(timeoutId);
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new AIServiceError(
          `OpenAI API error: ${error.error?.message || response.statusText}`,
          'NETWORK',
          true
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        clearTimeout(timeoutId);
        throw new AIServiceError('No response body', 'NETWORK', true);
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content;
                if (content) {
                  yield content;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
        clearTimeout(timeoutId);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceError(
          `Request timeout after ${TIMEOUT_CONFIG.REQUEST_TIMEOUT / 1000} seconds`,
          'TIMEOUT',
          true
        );
      }
      throw error;
    }
  }

  /**
   * Call OpenAI API (non-streaming)
   */
  private async callAPI(endpoint: string, body: any): Promise<any> {
    const response = await fetch(`${this.config.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        ...(this.config.organization && { 'OpenAI-Organization': this.config.organization }),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new AIServiceError(
        `OpenAI API error: ${error.error?.message || response.statusText}`,
        'NETWORK',
        true
      );
    }

    return response.json();
  }

  /**
   * Parse sections from AI response
   */
  private parseSections(text: string): { html: string; css: string; js: string } {
    const result = { html: '', css: '', js: '' };

    // Extract HTML
    const htmlMatch = text.match(/HTML:\s*```html\s*([\s\S]*?)```/i) ||
                     text.match(/```html\s*([\s\S]*?)```/i);
    if (htmlMatch) {
      result.html = htmlMatch[1].trim();
    }

    // Extract CSS
    const cssMatch = text.match(/CSS:\s*```css\s*([\s\S]*?)```/i) ||
                    text.match(/```css\s*([\s\S]*?)```/i);
    if (cssMatch) {
      result.css = cssMatch[1].trim();
    }

    // Extract JS
    const jsMatch = text.match(/JS:\s*```javascript\s*([\s\S]*?)```/i) ||
                   text.match(/```javascript\s*([\s\S]*?)```/i) ||
                   text.match(/```js\s*([\s\S]*?)```/i);
    if (jsMatch) {
      result.js = jsMatch[1].trim();
    }

    return result;
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
   * Convert Blob to base64
   */
  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}
