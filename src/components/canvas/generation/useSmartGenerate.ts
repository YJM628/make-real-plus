/**
 * useSmartGenerate Hook - AI-driven routing between single and batch generation
 * 
 * Uses a 3-tier strategy to decide routing:
 * 1. Local heuristic (instant) - catches obvious single/batch requests
 * 2. Rule-based parser (instant) - catches known app types and explicit page lists
 * 3. AI parser (slow, ~2s) - only for genuinely ambiguous prompts
 */

import { useState, useCallback, useRef } from 'react';
import type { Editor } from 'tldraw';
import type { AIGenerationContext } from '../../../types';
import type { PageLinkHandler } from '../../../utils/batch/pageLinkHandler';
import { createAIService } from '../../../services/ai/AIService';
import { AIParserService } from '../../../utils/batch/aiParserService';
import { parseAppContext } from '../../../utils/batch/parseBatchRequest';
import { useSingleGenerate } from './useSingleGenerate';
import { useBatchGenerate } from './useBatchGenerate';

interface UseSmartGenerateReturn {
  handleGenerate: (context: AIGenerationContext) => Promise<void>;
  loading: boolean;
  batchProgress: { completed: number; total: number } | null;
}

/**
 * Single-page indicator patterns.
 * If the prompt matches any of these AND does not match multi-page indicators,
 * we skip AI parsing entirely and go straight to single generation.
 */
const SINGLE_PAGE_PATTERNS = [
  // Chinese: "创建一个XX页面/页/表单/组件"
  /创建一个.{0,20}(?:页面|页|表单|组件|界面|窗口|弹窗|对话框)/,
  /生成一个.{0,20}(?:页面|页|表单|组件|界面|窗口|弹窗|对话框)/,
  /做一个.{0,20}(?:页面|页|表单|组件|界面|窗口|弹窗|对话框)/,
  /设计一个.{0,20}(?:页面|页|表单|组件|界面|窗口|弹窗|对话框)/,
  // English: "create a XX page/form/component"
  /(?:create|make|build|design|generate)\s+(?:a|an|one)\s+\S+(?:\s+\S+){0,4}\s+(?:page|form|component|view|screen|dialog|modal)/i,
];

/**
 * Multi-page indicator patterns.
 * If any of these match, the prompt likely needs batch generation or AI analysis.
 */
const MULTI_PAGE_INDICATORS = [
  // Explicit page counts
  /(\d+)\s*个?页面/,
  /(\d+)\s*pages?/i,
  // Multi-page keywords (Chinese)
  /多页/, /多个页面/, /网站/, /应用程序/, /应用/, /系统/, /平台/,
  /首页.{0,10}(?:和|、|,)/, // "首页和..." implies multiple pages
  // Multi-page keywords (English)
  /website/i, /application/i, /\bapp\b/i, /platform/i, /system/i,
  /multiple\s+pages/i, /multi.?page/i,
  // Page list patterns: "home, about, contact"
  /(?:home|about|contact|products|blog|dashboard|login|signup).{0,5}(?:,|、|和|and)/i,
  // Known app types
  /电商|商城|博客|仪表板|后台|管理系统|作品集/,
  /ecommerce|e-commerce|portfolio|dashboard/i,
];

/**
 * Classify prompt routing without any API calls.
 * Returns 'single', 'batch', or 'ambiguous'.
 */
export function classifyPrompt(prompt: string): 'single' | 'batch' | 'ambiguous' {
  const hasMultiIndicator = MULTI_PAGE_INDICATORS.some(p => p.test(prompt));
  const hasSingleIndicator = SINGLE_PAGE_PATTERNS.some(p => p.test(prompt));

  // If multi-page indicators are present, it's likely batch (or needs AI to confirm)
  if (hasMultiIndicator) {
    return hasSingleIndicator ? 'ambiguous' : 'batch';
  }

  // If single-page indicators match and no multi-page indicators, it's single
  if (hasSingleIndicator) {
    return 'single';
  }

  // Short prompts without any indicators are likely single-page
  if (prompt.length < 30) {
    return 'single';
  }

  return 'ambiguous';
}

/**
 * Hook that uses AI to intelligently route between single-page and batch generation.
 * 
 * Flow:
 * 1. Local heuristic classifies prompt as single/batch/ambiguous
 * 2. If single → skip AI, go directly to single generation
 * 3. If batch/ambiguous → try rule parser, then AI parser if needed
 * 4. If multi-page context found → batch generation
 * 5. Otherwise → single generation
 */
export function useSmartGenerate(
  editor: Editor | null,
  pageLinkHandlerRef: React.MutableRefObject<PageLinkHandler | null>,
  onComplete: () => void,
  onError: (message: string) => void
): UseSmartGenerateReturn {
  const [routingInProgress, setRoutingInProgress] = useState(false);

  // AI parser for intelligent routing (only used for ambiguous cases)
  const serviceRef = useRef(createAIService());
  const aiParserRef = useRef<AIParserService | null>(null);
  if (!aiParserRef.current) {
    aiParserRef.current = new AIParserService(serviceRef.current, {
      timeout: 30000,
      verbose: true,
    });
  }

  const { handleSingleGenerate, singleLoading } = useSingleGenerate(
    editor, undefined, onComplete, onError
  );
  const { handleBatchGenerate, batchLoading, batchProgress } = useBatchGenerate(
    editor, pageLinkHandlerRef, onComplete, onError
  );

  const handleGenerate = useCallback(
    async (context: AIGenerationContext) => {
      setRoutingInProgress(true);
      try {
        const classification = classifyPrompt(context.prompt);
        console.log(`[SmartGenerate] Prompt classification: ${classification}`);

        // Fast path: obvious single-page request → skip AI entirely
        if (classification === 'single') {
          console.log('[SmartGenerate] Single page (heuristic), skipping AI');
          await handleSingleGenerate(context);
          return;
        }

        // For batch/ambiguous: use parseAppContext (rule parser first, then AI)
        console.log('[SmartGenerate] Trying parseAppContext...');
        const appContext = await parseAppContext(
          context.prompt,
          aiParserRef.current || undefined
        );

        if (appContext && appContext.pages.length >= 2) {
          console.log('[SmartGenerate] Multi-page detected, using batch generation');
          await handleBatchGenerate(context);
        } else {
          console.log('[SmartGenerate] No multi-page context found, using single generation');
          await handleSingleGenerate(context);
        }
      } catch (error) {
        console.error('[SmartGenerate] Routing error:', error);
        console.log('[SmartGenerate] Falling back to single generation');
        try {
          await handleSingleGenerate(context);
        } catch (fallbackError) {
          // Already handled by onError in useSingleGenerate
        }
      } finally {
        setRoutingInProgress(false);
      }
    },
    [handleSingleGenerate, handleBatchGenerate]
  );

  return {
    handleGenerate,
    loading: routingInProgress || singleLoading || batchLoading,
    batchProgress,
  };
}
