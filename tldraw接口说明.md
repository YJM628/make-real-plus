# tldraw API 接口使用说明

本文档整理了 tldraw 的核心 API 接口使用方法，包括 Editor API、Shapes API 和 User Interface API。

## 目录
- [Editor API](#editor-api)
- [Shapes API](#shapes-api)
- [User Interface API](#user-interface-api)
- [Tools API](#tools-api)
- [Persistence API](#persistence-api)
- [Sync API](#sync-api)

---

## Editor API

Editor 是 tldraw 的核心 API，提供了创建、操作形状、处理事件等功能。

### 基本使用

#### 创建 Editor 实例

```typescript
import { Tldraw } from 'tldraw'

function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw />
    </div>
  )
}
```

#### onMount 钩子

在编辑器挂载时获取 editor 实例：

```typescript
<Tldraw 
  onMount={(editor) => {
    // 使用 editor 实例
    editor.createShapes([{ type: 'card' }])
  }}
/>
```

### 核心 Editor 方法

#### 创建形状

```typescript
editor.createShapes([{
  type: 'card',
  x: 100,
  y: 100,
  props: {
    w: 200,
    h: 100
  }
}])
```

#### 更新形状

```typescript
editor.updateShapes([{
  id: 'shape-id',
  type: 'geo',
  props: {
    color: 'red'
  }
}])
```

#### 获取形状

```typescript
const shape = editor.getShape<MyShapeType>('shape-id')
```

#### 设置当前工具

```typescript
editor.setCurrentTool('draw')
```

#### 获取初始 Meta 信息

```typescript
editor.getInitialMetaForShape = (shape: TLShape) => {
  if (shape.type === 'text') {
    return {
      createdBy: currentUser.id,
      lastModified: Date.now()
    }
  }
  return {
    createdBy: currentUser.id
  }
}
```

---

## Shapes API

tldraw 中的形状分为三类：Core shapes、Default shapes 和 Custom shapes。

### 形状对象结构

每个形状都是一个 JSON 对象，包含以下属性：

#### Base Properties（基础属性）

- `id`: 形状的唯一标识符
- `typeName`: 类型名称（通常为 "shape"）
- `type`: 形状类型（如 "geo"、"arrow"、"text" 等）
- `x`, `y`: 位置坐标
- `rotation`: 旋转角度
- `opacity`: 透明度
- `isLocked`: 是否锁定
- `index`: 渲染顺序
- `parentId`: 父级 ID（通常为页面 ID）

#### Props（形状特定属性）

每个形状类型有自己独特的 props：

```typescript
// 矩形形状示例
{
  props: {
    w: 200,           // 宽度
    h: 200,           // 高度
    geo: 'rectangle', // 几何形状
    color: 'black',   // 颜色
    labelColor: 'black', // 标签颜色
    fill: 'none',     // 填充样式
    dash: 'draw',     // 虚线样式
    size: 'm',        // 大小
    font: 'draw',     // 字体
    text: 'diagram',  // 文本内容
    align: 'middle',  // 对齐方式
    verticalAlign: 'middle', // 垂直对齐
    growY: 0,         // 垂直增长
    url: ''           // URL 链接
  }
}
```

#### Meta（元信息）

用于存储自定义数据，不会被 tldraw 使用，但可以被你的应用程序使用：

```typescript
{
  meta: {
    createdBy: 'Steve',
    createdAt: '2024-01-01'
  }
}
```

### 创建自定义形状

#### 1. 定义形状类型

```typescript
const CARD_TYPE = 'card'

declare module 'tldraw' {
  export interface TLGlobalShapePropsMap {
    [CARD_TYPE]: {
      w: number
      h: number
    }
  }
}

type CardShape = TLShape<typeof CARD_TYPE>
```

#### 2. 创建 ShapeUtil 类

```typescript
import { HTMLContainer, Rectangle2d, ShapeUtil } from 'tldraw'

class CardShapeUtil extends ShapeUtil<CardShape> {
  static override type = CARD_TYPE

  // 获取默认属性
  getDefaultProps(): CardShape['props'] {
    return {
      w: 100,
      h: 100,
    }
  }

  // 获取几何形状（用于命中检测和其他计算）
  getGeometry(shape: CardShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  // 渲染组件
  component(shape: CardShape) {
    return <HTMLContainer>Hello</HTMLContainer>
  }

  // 选中指示器
  indicator(shape: CardShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}
```

#### 3. 注册自定义形状

```typescript
const MyCustomShapes = [CardShapeUtil]

export default function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw 
        shapeUtils={MyCustomShapes}
        onMount={(editor) => {
          editor.createShapes([{ type: 'card' }])
        }}
      />
    </div>
  )
}
```

### 使用 Meta 信息

#### 类型定义

```typescript
type MyShapeWithMeta = TLGeoShape & {
  meta: {
    createdBy: string
  }
}

const shape = editor.getShape<MyShapeWithMeta>(myGeoShape.id)
```

#### 更新 Meta 信息

```typescript
editor.updateShapes<MyShapeWithMeta>([
  {
    id: myGeoShape.id,
    type: 'geo',
    meta: {
      createdBy: 'Steve',
    },
  },
])
```

### 高级功能

#### 使用 Starter Shapes

```typescript
import { BaseBoxShapeUtil } from 'tldraw'

class MyShapeUtil extends BaseBoxShapeUtil<MyShape> {
  // 继承基础矩形形状行为
}
```

#### ShapeUtil Flags

```typescript
class MyShapeUtil extends ShapeUtil<MyShape> {
  static override hideRotateHandle = true // 隐藏旋转手柄
  // 其他 flag...
}
```

#### 交互功能

```typescript
class MyShapeUtil extends ShapeUtil<MyShape> {
  component(shape: MyShape) {
    return (
      <HTMLContainer
        style={{ pointerEvents: 'all' }}
        onClick={() => console.log('clicked')}
      >
        {/* 内容 */}
      </HTMLContainer>
    )
  }
}
```

#### 标签（纯文本和富文本）

**纯文本标签：**

```typescript
import { PlainTextLabel, PlainTextArea } from 'tldraw'

class MyShapeUtil extends ShapeUtil<MyShape> {
  component(shape: MyShape) {
    return (
      <HTMLContainer>
        <PlainTextLabel 
          text={shape.props.text}
          font={shape.props.font}
          align={shape.props.align}
        />
      </HTMLContainer>
    )
  }
}
```

**富文本标签：**

```typescript
import { RichTextLabel, RichTextArea } from 'tldraw'

class MyShapeUtil extends ShapeUtil<MyShape> {
  component(shape: MyShape) {
    return (
      <HTMLContainer>
        <RichTextLabel
          richText={shape.props.richText}
        />
      </HTMLContainer>
    )
  }
}
```

#### 文本测量

```typescript
import { TextManager } from 'tldraw'

// 测量 HTML 富文本
const bounds = TextManager.measureHtml(htmlElement)

// 测量纯文本
const bounds = TextManager.measureText(text, font)
```

#### 扩展 TipTap

```typescript
import { tipTapDefaultExtensions } from 'tldraw'
import { FontFamily } from './my-extensions'

const textOptions = {
  tipTapConfig: {
    extensions: [
      ...tipTapDefaultExtensions,
      FontFamily,
    ],
  },
}

export default function App() {
  return (
    <div className="tldraw__editor">
      <Tldraw
        persistenceKey="rich-text-custom-extension"
        textOptions={textOptions}
      />
    </div>
  )
}
```

#### 剪裁子形状

```typescript
class MyShapeUtil extends ShapeUtil<MyShape> {
  getClipPath(shape: MyShape) {
    // 返回剪裁路径
  }

  shouldClipChild(shape: MyShape, child: TLShape) {
    // 决定是否剪裁子形状
    return true
  }
}
```

#### 数据迁移

```typescript
class MyShapeUtil extends ShapeUtil<MyShape> {
  static override migrations = {
    versions: {
      1: {
        up: (shape) => {
          // 从版本 1 升级到版本 2
          return {
            ...shape,
            props: {
              ...shape.props,
              newProp: 'default'
            }
          }
        }
      }
    }
  }
}
```

---

## User Interface API

tldraw 的用户界面包括菜单、工具栏、键盘快捷键和分析事件。

### 隐藏默认 UI

```typescript
function App() {
  return <Tldraw hideUi />
}
```

隐藏 UI 后，仍可通过 Editor 方法控制编辑器：

```typescript
editor.setCurrentTool('draw')
```

### UI 事件处理

```typescript
function App() {
  function handleEvent(name, data) {
    // 处理 UI 事件
    console.log('Event:', name, 'Data:', data)
  }
  
  return <Tldraw onUiEvent={handleEvent} />
}
```

**注意**：`onUiEvent` 仅在用户与 UI 交互时调用，手动调用 Editor 方法不会触发此事件。

### UI Overrides

通过 `overrides` 属性控制 UI 内容：

```typescript
import type { TLUiOverrides } from 'tldraw'

const myOverrides: TLUiOverrides = {
  // 自定义 actions
  actions(editor, actions) {
    // 删除 action
    delete actions['insert-embed']
    
    // 创建新 action
    actions['my-new-action'] = {
      id: 'my-new-action',
      label: 'My new action',
      readonlyOk: true,
      kbd: 'cmd+u, ctrl+u',
      onSelect(source: any) {
        window.alert('My new action just happened!')
      },
    }
    
    return actions
  },
  
  // 自定义工具
  tools(editor, tools) {
    tools['card'] = {
      id: 'card',
      icon: 'color',
      label: 'tools.card',
      kbd: 'c',
      onSelect: () => {
        editor.setCurrentTool('card')
      },
    }
    
    return tools
  },
  
  // 自定义翻译
  translations: {
    en: {
      'tools.card': 'Card',
    },
  },
}

export default function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw overrides={myOverrides} />
    </div>
  )
}
```

### Actions（操作）

Actions 是 UI 中菜单和键盘快捷键使用的共享操作集。

#### Action 结构

```typescript
interface TLUiActionItem {
  id: string              // 唯一标识符
  label: string           // 显示标签
  readonlyOk: boolean     // 是否在只读模式下可用
  kbd?: string            // 键盘快捷键
  onSelect: (source: any) => void  // 选择时的回调
}
```

#### 示例：创建自定义 Action

```typescript
const myOverrides: TLUiOverrides = {
  actions(editor, actions) {
    actions['custom-save'] = {
      id: 'custom-save',
      label: 'Save',
      readonlyOk: true,
      kbd: 'cmd+s, ctrl+s',
      onSelect(source) {
        // 执行保存逻辑
        saveToDatabase(editor.getSnapshot())
      },
    }
    
    return actions
  },
}
```

### Tools（工具）

Tools 定义了编辑器中可用的工具选项。

#### Tool 结构

```typescript
interface TLUiToolItem {
  id: string              // 唯一标识符
  icon: string            // 图标
  label: string           // 显示标签
  kbd?: string            // 键盘快捷键
  onSelect: () => void    // 选择时的回调
}
```

#### 示例：创建自定义 Tool

```typescript
const myOverrides: TLUiOverrides = {
  tools(editor, tools) {
    tools['custom-stamp'] = {
      id: 'custom-stamp',
      icon: 'star',
      label: 'tools.custom-stamp',
      kbd: 's',
      onSelect: () => {
        editor.setCurrentTool('custom-stamp')
      },
    }
    
    return tools
  },
  
  // 添加翻译
  translations: {
    en: {
      'tools.custom-stamp': 'Stamp Tool',
    },
    zh: {
      'tools.custom-stamp': '印章工具',
    },
  },
}
```

### 翻译（Translations）

通过 `translations` 方法为 UI 元素提供多语言支持：

```typescript
const myOverrides: TLUiOverrides = {
  translations: {
    en: {
      'tools.card': 'Card',
      'menu.file': 'File',
      'actions.save': 'Save',
    },
    zh: {
      'tools.card': '卡片',
      'menu.file': '文件',
      'actions.save': '保存',
    },
  },
}
```

### 完整示例：自定义 UI

```typescript
import { Tldraw, TLUiOverrides } from 'tldraw'

const myOverrides: TLUiOverrides = {
  actions(editor, actions) {
    // 移除默认的嵌入功能
    delete actions['insert-embed']
    
    // 添加自定义保存功能
    actions['custom-save'] = {
      id: 'custom-save',
      label: 'actions.save',
      readonlyOk: false,
      kbd: 'cmd+s, ctrl+s',
      onSelect: () => {
        const data = editor.getSnapshot()
        localStorage.setItem('drawing', JSON.stringify(data))
        alert('Saved!')
      },
    }
    
    return actions
  },
  
  tools(editor, tools) {
    // 添加自定义工具
    tools['note'] = {
      id: 'note',
      icon: 'note',
      label: 'tools.note',
      kbd: 'n',
      onSelect: () => {
        editor.setCurrentTool('note')
      },
    }
    
    return tools
  },
  
  translations: {
    en: {
      'actions.save': 'Save',
      'tools.note': 'Note',
    },
    zh: {
      'actions.save': '保存',
      'tools.note': '笔记',
    },
  },
}

export default function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw overrides={myOverrides} />
    </div>
  )
}
```

---

## Tools API

Tools API 允许你创建和管理自定义工具，定义工具的行为、键盘快捷键和图标。

### 工具状态机

tldraw 使用状态机来管理工具状态。每个工具可以定义不同的状态和转换逻辑。

#### 创建自定义工具

```typescript
import { StateNode, TLEventHandlers, TLToolState } from 'tldraw'

class MyToolState extends StateNode implements TLEventHandlers {
  static override id = 'my-tool'
  
  // 工具进入时的处理
  onEnter = () => {
    console.log('Tool entered')
  }
  
  // 工具退出时的处理
  onExit = () => {
    console.log('Tool exited')
  }
  
  // 指针按下事件
  onPointerDown: TLEventHandlers['onPointerDown'] = (info) => {
    const { point } = info
    
    // 创建形状
    this.editor.createShapes([{
      type: 'my-shape',
      x: point.x,
      y: point.y,
    }])
    
    // 切换到工具的下一个状态
    this.parent.transition('my-tool.idle')
  }
  
  // 指针移动事件
  onPointerMove: TLEventHandlers['onPointerMove'] = (info) => {
    // 处理拖拽
  }
  
  // 指针释放事件
  onPointerUp: TLEventHandlers['onPointerUp'] = (info) => {
    // 完成操作
  }
  
  // 取消操作
  onCancel: TLEventHandlers['onCancel'] = () => {
    this.editor.cancel()
  }
  
  // 键盘事件
  onKeyDown: TLEventHandlers['onKeyDown'] = (info) => {
    if (info.code === 'Escape') {
      this.onCancel()
    }
  }
}
```

### 状态转换

工具可以定义多个状态，状态之间可以相互转换：

```typescript
class MyTool extends TLToolState {
  static override id = 'my-tool'
  static override initial = 'idle'
  
  // 定义工具的子状态
  override children(): TLStateNodeConstructor[] {
    return [MyToolIdle, MyToolDragging]
  }
}

// 空闲状态
class MyToolIdle extends StateNode {
  static override id = 'idle'
  
  onPointerDown(info: TLPointerEventInfo) {
    // 开始拖拽，转换到 dragging 状态
    this.parent.transition('dragging')
  }
}

// 拖拽状态
class MyToolDragging extends StateNode {
  static override id = 'dragging'
  
  onPointerMove(info: TLPointerEventInfo) {
    // 更新形状位置
  }
  
  onPointerUp(info: TLPointerEventInfo) {
    // 完成拖拽，回到 idle 状态
    this.parent.transition('idle')
  }
  
  onCancel() {
    // 取消操作，回到 idle 状态
    this.parent.transition('idle')
  }
}
```

### 注册自定义工具

```typescript
import { Tldraw, createTLStore, defaultTools } from 'tldraw'

// 创建自定义工具
const myTools = {
  ...defaultTools,
  myTool: {
    id: 'myTool',
    label: 'My Tool',
    icon: 'tool',
    kbd: 'm',
    onSelect: () => {
      editor.setCurrentTool('myTool')
    },
  }
}

export default function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        tools={myTools}
        onMount={(editor) => {
          // 可以在这里注册工具状态
        }}
      />
    </div>
  )
}
```

### 工具属性

#### 静态属性

```typescript
class MyTool extends StateNode {
  // 工具的唯一标识
  static override id = 'my-tool'
  
  // 工具的初始状态
  static override initial = 'idle'
  
  // 工具是否在只读模式下可用
  static override isLockable = true
  
  // 工具的图标
  static override icon = 'my-icon'
  
  // 工具的标签
  static override label = 'My Tool'
  
  // 键盘快捷键
  static override kbd = 'm'
}
```

### 工具事件

#### 指针事件

```typescript
onPointerDown(info: TLPointerEventInfo)
onPointerMove(info: TLPointerEventInfo)
onPointerUp(info: TLPointerEventInfo)
onPointerEnter(info: TLPointerEventInfo)
onPointerLeave(info: TLPointerEventInfo)
```

#### 键盘事件

```typescript
onKeyDown(info: TLKeyboardEventInfo)
onKeyUp(info: TLKeyboardEventInfo)
```

#### 其他事件

```typescript
onEnter()  // 进入状态时
onExit()   // 退出状态时
onCancel() // 取消操作时
onTick()   // 每帧更新时
```

### 完整示例：绘制工具

```typescript
import { StateNode, TLEventHandlers, TLToolState } from 'tldraw'

class DrawTool extends TLToolState {
  static override id = 'draw'
  static override initial = 'idle'
  
  override children() {
    return [DrawIdle, DrawDragging]
  }
}

class DrawIdle extends StateNode {
  static override id = 'idle'
  
  onPointerDown(info: TLPointerEventInfo) {
    const { point } = info
    
    // 创建新形状
    this.editor.createShapes([{
      type: 'draw',
      x: point.x,
      y: point.y,
      props: {
        points: [{ x: 0, y: 0 }],
      },
    }])
    
    // 开始编辑
    this.editor.setEditingId(this.editor.getOnlySelectedShapeId()!)
    
    this.parent.transition('dragging')
  }
}

class DrawDragging extends StateNode {
  static override id = 'dragging'
  
  onPointerMove(info: TLPointerEventInfo) {
    const { point } = info
    const shapeId = this.editor.getOnlySelectedShapeId()!
    
    // 更新形状的点
    this.editor.updateShape<TLDrawShape>([{
      id: shapeId,
      props: {
        points: [...this.editor.getShape(shapeId)!.props.points, {
          x: point.x - this.editor.getShape(shapeId)!.x,
          y: point.y - this.editor.getShape(shapeId)!.y,
        }],
      },
    }])
  }
  
  onPointerUp(info: TLPointerEventInfo) {
    this.parent.transition('idle')
  }
  
  onCancel() {
    this.editor.deleteShapes(this.editor.getSelectedShapeIds())
    this.parent.transition('idle')
  }
}
```

---

## Persistence API

Persistence API 允许你保存和加载编辑器状态，支持多种存储后端。

### 基本持久化

#### 使用 localStorage

```typescript
import { Tldraw } from 'tldraw'

function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        persistenceKey="my-drawing"
      />
    </div>
  )
}
```

#### 自定义持久化

```typescript
import { Tldraw, useFileSystem } from 'tldraw'

function App() {
  const fileSystemEvents = useFileSystem()

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        onMount={(editor) => {
          // 加载保存的数据
          const saved = localStorage.getItem('my-drawing')
          if (saved) {
            editor.loadSnapshot(JSON.parse(saved))
          }
          
          // 监听变化并保存
          editor.store.listen((entry) => {
            if (entry.changes.didAdd || entry.changes.didUpdate || entry.changes.didDelete) {
              localStorage.setItem('my-drawing', JSON.stringify(editor.getSnapshot()))
            }
          })
        }}
      />
    </div>
  )
}
```

### Store API

#### 创建 Store

```typescript
import { createTLStore } from 'tldraw'

const store = createTLStore({
  shapeUtils: [defaultShapeUtils],
})

// 创建初始文档
store.createDocument()
```

#### Store 方法

```typescript
// 获取快照
const snapshot = store.getSnapshot()

// 加载快照
store.loadSnapshot(snapshot)

// 监听变化
const unsubscribe = store.listen((entry) => {
  console.log('Changes:', entry.changes)
})

// 停止监听
unsubscribe()

// 获取文档
const document = store.getDocument()

// 创建记录
store.put([{
  typeName: 'shape',
  id: 'shape-1',
  type: 'geo',
  x: 100,
  y: 100,
  props: { w: 200, h: 200 },
}])

// 更新记录
store.update([{
  id: 'shape-1',
  props: { color: 'red' },
}])

// 删除记录
store.remove(['shape-1'])
```

### Session Storage

```typescript
import { Tldraw } from 'tldraw'

function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        persistenceKey="my-drawing"
        persistenceMode="session"
      />
    </div>
  )
}
```

### 导入/导出

```typescript
import { Tldraw } from 'tldraw'

function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        onMount={(editor) => {
          // 导出为 JSON
          const exportData = () => {
            const snapshot = editor.getSnapshot()
            const dataStr = JSON.stringify(snapshot, null, 2)
            const blob = new Blob([dataStr], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'drawing.json'
            a.click()
          }
          
          // 导入 JSON
          const importData = (file: File) => {
            const reader = new FileReader()
            reader.onload = (e) => {
              const snapshot = JSON.parse(e.target!.result as string)
              editor.loadSnapshot(snapshot)
            }
            reader.readAsText(file)
          }
        }}
      />
    </div>
  )
}
```

### 自定义存储后端

```typescript
import { Tldraw, TLStore } from 'tldraw'

class CustomStorage {
  async save(store: TLStore) {
    const snapshot = store.getSnapshot()
    // 保存到自定义后端
    await fetch('/api/save', {
      method: 'POST',
      body: JSON.stringify(snapshot),
    })
  }
  
  async load(): Promise<any> {
    // 从自定义后端加载
    const response = await fetch('/api/load')
    return response.json()
  }
}

function App() {
  const storage = new CustomStorage()
  
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        onMount={async (editor) => {
          const snapshot = await storage.load()
          if (snapshot) {
            editor.loadSnapshot(snapshot)
          }
          
          editor.store.listen((entry) => {
            if (entry.changes.didAdd || entry.changes.didUpdate || entry.changes.didDelete) {
              storage.save(editor.store)
            }
          })
        }}
      />
    </div>
  )
}
```

### 历史记录

```typescript
import { Tldraw } from 'tldraw'

function App() {
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw
        onMount={(editor) => {
          // 撤销
          const undo = () => editor.undo()
          
          // 重做
          const redo = () => editor.redo()
          
          // 批量操作
          editor.batch(() => {
            editor.createShapes([{ type: 'geo' }])
            editor.updateShapes([{ id: 'shape-1', props: { color: 'red' } }])
          })
          
          // 标记历史记录点
          editor.markHistoryStoppingPoint()
        }}
      />
    </div>
  )
}
```

---

## Sync API

Sync API 提供实时协作功能，允许多个用户同时编辑同一个文档。

### 基本同步

#### 客户端设置

```typescript
import { Tldraw, useSync } from '@tldraw/sync'
import { defaultShapeUtils, defaultBindingUtils } from 'tldraw'

// 实现 Asset Store
const myAssetStore: TLAssetStore = {
  upload(file, asset) {
    return uploadFileAndReturnUrl(file)
  },
  resolve(asset) {
    return asset.props.src
  },
}

function MyApp() {
  const store = useSync({
    uri: 'ws://localhost:3000/room/123',
    assets: myAssetStore,
    shapeUtils: useMemo(() => [
      ...defaultShapeUtils,
      // 添加自定义形状
    ], []),
    bindingUtils: useMemo(() => [
      ...defaultBindingUtils,
      // 添加自定义绑定
    ], []),
  })
  
  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Tldraw store={store} />
    </div>
  )
}
```

### WebSocket 服务器

#### 使用 TLSocketRoom

```typescript
import { TLSocketRoom, InMemorySyncStorage } from '@tldraw/sync-core'
import { WebSocketServer } from 'ws'

const wss = new WebSocketServer({ port: 3000 })

const storage = new InMemorySyncStorage({
  snapshot: existingData, // 可选：从数据库加载
  onChange() {
    // 保存到数据库
    saveToDatabase(storage.getSnapshot())
  },
})

wss.on('connection', (ws, req) => {
  const roomId = req.url?.split('/').pop()
  
  const room = new TLSocketRoom({
    storage,
    roomId,
  })
  
  room.handleConnection(ws)
})
```

### 存储后端

#### InMemorySyncStorage

```typescript
import { InMemorySyncStorage, TLSocketRoom } from '@tldraw/sync-core'

const storage = new InMemorySyncStorage({
  snapshot: existingData, // 可选
  onChange() {
    // 保存到数据库
    saveToDatabase(storage.getSnapshot())
  },
})

const room = new TLSocketRoom({
  storage,
})
```

#### SQLiteSyncStorage（推荐）

**Cloudflare Durable Objects:**

```typescript
import { DurableObject } from 'cloudflare:workers'
import { SQLiteSyncStorage, DurableObjectSqliteSyncWrapper, TLSocketRoom } from '@tldraw/sync-core'

export class TLSyncDurableObject extends DurableObject {
  private room: TLSocketRoom
  
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    const sql = new DurableObjectSqliteSyncWrapper(ctx.storage)
    const storage = new SQLiteSyncStorage({ sql })
    this.room = new TLSocketRoom({ storage })
  }
}
```

**Node.js with better-sqlite3:**

```typescript
import Database from 'better-sqlite3'
import { SQLiteSyncStorage, NodeSqliteWrapper, TLSocketRoom } from '@tldraw/sync-core'

const db = new Database('rooms.db')
const sql = new NodeSqliteWrapper(db)
const storage = new SQLiteSyncStorage({ sql })
const room = new TLSocketRoom({ storage })
```

### Asset 存储

```typescript
// 实现 TLAssetStore 接口
const myAssetStore: TLAssetStore = {
  upload(file, asset) {
    // 上传文件到存储服务
    return fetch('/api/upload', {
      method: 'POST',
      body: file,
    }).then(res => res.json().then(data => data.url))
  },
  
  resolve(asset) {
    // 解析资产 URL
    return asset.props.src
  },
}
```

### URL 展开（Unfurling）

```typescript
// 注册 URL 处理器
function registerUrlHandler(editor: Editor) {
  editor.registerExternalAssetHandler('url', async ({ url }) => {
    return await convertUrlToBookmarkAsset(url)
  })
}

<Tldraw 
  onMount={registerUrlHandler}
/>
```

### 自定义形状和绑定的同步

#### 客户端

```typescript
import { Tldraw, defaultShapeUtils, defaultBindingUtils } from 'tldraw'
import { useSync } from '@tldraw/sync'
import { customShapeUtils } from './custom-shapes'

function MyApp() {
  const store = useSync({
    uri: 'ws://localhost:3000/room/123',
    assets: myAssetStore,
    shapeUtils: useMemo(() => [
      ...customShapeUtils,
      ...defaultShapeUtils,
    ], []),
    bindingUtils: useMemo(() => [
      ...defaultBindingUtils,
    ], []),
  })
  
  return (
    <Tldraw 
      store={store}
      shapeUtils={customShapeUtils}
      bindingUtils={defaultBindingUtils}
    />
  )
}
```

#### 服务器

```typescript
import { createTLSchema, defaultShapeSchemas, defaultBindingSchemas } from '@tldraw/tlschema'
import { TLSocketRoom } from '@tldraw/sync-core'

const schema = createTLSchema({
  shapes: {
    ...defaultShapeSchemas,
    myCustomShape: {
      props: myCustomShapeProps,
      migrations: myCustomShapeMigrations,
    },
  },
  bindings: defaultBindingSchemas,
})

const room = new TLSocketRoom({
  schema,
  storage,
})
```

### 数据迁移

#### 从旧系统迁移

```typescript
import { SQLiteSyncStorage, NodeSqliteWrapper, TLSocketRoom } from '@tldraw/sync-core'
import Database from 'better-sqlite3'

function loadOrMakeRoom(roomId: string, db: Database.Database) {
  const sql = new NodeSqliteWrapper(db, {
    tablePrefix: `room_${roomId}_`
  })
  
  // 检查是否已有数据
  if (SQLiteSyncStorage.hasBeenInitialized(sql)) {
    const storage = new SQLiteSyncStorage({ sql })
    return new TLSocketRoom({ storage })
  }
  
  // 尝试从旧系统加载
  const legacyData = loadRoomDataFromLegacyStore(roomId)
  if (legacyData) {
    const snapshot = convertOldDataToSnapshot(legacyData)
    const storage = new SQLiteSyncStorage({ sql, snapshot })
    deleteLegacyRoomData(roomId)
    return new TLSocketRoom({ storage })
  }
  
  // 创建新房间
  return new TLSocketRoom({
    storage: new SQLiteSyncStorage({ sql })
  })
}
```

#### 从 R2 迁移到 SQLite

```typescript
import { DurableObjectSqliteSyncWrapper, SQLiteSyncStorage, TLSocketRoom } from '@tldraw/sync-core'

export class TldrawDurableObjectSqlite {
  private async loadRoom(): Promise<TLSocketRoom<TLRecord, void>> {
    const sql = new DurableObjectSqliteSyncWrapper(this.ctx.storage)
    
    // 检查 SQLite 是否已有数据
    if (SQLiteSyncStorage.hasBeenInitialized(sql)) {
      const storage = new SQLiteSyncStorage<TLRecord>({ sql })
      return new TLSocketRoom<TLRecord, void>({ schema, storage })
    }
    
    // 尝试从 R2 加载
    if (this.roomId) {
      const r2Object = await this.env.TLDRAW_BUCKET.get(`rooms/${this.roomId}`)
      if (r2Object) {
        const snapshot = (await r2Object.json()) as RoomSnapshot
        const storage = new SQLiteSyncStorage<TLRecord>({ sql, snapshot })
        // 可选：删除 R2 对象
        // await this.env.TLDRAW_BUCKET.delete(`rooms/${this.roomId}`)
        return new TLSocketRoom<TLRecord, void>({ schema, storage })
      }
    }
    
    // 创建新房间
    const storage = new SQLiteSyncStorage<TLRecord>({ sql })
    return new TLSocketRoom<TLRecord, void>({ schema, storage })
  }
}
```

### 部署注意事项

1. **版本匹配**: 确保客户端和服务器的 tldraw 版本一致
2. **同步更新**: 后端应与客户端同时更新
3. **向后兼容**: 某些版本可能不支持旧客户端

```typescript
// 检查版本兼容性
if (clientVersion !== serverVersion) {
  ws.send(JSON.stringify({
    type: 'error',
    message: 'Please refresh the page'
  }))
  ws.close()
}
```

---

## 总结

tldraw 提供了强大且灵活的 API，使开发者能够：

1. **Editor API**: 完全控制编辑器状态、创建和操作形状
2. **Shapes API**: 创建和管理自定义形状，支持丰富的交互和样式
3. **User Interface API**: 自定义用户界面、工具栏、快捷键和操作
4. **Tools API**: 创建自定义工具和状态机，实现复杂的交互逻辑
5. **Persistence API**: 保存和加载编辑器状态，支持多种存储后端
6. **Sync API**: 实现实时协作功能，支持多用户同时编辑

通过组合这些 API，你可以构建功能丰富、交互性强的白板应用。

## 相关资源

- [tldraw 官方文档](https://tldraw.dev/docs)
- [tldraw GitHub 仓库](https://github.com/tldraw/tldraw)
- [自定义形状示例](https://github.com/tldraw/tldraw/tree/main/apps/examples)
