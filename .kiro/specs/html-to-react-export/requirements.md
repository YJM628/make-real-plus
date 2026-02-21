# 需求文档

## 简介

当前 React 导出功能（`reactConverter.ts`）使用 `dangerouslySetInnerHTML` 将原始 HTML 字符串注入到 React 组件中，导致生成的代码不是地道的 React 代码，页面间路由无法正常工作（页面内容中的 `<a>` 标签未转换为 React Router 的 `<Link>` 组件），且代码不可维护。

本功能将引入开源库 `html-to-react`（https://github.com/aknuds1/html-to-react）替换当前的自定义 HTML→React 转换逻辑。`html-to-react` 负责将 HTML 字符串转换为 React 元素/JSX 对象（结构转换），但不处理 CSS 样式（`<style>` 标签内容、`<link>` 样式表引用、外部 CSS 文件等）。因此 CSS 处理需要单独实现。

核心改造策略：
- 导出的 React 项目中，每个页面组件使用 `html-to-react` 的 `Parser` 在运行时将 HTML 内容转换为 React 元素
- 通过自定义 `ProcessingInstruction` 将内部导航 `<a>` 标签转换为 React Router `<Link>` 组件
- 通过自定义 `ProcessingInstruction` 处理 `<style>` 和 `<script>` 标签
- CSS 通过独立的 CSS 文件（每页一个）+ 共享 CSS 文件的方式管理
- 保持 `assembleReactProject` 函数签名不变，确保与现有导出管道的向后兼容性

## 术语表

- **Html_To_React_Parser**: `html-to-react` 库提供的 HTML 解析器，将 HTML 字符串转换为 React 元素树
- **Processing_Instruction**: `html-to-react` 库中的自定义处理指令，用于在解析过程中对特定 HTML 节点进行自定义转换（如将 `<a>` 转为 `<Link>`）
- **React_Converter**: 负责将处理后的页面数据组装为 React 项目结构的模块（`reactConverter.ts`）
- **Page_Component**: 导出的 React 项目中代表单个页面的函数组件
- **CSS_Module**: 每个页面组件对应的独立 CSS 文件，用于管理页面特有样式
- **Internal_Link**: 包含 `data-page-target` 或 `data-react-link` 属性的 `<a>` 标签，指向项目内其他页面
- **External_Link**: 不包含内部导航属性的普通 `<a>` 标签，指向外部 URL
- **Shared_CSS**: 从多个页面中提取的公共 CSS 规则，存放在 `shared.css` 文件中
- **Page_CSS**: 每个页面独有的 CSS 规则，存放在对应的页面 CSS 文件中

## 需求

### 需求 1：使用 html-to-react 进行 HTML 结构转换

**用户故事：** 作为开发者，我希望导出的 React 组件使用 `html-to-react` 库将 HTML 转换为真正的 React 元素，以便生成的代码是地道的 React 代码而非 `dangerouslySetInnerHTML` 注入。

#### 验收标准

1. WHEN React_Converter 生成页面组件代码时, THE Page_Component SHALL 导入并使用 `html-to-react` 的 `Parser` 类在运行时将 HTML 字符串解析为 React 元素
2. WHEN Page_Component 渲染页面内容时, THE Page_Component SHALL 使用 `Parser.parseWithInstructions()` 方法配合自定义 Processing_Instruction 进行转换，而非使用 `dangerouslySetInnerHTML`
3. WHEN React_Converter 生成 package.json 时, THE React_Converter SHALL 在 dependencies 中包含 `html-to-react` 库
4. FOR ALL 导出的 Page_Component, 组件代码中 SHALL 不包含 `dangerouslySetInnerHTML` 的使用

### 需求 2：CSS 样式处理

**用户故事：** 作为开发者，我希望导出的 React 项目正确处理所有 CSS 样式，以便页面在 React 项目中的渲染效果与原始 HTML 一致。

#### 验收标准

1. WHEN React_Converter 处理页面时, THE React_Converter SHALL 将每个页面的 Page_CSS 写入独立的 CSS 文件（如 `src/styles/Home.css`），并在对应的 Page_Component 中通过 `import` 语句引入
2. WHEN 存在 Shared_CSS 时, THE React_Converter SHALL 将其写入 `src/styles/shared.css` 文件，并在 `App.jsx` 中通过 `import` 语句引入
3. WHEN 页面 HTML 中包含 `<style>` 标签时, THE Processing_Instruction SHALL 提取 `<style>` 标签的 CSS 内容并合并到该页面的 CSS 文件中，而非在 JSX 中内联渲染 `<style>` 标签
4. WHEN 页面 HTML 中包含 `<link rel="stylesheet">` 标签时, THE React_Converter SHALL 将这些样式表引用保留在 `public/index.html` 的 `<head>` 中
5. WHEN 生成 public/index.html 时, THE React_Converter SHALL 包含全局布局样式（如 `body { margin: 0; }` 和 `box-sizing: border-box`）以保持页面布局上下文一致

### 需求 3：内部链接转换为 React Router Link

**用户故事：** 作为开发者，我希望导出的 React 项目中的页面间导航使用 React Router 的 `<Link>` 组件，以便路由能正常工作且不触发整页刷新。

#### 验收标准

1. WHEN 页面 HTML 中包含带有 `data-react-link="true"` 属性的 `<a>` 标签时, THE Processing_Instruction SHALL 将该 `<a>` 标签转换为 React Router 的 `<Link>` 组件，`to` 属性值为对应的路由路径
2. WHEN 页面 HTML 中包含带有 `data-react-link-disabled="true"` 属性的 `<a>` 标签时, THE Processing_Instruction SHALL 将该标签渲染为禁用状态的普通元素（保留视觉样式但移除导航功能）
3. WHEN 页面 HTML 中包含不带 `data-react-link` 属性的 External_Link 时, THE Processing_Instruction SHALL 保留该 `<a>` 标签为普通的 HTML 锚元素不做转换
4. WHEN 生成的 Page_Component 包含 Internal_Link 转换时, THE Page_Component SHALL 在文件顶部导入 `Link` 组件（`from 'react-router-dom'`）

### 需求 4：Script 标签处理

**用户故事：** 作为开发者，我希望页面中的 JavaScript 代码在 React 组件中被正确执行，以便页面的交互功能正常工作。

#### 验收标准

1. WHEN 页面 HTML 中包含 `<script>` 标签时, THE Processing_Instruction SHALL 提取 `<script>` 标签的代码内容，不在 React 元素树中渲染 `<script>` 标签
2. WHEN 页面包含需要执行的 JavaScript 代码（来自 `<script>` 标签或页面的 `js` 属性）时, THE Page_Component SHALL 通过 `useEffect` 钩子在组件挂载时执行这些代码
3. IF 页面不包含任何 JavaScript 代码, THEN THE Page_Component SHALL 不导入 `useEffect` 也不生成 `useEffect` 代码块

### 需求 5：向后兼容性

**用户故事：** 作为开发者，我希望改造后的 React 导出功能保持与现有导出管道的兼容性，以便不影响其他导出格式和整体导出流程。

#### 验收标准

1. THE React_Converter 的 `assembleReactProject` 函数 SHALL 保持与现有相同的函数签名：`(pages, sharedCSS, pageCSS, deps, mockResult, appName) => Map<string, string>`
2. WHEN 导出管道调用 `assembleReactProject` 时, THE React_Converter SHALL 返回与现有格式一致的文件路径映射（`Map<string, string>`），包含 `package.json`、`src/App.jsx`、`src/index.jsx`、`public/index.html`、`README.md`、`.gitignore` 以及各页面组件文件
3. WHEN 导出为 React 项目时, THE React_Converter SHALL 继续生成包含 React Router 路由配置的 `App.jsx`，其中第一个页面作为默认路由（`/`）
4. WHEN 导出为 React 项目时, THE React_Converter SHALL 继续在 `README.md` 中包含安装和启动说明

### 需求 6：生成项目的运行时依赖管理

**用户故事：** 作为开发者，我希望导出的 React 项目包含所有必要的依赖声明，以便我可以通过 `npm install` 安装后直接运行项目。

#### 验收标准

1. WHEN React_Converter 生成 package.json 时, THE React_Converter SHALL 在 dependencies 中包含 `html-to-react` 库及其版本号
2. WHEN React_Converter 生成 package.json 时, THE React_Converter SHALL 继续包含 `react`、`react-dom`、`react-router-dom` 和 `react-scripts` 依赖
3. WHEN 生成的 Page_Component 使用 `html-to-react` 时, THE Page_Component SHALL 正确导入 `Parser` 和 `ProcessNodeDefinitions` 类

### 需求 7：Mock 数据集成保持

**用户故事：** 作为开发者，我希望改造后的 React 导出仍然支持 Mock 数据集成，以便页面中的 API 调用在没有后端的情况下也能正常工作。

#### 验收标准

1. WHEN mockResult 包含 API 端点时, THE React_Converter SHALL 继续将 mock 文件放置在 `public/mock/` 目录下
2. WHEN mockResult 包含拦截脚本时, THE React_Converter SHALL 在 `public/index.html` 中引用该拦截脚本
3. IF mockResult 不包含任何 API 端点, THEN THE React_Converter SHALL 不生成任何 mock 相关文件
