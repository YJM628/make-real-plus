# 需求文档

## 简介

当前在 EditorCanvas 中通过 AIPromptPanel 生成的页面内容（包括自定义 HTML 形状）在浏览器刷新后会丢失。本功能将利用 tldraw 内置的持久化 API，将画布状态自动保存到 localStorage，并在页面加载时自动恢复，确保用户生成的内容不会因刷新而丢失。

## 术语表

- **Editor_Canvas**: 基于 tldraw 的主画布编辑器组件，负责渲染和管理所有形状
- **TL_Store**: tldraw 的数据存储实例，管理所有形状和页面数据
- **Snapshot**: tldraw store 的完整状态快照，包含所有形状、页面和文档数据
- **HybridHtmlShape**: 自定义 HTML 形状类型，包含 html、css、js 等属性
- **Persistence_Layer**: 负责将 Snapshot 序列化到 localStorage 并从中恢复的持久化层
- **Loading_State**: 表示持久化数据加载状态的枚举（loading、ready、error）

## 需求

### 需求 1：创建带自定义形状支持的 TL_Store

**用户故事：** 作为开发者，我希望 TL_Store 在创建时注册 HybridHtmlShapeUtil，以便自定义 HTML 形状能够被正确序列化和反序列化。

#### 验收标准

1. THE Editor_Canvas SHALL 使用 `createTLStore` 创建 TL_Store 实例，并传入 `shapeUtils: [HybridHtmlShapeUtil]` 参数
2. THE Editor_Canvas SHALL 将创建的 TL_Store 通过 `store` 属性传递给 Tldraw 组件
3. THE TL_Store SHALL 在组件整个生命周期内保持同一实例（使用 useMemo）

### 需求 2：从 localStorage 加载持久化数据

**用户故事：** 作为用户，我希望刷新页面后之前生成的内容能自动恢复，这样我不会丢失工作成果。

#### 验收标准

1. WHEN Editor_Canvas 挂载时，THE Persistence_Layer SHALL 从 localStorage 读取指定 key 的持久化数据
2. WHEN 持久化数据存在且有效时，THE Persistence_Layer SHALL 使用 `loadSnapshot` 将数据加载到 TL_Store 中
3. WHEN 持久化数据不存在时，THE Persistence_Layer SHALL 将 Loading_State 设置为 ready 并使用空白画布
4. IF 持久化数据解析失败，THEN THE Persistence_Layer SHALL 将 Loading_State 设置为 error 并显示错误信息

### 需求 3：自动保存画布状态到 localStorage

**用户故事：** 作为用户，我希望画布上的所有更改能自动保存，这样我不需要手动执行保存操作。

#### 验收标准

1. WHEN TL_Store 中的数据发生变化时，THE Persistence_Layer SHALL 使用 `getSnapshot` 获取当前快照并保存到 localStorage
2. THE Persistence_Layer SHALL 对保存操作进行节流处理（throttle），间隔不少于 500 毫秒，以避免频繁写入
3. WHEN Editor_Canvas 卸载时，THE Persistence_Layer SHALL 清理 store 监听器以防止内存泄漏

### 需求 4：加载状态展示

**用户故事：** 作为用户，我希望在数据加载过程中看到明确的状态提示，这样我知道系统正在恢复我的数据。

#### 验收标准

1. WHILE Loading_State 为 loading 时，THE Editor_Canvas SHALL 显示加载指示器
2. WHILE Loading_State 为 error 时，THE Editor_Canvas SHALL 显示错误信息
3. WHILE Loading_State 为 ready 时，THE Editor_Canvas SHALL 正常渲染 Tldraw 编辑器

### 需求 5：Snapshot 序列化往返一致性

**用户故事：** 作为开发者，我希望 Snapshot 的序列化和反序列化过程保持数据一致性，以确保持久化数据的可靠性。

#### 验收标准

1. FOR ALL 有效的 Snapshot 对象，THE Persistence_Layer 对其执行 JSON.stringify 然后 JSON.parse 后 SHALL 产生等价的对象
2. FOR ALL 包含 HybridHtmlShape 的 TL_Store，THE Persistence_Layer 执行 getSnapshot 然后 loadSnapshot 后 SHALL 恢复所有形状及其属性
