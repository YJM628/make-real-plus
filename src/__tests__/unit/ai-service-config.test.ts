/**
 * AI Service Configuration Tests
 * Feature: ai-html-visual-editor
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getAIConfigFromEnv, validateAIConfig, DEFAULT_CONFIG } from '../../services/ai/config';
import type { AIConfig } from '../../services/ai/config';

describe('AI Service Configuration', () => {
  const originalEnv = { ...import.meta.env };

  beforeEach(() => {
    // Reset environment
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        delete (import.meta.env as any)[key];
      }
    });
  });

  afterEach(() => {
    // Restore environment
    Object.assign(import.meta.env, originalEnv);
  });

  describe('getAIConfigFromEnv', () => {
    it('should return default config when no env vars are set', () => {
      const config = getAIConfigFromEnv();
      
      expect(config.provider).toBe('mock');
      expect(config.maxTokens).toBe(4000);
      expect(config.temperature).toBe(0.7);
    });

    it('should parse OpenAI configuration from env', () => {
      (import.meta.env as any).VITE_AI_PROVIDER = 'openai';
      (import.meta.env as any).VITE_OPENAI_API_KEY = 'sk-test-key';
      (import.meta.env as any).VITE_OPENAI_MODEL = 'gpt-4';
      (import.meta.env as any).VITE_OPENAI_ORGANIZATION = 'org-test';
      (import.meta.env as any).VITE_AI_MAX_TOKENS = '2000';
      (import.meta.env as any).VITE_AI_TEMPERATURE = '0.5';

      const config = getAIConfigFromEnv();

      expect(config.provider).toBe('openai');
      expect(config.apiKey).toBe('sk-test-key');
      expect(config.model).toBe('gpt-4');
      expect(config.organization).toBe('org-test');
      expect(config.maxTokens).toBe(2000);
      expect(config.temperature).toBe(0.5);
    });

    it('should parse Anthropic configuration from env', () => {
      (import.meta.env as any).VITE_AI_PROVIDER = 'anthropic';
      (import.meta.env as any).VITE_ANTHROPIC_API_KEY = 'sk-ant-test-key';
      (import.meta.env as any).VITE_ANTHROPIC_MODEL = 'claude-3-opus';
      (import.meta.env as any).VITE_AI_MAX_TOKENS = '3000';

      const config = getAIConfigFromEnv();

      expect(config.provider).toBe('anthropic');
      expect(config.apiKey).toBe('sk-ant-test-key');
      expect(config.model).toBe('claude-3-opus');
      expect(config.maxTokens).toBe(3000);
    });

    it('should use default model when not specified', () => {
      (import.meta.env as any).VITE_AI_PROVIDER = 'openai';
      (import.meta.env as any).VITE_OPENAI_API_KEY = 'sk-test-key';

      const config = getAIConfigFromEnv();

      expect(config.model).toBe('gpt-4-turbo-preview');
    });

    it('should handle custom base URL', () => {
      (import.meta.env as any).VITE_AI_PROVIDER = 'openai';
      (import.meta.env as any).VITE_OPENAI_API_KEY = 'sk-test-key';
      (import.meta.env as any).VITE_OPENAI_BASE_URL = 'https://custom.api.com/v1';

      const config = getAIConfigFromEnv();

      expect(config.baseURL).toBe('https://custom.api.com/v1');
    });
  });

  describe('validateAIConfig', () => {
    it('should validate mock provider without API key', () => {
      const config: AIConfig = {
        provider: 'mock',
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should require API key for OpenAI', () => {
      const config: AIConfig = {
        provider: 'openai',
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('API key is required');
    });

    it('should require API key for Anthropic', () => {
      const config: AIConfig = {
        provider: 'anthropic',
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('API key is required');
    });

    it('should validate OpenAI config with API key', () => {
      const config: AIConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(true);
    });

    it('should validate Anthropic config with API key', () => {
      const config: AIConfig = {
        provider: 'anthropic',
        apiKey: 'sk-ant-test-key',
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(true);
    });

    it('should reject invalid maxTokens (too low)', () => {
      const config: AIConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
        maxTokens: 50,
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('maxTokens must be between');
    });

    it('should reject invalid maxTokens (too high)', () => {
      const config: AIConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
        maxTokens: 200000,
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('maxTokens must be between');
    });

    it('should reject invalid temperature (too low)', () => {
      const config: AIConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
        temperature: -0.5,
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('temperature must be between');
    });

    it('should reject invalid temperature (too high)', () => {
      const config: AIConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
        temperature: 3.0,
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('temperature must be between');
    });

    it('should accept valid maxTokens', () => {
      const config: AIConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
        maxTokens: 4000,
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(true);
    });

    it('should accept valid temperature', () => {
      const config: AIConfig = {
        provider: 'openai',
        apiKey: 'sk-test-key',
        temperature: 0.7,
      };

      const result = validateAIConfig(config);

      expect(result.valid).toBe(true);
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CONFIG.provider).toBe('mock');
      expect(DEFAULT_CONFIG.maxTokens).toBe(4000);
      expect(DEFAULT_CONFIG.temperature).toBe(0.7);
    });
  });
});
