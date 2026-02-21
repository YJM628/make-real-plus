/**
 * Integration test for streaming batch render
 * Feature: streaming-batch-render
 */

import { MockAIService } from '../../services/ai/MockAIService';
import type { AIGenerationContext, BatchPageChunk, BatchProgressChunk } from '../../types';

describe('Streaming Batch Render Integration', () => {
  let service: MockAIService;

  beforeEach(() => {
    service = new MockAIService();
  });

  it('should yield page-complete events as pages are generated', async () => {
    const context: AIGenerationContext = {
      prompt: '创建一个电商网站，包含首页、产品列表页和购物车页',
      batchGeneration: {
        count: 3,
        pageTypes: ['home', 'products', 'cart'],
        appContext: {
          appName: '电商网站',
          appType: 'ecommerce',
          pages: [
            { name: 'home', role: '首页', linksTo: ['products', 'cart'], order: 0 },
            { name: 'products', role: '产品列表', linksTo: ['home', 'cart'], order: 1 },
            { name: 'cart', role: '购物车', linksTo: ['home', 'products'], order: 2 },
          ],
          originalPrompt: '创建一个电商网站',
        },
      },
    };

    const generator = service.generateBatch(context);
    const events: Array<BatchPageChunk | BatchProgressChunk> = [];
    const pageCompleteEvents: BatchPageChunk[] = [];

    // Collect all events
    for await (const event of generator) {
      if (event.type === 'page-complete' || event.type === 'batch-progress') {
        events.push(event);
        if (event.type === 'page-complete') {
          pageCompleteEvents.push(event);
        }
      }
    }

    // Verify we got page-complete events
    expect(pageCompleteEvents.length).toBeGreaterThan(0);
    expect(pageCompleteEvents.length).toBeLessThanOrEqual(3);

    // Verify page-complete events have correct structure
    pageCompleteEvents.forEach((event, index) => {
      expect(event.type).toBe('page-complete');
      expect(event.page).toBeDefined();
      expect(event.page.name).toBeDefined();
      expect(event.page.html).toBeDefined();
      expect(event.pageIndex).toBe(index);
      expect(event.totalPages).toBe(3);
    });

    // Verify we got progress events
    const progressEvents = events.filter(e => e.type === 'batch-progress') as BatchProgressChunk[];
    expect(progressEvents.length).toBeGreaterThan(0);
  });

  it('should return complete BatchGenerationResult at the end', async () => {
    const context: AIGenerationContext = {
      prompt: '创建一个博客网站',
      batchGeneration: {
        count: 2,
        pageTypes: ['home', 'about'],
        appContext: {
          appName: '博客',
          appType: 'blog',
          pages: [
            { name: 'home', role: '首页', linksTo: ['about'], order: 0 },
            { name: 'about', role: '关于', linksTo: ['home'], order: 1 },
          ],
          originalPrompt: '创建一个博客网站',
        },
      },
    };

    const generator = service.generateBatch(context);
    
    // Consume all events
    const iterator = generator[Symbol.asyncIterator]();
    let iterResult = await iterator.next();
    
    while (!iterResult.done) {
      iterResult = await iterator.next();
    }
    
    // Verify final result
    const result = iterResult.value;
    expect(result).toBeDefined();
    expect(result.pages).toBeDefined();
    expect(result.pages.length).toBeGreaterThan(0);
    expect(result.sharedTheme).toBeDefined();
    expect(result.sharedNavigation).toBeDefined();
  });
});
