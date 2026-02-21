/**
 * AI Service for HTML generation and optimization
 * Feature: ai-html-visual-editor
 * Requirements: 1.1, 1.2, 1.6, 1.8, 3.1, 7.5, 7.6, 8.5, 8.6
 * 
 * Design System Integration:
 * - Supports Material UI, Ant Design, Tailwind CSS, and vanilla HTML
 * - Uses design system adapters to provide AI with component syntax and conventions
 * - Validates generated code against design system best practices
 * - In production, the AI prompt would include design system instructions from adapters
 */

import type {
  AIGenerationContext,
  AIGenerationChunk,
  AIGenerationResult,
  AIOptimizationResult,
  BatchGenerationResult,
} from '../../types';
import type { AIConfig } from './config';
import { getAIConfigFromEnv, validateAIConfig } from './config';
import { OpenAIService } from './OpenAIService';
import { AnthropicService } from './AnthropicService';
import { MockAIService } from './MockAIService';

/**
 * Timeout configuration
 */
export const TIMEOUT_CONFIG = {
  PROGRESS_DISPLAY: 10000, // 10 seconds - show progress indicator
  REQUEST_TIMEOUT: 120000, // 120 seconds - timeout the request (increased for real AI services)
  RETRY_DELAY: 1000, // 1 second - delay between retries
  MAX_RETRIES: 3, // Maximum number of retry attempts
} as const;

/**
 * AI Service interface for HTML generation and optimization
 */
export interface AIService {
  /**
   * Generate HTML/CSS/JS from natural language description (streaming)
   * @param context - AI generation context with prompt and options
   * @returns AsyncGenerator yielding chunks of generated content
   */
  generateHtml(
    context: AIGenerationContext
  ): AsyncGenerator<AIGenerationChunk, AIGenerationResult, void>;

  /**
   * Optimize an existing HTML element
   * @param elementHtml - Current HTML of the element
   * @param optimizationPrompt - Natural language optimization request
   * @param screenshot - Optional screenshot for visual context
   * @returns Promise resolving to optimization result
   */
  optimizeElement(
    elementHtml: string,
    optimizationPrompt: string,
    screenshot?: Blob
  ): Promise<AIOptimizationResult>;

  /**
   * Generate multiple pages in batch
   * @param context - AI generation context with batch configuration
   * @returns AsyncGenerator yielding batch generation progress
   */
  generateBatch(
    context: AIGenerationContext
  ): AsyncGenerator<import('../../types').BatchStreamEvent, BatchGenerationResult, void>;

  /**
   * Parse application description to extract structured information
   * Feature: intelligent-app-context-parsing
   * Requirements: 5.1
   * 
   * Analyzes a natural language application description and extracts
   * structured information about the application including:
   * - Application name and type
   * - List of pages with roles and relationships
   * - Navigation structure
   * 
   * @param prompt - Natural language application description
   * @returns Promise resolving to JSON string containing AppContext structure
   * 
   * @example
   * ```typescript
   * const result = await service.parseAppDescription(
   *   'Create a multi-agent desktop app for Mac with task management'
   * );
   * const appContext = JSON.parse(result);
   * ```
   */
  parseAppDescription(prompt: string): Promise<string>;

  /**
   * Validate AI response for correctness
   * @param response - Response to validate
   * @returns true if response is valid, false otherwise
   */
  validateResponse(response: unknown): boolean;
}

/**
 * Error types for AI service
 */
export class AIServiceError extends Error {
  readonly code: 'TIMEOUT' | 'NETWORK' | 'INVALID_RESPONSE' | 'GENERATION_FAILED';
  readonly retryable: boolean;

  constructor(
    message: string,
    code: 'TIMEOUT' | 'NETWORK' | 'INVALID_RESPONSE' | 'GENERATION_FAILED',
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.retryable = retryable;
  }
}

/**
 * Create AI service instance
 */
export function createAIService(config?: AIConfig): AIService {
  // Get configuration from environment if not provided
  const finalConfig = config || getAIConfigFromEnv();
  
  // Validate configuration
  const validation = validateAIConfig(finalConfig);
  if (!validation.valid) {
    console.warn(`AI Service configuration warning: ${validation.error}`);
    console.warn('Falling back to mock service');
    return new MockAIService();
  }

  // Create service based on provider
  switch (finalConfig.provider) {
    case 'openai':
      if (!finalConfig.apiKey) {
        console.warn('OpenAI API key not found, using mock service');
        return new MockAIService();
      }
      return new OpenAIService({
        apiKey: finalConfig.apiKey,
        model: finalConfig.model,
        baseURL: finalConfig.baseURL,
        organization: finalConfig.organization,
        maxTokens: finalConfig.maxTokens,
        temperature: finalConfig.temperature,
      });

    case 'anthropic':
      if (!finalConfig.apiKey) {
        console.warn('Anthropic API key not found, using mock service');
        return new MockAIService();
      }
      return new AnthropicService({
        apiKey: finalConfig.apiKey,
        model: finalConfig.model,
        baseURL: finalConfig.baseURL,
        maxTokens: finalConfig.maxTokens,
        temperature: finalConfig.temperature,
      });

    case 'mock':
    default:
      return new MockAIService();
  }
}
