# Implementation Plan: GrapesJS Editor Integration

## Overview

用 GrapesJS 全屏模态对话框替换自定义 EditMode。按照增量方式实现：先创建新的 GrapesJS 对话框组件，再集成到工具栏和画布，最后移除旧代码。

## Tasks

- [ ] 1. 创建 GrapesJSEditorDialog 组件
  - [x] 1.1 创建 `src/components/canvas/dialogs/GrapesJSEditorDialog.tsx`
    - 实现 `GrapesJSEditorDialogProps` 接口（isOpen, editor, onClose）
    - 渲染全屏模态遮罩（参考 CodeEditorDialog 的样式模式）
    - 内部使用 `useRef` 管理 GrapesJS 容器 DOM 元素
    - 使用 `useEffect` 在 isOpen 变为 true 时初始化 GrapesJS 实例
    - 从 tldraw editor 获取选中 HTML shape 的 html/css 属性
    - 配置 GrapesJS：storageManager: false, 基础 blocks, style 加载 shape CSS
    - 实现 Save 按钮：调用 `gjsEditor.getHtml()` + `gjsEditor.getCss()` → `editor.updateShape()` → `onClose()`
    - 实现 Close 按钮：直接调用 `onClose()`
    - 点击遮罩层关闭对话框
    - 在 useEffect cleanup 中调用 `gjsEditor.destroy()` 清理资源
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.5, 7.1, 7.2, 7.3_

  - [ ]* 1.2 编写 GrapesJSEditorDialog 单元测试
    - 测试 isOpen=false 时不渲染
    - 测试 isOpen=true 时渲染模态遮罩
    - 测试 Save 调用 updateShape 并关闭
    - 测试 Close 不调用 updateShape
    - 测试遮罩点击关闭
    - 测试 GrapesJS destroy 在关闭时被调用
    - _Requirements: 1.1, 1.4, 1.5, 2.2, 2.3, 2.4, 7.1, 7.2_

  - [ ]* 1.3 编写属性测试：Save operation preserves extracted content
    - **Property 1: Save operation preserves extracted content**
    - 使用 fast-check 生成随机 html/css 字符串对
    - 模拟 GrapesJS getHtml/getCss 返回生成的值
    - 验证 updateShape 接收到的 props.html 和 props.css 与生成值一致
    - **Validates: Requirements 2.2**

- [ ] 2. 集成到工具栏和画布
  - [x] 2.1 修改 `src/components/canvas/toolbar/toolDefinitions.ts`
    - 在 `ToolDefinitionsConfig` 接口中添加 `setGrapesEditorOpen: (open: boolean) => void`
    - 修改 `mode-edit` 工具的 `onSelect`：检查选中 shape，调用 `setGrapesEditorOpen(true)` 而非 `updateAllHtmlShapes(editor, { mode: 'edit' })`
    - 未选中 HTML shape 时显示 alert
    - _Requirements: 4.1, 4.2, 4.3, 1.3_

  - [x] 2.2 修改 `src/components/canvas/EditorCanvas.tsx`
    - 添加 `grapesEditorOpen` state
    - 将 `setGrapesEditorOpen` 传入 `createUiOverrides` 配置
    - 渲染 `GrapesJSEditorDialog` 组件
    - _Requirements: 4.2, 6.3_

  - [ ]* 2.3 编写属性测试：Edit action does not mutate shape mode props
    - **Property 2: Edit action does not mutate shape mode props**
    - 使用 fast-check 生成随机数量的 HTML shapes（各有随机 mode）
    - 模拟点击 Edit 按钮
    - 验证所有 shape 的 mode 属性未被修改
    - **Validates: Requirements 6.1**

- [x] 3. Checkpoint - 确保新功能正常工作
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. 移除旧 EditMode 代码
  - [x] 4.1 修改 `src/core/shape/HybridHtmlShapeUtil.tsx`
    - 移除 `EditMode` import
    - 移除 `renderMode` 中的 `case 'edit'` 分支
    - 移除 `handleElementDrag`、`handleElementResize`、`handleOverrideAdd` 私有方法
    - _Requirements: 5.1, 5.3, 6.2_

  - [x] 4.2 修改 `src/components/canvas/EditorCanvas.tsx`
    - 移除 `useEditModeClick` import 和调用
    - _Requirements: 5.2_

  - [x] 4.3 删除旧文件
    - 删除 `src/components/modes/EditMode.tsx`
    - 删除 `src/hooks/useElementSelect.ts`
    - 删除 `src/hooks/useDrag.ts`
    - 删除 `src/hooks/useResize.ts`
    - 删除 `src/hooks/useElementPreview.ts`
    - 删除 `src/components/panels/FloatingEditPanel.tsx`
    - 删除 `src/components/panels/ContentEditor.tsx`
    - 删除 `src/components/panels/StyleEditor.tsx`
    - 删除 `src/components/panels/AIEditor.tsx`
    - 删除 `src/components/canvas/hooks/useEditModeClick.ts`
    - 删除 `src/components/modes/Tooltip.tsx`
    - 删除 `src/components/modes/ResizeHandles.tsx`
    - _Requirements: 5.4_

  - [x] 4.4 更新 `src/components/modes/index.ts` 导出
    - 移除 EditMode 和 EditModeProps 的导出
    - _Requirements: 5.4_

  - [x] 4.5 删除旧的 `src/components/editors/grapesjs-editor.tsx`（有 TS 错误的旧文件）
    - _Requirements: 5.4_

- [ ] 5. 清理和修复引用
  - [x] 5.1 修复所有因删除文件导致的 import 错误
    - 检查并修复 `src/components/modes/index.ts` 中的导出
    - 检查并删除引用已删除文件的测试文件
    - 确保 `src/types/index.ts` 中的 `HtmlShapeProps` mode 类型保持不变
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 6. Final checkpoint - 确保所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- GrapesJS v0.22.14 已作为项目依赖安装
- 对话框模式参考现有的 `CodeEditorDialog` 实现
- `mode: 'edit'` 类型定义保留以保持向后兼容，但运行时不再使用
