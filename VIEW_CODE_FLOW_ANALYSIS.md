# View Code 功能流程分析

## 概述
本文档梳理了点击 EditorToolbar 中 "view-code" 按钮后，修改 HTML 内容如何生效的完整流程。

## 流程图

```
用户点击 "Code" 按钮
    ↓
EditorToolbar.tsx (工具栏按钮)
    ↓
toolDefinitions.ts (view-code 工具定义)
    ↓
检查是否选中了 HTML shape
    ↓
setCodeEditorOpen(true) - 打开代码编辑器对话框
    ↓
CodeEditorDialog.tsx (对话框容器)
    ↓
获取当前选中的 HTML shape 数据
    ↓
CodeEditor.tsx (Monaco 编辑器)
    ↓
用户编辑 HTML/CSS/JS 代码
    ↓
点击 Save 按钮
    ↓
handleCodeSave() - 保存回调
    ↓
editor.updateShape() - 更新 tldraw shape
    ↓
HybridHtmlShapeUtil.tsx - shape 重新渲染
    ↓
component() 方法被调用
    ↓
renderMode() 根据 mode 渲染对应组件
    ↓
PreviewMode/EditMode/SplitMode 使用新的 HTML 内容渲染
    ↓
页面显示更新后的内容
```

## 详细流程说明

### 1. 点击 "Code" 按钮

**文件**: `src/components/canvas/toolbar/EditorToolbar.tsx`

```tsx
<TextButton tool={tools['view-code']} label="Code" />
```

工具栏渲染一个文本按钮，点击时触发 `tools['view-code'].onSelect()`。

---

### 2. 工具定义和事件处理

**文件**: `src/components/canvas/toolbar/toolDefinitions.ts`

```tsx
tools['view-code'] = {
  id: 'view-code',
  label: 'Code',
  icon: 'code',
  onSelect: () => {
    // 检查是否选中了 HTML shape
    if (configEditor) {
      const selectedShapes = configEditor.getSelectedShapes();
      if (selectedShapes.length === 1 && selectedShapes[0].type === 'html') {
        setCodeEditorOpen(true);  // 打开代码编辑器
      } else {
        alert('Please select an HTML shape to view its code.');
      }
    }
  },
};
```

**关键逻辑**:
- 检查是否有且仅有一个 shape 被选中
- 检查该 shape 的类型是否为 'html'
- 如果满足条件，调用 `setCodeEditorOpen(true)` 打开对话框
- 否则显示错误提示

---

### 3. 代码编辑器对话框

**文件**: `src/components/canvas/dialogs/CodeEditorDialog.tsx`

```tsx
export const CodeEditorDialog: React.FC<CodeEditorDialogProps> = ({
  isOpen,
  editor,
  onClose,
}) => {
  // 获取当前选中的 HTML shape
  const getCurrentHtmlShape = useCallback(() => {
    if (!editor) return null;
    const selectedShapes = editor.getSelectedShapes();
    if (selectedShapes.length !== 1) return null;
    const shape = selectedShapes[0];
    if (shape.type !== 'html') return null;
    return shape as any;
  }, [editor]);

  // 保存代码的回调
  const handleCodeSave = useCallback(
    (code: { html: string; css: string; js: string }, shapeId?: string) => {
      if (!editor) return;
      const targetShapeId = shapeId || getCurrentHtmlShape()?.id;
      if (!targetShapeId) return;

      // 关键：使用 editor.updateShape() 更新 shape 的 props
      editor.updateShape({
        id: targetShapeId,
        type: 'html',
        props: {
          ...editor.getShape(targetShapeId)?.props,
          html: code.html,
          css: code.css,
          js: code.js,
        },
      });

      onClose();
    },
    [editor, getCurrentHtmlShape, onClose]
  );
  
  // ... 渲染 CodeEditor 组件
};
```

**关键功能**:
- `getCurrentHtmlShape()`: 获取当前选中的 HTML shape
- `getAllHtmlShapes()`: 获取所有 HTML shapes（用于多页面支持）
- `handleCodeSave()`: **核心保存逻辑**，使用 `editor.updateShape()` 更新 shape 的 props

---

### 4. Monaco 代码编辑器

**文件**: `src/components/editors/CodeEditor.tsx`

```tsx
export const CodeEditor: React.FC<CodeEditorProps> = ({
  html,
  css,
  js,
  onSave,
  onClose,
  allPages,
  currentPageId,
}) => {
  const [htmlCode, setHtmlCode] = useState(html);
  const [cssCode, setCssCode] = useState(css);
  const [jsCode, setJsCode] = useState(js);
  
  // 保存按钮处理
  const handleSave = useCallback(() => {
    // 验证代码
    validateCode();
    
    // 检查错误
    const hasErrors = errors.some(error => error.severity === 'error');
    
    // 如果有错误，询问用户是否继续
    if (hasErrors || htmlParseError) {
      const confirmSave = window.confirm('There are syntax errors. Save anyway?');
      if (!confirmSave) return;
    }

    // 调用父组件的 onSave 回调
    onSave({
      html: htmlCode,
      css: cssCode,
      js: jsCode,
    }, selectedPageId);
  }, [htmlCode, cssCode, jsCode, errors, selectedPageId, onSave, validateCode]);
  
  // ... Monaco Editor 配置和渲染
};
```

**关键功能**:
- 使用 Monaco Editor 提供代码编辑功能
- 支持 HTML/CSS/JavaScript 三个标签页
- 实时语法验证和错误提示
- 代码格式化功能
- 保存时调用 `onSave` 回调（即 `CodeEditorDialog` 的 `handleCodeSave`）

---

### 5. Shape 更新和重新渲染

**文件**: `src/core/shape/HybridHtmlShapeUtil.tsx`

当 `editor.updateShape()` 被调用时，tldraw 会自动触发 shape 的重新渲染。

```tsx
class HybridHtmlShapeUtil extends ShapeUtil<HtmlShape> {
  // component 方法在 shape 需要渲染时被调用
  component(shape: HtmlShape) {
    const { mode, html, css, js, overrides, viewport, w, h } = shape.props;

    return (
      <HTMLContainer id={shape.id} style={{ width: w, height: h }}>
        <div style={{ width: '100%', height: '100%' }}>
          {this.renderMode(mode, html, css, js, overrides, viewport, w, h, shape.id)}
        </div>
      </HTMLContainer>
    );
  }

  // 根据 mode 渲染不同的组件
  private renderMode(
    mode: 'preview' | 'edit' | 'split',
    html: string,
    css: string,
    js: string,
    overrides: ElementOverride[],
    _viewport: ViewportConfig | undefined,
    width: number,
    height: number,
    shapeId: string
  ): React.ReactElement {
    switch (mode) {
      case 'preview':
        return <PreviewMode html={html} css={css} js={js} ... />;
      case 'edit':
        return <EditMode html={html} css={css} ... />;
      case 'split':
        return <SplitMode html={html} css={css} js={js} ... />;
    }
  }
}
```

**关键机制**:
- tldraw 的响应式系统会自动检测 shape props 的变化
- 当 props 变化时，`component()` 方法会被重新调用
- `renderMode()` 根据当前 mode 渲染对应的组件
- PreviewMode/EditMode/SplitMode 接收新的 html/css/js 并重新渲染

---

## 核心机制总结

### 1. 状态管理
- **EditorCanvas** 维护 `codeEditorOpen` 状态
- 通过 `setCodeEditorOpen` 控制对话框的显示/隐藏

### 2. 数据流向
```
Shape Props (html, css, js)
    ↓ (读取)
CodeEditorDialog
    ↓ (传递)
CodeEditor (用户编辑)
    ↓ (保存)
editor.updateShape() (更新 props)
    ↓ (触发重新渲染)
HybridHtmlShapeUtil.component()
    ↓ (渲染)
PreviewMode/EditMode/SplitMode (显示新内容)
```

### 3. 关键 API

#### editor.updateShape()
```tsx
editor.updateShape({
  id: shapeId,           // shape 的唯一标识
  type: 'html',          // shape 类型
  props: {               // 要更新的属性
    html: newHtml,
    css: newCss,
    js: newJs,
  },
});
```

这是 tldraw 提供的核心 API，用于更新 shape 的属性。调用后会触发：
1. Shape 的 props 更新
2. Shape 的重新渲染（调用 `component()` 方法）
3. 相关的副作用和事件处理

### 4. React 响应式更新

tldraw 使用 React 的响应式系统：
- Shape 的 props 变化会触发组件重新渲染
- `HybridHtmlShapeUtil.component()` 是一个 React 组件
- 当 props 变化时，React 会自动调用该方法
- 新的 HTML 内容通过 props 传递给 PreviewMode/EditMode/SplitMode
- 这些组件使用 `dangerouslySetInnerHTML` 或其他方式渲染新的 HTML

---

## 多页面支持

代码编辑器还支持多页面编辑：

```tsx
// CodeEditorDialog 准备多页面数据
const allPages = allHtmlShapes.map((shape: any, index: number) => ({
  id: shape.id,
  name: `Page ${index + 1}`,
  html: shape.props.html || '',
  css: shape.props.css || '',
  js: shape.props.js || '',
}));

// CodeEditor 支持页面切换
<select
  value={selectedPageId}
  onChange={(e) => setSelectedPageId(e.target.value)}
>
  {allPages.map((page) => (
    <option key={page.id} value={page.id}>
      {page.name}
    </option>
  ))}
</select>
```

当有多个 HTML shapes 时，用户可以在代码编辑器中切换不同的页面进行编辑。

---

## 验证和错误处理

### 1. 语法验证
- Monaco Editor 提供实时语法检查
- HtmlParser 提供额外的 HTML 验证

### 2. 保存前确认
```tsx
if (hasErrors || htmlParseError) {
  const confirmSave = window.confirm(
    'There are syntax errors. Do you want to save anyway?'
  );
  if (!confirmSave) return;
}
```

### 3. 未保存提示
```tsx
if (hasChanges) {
  const confirmClose = window.confirm(
    'You have unsaved changes. Are you sure you want to close?'
  );
  if (!confirmClose) return;
}
```

---

## 快捷键支持

```tsx
// Ctrl/Cmd + S: 保存
if ((e.ctrlKey || e.metaKey) && e.key === 's') {
  e.preventDefault();
  handleSave();
}

// Ctrl/Cmd + Shift + F: 格式化
if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'f') {
  e.preventDefault();
  handleFormat();
}

// Escape: 关闭
if (e.key === 'Escape') {
  e.preventDefault();
  handleCancel();
}
```

---

## 总结

整个流程的核心是 **tldraw 的响应式更新机制**：

1. **用户操作**: 点击 "Code" 按钮 → 打开代码编辑器
2. **编辑代码**: 在 Monaco Editor 中修改 HTML/CSS/JS
3. **保存更新**: 调用 `editor.updateShape()` 更新 shape 的 props
4. **自动渲染**: tldraw 检测到 props 变化，自动重新渲染 shape
5. **显示结果**: 新的 HTML 内容在画布上显示

这个设计充分利用了 React 的响应式特性和 tldraw 的 shape 系统，实现了流畅的代码编辑和实时预览功能。
