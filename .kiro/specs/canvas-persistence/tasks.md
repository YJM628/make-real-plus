# Implementation Plan: Canvas Persistence

## Overview

利用 tldraw v4 内置的 `persistenceKey` 属性，在 EditorCanvas 组件中添加自动持久化支持。实现改动极小——仅需在 `<Tldraw>` 组件上添加一个属性。

## Tasks

- [x] 1. 在 EditorCanvas 中添加 persistenceKey 属性
  - [x] 1.1 在 `src/components/canvas/EditorCanvas.tsx` 中定义 `PERSISTENCE_KEY` 常量，值为 `'canvas-editor'`
    - 在文件顶部（import 语句之后）添加常量定义
    - _Requirements: 1.1, 1.2_
  - [x] 1.2 在 `<Tldraw>` 组件上添加 `persistenceKey={PERSISTENCE_KEY}` 属性
    - 在现有的 `onMount`、`shapeUtils` 等属性旁添加
    - 这一个改动即可启用自动持久化（IndexedDB 存储、加载状态管理、跨标签页同步）
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3_
  - [x] 1.3 编写单元测试验证 persistenceKey 属性传递
    - 在 `src/__tests__/unit/editor-canvas-persistence.test.tsx` 中创建测试
    - 验证 Tldraw 组件接收到 persistenceKey 属性
    - 验证 PERSISTENCE_KEY 常量值为 'canvas-editor'
    - _Requirements: 1.1, 1.2_

- [x] 2. Checkpoint - 验证基本持久化功能
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. 编写属性测试验证持久化正确性
  - [x] 3.1 编写 JSON 序列化往返属性测试
    - 在 `src/__tests__/property/canvas-persistence.property.test.ts` 中创建测试
    - **Property 1: JSON 序列化往返一致性**
    - 使用 fast-check 生成随机 HybridHtmlShape 属性对象
    - 验证 JSON.stringify → JSON.parse 产生等价对象
    - 最少 100 次迭代
    - **Validates: Requirements 5.1**
  - [x] 3.2 编写 store snapshot 往返属性测试
    - 在同一测试文件中添加
    - **Property 2: HybridHtmlShape 持久化往返一致性**
    - 使用 fast-check 生成随机 HybridHtmlShape 数据
    - 创建带 HybridHtmlShapeUtil 的 store，添加形状，执行 getSnapshot/loadSnapshot
    - 验证恢复后的形状属性与原始一致
    - 最少 100 次迭代
    - **Validates: Requirements 2.1, 2.2, 3.1, 5.2**

- [x] 4. Final checkpoint - 确认所有测试通过
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- 核心实现仅涉及 Task 1.1 和 1.2，改动量极小（约 2 行代码）
- tldraw 内部处理所有持久化逻辑（IndexedDB 存储、加载状态、错误处理、跨标签页同步）
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
