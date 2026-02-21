/**
 * Anthropic Claude Service Implementation
 * Feature: ai-html-visual-editor
 * 
 * Real AI service implementation using Anthropic Claude API
 */

import type {
  AIGenerationContext,
  AIGenerationChunk,
  AIGenerationResult,
  AIOptimizationResult,
  BatchGenerationResult,
} from '../../types';
import type { AIService } from './AIService';
import { AIServiceError, TIMEOUT_CONFIG } from './AIService';
import { loadPrompt } from './promptLoader';

/**
 * Anthropic API Configuration
 */
export interface AnthropicConfig {
  apiKey: string;
  model?: string;
  baseURL?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Anthropic Claude Service Implementation
 */
export class AnthropicService implements AIService {
  private config: Required<AnthropicConfig>;

  constructor(config: AnthropicConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'claude-3-5-sonnet-20241022',
      baseURL: config.baseURL || 'https://api.anthropic.com/v1',
      maxTokens: config.maxTokens || 4000,
      temperature: config.temperature || 0.7,
    };

    if (!this.config.apiKey) {
      throw new AIServiceError(
        'Anthropic API key is required',
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
      
      // Accumulate the full response (same as batch generation and OpenAI)
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

      // Parse sections once at the end (same as batch generation and OpenAI)
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
        `Anthropic API error: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
      
      const messages: any[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      // Add screenshot if provided (Claude supports vision)
      if (screenshot) {
        const base64Image = await this.blobToBase64(screenshot);
        const imageData = base64Image.split(',')[1]; // Remove data:image/...;base64, prefix
        const mediaType = base64Image.match(/data:(.*?);base64/)?.[1] || 'image/png';
        
        messages[0].content = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageData,
            },
          },
          {
            type: 'text',
            text: prompt,
          },
        ];
      }

      const response = await this.callAPI('/messages', {
        model: this.config.model,
        messages,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: loadPrompt('optimization-system'),
      });

      const content = response.content[0]?.text;
      if (!content) {
        throw new AIServiceError(
          'Empty response from Anthropic',
          'INVALID_RESPONSE',
          true
        );
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new AIServiceError(
          'Could not parse JSON from response',
          'INVALID_RESPONSE',
          true
        );
      }

      const result = JSON.parse(jsonMatch[0]) as AIOptimizationResult;

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
   * Generate multiple pages in batch
   */
  async *generateBatch(
    context: AIGenerationContext
  ): AsyncGenerator<AIGenerationChunk, BatchGenerationResult, void> {
    if (!context.batchGeneration) {
      throw new AIServiceError(
        'Batch generation context is required',
        'INVALID_RESPONSE',
        false
      );
    }

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
    } catch (error) {
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
   * Uses Claude AI to analyze a natural language application description
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
        // Call Anthropic API
        const response = await fetch(`${this.config.baseURL}/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.config.apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: this.config.model,
            messages: [
              {
                role: 'user',
                content: userPrompt,
              },
            ],
            max_tokens: 2000,
            temperature: 0.3,
            system: systemPrompt,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
          throw new AIServiceError(
            `Anthropic API error: ${error.error?.message || response.statusText}`,
            'NETWORK',
            true
          );
        }

        const data = await response.json();
        
        // Extract text content from response
        let content = '';
        if (data.content && Array.isArray(data.content)) {
          for (const block of data.content) {
            if (block.type === 'text' && block.text) {
              content += block.text;
            }
          }
        }

        if (!content) {
          throw new AIServiceError(
            'Empty response from Anthropic API',
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

        // Extract JSON from response (may still be wrapped)
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new AIServiceError(
            'Could not extract JSON from response',
            'INVALID_RESPONSE',
            false
          );
        }

        // Validate JSON structure
        const parsed = JSON.parse(jsonMatch[0]);
        if (!parsed.appName || !parsed.appType || !Array.isArray(parsed.pages)) {
          throw new AIServiceError(
            'Invalid AppContext structure in response',
            'INVALID_RESPONSE',
            false
          );
        }

        return jsonMatch[0];
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
   * Stream completion from Anthropic
   */
  private async *streamCompletion(prompt: string): AsyncGenerator<string, void, void> {
    // Create an AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_CONFIG.REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${this.config.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: true,
          system: loadPrompt('generation-system'),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        clearTimeout(timeoutId);
        const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
        throw new AIServiceError(
          `Anthropic API error: ${error.error?.message || response.statusText}`,
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
              
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.type === 'content_block_delta') {
                  const content = parsed.delta?.text;
                  if (content) {
                    yield content;
                  }
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
   * Call Anthropic API (non-streaming)
   */
  private async callAPI(endpoint: string, body: any): Promise<any> {
    const response = await fetch(`${this.config.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      throw new AIServiceError(
        `Anthropic API error: ${error.error?.message || response.statusText}`,
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
