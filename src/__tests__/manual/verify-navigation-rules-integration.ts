/**
 * Manual verification script for Task 2.2
 * Run this to see the complete prompt with navigation rules integrated
 * 
 * Usage: npx tsx src/__tests__/manual/verify-navigation-rules-integration.ts
 */

import { buildPerPagePrompt } from '../../utils/batch/buildPerPagePrompt';
import type { PageSpec, AppContext } from '../../types';

const mockPages: PageSpec[] = [
  { name: 'home', role: '首页', linksTo: ['products', 'about'], order: 0 },
  { name: 'products', role: '产品列表', linksTo: ['home', 'product-detail'], order: 1 },
  { name: 'product-detail', role: '产品详情', linksTo: ['products', 'cart'], order: 2 },
  { name: 'cart', role: '购物车', linksTo: ['products', 'checkout'], order: 3 },
  { name: 'checkout', role: '结账', linksTo: ['cart'], order: 4 },
  { name: 'about', role: '关于我们', linksTo: ['home'], order: 5 },
];

const mockAppContext: AppContext = {
  appName: '电商网站',
  appType: 'ecommerce',
  pages: mockPages,
  originalPrompt: '生成一个电商网站',
};

console.log('='.repeat(80));
console.log('TASK 2.2 VERIFICATION: Navigation Rules Integration');
console.log('='.repeat(80));
console.log('\nGenerating prompt for HOME page...\n');

const prompt = buildPerPagePrompt(mockPages[0], mockAppContext);

console.log(prompt);

console.log('\n' + '='.repeat(80));
console.log('VERIFICATION CHECKLIST:');
console.log('='.repeat(80));

const checks = [
  { name: '✓ Navigation Structure section exists', test: prompt.includes('## Navigation Structure') },
  { name: '✓ Navigation Rules section exists', test: prompt.includes('## Navigation Rules (MANDATORY)') },
  { name: '✓ Page Link Targets section exists', test: prompt.includes('## Page Link Targets') },
  { name: '✓ Navigation Rules comes after Navigation Structure', test: prompt.indexOf('## Navigation Rules') > prompt.indexOf('## Navigation Structure') },
  { name: '✓ Navigation Rules comes before Page Link Targets', test: prompt.indexOf('## Navigation Rules') < prompt.indexOf('## Page Link Targets') },
  { name: '✓ CRITICAL constraint in Navigation Rules', test: prompt.includes('CRITICAL REQUIREMENT') },
  { name: '✓ Element types checklist present', test: prompt.includes('Navigation bar links') && prompt.includes('Call-to-action (CTA) buttons') },
  { name: '✓ HTML examples for linksTo targets', test: prompt.includes('For page "products"') && prompt.includes('For page "about"') },
  { name: '✓ Anti-pattern examples present', test: prompt.includes('❌ WRONG vs. ✅ CORRECT Examples') },
  { name: '✓ Navigation links use href="#"', test: prompt.match(/<a href="#" data-page-target="[^"]+">/) !== null },
  { name: '✓ CRITICAL constraint in Output Requirements', test: prompt.match(/## Output Requirements[\s\S]*CRITICAL[\s\S]*data-page-target/) !== null },
];

checks.forEach(check => {
  console.log(`${check.test ? '✅' : '❌'} ${check.name}`);
});

const allPassed = checks.every(check => check.test);
console.log('\n' + '='.repeat(80));
console.log(allPassed ? '✅ ALL CHECKS PASSED!' : '❌ SOME CHECKS FAILED!');
console.log('='.repeat(80));

process.exit(allPassed ? 0 : 1);
