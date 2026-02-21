# 设计文档：AI 驱动的 HTML 可视化编辑器

## 概述

AI 驱动的 HTML 可视化编辑器是一个基于 React 和 tldraw 构建的应用程序，使用户能够通过交互式画布界面生成、可视化和编辑 HTML 页面。该系统结合了 AI 驱动的代码生成与可视化编辑功能，允许用户将 HTML 元素作为 tldraw 形状进行操作，同时保持与底层 DOM 结构的双向同步。

架构由四个主要层组成：
1. **组件层**：用于 UI 和渲染模式的 React 组件
2. **核心层**：状态管理、解析和同步引擎
3. **工具层**：选择器、样式和转换的辅助函数
4. **钩子层**：用于 AI 集成和状态管理的 React hooks

## 架构

### 高层架构

```
┌─────────────────────────────────────────────────────────────┐
│                     用户界面层                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 工具栏   │  │ 预览模式 │  │ 编辑模式 │  │ 对比模式 │   │
│  │          │  │          │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                        ┌──────────────────┐                 │
│                        │ 浮动编辑面板     │                 │
│                        │                  │                 │
│                        └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    tldraw 集成层                             │
│                  ┌──────────────────────────┐               │
│                  │ HybridHtmlShapeUtil      │               │
│                  │ (自定义形状处理器)        │               │
│                  └──────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      核心引擎层                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ 同步引擎 │  │ HTML解析 │  │ 差异引擎 │  │ AI服务   │   │
│  │          │  │          │  │          │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       数据层                                 │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  HTML DOM 状态   │  │  覆盖存储        │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

### 组件交互流程

```
用户输入 → AI 生成器 → HTML 解析器 → tldraw 形状
                                              │
                                              ▼
用户编辑 ← 浮动面板 ← 元素选择
     │
     ▼
覆盖存储 → 同步引擎 → DOM 更新
                      │
                      ▼
                 形状更新
```


## 组件和接口

### 1. HybridHtmlShapeUtil（核心形状处理器）

处理 HTML 渲染和交互的自定义 tldraw 形状工具。

```typescript
interface HtmlShapeProps {
  id: string
  type: 'html'
  x: number
  y: number
  width: number
  height: number
  props: {
    html: string
    css: string
    js: string
    mode: 'preview' | 'edit' | 'split'
    overrides: ElementOverride[]
    designSystem?: string
    viewport?: 'desktop' | 'tablet' | 'mobile' | { width: number; height: number }
  }
}

class HybridHtmlShapeUtil extends ShapeUtil<HtmlShapeProps> {
  // 根据当前模式渲染形状
  component(shape: HtmlShapeProps): JSX.Element
  
  // 处理形状交互
  onPointerDown(shape: HtmlShapeProps, event: PointerEvent): void
  onPointerMove(shape: HtmlShapeProps, event: PointerEvent): void
  onPointerUp(shape: HtmlShapeProps, event: PointerEvent): void
  
  // 处理形状变换
  onResize(shape: HtmlShapeProps, info: ResizeInfo): HtmlShapeProps
  onRotate(shape: HtmlShapeProps, angle: number): HtmlShapeProps
  
  // 选中状态指示器
  indicator(shape: HtmlShapeProps): JSX.Element
}
```

### 2. 渲染模式

#### PreviewMode 组件

在隔离的 iframe 中渲染 HTML，实现完整的 CSS/JS 执行。

```typescript
interface PreviewModeProps {
  html: string
  css: string
  js: string
  width: number
  height: number
  overrides: ElementOverride[]
  viewport?: ViewportConfig
}

function PreviewMode(props: PreviewModeProps): JSX.Element {
  // 创建包含合并 HTML 的 srcdoc 的 iframe
  // 在渲染前应用覆盖
  // 通过 postMessage 处理 iframe 通信
  // 支持完整的用户交互（按钮点击、表单输入等）
}
```

#### EditMode 组件

使用 Shadow DOM 渲染 HTML，支持交互式元素选择。

```typescript
interface EditModeProps {
  html: string
  css: string
  js: string
  width: number
  height: number
  overrides: ElementOverride[]
  onElementSelect: (selector: string, element: HTMLElement) => void
  onElementDrag: (selector: string, position: { x: number; y: number }) => void
  onElementResize: (selector: string, size: { width: number; height: number }) => void
}

function EditMode(props: EditModeProps): JSX.Element {
  // 创建 Shadow DOM 容器
  // 解析并渲染带有覆盖的 HTML
  // 为所有元素附加点击处理器
  // 用蓝色边框高亮选中的元素
  // 选择时生成 CSS 选择器
  // 支持拖动和缩放选中的元素
  // 显示实时的尺寸和位置提示
}
```

#### SplitMode 组件

并排显示原始和修改后的 HTML。

```typescript
interface SplitModeProps {
  originalHtml: string
  modifiedHtml: string
  css: string
  js: string
  width: number
  height: number
}

function SplitMode(props: SplitModeProps): JSX.Element {
  // 并排渲染两个 PreviewMode 实例
  // 左侧：原始 HTML
  // 右侧：应用覆盖的 HTML
  // 两个视图之间同步滚动
}
```

### 3. FloatingEditPanel（浮动编辑面板）

选择元素时出现的编辑界面。

```typescript
interface FloatingEditPanelProps {
  element: HTMLElement
  selector: string
  currentOverride?: ElementOverride
  onSave: (override: ElementOverride) => void
  onCancel: () => void
  onAIOptimize: (prompt: string, screenshot?: Blob) => Promise<void>
}

interface EditPanelState {
  mode: 'content' | 'style' | 'ai'
  textContent: string
  styles: Record<string, string>
  aiPrompt: string
  isAIGenerating: boolean
}

function FloatingEditPanel(props: FloatingEditPanelProps): JSX.Element {
  // 三种编辑模式的标签界面
  // 内容标签：文本输入、占位符编辑
  // 样式标签：颜色选择器、尺寸输入、间距控制
  // AI 标签：自然语言输入进行优化
  // 保存/取消按钮
  // 实时预览 AI 修改
}
```

### 4. Toolbar 组件

全局操作的顶层工具栏。

```typescript
interface ToolbarProps {
  onGenerate: () => void
  onImport: () => void
  onExport: () => void
  onModeChange: (mode: 'preview' | 'edit' | 'split') => void
  onViewportChange: (viewport: ViewportConfig) => void
  onScreenshotSelect: () => void
  currentMode: 'preview' | 'edit' | 'split'
  currentViewport: ViewportConfig
}

function Toolbar(props: ToolbarProps): JSX.Element {
  // 生成按钮（打开 AI 输入对话框）
  // 导入按钮（上传现有 HTML 文件）
  // 导出按钮（触发代码导出）
  // 模式切换按钮（P/E/S）
  // 设备预览选择器（桌面/平板/手机）
  // 截图圈选工具按钮
  // 查看代码按钮
  // 历史记录按钮
}
```

### 5. ScreenshotSelector 组件

截图圈选工具，用于 AI 上下文修改。

```typescript
interface ScreenshotSelectorProps {
  targetElement: HTMLElement
  onComplete: (screenshot: Blob, elements: HTMLElement[], bounds: DOMRect) => void
  onCancel: () => void
}

function ScreenshotSelector(props: ScreenshotSelectorProps): JSX.Element {
  // 在目标元素上覆盖半透明遮罩
  // 允许用户拖动绘制矩形选区
  // 捕获选区内的屏幕截图
  // 识别选区内的所有 HTML 元素
  // 返回截图和元素列表
}
```

### 6. CodeEditor 组件

带语法高亮的代码编辑器。

```typescript
interface CodeEditorProps {
  html: string
  css: string
  js: string
  onSave: (code: { html: string; css: string; js: string }) => void
  onClose: () => void
}

function CodeEditor(props: CodeEditorProps): JSX.Element {
  // HTML/CSS/JS 的标签页界面
  // 语法高亮和代码格式化
  // 实时语法验证
  // 错误高亮显示
  // 自动补全支持
  // 保存/取消按钮
}
```

### 7. HistoryPanel 组件

修改历史和版本管理面板。

```typescript
interface HistoryPanelProps {
  shapeId: string
  history: HistoryEntry[]
  onRestore: (timestamp: number) => void
  onCompare: (timestamp1: number, timestamp2: number) => void
  onAddTag: (timestamp: number, tag: string) => void
}

interface HistoryEntry {
  timestamp: number
  override: ElementOverride
  tag?: string
  note?: string
}

function HistoryPanel(props: HistoryPanelProps): JSX.Element {
  // 时间线视图显示所有修改
  // 每个条目显示时间、类型、内容
  // 点击预览该版本
  // 恢复到选定版本
  // 比较两个版本的差异
  // 添加标签和注释
}
```

## 数据模型

### ElementOverride（元素覆盖）

跟踪 HTML 元素的修改，不改变原始代码。

```typescript
interface ElementOverride {
  // 唯一的 CSS 选择器标识目标元素
  selector: string
  
  // 文本内容修改（可选）
  text?: string
  
  // CSS 样式覆盖（可选）
  styles?: Record<string, string>
  
  // 完整的 HTML 替换（可选）
  html?: string
  
  // 要添加/修改的属性（可选）
  attributes?: Record<string, string>
  
  // 位置覆盖（用于拖动）
  position?: { x: number; y: number }
  
  // 尺寸覆盖（用于缩放）
  size?: { width: number; height: number }
  
  // 修改时间戳
  timestamp: number
  
  // 是否为 AI 生成
  aiGenerated: boolean
  
  // 用于恢复的原始值
  original?: {
    text?: string
    styles?: Record<string, string>
    html?: string
    attributes?: Record<string, string>
    position?: { x: number; y: number }
    size?: { width: number; height: number }
  }
}
```

### HtmlParseResult（HTML 解析结果）

将 HTML 解析为结构化数据的结果。

```typescript
interface HtmlParseResult {
  // 根元素信息
  root: ParsedElement
  
  // 按标识符索引的所有元素的扁平映射
  elementMap: Map<string, ParsedElement>
  
  // 从 <style> 标签提取的 CSS 样式
  styles: string
  
  // 从 <script> 标签提取的 JavaScript
  scripts: string
  
  // 外部资源链接
  externalResources: {
    stylesheets: string[]
    scripts: string[]
    images: string[]
  }
}

interface ParsedElement {
  // 唯一标识符（id 或 data-uuid）
  identifier: string
  
  // HTML 标签名
  tagName: string
  
  // 元素属性
  attributes: Record<string, string>
  
  // 内联样式
  inlineStyles: Record<string, string>
  
  // 计算的 CSS 选择器
  selector: string
  
  // 文本内容
  textContent: string
  
  // 子元素
  children: ParsedElement[]
  
  // 父元素引用
  parent?: ParsedElement
  
  // 边界框信息
  bounds?: {
    x: number
    y: number
    width: number
    height: number
  }
}
```

### SyncState（同步状态）

同步引擎维护的状态。

```typescript
interface SyncState {
  // 当前 HTML 形状 ID
  shapeId: string
  
  // 原始 HTML 结构
  originalHtml: HtmlParseResult
  
  // 当前覆盖
  overrides: ElementOverride[]
  
  // DOM 引用（用于编辑模式）
  domRoot?: HTMLElement
  
  // 形状引用
  shapeRef?: HtmlShapeProps
  
  // 同步状态
  status: 'synced' | 'pending' | 'error'
  
  // 最后同步时间戳
  lastSync: number
  
  // 修改历史
  history: HistoryEntry[]
}
```

### ViewportConfig（视口配置）

响应式设计的视口配置。

```typescript
type ViewportConfig = 
  | 'desktop'  // 1920x1080
  | 'tablet'   // 768x1024
  | 'mobile'   // 375x667
  | { width: number; height: number }  // 自定义尺寸
```

### AIGenerationContext（AI 生成上下文）

发送给 AI 的上下文信息。

```typescript
interface AIGenerationContext {
  // 用户提示
  prompt: string
  
  // 设计系统偏好
  designSystem?: string
  
  // 截图上下文（可选）
  screenshot?: Blob
  
  // 选区内的 HTML 结构（可选）
  selectedElements?: ParsedElement[]
  
  // 当前页面的完整 HTML（用于上下文）
  currentHtml?: string
  
  // 是否为批量生成
  batchGeneration?: {
    count: number
    pageTypes: string[]
  }
}
```

## 核心引擎设计

### SyncEngine（同步引擎）

管理 tldraw 形状和 HTML DOM 之间的双向同步。

```typescript
class SyncEngine {
  private syncStates: Map<string, SyncState>
  
  // 为新的 HTML 形状初始化同步
  initSync(shapeId: string, html: HtmlParseResult): void
  
  // 将覆盖应用于形状和 DOM
  applyOverride(shapeId: string, override: ElementOverride): void
  
  // 将形状位置/尺寸更改同步到 DOM
  syncShapeToDOM(shapeId: string, shape: HtmlShapeProps): void
  
  // 将 DOM 更改同步回形状
  syncDOMToShape(shapeId: string, element: HTMLElement): void
  
  // 获取当前同步状态
  getSyncState(shapeId: string): SyncState | undefined
  
  // 验证同步一致性
  validateSync(shapeId: string): boolean
  
  // 从同步错误中恢复
  recoverSync(shapeId: string): void
  
  // 添加历史条目
  addHistoryEntry(shapeId: string, override: ElementOverride): void
  
  // 恢复到历史版本
  restoreToVersion(shapeId: string, timestamp: number): void
}
```

**同步算法：**

1. 创建形状时，解析 HTML 并创建初始同步状态
2. 应用覆盖时：
   - 更新同步状态中的覆盖列表
   - 将覆盖应用于 DOM（如果在编辑模式）
   - 使用新覆盖更新形状属性
   - 将同步标记为待处理
3. 形状变换时（移动/调整大小）：
   - 计算新的位置/尺寸
   - 更新 DOM 容器样式
   - 将同步标记为待处理
4. 定期验证同步一致性：
   - 比较形状属性与 DOM 状态
   - 检测冲突
   - 使用基于时间戳的优先级解决

### HtmlParser（HTML 解析器）

将 HTML 字符串解析为 tldraw 形状的结构化数据。

```typescript
class HtmlParser {
  // 将 HTML 字符串解析为结构化结果
  parse(html: string, css?: string, js?: string): HtmlParseResult
  
  // 提取元素标识符（id 或 data-uuid）
  extractIdentifiers(element: Element): string
  
  // 如果不存在则生成唯一标识符
  generateIdentifier(element: Element): string
  
  // 递归构建元素树
  buildElementTree(element: Element, parent?: ParsedElement): ParsedElement
  
  // 提取和规范化样式
  extractStyles(element: Element): Record<string, string>
  
  // 为元素生成 CSS 选择器
  generateSelector(element: ParsedElement): string
  
  // 验证 HTML 结构
  validate(html: string): { valid: boolean; errors: string[] }
  
  // 提取外部资源
  extractExternalResources(html: string): {
    stylesheets: string[]
    scripts: string[]
    images: string[]
  }
  
  // 为导入的 HTML 注入标识符
  injectIdentifiers(html: string): string
}
```

**解析算法：**

1. 使用 DOMParser 解析 HTML 字符串
2. 深度优先遍历 DOM 树
3. 对于每个元素：
   - 提取或生成唯一标识符
   - 提取标签名、属性、样式
   - 生成 CSS 选择器
   - 计算边界框（如果已渲染）
   - 构建 ParsedElement 对象
4. 构建元素映射以便快速查找
5. 提取全局样式和脚本
6. 返回 HtmlParseResult

### DiffEngine（差异引擎）

计算原始和修改后 HTML 之间的差异。

```typescript
class DiffEngine {
  // 计算原始 HTML 和当前状态之间的差异
  calculateDiff(
    original: HtmlParseResult,
    overrides: ElementOverride[]
  ): HtmlDiff
  
  // 将覆盖应用于 HTML 字符串
  applyOverrides(
    html: string,
    overrides: ElementOverride[]
  ): string
  
  // 生成可导出的 HTML
  generateExport(
    original: HtmlParseResult,
    overrides: ElementOverride[],
    format: 'single' | 'separate'
  ): ExportResult
  
  // 合并同一元素的多个覆盖
  mergeOverrides(overrides: ElementOverride[]): ElementOverride[]
  
  // 生成响应式媒体查询
  generateMediaQueries(
    overrides: ElementOverride[],
    viewports: ViewportConfig[]
  ): string
}

interface HtmlDiff {
  added: ParsedElement[]
  modified: Array<{
    selector: string
    changes: ElementOverride
  }>
  removed: ParsedElement[]
}

interface ExportResult {
  html: string
  css?: string
  js?: string
}
```

**差异算法：**

1. 按选择器分组覆盖
2. 合并同一元素的多个覆盖（最新的优先）
3. 对于每个覆盖：
   - 在原始 HTML 中查找目标元素
   - 应用文本/样式/html/属性更改
   - 跟踪修改
4. 生成修改后的 HTML 字符串
5. 格式化和美化输出
6. 返回导出结果

### AI Service Integration（AI 服务集成）

```typescript
interface AIService {
  // 从自然语言生成 HTML
  generateHtml(
    context: AIGenerationContext
  ): AsyncGenerator<AIGenerationChunk, AIGenerationResult>
  
  // 优化现有元素
  optimizeElement(
    elementHtml: string,
    optimizationPrompt: string,
    screenshot?: Blob
  ): Promise<AIOptimizationResult>
  
  // 批量生成多个页面
  generateBatch(
    context: AIGenerationContext
  ): AsyncGenerator<BatchGenerationChunk, BatchGenerationResult>
  
  // 验证 AI 响应
  validateResponse(response: any): boolean
}

interface AIGenerationChunk {
  type: 'html' | 'css' | 'js'
  content: string
  isComplete: boolean
}

interface AIGenerationResult {
  html: string
  css: string
  js: string
  identifiers: string[]  // 生成的标识符列表
  error?: string
}

interface BatchGenerationResult {
  pages: Array<{
    name: string
    html: string
    css: string
    js: string
  }>
  error?: string
}

interface AIOptimizationResult {
  html?: string
  styles?: Record<string, string>
  error?: string
}

// 用于 AI 集成的 React hook
function useAI(): {
  generate: (context: AIGenerationContext) => AsyncGenerator<AIGenerationChunk>
  optimize: (element: string, prompt: string, screenshot?: Blob) => Promise<AIOptimizationResult>
  loading: boolean
  error: string | null
}
```

## 工具函数

### CSS 选择器生成

```typescript
// 为元素生成唯一的 CSS 选择器
function generateCssSelector(element: ParsedElement): string {
  // 优先级顺序：
  // 1. 如果可用，使用 id：#element-id
  // 2. 如果可用，使用 data-uuid：[data-uuid="..."]
  // 3. 使用标签 + 类 + nth-child 的组合
  // 4. 如果需要，从根构建路径
}

// 验证选择器唯一性
function validateSelector(selector: string, root: HTMLElement): boolean {
  const matches = root.querySelectorAll(selector)
  return matches.length === 1
}

// 通过选择器查找元素，带回退
function findElement(
  selector: string,
  root: HTMLElement,
  fallbackPosition?: { x: number; y: number }
): HTMLElement | null {
  // 尝试直接选择器匹配
  // 如果失败且提供了位置，在该位置查找元素
  // 如果未找到则返回 null
}

// 为元素生成基于位置的选择器
function generatePositionBasedSelector(
  element: HTMLElement,
  root: HTMLElement
): string {
  // 构建从根到元素的路径
  // 使用 nth-child 选择器
}
```

### 样式处理

```typescript
// 将 CSS 字符串解析为样式对象
function parseCssString(css: string): Record<string, string>

// 将样式对象转换为 CSS 字符串
function styleToCssString(styles: Record<string, string>): string

// 合并多个样式对象（后面的覆盖前面的）
function mergeStyles(...styles: Record<string, string>[]): Record<string, string>

// 从元素提取计算样式
function getComputedStyles(element: HTMLElement): Record<string, string>

// 将样式应用于元素
function applyStyles(element: HTMLElement, styles: Record<string, string>): void

// 生成响应式媒体查询
function generateMediaQuery(
  viewport: ViewportConfig,
  styles: Record<string, string>
): string

// 检测元素的定位类型
function getPositioningType(element: HTMLElement): 'static' | 'relative' | 'absolute' | 'fixed' | 'flex' | 'grid'

// 为拖动调整定位策略
function adjustPositioningForDrag(element: HTMLElement): void {
  // 如果是 flex/grid 子元素，转换为 absolute
  // 保留原始位置
}
```

### 截图和图像处理

```typescript
// 捕获 DOM 元素的截图
async function captureScreenshot(
  element: HTMLElement,
  bounds: DOMRect
): Promise<Blob>

// 识别边界内的元素
function identifyElementsInBounds(
  root: HTMLElement,
  bounds: DOMRect
): HTMLElement[]

// 将 Blob 转换为 base64
async function blobToBase64(blob: Blob): Promise<string>
```

### 性能优化

```typescript
// 防抖函数
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void

// 节流函数
function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void

// 检查元素是否在视口内
function isInViewport(element: HTMLElement, viewport: DOMRect): boolean

// 延迟加载外部资源
async function lazyLoadResource(url: string, type: 'style' | 'script' | 'image'): Promise<void>
```

## 正确性属性

*属性是在系统所有有效执行中都应该成立的特征或行为——本质上是关于系统应该做什么的形式化陈述。属性是人类可读规范和机器可验证正确性保证之间的桥梁。*

### 属性 1：AI 生成有效性

*对于任何*有效的自然语言描述，AI 生成器应该返回可解析的 HTML、CSS 和 JavaScript 代码，且 HTML 应该通过 W3C 验证。

**验证：需求 1.1**

### 属性 2：流式生成完整性

*对于任何*AI 生成请求，流式返回的所有 chunk 组合后应该等于最终的完整结果，且每个 chunk 应该按照 HTML → CSS → JS 的顺序到达。

**验证：需求 1.2, 1.3**

### 属性 3：元素标识符唯一性

*对于任何*生成的 HTML，所有关键交互元素（按钮、输入框、链接）都应该有唯一的 Element_Identifier（id 或 data-uuid），且在整个文档中不重复。

**验证：需求 1.4**

### 属性 4：形状创建一致性

*对于任何*有效的 HTML 字符串，解析并创建 HTML_Shape 后，形状的数量应该等于 HTML 中顶层元素的数量。

**验证：需求 2.1**

### 属性 5：HTML 解析往返

*对于任何*有效的 HTML 文档，解析为 ParsedElement 树然后序列化回 HTML 应该保留所有 Element_Identifier 和 DOM 结构。

**验证：需求 2.3, 11.2**

### 属性 6：形状尺寸同步

*对于任何*HTML_Shape，调整其 width 和 height 属性应该同步更新渲染的 HTML 容器的对应 CSS 尺寸属性。

**验证：需求 2.5**

### 属性 7：批量生成数量一致性

*对于任何*指定生成 N 个页面的请求，AI 生成器应该返回恰好 N 个独立的 HTML 文档，且每个文档都应该是有效的。

**验证：需求 3.1, 3.2**

### 属性 8：自动布局间距

*对于任何*批量生成的 HTML_Shape 集合，它们应该按照从左到右的顺序排列，且相邻形状之间的水平间距应该一致（50px）。

**验证：需求 3.3**

### 属性 9：模式切换状态保持

*对于任何*渲染模式（Preview/Edit/Split），切换到另一个模式然后切换回来应该保留所有 Element_Override 和选中状态。

**验证：需求 4.8**

### 属性 10：CSS 选择器唯一性

*对于任何*选中的 HTML 元素，生成的 CSS_Selector 在当前 DOM 树中应该唯一匹配该元素（querySelectorAll 返回长度为 1）。

**验证：需求 5.3**

### 属性 11：元素拖动位置更新

*对于任何*在 Edit_Mode 中选中的元素，拖动到新位置 (x, y) 应该创建一个 Element_Override，其中 position 字段反映新的坐标。

**验证：需求 6.1, 6.2, 6.6**

### 属性 12：元素缩放尺寸更新

*对于任何*在 Edit_Mode 中选中的元素，缩放到新尺寸 (w, h) 应该创建一个 Element_Override，其中 size 字段反映新的宽度和高度。

**验证：需求 6.3, 6.4, 6.6**

### 属性 13：文本编辑同步

*对于任何*通过 Floating_Edit_Panel 修改的元素文本，修改应该立即反映在 DOM 中，且关闭面板后应该创建包含新文本的 Element_Override。

**验证：需求 7.3, 7.8**

### 属性 14：截图元素识别完整性

*对于任何*矩形选区，识别的元素集合应该包含所有边界框与选区相交的 HTML 元素，且不包含任何边界框完全在选区外的元素。

**验证：需求 8.4**

### 属性 15：覆盖合并幂等性

*对于任何*元素的多个 Element_Override，合并它们应该产生单个覆盖，其中每个字段的值来自最新的覆盖（按时间戳）。

**验证：需求 9.3**

### 属性 16：覆盖应用顺序

*对于任何*Element_Override 列表，按时间戳顺序应用它们到 HTML 应该产生与按任意顺序应用然后按时间戳合并相同的结果。

**验证：需求 9.4**

### 属性 17：双向同步一致性

*对于任何*HTML_Shape 和对应的 DOM 元素，在 Sync_Engine 中：
- 修改形状的位置/尺寸应该更新 DOM 的 CSS
- 修改 DOM 的内容/样式应该更新形状的 props
- 两次同步后，形状和 DOM 应该处于一致状态

**验证：需求 10.1, 10.2, 10.3**

### 属性 18：HTML 解析完整性

*对于任何*有效的 HTML 字符串，解析后的 HtmlParseResult 应该包含：
- 所有元素的标签名和属性
- 完整的父子层次结构
- 所有内联样式和类名
- 从 <style> 标签提取的全局样式
- 从 <script> 标签提取的脚本

**验证：需求 11.1**

### 属性 19：无效 HTML 错误处理

*对于任何*语法无效的 HTML 字符串，HTML_Parser 应该返回包含错误描述的验证结果，而不是抛出异常或返回不完整的解析结果。

**验证：需求 11.3**

### 属性 20：导出往返一致性

*对于任何*没有 Element_Override 的 HTML_Shape，导出然后重新导入应该产生相同的 HTML 内容（忽略空白和格式化）。

**验证：需求 12.4**

### 属性 21：差异计算完整性

*对于任何*原始 HTML 和 Element_Override 列表，Diff_Engine 计算的差异应该包含所有被覆盖修改的元素，且应用这些差异到原始 HTML 应该产生与直接应用覆盖相同的结果。

**验证：需求 12.1, 12.2**

### 属性 22：导入标识符注入

*对于任何*导入的 HTML 文件，如果关键交互元素缺少 Element_Identifier，Visual_Editor 应该自动生成并注入唯一的 data-uuid 属性。

**验证：需求 16.5**

### 属性 23：代码编辑往返

*对于任何*HTML_Shape，在代码编辑器中查看、修改并保存代码后，重新解析的形状应该反映所有代码更改，且保持其他未修改的属性不变。

**验证：需求 17.5**

### 属性 24：响应式视口调整

*对于任何*HTML_Shape 和视口配置（desktop/tablet/mobile），切换视口应该调整形状的 width 属性以匹配视口宽度，且切换回原视口应该恢复原始宽度。

**验证：需求 18.2**

### 属性 25：历史记录完整性

*对于任何*HTML_Shape，其历史记录应该包含所有已应用的 Element_Override，按时间戳排序，且每个历史条目应该包含足够的信息来恢复到该版本。

**验证：需求 19.2**

### 属性 26：版本恢复正确性

*对于任何*历史版本时间戳 T，恢复到该版本应该移除所有时间戳 > T 的 Element_Override，且保留所有时间戳 ≤ T 的覆盖。

**验证：需求 19.5**

### 属性 27：视口裁剪优化

*对于任何*画布视口，只有边界框与视口相交的 HTML_Shape 应该被渲染，且当形状移出视口时应该停止渲染，移入视口时应该开始渲染。

**验证：需求 20.4**

## 错误处理

### AI 生成错误

- **超时处理**：如果 AI 请求超过 30 秒，显示超时错误并允许重试
- **无效响应**：如果 AI 返回无效的 HTML/CSS/JS，显示验证错误并提供手动编辑选项
- **网络错误**：如果网络请求失败，保存当前状态并提供离线模式
- **流式中断**：如果流式生成中断，保留已接收的部分内容并标记为不完整

### HTML 解析错误

- **语法错误**：显示具体的错误位置和描述，提供自动修复建议
- **缺失标签**：自动补全缺失的闭合标签
- **无效属性**：忽略无效属性并记录警告
- **编码问题**：自动检测并转换字符编码

### 同步错误

- **冲突检测**：如果形状和 DOM 状态不一致，使用时间戳优先级解决
- **循环依赖**：检测并打破同步循环，记录错误
- **内存泄漏**：定期清理未使用的同步状态
- **恢复机制**：如果同步失败，回退到最后的有效状态

### 性能错误

- **内存警告**：当内存使用超过 500MB 时，提示用户并建议优化
- **渲染卡顿**：如果帧率低于 30fps，自动启用性能模式（减少实时预览）
- **大文件警告**：如果 HTML 文件超过 100KB，警告可能的性能问题

## 测试策略

### 双重测试方法

本项目采用单元测试和基于属性的测试相结合的方法，以确保全面覆盖：

- **单元测试**：验证特定示例、边缘情况和错误条件
- **属性测试**：验证所有输入的通用属性
- 两者互补且都是全面覆盖所必需的

### 单元测试重点

单元测试应该专注于：
- **特定示例**：演示正确行为的具体案例
- **集成点**：组件之间的交互
- **边缘情况**：空输入、极大值、特殊字符
- **错误条件**：无效输入、网络失败、超时

避免编写过多的单元测试 - 基于属性的测试处理大量输入覆盖。

### 基于属性的测试配置

**测试库选择**：使用 `fast-check` 库进行 TypeScript/JavaScript 的基于属性的测试

**配置要求**：
- 每个属性测试最少 100 次迭代（由于随机化）
- 每个测试必须引用其设计文档属性
- 标签格式：`Feature: ai-html-visual-editor, Property {number}: {property_text}`

**属性测试示例**：

```typescript
import fc from 'fast-check'

// Feature: ai-html-visual-editor, Property 5: HTML 解析往返
test('HTML parsing round trip preserves identifiers', () => {
  fc.assert(
    fc.property(
      fc.webUrl(), // 生成随机 HTML
      (html) => {
        const parsed = htmlParser.parse(html)
        const serialized = htmlSerializer.serialize(parsed)
        const reparsed = htmlParser.parse(serialized)
        
        // 验证所有标识符都被保留
        expect(reparsed.elementMap.keys()).toEqual(parsed.elementMap.keys())
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: ai-html-visual-editor, Property 10: CSS 选择器唯一性
test('generated CSS selectors are unique', () => {
  fc.assert(
    fc.property(
      htmlGenerator(), // 自定义生成器
      (html) => {
        const parsed = htmlParser.parse(html)
        const root = document.createElement('div')
        root.innerHTML = html
        
        // 对于每个元素，验证选择器唯一性
        for (const element of parsed.elementMap.values()) {
          const matches = root.querySelectorAll(element.selector)
          expect(matches.length).toBe(1)
        }
      }
    ),
    { numRuns: 100 }
  )
})

// Feature: ai-html-visual-editor, Property 15: 覆盖合并幂等性
test('override merging is idempotent', () => {
  fc.assert(
    fc.property(
      fc.array(overrideGenerator()), // 生成随机覆盖数组
      (overrides) => {
        const merged1 = mergeOverrides(overrides)
        const merged2 = mergeOverrides(merged1)
        
        // 合并两次应该产生相同结果
        expect(merged2).toEqual(merged1)
      }
    ),
    { numRuns: 100 }
  )
})
```

### 测试覆盖目标

- **单元测试**：80% 代码覆盖率
- **属性测试**：所有 27 个正确性属性都有对应的测试
- **集成测试**：关键用户流程的端到端测试
- **性能测试**：验证性能需求（帧率、内存使用）

### 测试数据生成器

为基于属性的测试创建自定义生成器：

```typescript
// HTML 生成器
const htmlGenerator = () => fc.string().map(text => {
  return `<div id="${generateId()}">${text}</div>`
})

// 覆盖生成器
const overrideGenerator = () => fc.record({
  selector: fc.string(),
  text: fc.option(fc.string()),
  styles: fc.option(fc.dictionary(fc.string(), fc.string())),
  timestamp: fc.integer({ min: 0 }),
  aiGenerated: fc.boolean()
})

// 视口配置生成器
const viewportGenerator = () => fc.oneof(
  fc.constant('desktop'),
  fc.constant('tablet'),
  fc.constant('mobile'),
  fc.record({
    width: fc.integer({ min: 320, max: 3840 }),
    height: fc.integer({ min: 568, max: 2160 })
  })
)
```

### 持续集成

- 所有测试在每次提交时运行
- 属性测试在 CI 中使用更高的迭代次数（1000 次）
- 性能测试在专用环境中运行
- 测试失败阻止合并

## 实现注意事项

### 安全性

- **XSS 防护**：所有用户生成的 HTML 在 iframe 中使用 sandbox 属性渲染
- **CSP 策略**：实施严格的内容安全策略
- **输入验证**：验证所有用户输入和 AI 响应
- **外部资源**：警告用户加载外部脚本和样式的风险

### 性能优化

- **虚拟化**：只渲染视口内可见的形状
- **防抖/节流**：优化拖动和缩放操作
- **延迟加载**：按需加载外部资源
- **Web Workers**：在后台线程中进行 HTML 解析和差异计算
- **内存管理**：定期清理未使用的 DOM 引用和同步状态

### 可访问性

- **键盘导航**：支持所有功能的键盘快捷键
- **屏幕阅读器**：为所有交互元素提供 ARIA 标签
- **对比度**：确保 UI 元素满足 WCAG AA 标准
- **焦点管理**：清晰的焦点指示器和逻辑的 Tab 顺序

### 浏览器兼容性

- **目标浏览器**：Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Polyfills**：为旧浏览器提供必要的 polyfills
- **功能检测**：检测并优雅降级不支持的功能
- **测试**：在所有目标浏览器中进行跨浏览器测试
