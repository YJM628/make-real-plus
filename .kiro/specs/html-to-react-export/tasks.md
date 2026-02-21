# Implementation Plan: html-to-react-export

## Overview

改造 `src/utils/export/reactConverter.ts`，将 `dangerouslySetInnerHTML` 方案替换为 `html-to-react` 库。改造范围限定在该模块内部，上游管道模块不需要修改。同时更新现有测试以匹配新的生成代码结构。

## Tasks

- [x] 1. 实现 HTML 预处理辅助函数
  - [x] 1.1 在 `reactConverter.ts` 中实现 `extractStyleTags` 函数
    - 使用正则从 HTML 字符串中提取所有 `<style>` 标签的内容
    - 返回 `{ cleanedHtml, extractedCSS }`
    - 处理多个 style 标签、空标签、未闭合标签等边界情况
    - _Requirements: 2.3_

  - [x] 1.2 在 `reactConverter.ts` 中实现 `extractScriptTags` 函数
    - 使用正则从 HTML 字符串中提取所有 `<script>` 标签的内联代码内容
    - 忽略带有 `src` 属性的外部脚本标签
    - 返回 `{ cleanedHtml, extractedJS }`
    - _Requirements: 4.1_

  - [x] 1.3 在 `reactConverter.ts` 中实现 `extractLinkStylesheets` 函数
    - 使用正则从 HTML 字符串中提取所有 `<link rel="stylesheet" href="...">` 的 URL
    - 返回 `{ cleanedHtml, stylesheetUrls }`
    - _Requirements: 2.4_

  - [x] 1.4 在 `reactConverter.ts` 中实现 `hasInternalLinks` 函数
    - 检查 HTML 中是否包含 `data-react-link="true"` 属性
    - 返回 boolean
    - _Requirements: 3.1_

  - [x] 1.5 为 HTML 预处理函数编写属性测试
    - **Property 3: HTML 标签提取保持内容完整性**
    - **Validates: Requirements 2.3, 4.1**

- [x] 2. 重写页面组件生成逻辑
  - [x] 2.1 重写 `generatePageComponent` 函数
    - 预处理 HTML：调用 extractStyleTags、extractScriptTags 移除 style/script 标签
    - 生成 import 语句：`html-to-react`（Parser, ProcessNodeDefinitions）、`react-router-dom`（Link，仅当有内部链接时）、`useEffect`（仅当有 JS 时）、页面 CSS 文件
    - 生成 HTML 内容常量（清理后的 HTML 字符串，转义反引号和 $ 符号）
    - 生成 ProcessingInstruction 数组代码：内部链接→Link 转换指令 + 禁用链接处理指令 + 默认处理指令
    - 生成组件函数：使用 `parser.parseWithInstructions()` 渲染
    - _Requirements: 1.1, 1.2, 3.1, 3.2, 3.3, 4.2_

  - [x] 2.2 为组件生成编写属性测试：html-to-react 使用
    - **Property 1: 组件使用 html-to-react 且不使用 dangerouslySetInnerHTML**
    - **Validates: Requirements 1.1, 1.2, 1.4, 6.3**

  - [x] 2.3 为组件生成编写属性测试：链接转换
    - **Property 5: 内部链接转换为 Link 组件，外部链接保持不变**
    - **Validates: Requirements 3.1, 3.3, 3.4**

  - [x] 2.4 为组件生成编写属性测试：useEffect
    - **Property 6: JavaScript 代码通过 useEffect 执行**
    - **Validates: Requirements 4.2, 4.3**

- [x] 3. 修改 package.json 和 index.html 生成
  - [x] 3.1 修改 `generatePackageJson` 函数
    - 在 dependencies 中添加 `"html-to-react": "^1.7.0"`
    - 保留现有的 react、react-dom、react-router-dom、react-scripts 依赖
    - _Requirements: 1.3, 6.1, 6.2_

  - [x] 3.2 修改 `generatePublicIndexHtml` 函数
    - 新增参数接收从页面 HTML 中提取的 `<link rel="stylesheet">` URL 列表
    - 在 `<head>` 中添加这些样式表引用
    - 添加全局布局样式：`body { margin: 0; }` 和 `*, *::before, *::after { box-sizing: border-box; }`
    - _Requirements: 2.4, 2.5_

  - [x] 3.3 修改 `assembleReactProject` 主函数
    - 在遍历页面时调用 `extractLinkStylesheets` 收集所有页面的样式表 URL
    - 为每个有 CSS 的页面生成独立的 CSS 文件（`src/styles/{ComponentName}.css`）
    - CSS 文件内容 = pageCSS + extractedCSS（从 style 标签提取）
    - 将收集的样式表 URL 传递给 `generatePublicIndexHtml`
    - 保持函数签名不变
    - _Requirements: 2.1, 5.1, 5.2_

- [x] 4. Checkpoint - 确保所有改造完成且代码编译通过
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. 更新测试
  - [x] 5.1 更新现有单元测试以匹配新的生成代码
    - 修改 `reactConverter.test.ts` 中检查 `dangerouslySetInnerHTML` 的断言为检查 `html-to-react` 相关代码
    - 更新 CSS 相关断言：从检查 `<style>` 标签改为检查独立 CSS 文件
    - 更新 package.json 断言：添加 html-to-react 依赖检查
    - 添加 extractStyleTags、extractScriptTags、extractLinkStylesheets 的单元测试
    - _Requirements: 1.1, 1.2, 2.1, 2.3, 6.1_

  - [x] 5.2 编写属性测试：页面 CSS 文件生成
    - **Property 2: 每个有 CSS 的页面生成独立 CSS 文件**
    - **Validates: Requirements 2.1**

  - [x] 5.3 编写属性测试：输出文件完整性
    - **Property 7: 输出文件映射包含所有必需文件**
    - **Validates: Requirements 5.2**

  - [x] 5.4 编写属性测试：路由配置
    - **Property 8: 第一个页面为默认路由**
    - **Validates: Requirements 5.3**

- [x] 6. Final checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 改造范围限定在 `reactConverter.ts` 模块内部，不修改上游管道模块
- 现有测试文件 `reactConverter.test.ts` 需要更新断言以匹配新的生成代码结构
- `html-to-react` 库版本 ^1.7.0 对应最新稳定版
- Property tests validate universal correctness properties, unit tests validate specific examples and edge cases
