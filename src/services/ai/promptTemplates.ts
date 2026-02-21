/**
 * Prompt Template Registry
 * 
 * This module imports all prompt template markdown files using Vite's ?raw import
 * and exports them as a registry for use by the PromptLoader.
 */

import generationSystem from './prompts/generation-system.md?raw';
import generationUser from './prompts/generation-user.md?raw';
import optimizationSystem from './prompts/optimization-system.md?raw';
import optimizationUser from './prompts/optimization-user.md?raw';
import visionOptimizationSystem from './prompts/vision-optimization-system.md?raw';

/**
 * Registry of all available prompt templates
 * Key: template name (without .md extension)
 * Value: template content as string
 */
export const templates: Record<string, string> = {
  'generation-system': generationSystem,
  'generation-user': generationUser,
  'optimization-system': optimizationSystem,
  'optimization-user': optimizationUser,
  'vision-optimization-system': visionOptimizationSystem,
};
