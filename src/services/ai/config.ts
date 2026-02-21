/**
 * AI Service Configuration
 * Feature: ai-html-visual-editor
 * 
 * Configuration for AI service providers
 */

export type AIProvider = 'openai' | 'anthropic' | 'mock';

/**
 * AI Service Configuration
 */
export interface AIConfig {
  provider: AIProvider;
  apiKey?: string;
  model?: string;
  baseURL?: string;
  organization?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Default configuration
 */
export const DEFAULT_CONFIG: AIConfig = {
  provider: 'mock',
  maxTokens: 4000,
  temperature: 0.7,
};

/**
 * Get AI configuration from environment variables
 */
export function getAIConfigFromEnv(): AIConfig {
  // Check for provider
  const provider = (import.meta.env.VITE_AI_PROVIDER as AIProvider) || 'mock';
  
  // Base configuration
  const config: AIConfig = {
    provider,
    maxTokens: parseInt(import.meta.env.VITE_AI_MAX_TOKENS || '4000'),
    temperature: parseFloat(import.meta.env.VITE_AI_TEMPERATURE || '0.7'),
  };

  // Provider-specific configuration
  if (provider === 'openai') {
    config.apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    config.model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4-turbo-preview';
    config.baseURL = import.meta.env.VITE_OPENAI_BASE_URL;
    config.organization = import.meta.env.VITE_OPENAI_ORGANIZATION;
  } else if (provider === 'anthropic') {
    config.apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    config.model = import.meta.env.VITE_ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    config.baseURL = import.meta.env.VITE_ANTHROPIC_BASE_URL;
  }

  return config;
}

/**
 * Validate AI configuration
 */
export function validateAIConfig(config: AIConfig): { valid: boolean; error?: string } {
  if (config.provider === 'mock') {
    return { valid: true };
  }

  if (!config.apiKey) {
    return {
      valid: false,
      error: `API key is required for ${config.provider} provider`,
    };
  }

  if (config.maxTokens && (config.maxTokens < 100 || config.maxTokens > 100000)) {
    return {
      valid: false,
      error: 'maxTokens must be between 100 and 100000',
    };
  }

  if (config.temperature && (config.temperature < 0 || config.temperature > 2)) {
    return {
      valid: false,
      error: 'temperature must be between 0 and 2',
    };
  }

  return { valid: true };
}
