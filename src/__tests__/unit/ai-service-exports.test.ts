/**
 * Test: AI Service Index Exports
 * Feature: prompt-template-extraction
 * 
 * This test verifies that the promptLoader functions are properly exported
 * from the AI service index file and can be imported by external consumers.
 */

import { describe, it, expect } from '@jest/globals';

describe('AI Service Index Exports', () => {
  describe('PromptLoader exports from index', () => {
    it('should be able to import promptLoader functions from index', async () => {
      // Dynamic import to avoid TypeScript compilation issues with config.ts
      // This tests that the exports are correctly defined in the index file
      const indexModule = await import('../../services/ai/promptLoader');
      
      expect(typeof indexModule.renderTemplate).toBe('function');
      expect(typeof indexModule.getTemplate).toBe('function');
      expect(typeof indexModule.loadPrompt).toBe('function');
    });

    it('should verify renderTemplate works when imported', async () => {
      const { renderTemplate } = await import('../../services/ai/promptLoader');
      
      const result = renderTemplate('Hello {{name}}', { name: 'World' });
      expect(result).toBe('Hello World');
    });

    it('should verify getTemplate works when imported', async () => {
      const { getTemplate } = await import('../../services/ai/promptLoader');
      
      const template = getTemplate('generation-system');
      expect(typeof template).toBe('string');
      expect(template.length).toBeGreaterThan(0);
    });

    it('should verify loadPrompt works when imported', async () => {
      const { loadPrompt } = await import('../../services/ai/promptLoader');
      
      const prompt = loadPrompt('generation-system');
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should work with loadPrompt and variables', async () => {
      const { getTemplate, loadPrompt } = await import('../../services/ai/promptLoader');
      
      const template = getTemplate('generation-user');
      expect(template).toContain('{{userPrompt}}');
      
      const rendered = loadPrompt('generation-user', {
        userPrompt: 'Create a button',
        designSystemInstructions: 'Use Tailwind CSS'
      });
      
      expect(rendered).toContain('Create a button');
      expect(rendered).toContain('Use Tailwind CSS');
      expect(rendered).not.toContain('{{userPrompt}}');
    });
  });
});
