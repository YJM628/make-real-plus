# 需求文档

## 简介

本文档规定了基于 tldraw 构建的 AI 驱动 HTML 可视化编辑器的需求。该系统使用户能够通过自然语言描述生成 HTML 页面，将其渲染为 tldraw 画布上的交互式形状，并精确选择和编辑单个元素。编辑器支持多种渲染模式、双向状态同步以及与主流设计系统的集成。

## 术语表

- **Visual_Editor**：基于 tldraw 构建的完整 AI 驱动 HTML 编辑系统
- **AI_Generator**：负责从自然语言描述生成 HTML/CSS/JS 的组件
- **Canvas**：tldraw 画布，HTML 形状在其上渲染
- **HTML_Shape**：表示渲染 HTML 内容的 tldraw 形状
- **Element_Identifier**：分配给 HTML 元素的唯一标识符（id 或 data-uuid）
- **Preview_Mode**：预览模式，使用 iframe 进行完整的 CSS/JS 执行
- **Edit_Mode**：编辑模式，使用 Shadow DOM 进行交互式元素选择
- **Split_Mode**：对比模式，并排显示原始版本和修改版本
- **Element_Override**：跟踪 HTML 元素修改的数据结构，不改变原始代码
- **Sync_Engine**：负责 tldraw 形状和 HTML DOM 之间双向同步的组件
- **Diff_Engine**：计算原始 HTML 和修改后 HTML 之间差异的组件
- **HTML_Parser**：解析 HTML 并将其转换为 tldraw 形状的组件
- **Floating_Edit_Panel**：选择元素时出现的浮动编辑面板
- **Design_System**：预配置的 UI 组件和样式集（如 Material UI、Ant Design、Tailwind）
- **CSS_Selector**：用于唯一标识 DOM 中 HTML 元素的字符串模式

## 需求

### 需求 1：AI HTML 生成

**用户故事：** 作为用户，我想通过自然语言描述生成 HTML 页面，以便无需手动编写代码即可快速创建网页布局。

#### 验收标准

1. 当用户提供自然语言描述时，AI_Generator 应生成有效的 HTML、CSS 和 JavaScript 代码
2. 当 AI 生成代码时，AI_Generator 应以流式方式返回生成的内容
3. 当接收到流式数据时，Visual_Editor 应实时渲染部分生成的 HTML 内容
4. 当生成 HTML 时，AI_Generator 应为所有关键交互元素分配唯一的 Element_Identifier
5. 当用户在描述中指定 Design_System 时，AI_Generator 应生成与该 Design_System 兼容的代码
6. 当生成的代码无效或不完整时，AI_Generator 应返回描述性错误消息
7. AI_Generator 应支持至少三个主流 Design_System（Material UI、Ant Design、Tailwind CSS）
8. 当流式生成过程中断时，Visual_Editor 应保留已生成的部分内容并允许用户重试

### 需求 2：HTML 形状渲染

**用户故事：** 作为用户，我想将生成的 HTML 渲染为 tldraw 画布上的交互式形状，以便使用 tldraw 的工具操作它们。

#### 验收标准

1. 当生成 HTML 时，Visual_Editor 应在 Canvas 上创建 HTML_Shape
2. HTML_Shape 应维护 tldraw 形状数据与原始 HTML DOM 结构之间的映射关系
3. 当创建 HTML_Shape 时，Visual_Editor 应保留生成 HTML 中的所有 Element_Identifier
4. HTML_Shape 应支持标准 tldraw 操作（移动、调整大小、旋转、删除）
5. 当调整 HTML_Shape 大小时，Visual_Editor 应相应更新渲染的 HTML 尺寸

### 需求 3：批量 HTML 生成和布局

**用户故事：** 作为用户，我想一次生成一整套相关的 HTML 页面，以便快速创建完整的网站原型。

#### 验收标准

1. 当用户在 AI 输入框中请求生成多个页面时，AI_Generator 应识别并生成多个独立的 HTML 文件
2. 当生成多个 HTML 页面时，Visual_Editor 应为每个页面创建独立的 HTML_Shape
3. 当创建多个 HTML_Shape 时，Visual_Editor 应自动将它们在画布上并排排列
4. 当自动排列形状时，Visual_Editor 应在形状之间保持合理的间距（如 50px）
5. 当生成的页面具有逻辑关系时（如首页、详情页），Visual_Editor 应按逻辑顺序从左到右排列
6. 当用户指定页面数量时（如"生成 3 个页面"），AI_Generator 应生成指定数量的页面
7. 当批量生成完成时，Visual_Editor 应自动调整画布视图以显示所有生成的形状

### 需求 4：渲染模式切换

**用户故事：** 作为用户，我想在不同的渲染模式之间切换，以便根据当前任务预览、编辑或对比 HTML 内容。

#### 验收标准

1. 当用户按下 'P' 键或点击预览模式按钮时，Visual_Editor 应切换到 Preview_Mode
2. 当用户按下 'E' 键或点击编辑模式按钮时，Visual_Editor 应切换到 Edit_Mode
3. 当用户按下 'S' 键或点击对比模式按钮时，Visual_Editor 应切换到 Split_Mode
4. 当处于 Preview_Mode 时，Visual_Editor 应在 iframe 中渲染 HTML，完整执行 CSS 和 JavaScript
5. 当处于 Preview_Mode 时，用户应能够与渲染的 HTML 内容进行正常交互（点击按钮、填写表单、触发事件等）
6. 当处于 Edit_Mode 时，Visual_Editor 应使用 Shadow DOM 渲染 HTML，启用交互式元素选择
7. 当处于 Split_Mode 时，Visual_Editor 应并排显示原始 HTML 和修改后的 HTML
8. 当切换模式时，Visual_Editor 应保留所有当前的 Element_Override
9. 当在 Preview_Mode 中进行交互时，Visual_Editor 应保持页面状态（如表单输入、滚动位置）
10. 当前激活的模式按钮应显示视觉高亮状态

### 需求 5：元素选择和高亮

**用户故事：** 作为用户，我想点击任何渲染的 HTML 元素来选择它，以便编辑页面的特定部分。

#### 验收标准

1. 当用户在 Edit_Mode 中点击 HTML 元素时，Visual_Editor 应选择该元素
2. 当选择元素时，Visual_Editor 应在元素周围显示蓝色边框高亮
3. 当选择元素时，Visual_Editor 应为该元素生成唯一的 CSS_Selector
4. 当用户点击所有元素外部时，Visual_Editor 应取消选择当前选择
5. 当点击没有 Element_Identifier 的元素时，Visual_Editor 应根据元素在 DOM 树中的位置生成 CSS_Selector

### 需求 6：编辑模式下的元素操作

**用户故事：** 作为用户，我想在编辑模式下直接拖动和缩放 HTML 元素，以便快速调整布局而无需手动修改 CSS。

#### 验收标准

1. 当处于 Edit_Mode 时，用户应能够拖动选定的 HTML 元素到新位置
2. 当拖动元素时，Visual_Editor 应实时更新元素的 CSS 位置属性（left、top 或 transform）
3. 当处于 Edit_Mode 时，用户应能够通过拖动边框控制点来缩放选定的元素
4. 当缩放元素时，Visual_Editor 应实时更新元素的 CSS 尺寸属性（width、height）
5. 当拖动或缩放元素时，Visual_Editor 应显示实时的尺寸和位置提示
6. 当完成拖动或缩放操作时，Visual_Editor 应将位置和尺寸更改记录为 Element_Override
7. 当元素具有 CSS 定位约束（如 flex、grid）时，Visual_Editor 应智能调整定位策略以支持拖动

### 需求 7：元素编辑界面

**用户故事：** 作为用户，我想通过直观的界面编辑选定的元素，以便无需编写代码即可修改内容、样式和行为。

#### 验收标准

1. 当选择元素时，Visual_Editor 应显示 Floating_Edit_Panel
2. Floating_Edit_Panel 应提供三种编辑模式：内容编辑、样式编辑和 AI 优化
3. 当用户在内容编辑模式下修改元素文本时，Visual_Editor 应更新元素的文本内容
4. 当用户在样式编辑模式下修改样式时，Visual_Editor 应将 CSS 更改应用于元素
5. 当用户在 AI 优化模式下提供自然语言请求时，AI_Generator 应为该元素生成改进的 HTML/CSS
6. 当 AI 生成新的元素代码时，Visual_Editor 应在 Edit_Mode 中实时预览 AI 修改结果
7. 当用户确认 AI 修改时，Visual_Editor 应将 AI 生成的更改应用为 Element_Override
8. 当关闭 Floating_Edit_Panel 时，Visual_Editor 应将所有修改保留为 Element_Override

### 需求 8：截图圈选 AI 修改

**用户故事：** 作为用户，我想通过截图圈选页面的特定区域，以便为 AI 提供视觉上下文来进行精确修改。

#### 验收标准

1. 当处于 Edit_Mode 时，Visual_Editor 应提供截图圈选工具按钮
2. 当用户激活截图圈选工具时，Visual_Editor 应允许用户在渲染的 HTML 上拖动绘制矩形选区
3. 当用户完成圈选时，Visual_Editor 应捕获选区内的屏幕截图
4. 当截图捕获完成时，Visual_Editor 应自动识别选区内包含的所有 HTML 元素
5. 当用户提供 AI 修改指令时，Visual_Editor 应将截图和选区内的 HTML 结构一起发送给 AI_Generator
6. 当 AI_Generator 接收到截图上下文时，AI_Generator 应基于视觉信息和结构信息生成更精确的修改建议
7. 当 AI 返回修改建议时，Visual_Editor 应在选区内实时预览修改效果
8. 当用户确认修改时，Visual_Editor 应将所有选区内元素的更改应用为 Element_Override
9. 当用户取消圈选时，Visual_Editor 应清除选区并返回正常编辑模式

### 需求 9：覆盖系统

**用户故事：** 作为用户，我想将修改与原始 HTML 分开跟踪，以便可以查看更改并在需要时恢复。

#### 验收标准

1. 当用户修改元素时，Visual_Editor 应创建 Element_Override 记录
2. Element_Override 应包含 CSS_Selector、修改类型、新值、时间戳和 AI 生成标志
3. 当对同一元素进行多次修改时，Visual_Editor 应将它们合并为单个 Element_Override
4. 当渲染 HTML 时，Visual_Editor 应按时间顺序应用所有 Element_Override
5. Visual_Editor 应支持恢复单个 Element_Override 而不影响其他修改

### 需求 10：状态同步

**用户故事：** 作为开发者，我想在 tldraw 形状和 HTML DOM 之间进行双向同步，以便任一表示中的更改都反映在另一个中。

#### 验收标准

1. 当在 Canvas 上移动 HTML_Shape 时，Sync_Engine 应更新相应 HTML 元素的位置
2. 当通过 Floating_Edit_Panel 修改 HTML 元素时，Sync_Engine 应更新相应的 HTML_Shape
3. 当应用 Element_Override 时，Sync_Engine 应同时更新 HTML DOM 和 tldraw 形状表示
4. Sync_Engine 应保持 HTML_Shape 属性与 HTML DOM 属性之间的一致性
5. 当同步失败时，Sync_Engine 应记录错误并保持最后的有效状态

### 需求 11：HTML 解析和转换

**用户故事：** 作为开发者，我想准确解析生成的 HTML 并将其转换为 tldraw 形状，以便视觉表示与代码结构匹配。

#### 验收标准

1. 当向 HTML_Parser 提供 HTML 时，HTML_Parser 应提取所有元素标签、属性、样式和层次结构
2. HTML_Parser 应将 HTML 结构转换为 tldraw 形状数据，同时保留 Element_Identifier
3. 当解析遇到无效 HTML 时，HTML_Parser 应返回描述性错误消息
4. HTML_Parser 应在形状层次结构中保留 HTML 元素的父子关系
5. HTML_Parser 应为每个元素提取并存储内联样式、类名和计算样式

### 需求 12：差异计算和导出

**用户故事：** 作为用户，我想将修改后的 HTML 导出为干净的、可用于生产的代码，以便在项目中使用。

#### 验收标准

1. 当用户请求代码导出时，Diff_Engine 应计算原始 HTML 和修改后 HTML 之间的所有差异
2. Diff_Engine 应生成应用了所有 Element_Override 的完整 HTML 文档
3. 导出的 HTML 应有效、格式良好，并包含所有 CSS 和 JavaScript
4. 当未进行任何修改时，导出的 HTML 应与原始生成的 HTML 匹配
5. Visual_Editor 应提供多种格式的导出（单个 HTML 文件、分离的 HTML/CSS/JS 文件）

### 需求 13：设计系统集成

**用户故事：** 作为用户，我想使用流行设计系统中的组件，以便生成的页面遵循既定的设计模式。

#### 验收标准

1. Visual_Editor 应支持 Material UI 组件生成
2. Visual_Editor 应支持 Ant Design 组件生成
3. Visual_Editor 应支持 Tailwind CSS 实用类生成
4. 当指定 Design_System 时，AI_Generator 应使用适当的组件语法和类名
5. Visual_Editor 应允许用户配置自定义 Design_System 适配器

### 需求 14：错误处理和验证

**用户故事：** 作为用户，我想在出现问题时获得清晰的错误消息，以便理解并修复问题。

#### 验收标准

1. 当 AI 生成失败时，Visual_Editor 应显示用户友好的错误消息，说明失败原因
2. 当 HTML 解析失败时，Visual_Editor 应显示解析错误位置和描述
3. 当同步失败时，Visual_Editor 应记录错误并尝试恢复到最后的有效状态
4. 当生成无效的 CSS_Selector 时，Visual_Editor 应回退到基于位置的选择器
5. Visual_Editor 应在处理之前验证所有用户输入

### 需求 15：画布交互

**用户故事：** 作为用户，我想通过直观的交互在画布上创建 HTML 形状，以便快速开始设计。

#### 验收标准

1. 当用户双击 Canvas 的空白区域时，Visual_Editor 应显示 AI 输入对话框
2. 当用户在 AI 输入对话框中提交描述时，Visual_Editor 应生成 HTML 并创建 HTML_Shape
3. Visual_Editor 应提供带有常用操作按钮的工具栏（生成、导出、模式切换按钮）
4. 当选择 HTML_Shape 时，Visual_Editor 应在 tldraw 工具栏中显示形状特定的控件
5. Visual_Editor 应支持所有 HTML_Shape 操作的撤销/重做
6. 工具栏中的模式切换按钮应包括预览（P）、编辑（E）、对比（S）三个选项

### 需求 16：导入现有 HTML

**用户故事：** 作为用户，我想导入现有的 HTML 文件进行编辑，以便改进或修改已有的网页。

#### 验收标准

1. Visual_Editor 应提供导入 HTML 文件的功能按钮
2. 当用户选择 HTML 文件时，Visual_Editor 应解析文件内容并创建 HTML_Shape
3. 当导入的 HTML 包含外部 CSS 链接时，Visual_Editor 应提示用户是否加载外部样式
4. 当导入的 HTML 包含外部 JavaScript 时，Visual_Editor 应提示用户潜在的安全风险
5. 当导入成功时，Visual_Editor 应为导入的 HTML 中的关键元素自动生成 Element_Identifier
6. Visual_Editor 应支持导入多个 HTML 文件并自动在画布上排列

### 需求 17：代码查看和编辑

**用户故事：** 作为开发者，我想查看和直接编辑 HTML 源代码，以便进行精细的代码级调整。

#### 验收标准

1. 当选择 HTML_Shape 时，Visual_Editor 应提供"查看代码"按钮
2. 当用户点击"查看代码"时，Visual_Editor 应显示带有语法高亮的代码编辑器
3. 代码编辑器应分别显示 HTML、CSS 和 JavaScript 代码的标签页
4. 当用户在代码编辑器中修改代码时，Visual_Editor 应实时验证代码语法
5. 当用户保存代码更改时，Visual_Editor 应重新解析 HTML 并更新 HTML_Shape
6. 当代码包含语法错误时，Visual_Editor 应在编辑器中高亮显示错误位置
7. 代码编辑器应支持代码格式化和自动补全功能

### 需求 18：响应式设计支持

**用户故事：** 作为用户，我想预览和编辑不同屏幕尺寸下的页面效果，以便创建响应式网页。

#### 验收标准

1. Visual_Editor 应提供设备预览模式选择器（桌面、平板、手机）
2. 当用户选择不同设备模式时，HTML_Shape 应调整到相应的视口宽度
3. 当处于响应式预览模式时，Visual_Editor 应显示当前视口尺寸
4. 当用户在不同设备模式下修改样式时，Visual_Editor 应生成相应的媒体查询
5. Visual_Editor 应支持自定义视口尺寸输入
6. 当导出代码时，Visual_Editor 应包含所有响应式媒体查询

### 需求 19：修改历史和版本管理

**用户故事：** 作为用户，我想查看和管理修改历史，以便追踪更改并恢复到之前的版本。

#### 验收标准

1. Visual_Editor 应维护每个 HTML_Shape 的完整修改历史记录
2. 当用户打开历史面板时，Visual_Editor 应显示所有 Element_Override 的时间线
3. 历史记录应包含修改时间、修改类型、修改内容和是否为 AI 生成
4. 当用户点击历史记录项时，Visual_Editor 应预览该版本的效果
5. 当用户选择恢复到某个历史版本时，Visual_Editor 应移除该版本之后的所有 Element_Override
6. Visual_Editor 应支持为特定版本添加标签或注释
7. Visual_Editor 应支持比较任意两个历史版本的差异

### 需求 20：性能和优化

**用户故事：** 作为用户，我想系统能够流畅运行，以便获得良好的使用体验。

#### 验收标准

1. 当 HTML_Shape 数量少于 10 个时，Visual_Editor 应保持 60fps 的渲染帧率
2. 当单个 HTML 文件大小超过 100KB 时，Visual_Editor 应显示性能警告
3. 当 AI 生成响应时间超过 10 秒时，Visual_Editor 应显示进度指示器
4. 当画布上有多个 HTML_Shape 时，Visual_Editor 应仅渲染视口内可见的形状
5. 当用户进行拖动或缩放操作时，Visual_Editor 应使用防抖或节流优化性能
6. Visual_Editor 应支持延迟加载外部资源（图片、字体等）
7. 当内存使用超过 500MB 时，Visual_Editor 应提示用户并建议优化操作
