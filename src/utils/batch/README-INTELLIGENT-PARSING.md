# Intelligent App Context Parsing

## 概述

智能应用上下文解析功能通过集成 AI 服务，增强了批量生成系统处理多样化和非标准应用描述的能力。

## 功能特性

- **AI 驱动解析**: 使用 AI 理解任意应用描述
- **两层解析策略**: 优先使用快速的规则解析器，必要时回退到 AI 解析器
- **响应验证**: 自动验证和清理 AI 响应
- **错误处理**: 健壮的错误处理和回退机制
- **语言支持**: 支持中文和英文描述

## 使用方法

### 基本用法（规则解析器）

对于预定义的应用类型（ecommerce, blog, dashboard, portfolio），系统会自动使用规则解析器：

```typescript
import { parseAppContext } from './utils/batch/parseBatchRequest';

// 电商网站
const context1 = await parseAppContext('生成电商网站：首页、产品列表、购物车');

// 博客网站
const context2 = await parseAppContext('Create a blog website');

// 仪表板应用
const context3 = await parseAppContext('Create a dashboard application');
```

### 高级用法（AI 解析器）

对于非标准应用类型，可以提供 AI 解析器：

```typescript
import { parseAppContext } from './utils/batch/parseBatchRequest';
import { AIParserService } from './utils/batch/aiParserService';
import { createAIService } from './services/ai/AIService';

// 创建 AI 解析器
const aiService = createAIService();
const aiParser = new AIParserService(aiService, {
  timeout: 5000,
  verbose: true,
});

// 解析非标准应用描述
const context = await parseAppContext(
  '我需要创建了一个功能完备的多Agent桌面应用程序，支持在Mac环境下并行执行多个Agent任务',
  aiParser
);

if (context) {
  console.log('App Name:', context.appName);
  console.log('App Type:', context.appType);
  console.log('Pages:', context.pages.map(p => p.name));
}
```

### 在批量生成中使用

在 `useAI` hook 中，AI 解析器已经自动集成：

```typescript
const { generateBatch } = useAI();

// 直接使用，AI 解析器会自动处理非标准应用类型
const generator = generateBatch({
  prompt: 'Create a multi-agent desktop app for Mac',
});

for await (const event of generator) {
  if (event.type === 'page-complete') {
    console.log('Page completed:', event.page.name);
  }
}
```

## 解析策略

系统使用两层解析策略：

1. **规则解析器（快速路径）**
   - 识别预定义的应用类型关键词
   - 提取页面数量和类型
   - 生成默认页面结构
   - 适用于：ecommerce, blog, dashboard, portfolio

2. **AI 解析器（智能路径）**
   - 使用 AI 理解任意应用描述
   - 推断合理的页面结构
   - 生成适当的页面名称和角色
   - 适用于：所有非标准应用类型

3. **回退机制**
   - 规则解析器失败 → 尝试 AI 解析器
   - AI 解析器失败 → 返回 null（触发单页生成模式）

## 配置选项

### AIParserService 配置

```typescript
const aiParser = new AIParserService(aiService, {
  timeout: 5000,    // 超时时间（毫秒）
  verbose: true,    // 是否输出详细日志
});
```

## 响应验证

所有 AI 响应都会经过严格验证：

- **结构验证**: 检查必需字段（appName, appType, pages）
- **页面验证**: 验证页面名称格式（kebab-case）、唯一性
- **关系验证**: 验证 linksTo 引用的有效性
- **数量限制**: 页面数量限制在 2-8 个之间

## 错误处理

系统提供多层错误处理：

1. **超时保护**: AI 解析默认 5 秒超时
2. **验证失败**: 自动回退到规则解析器
3. **网络错误**: 记录错误并回退
4. **优雅降级**: 确保不会破坏批量生成流程

## 示例

### 示例 1: 多 Agent 桌面应用

```typescript
const context = await parseAppContext(
  '创建一个多Agent桌面应用，支持并行执行任务',
  aiParser
);

// 结果:
// {
//   appName: "多Agent桌面应用",
//   appType: "agent-system",
//   pages: [
//     { name: "dashboard", role: "仪表板" },
//     { name: "agents", role: "Agent列表" },
//     { name: "tasks", role: "任务管理" },
//     ...
//   ]
// }
```

### 示例 2: 项目管理系统

```typescript
const context = await parseAppContext(
  'Build a project management system with team collaboration',
  aiParser
);

// 结果:
// {
//   appName: "project management system",
//   appType: "project-management",
//   pages: [
//     { name: "dashboard", role: "Dashboard" },
//     { name: "projects", role: "Projects" },
//     { name: "tasks", role: "Tasks" },
//     { name: "team", role: "Team" },
//     ...
//   ]
// }
```

## 相关文件

- `src/utils/batch/parseBatchRequest.ts` - 主解析函数
- `src/utils/batch/aiParserService.ts` - AI 解析器服务
- `src/utils/batch/responseValidator.ts` - 响应验证器
- `src/services/ai/AIService.ts` - AI 服务接口
- `src/hooks/useAI.ts` - AI hook 集成

## 测试

运行测试：

```bash
npm test -- parseBatchRequest
npm test -- aiParserService
npm test -- responseValidator
```

## 性能考虑

- **规则解析器**: < 1ms（同步）
- **AI 解析器**: 500-5000ms（异步，有超时保护）
- **优先级**: 规则解析器优先，仅在必要时使用 AI

## 限制

- 页面数量限制：2-8 个
- AI 解析超时：5 秒
- 仅支持中文和英文描述
- 需要有效的 AI API 密钥（OpenAI 或 Anthropic）

## 未来改进

- [ ] 支持更多语言
- [ ] 自定义页面数量限制
- [ ] 缓存 AI 解析结果
- [ ] 支持更多应用类型模板
- [ ] 改进页面关系推断算法
