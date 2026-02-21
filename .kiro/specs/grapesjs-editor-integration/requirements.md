# Requirements Document

## Introduction

用 GrapesJS 可视化编辑器替换当前自定义的 EditMode 实现。当前的 EditMode 使用 Shadow DOM、自定义元素选择、拖拽/缩放钩子和 FloatingEditPanel，代码复杂（跨 7+ 文件约 1500 行）且脆弱。新方案采用全屏模态对话框模式（类似现有的 CodeEditorDialog），在其中加载 GrapesJS 编辑器，用户可以可视化编辑选中 shape 的 HTML/CSS 内容，保存后更新 tldraw shape 的属性。

## Glossary

- **GrapesJS_Editor**: 基于 GrapesJS 库（v0.22.14）的可视化 HTML/CSS 编辑器组件
- **GrapesJS_Dialog**: 包裹 GrapesJS_Editor 的全屏模态对话框组件，类似 CodeEditorDialog 的模式
- **HTML_Shape**: tldraw 画布上的 HTML 类型 shape，包含 html、css、js 等属性
- **Shape_Updater**: 用于批量更新 HTML shape 属性的工具函数（shapeUpdater.ts）
- **Tool_Definitions**: tldraw 工具栏的 UI overrides 配置（toolDefinitions.ts）
- **Editor_Canvas**: 主画布组件，管理 tldraw 编辑器和所有对话框状态
- **HybridHtmlShapeUtil**: tldraw 自定义 shape 处理器，负责渲染不同模式下的 HTML 内容

## Requirements

### Requirement 1: GrapesJS 编辑器对话框

**User Story:** 作为用户，我希望通过全屏模态对话框使用 GrapesJS 可视化编辑器编辑 HTML shape 的内容，以便直观地修改页面元素的内容和样式。

#### Acceptance Criteria

1. WHEN the user clicks the "Edit" toolbar button with an HTML_Shape selected, THE GrapesJS_Dialog SHALL open as a full-screen modal overlay
2. WHEN the GrapesJS_Dialog opens, THE GrapesJS_Editor SHALL initialize with the selected HTML_Shape's html and css properties as content
3. WHEN the GrapesJS_Dialog opens without a selected HTML_Shape, THE Editor_Canvas SHALL display an alert message indicating that an HTML shape must be selected
4. THE GrapesJS_Dialog SHALL provide a "Save" button and a "Close" button in the dialog header
5. WHEN the user clicks the backdrop overlay outside the dialog content area, THE GrapesJS_Dialog SHALL close and discard changes

### Requirement 2: 内容保存与更新

**User Story:** 作为用户，我希望在 GrapesJS 编辑器中完成编辑后能将修改保存回 tldraw shape，以便我的修改能持久化到画布上。

#### Acceptance Criteria

1. WHEN the user clicks "Save" in the GrapesJS_Dialog, THE GrapesJS_Editor SHALL extract the current HTML content and CSS styles from the GrapesJS instance
2. WHEN the save operation executes, THE GrapesJS_Dialog SHALL call editor.updateShape() to update the selected HTML_Shape's html and css props with the extracted content
3. WHEN the save operation completes, THE GrapesJS_Dialog SHALL close the modal
4. WHEN the user clicks "Close" in the GrapesJS_Dialog, THE GrapesJS_Dialog SHALL discard all changes and close the modal without updating the HTML_Shape

### Requirement 3: GrapesJS 编辑器初始化配置

**User Story:** 作为用户，我希望 GrapesJS 编辑器提供合理的默认配置和基础编辑能力，以便我能高效地进行可视化编辑。

#### Acceptance Criteria

1. THE GrapesJS_Editor SHALL initialize with storageManager disabled to prevent automatic persistence
2. THE GrapesJS_Editor SHALL load the HTML_Shape's CSS content into the editor's style section
3. THE GrapesJS_Editor SHALL provide basic block components (text, image, container) for drag-and-drop editing
4. THE GrapesJS_Editor SHALL display a style manager panel for editing selected element CSS properties
5. THE GrapesJS_Editor SHALL set the canvas dimensions to match the HTML_Shape's width and height props

### Requirement 4: 工具栏集成

**User Story:** 作为用户，我希望点击工具栏的 "Edit" 按钮能直接打开 GrapesJS 编辑器对话框，以便获得一致的编辑入口。

#### Acceptance Criteria

1. WHEN the "Edit" toolbar button (mode-edit) is clicked, THE Tool_Definitions SHALL open the GrapesJS_Dialog instead of calling updateAllHtmlShapes with mode 'edit'
2. THE Tool_Definitions SHALL pass the current tldraw editor instance to the GrapesJS_Dialog
3. WHEN no HTML_Shape is selected and the "Edit" button is clicked, THE Tool_Definitions SHALL display an alert message to the user

### Requirement 5: 旧 EditMode 代码移除

**User Story:** 作为开发者，我希望移除不再需要的旧 EditMode 相关代码，以便减少代码复杂度和维护负担。

#### Acceptance Criteria

1. WHEN the GrapesJS integration is complete, THE HybridHtmlShapeUtil SHALL remove the 'edit' case from the renderMode method and remove the EditMode import
2. WHEN the GrapesJS integration is complete, THE Editor_Canvas SHALL remove the useEditModeClick hook import and invocation
3. WHEN the GrapesJS integration is complete, THE HybridHtmlShapeUtil SHALL remove the handleElementDrag, handleElementResize, and handleOverrideAdd private methods
4. THE codebase SHALL remove the following files: EditMode.tsx, useElementSelect.ts, useDrag.ts, useResize.ts, useElementPreview.ts, FloatingEditPanel.tsx, ContentEditor.tsx, StyleEditor.tsx, AIEditor.tsx, useEditModeClick.ts, Tooltip.tsx, ResizeHandles.tsx

### Requirement 6: Shape 模式简化

**User Story:** 作为开发者，我希望简化 HTML shape 的模式管理，以便代码更清晰且不再需要全局模式切换。

#### Acceptance Criteria

1. WHEN the mode-edit tool is selected, THE Tool_Definitions SHALL open the GrapesJS_Dialog for the selected shape only, without changing any shape's mode prop to 'edit'
2. THE HybridHtmlShapeUtil SHALL render only 'preview' and 'split' modes in the renderMode method after the edit mode case is removed
3. WHEN the GrapesJS_Dialog is open, THE Editor_Canvas SHALL continue to render all HTML_Shapes in their current mode (preview or split) on the canvas behind the modal

### Requirement 7: GrapesJS 编辑器资源清理

**User Story:** 作为开发者，我希望 GrapesJS 编辑器在关闭时正确清理资源，以便避免内存泄漏和 DOM 残留。

#### Acceptance Criteria

1. WHEN the GrapesJS_Dialog closes, THE GrapesJS_Editor SHALL call the GrapesJS instance's destroy() method to release all resources
2. WHEN the GrapesJS_Dialog unmounts from the React tree, THE GrapesJS_Editor SHALL ensure the GrapesJS instance is destroyed if it has not been destroyed already
3. WHEN the GrapesJS_Editor is re-opened with different content, THE GrapesJS_Editor SHALL create a fresh GrapesJS instance with the new content
