/**
 * Prompt Loader Module
 * 
 * Provides template loading and variable substitution functionality for AI prompts.
 * Uses the templates registry from promptTemplates.ts.
 */

import { templates } from './promptTemplates';

/**
 * Variable mapping type for template substitution
 */
export type PromptVariables = Record<string, string>;

/**
 * Replaces {{variableName}} placeholders in a template string with values from the variables map.
 * 
 * @param template - The template string containing {{key}} placeholders
 * @param variables - A mapping of variable names to their replacement values
 * @returns The template string with all matching placeholders replaced
 * 
 * @example
 * ```typescript
 * const template = "Hello {{name}}, you are {{age}} years old.";
 * const result = renderTemplate(template, { name: "Alice", age: "30" });
 * // Returns: "Hello Alice, you are 30 years old."
 * ```
 * 
 * Note: If a placeholder's variable is not in the mapping, it remains unchanged.
 */
export function renderTemplate(template: string, variables: PromptVariables): string {
  if (!variables || Object.keys(variables).length === 0) {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    // If the variable exists in the mapping, replace it; otherwise keep the original placeholder
    return variables[key] !== undefined ? variables[key] : match;
  });
}

/**
 * Retrieves a template by name from the templates registry.
 * 
 * @param templateName - The name of the template (without .md extension)
 * @returns The raw template content as a string
 * @throws Error if the template does not exist in the registry
 * 
 * @example
 * ```typescript
 * const template = getTemplate('generation-system');
 * // Returns the content of generation-system.md
 * ```
 */
export function getTemplate(templateName: string): string {
  const template = templates[templateName];
  
  if (template === undefined) {
    throw new Error(`Template "${templateName}" not found in registry. Available templates: ${Object.keys(templates).join(', ')}`);
  }
  
  return template;
}

/**
 * Convenience function that loads a template and replaces variables in one step.
 * Combines getTemplate() and renderTemplate().
 * 
 * @param templateName - The name of the template to load
 * @param variables - Optional variable mapping for placeholder substitution
 * @returns The template content with variables replaced (if provided)
 * @throws Error if the template does not exist
 * 
 * @example
 * ```typescript
 * const prompt = loadPrompt('generation-user', {
 *   userPrompt: 'Create a login form',
 *   designSystemInstructions: 'Use Tailwind CSS'
 * });
 * ```
 */
export function loadPrompt(templateName: string, variables?: PromptVariables): string {
  const template = getTemplate(templateName);
  
  if (!variables) {
    return template;
  }
  
  return renderTemplate(template, variables);
}
