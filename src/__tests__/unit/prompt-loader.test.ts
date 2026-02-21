/**
 * Unit tests for PromptLoader module
 */

import { renderTemplate, getTemplate, loadPrompt } from '../../services/ai/promptLoader';

describe('PromptLoader', () => {
  describe('renderTemplate', () => {
    it('should replace single placeholder with variable value', () => {
      const template = 'Hello {{name}}!';
      const result = renderTemplate(template, { name: 'Alice' });
      expect(result).toBe('Hello Alice!');
    });

    it('should replace multiple placeholders', () => {
      const template = 'Hello {{name}}, you are {{age}} years old.';
      const result = renderTemplate(template, { name: 'Bob', age: '25' });
      expect(result).toBe('Hello Bob, you are 25 years old.');
    });

    it('should keep placeholder unchanged if variable not provided', () => {
      const template = 'Hello {{name}}, you are {{age}} years old.';
      const result = renderTemplate(template, { name: 'Charlie' });
      expect(result).toBe('Hello Charlie, you are {{age}} years old.');
    });

    it('should return original template if no variables provided', () => {
      const template = 'Hello {{name}}!';
      const result = renderTemplate(template, {});
      expect(result).toBe('Hello {{name}}!');
    });

    it('should handle template with no placeholders', () => {
      const template = 'Hello World!';
      const result = renderTemplate(template, { name: 'Alice' });
      expect(result).toBe('Hello World!');
    });

    it('should handle empty template', () => {
      const template = '';
      const result = renderTemplate(template, { name: 'Alice' });
      expect(result).toBe('');
    });

    it('should replace same placeholder multiple times', () => {
      const template = '{{name}} said: "Hello {{name}}!"';
      const result = renderTemplate(template, { name: 'Dave' });
      expect(result).toBe('Dave said: "Hello Dave!"');
    });

    it('should not recursively replace placeholders in variable values', () => {
      const template = 'Value: {{value}}';
      const result = renderTemplate(template, { value: '{{nested}}' });
      expect(result).toBe('Value: {{nested}}');
    });
  });

  describe('getTemplate', () => {
    it('should return template content for known template names', () => {
      const template = getTemplate('generation-system');
      expect(template).toBeTruthy();
      expect(typeof template).toBe('string');
      expect(template.length).toBeGreaterThan(0);
    });

    it('should return content for all known templates', () => {
      const knownTemplates = [
        'generation-system',
        'generation-user',
        'optimization-system',
        'optimization-user',
        'vision-optimization-system',
      ];

      knownTemplates.forEach((name) => {
        const template = getTemplate(name);
        expect(template).toBeTruthy();
        expect(typeof template).toBe('string');
      });
    });

    it('should throw error for unknown template name', () => {
      expect(() => getTemplate('non-existent-template')).toThrow(
        'Template "non-existent-template" not found in registry'
      );
    });

    it('should include available templates in error message', () => {
      expect(() => getTemplate('unknown')).toThrow(/Available templates:/);
    });
  });

  describe('loadPrompt', () => {
    it('should load template without variables', () => {
      const result = loadPrompt('generation-system');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should load template and replace variables', () => {
      const result = loadPrompt('generation-user', {
        userPrompt: 'Create a button',
        designSystemInstructions: 'Use Tailwind CSS',
      });
      expect(result).toBeTruthy();
      expect(result).toContain('Create a button');
      expect(result).toContain('Use Tailwind CSS');
    });

    it('should throw error for unknown template', () => {
      expect(() => loadPrompt('unknown-template')).toThrow(
        'Template "unknown-template" not found'
      );
    });

    it('should handle undefined variables parameter', () => {
      const result = loadPrompt('generation-system', undefined);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should preserve unmatched placeholders when variables not provided', () => {
      const result = loadPrompt('generation-user');
      expect(result).toContain('{{userPrompt}}');
      expect(result).toContain('{{designSystemInstructions}}');
    });
  });
});
