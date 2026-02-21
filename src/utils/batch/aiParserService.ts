/**
 * AI-driven application context parser service
 * Feature: intelligent-app-context-parsing
 * Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.4, 7.1
 * 
 * Uses AI services to parse arbitrary application descriptions
 * and extract structured AppContext information.
 */

import type { AppContext } from '../../types';
import type { AIService } from '../../services/ai/AIService';
import { ResponseValidator } from './responseValidator';

/**
 * AI Parser Service configuration
 */
export interface AIParserConfig {
  /** Timeout in milliseconds (default: 5000) */
  timeout?: number;
  
  /** Whether to log parsing attempts */
  verbose?: boolean;
}

/**
 * AI-driven application context parser
 * 
 * Provides intelligent parsing of application descriptions using AI services.
 * Falls back gracefully on errors and validates all responses.
 */
export class AIParserService {
  private aiService: AIService;
  private timeout: number;
  private verbose: boolean;

  /**
   * Create a new AI parser service
   * 
   * @param aiService - AI service instance to use for parsing
   * @param config - Optional configuration
   */
  constructor(aiService: AIService, config?: AIParserConfig) {
    this.aiService = aiService;
    this.timeout = config?.timeout || 30000; // 30 second default timeout (real AI APIs need more time)
    this.verbose = config?.verbose || false;
  }

  /**
   * Parse application description using AI
   * 
   * Analyzes a natural language application description and extracts
   * structured AppContext information including app name, type, and
   * page structure.
   * 
   * Features:
   * - Timeout protection (5 seconds default)
   * - Response validation
   * - Error handling with detailed logging
   * - Language detection (Chinese/English)
   * 
   * @param prompt - User's natural language application description
   * @returns Promise resolving to AppContext or null if parsing fails
   * 
   * Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.4, 7.1
   * 
   * @example
   * ```typescript
   * const parser = new AIParserService(aiService);
   * const context = await parser.parseWithAI(
   *   'Create a multi-agent desktop app for Mac'
   * );
   * ```
   */
  async parseWithAI(prompt: string): Promise<AppContext | null> {
    const startTime = Date.now();
    
    try {
      if (this.verbose) {
        console.log('[AIParser] Starting AI parsing for prompt:', prompt.substring(0, 100) + '...');
      }

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`AI parsing timeout after ${this.timeout}ms`));
        }, this.timeout);
      });

      // Race between AI parsing and timeout
      const responseJson = await Promise.race([
        this.aiService.parseAppDescription(prompt),
        timeoutPromise,
      ]);

      const elapsed = Date.now() - startTime;
      if (this.verbose) {
        console.log(`[AIParser] Received response in ${elapsed}ms`);
      }

      // Parse AI response
      const appContext = this.parseAIResponse(responseJson);
      
      if (!appContext) {
        if (this.verbose) {
          console.log('[AIParser] Failed to parse AI response');
        }
        return null;
      }

      // Validate response
      const validation = ResponseValidator.validateAppContext(appContext);
      
      if (!validation.valid) {
        if (this.verbose) {
          console.log('[AIParser] Validation failed:', validation.errors);
        }
        return null;
      }

      if (this.verbose) {
        console.log('[AIParser] Successfully parsed and validated AppContext');
      }

      return validation.context || null;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      
      if (this.verbose) {
        console.error(`[AIParser] Parsing failed after ${elapsed}ms:`, error);
      }

      // Log error for debugging
      console.error('[AIParser] Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        elapsed,
        prompt: prompt.substring(0, 100) + '...',
      });

      return null;
    }
  }

  /**
   * Parse AI response JSON string
   * 
   * Extracts and validates the AppContext structure from the AI's
   * JSON response. Handles various response formats and edge cases.
   * 
   * @param response - JSON string from AI service
   * @returns Parsed AppContext or null if parsing fails
   * 
   * Requirements: 5.2, 7.2
   */
  private parseAIResponse(response: string): AppContext | null {
    try {
      // Parse JSON
      const parsed = JSON.parse(response);

      // Basic structure validation
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      // Check required fields
      if (!parsed.appName || !parsed.appType || !Array.isArray(parsed.pages)) {
        return null;
      }

      // Ensure originalPrompt is present
      if (!parsed.originalPrompt) {
        parsed.originalPrompt = '';
      }

      return parsed as AppContext;
    } catch (error) {
      if (this.verbose) {
        console.error('[AIParser] JSON parsing error:', error);
      }
      return null;
    }
  }

  /**
   * Detect language from prompt
   * 
   * Simple heuristic to detect if the prompt is in Chinese or English.
   * Used to guide AI in generating appropriate page role descriptions.
   * 
   * @param prompt - User's prompt
   * @returns 'zh' for Chinese, 'en' for English
   * 
   * Requirements: 6.4, 6.5
   */
  detectLanguage(prompt: string): 'zh' | 'en' {
    // Check for Chinese characters
    const chineseRegex = /[\u4e00-\u9fa5]/;
    return chineseRegex.test(prompt) ? 'zh' : 'en';
  }
}
