# 12 — UI 升级与菜单重构

> 状态：✅ 已完成
> 创建日期：2026-03-16
> 前置依赖：无（基座安装在 P0 阶段完成，与技术债清理并行）
> 后续依赖：所有新增页面（01-11）均在新体系上开发
> 核心目标：从手写 CSS Modules + 13 个基础组件 → Tailwind + shadcn/ui + Lucide + Recharts 的现代企业级 UI 体系

---

## 一、现状诊断

### 1.1 当前技术栈

| 层面 | 现状 | 问题 |
|------|------|------|
| 组件库 | 13 个手写组件（Table, Card, Dialog, Drawer, Sidebar...） | 覆盖度不足，后续新增页面需大量新组件 |
| 样式方案 | 37 个 CSS Modules 文件 | 颜色/间距/圆角硬编码，无统一 token |
| 图标 | 无图标库 | 侧边栏折叠后不可识别，按钮无图标 |
| 图表 | 无 | 结果汇报（11）无法落地 |
| 表单 | 手动 state 管理 | 复杂表单（定时任务、终端配置）开发成本高 |
| Toast | 无统一通知 | 操作反馈不一致 |
| 主题 | 散落硬编码 | 改主题色需逐文件修改 |

### 1.2 当前组件清单

```
src/components/
├── AgentTemplateSelector/  — 业务组件（保留）
├── Card/                   — 基础卡片（升级）
├── Dialog/                 — 弹窗（升级）
├── Drawer/                 — 抽屉（升级）
├── EmptyState/             — 空状态（保留，shadcn 无此组件）
├── Layout/ConsoleLayout    — 后台布局（升级）
├── ListPageToolbar/        — 列表工具栏（保留，内部原子组件升级）
├── PageContainer/          — 页面容器（升级）
├── Pagination/             — 分页（升级）
├── Sidebar/                — 侧边栏（重构）
├── StatusTag/              — 状态标签（升级）
├── Table/                  — 表格（升级）
└── TopBar/                 — 顶栏（升级）
```

### 1.3 后续新增页面对组件的需求缺口

| 页面 | 缺少的组件 |
|------|-----------|
| 消息中心（04/05） | ChatBubble, Avatar, ScrollArea, Textarea, Badge(未读数) |
| 配置助手（07） | ChatBubble, Textarea, ConfirmCard, Steps |
| 定时任务（09） | DatePicker, TimePicker, Select, Switch, CronBuilder |
| 数据分析（11） | LineChart, BarChart, PieChart, MetricCard, TrendArrow |
| 执行时间线（10） | Timeline, Progress, StepIndicator |
| 所有列表页 | Checkbox(行选择), Dropdown(更多操作), Tooltip, Skeleton(加载态) |
| 所有表单 | Form, Input, Select, Radio, Switch, FormField, Validation |

---

## 二、升级方案

### 2.1 技术选型

| 工具 | 版本 | 用途 | 替代对象 |
|------|------|------|---------|
| **Tailwind CSS** | v4 | 原子化样式 + design token | 37 个 CSS Modules |
| **shadcn/ui** | latest | 50+ 高质量 UI 组件 | 13 个手写基础组件 |
| **Lucide React** | latest | 1000+ SVG 图标 | 无（文字占位） |
| **Recharts** | ^2.x | 数据可视化图表 | 无 |
| **react-hook-form** | ^7.x | 表单状态管理 | 手动 useState |
| **zod** | ^3.x | 表单/数据 Schema 校验 | 无 |
| **@hookform/resolvers** | latest | zod 与 react-hook-form 桥接 | — |
| **sonner** | latest | Toast 通知 | 无统一 Toast |
| **date-fns** | ^3.x | 日期格式化与计算 | 无 |
| **@tanstack/react-table** | ^8.x | 高级表格（随 shadcn DataTable） | 手写 Table |
| **class-variance-authority** | latest | 组件变体管理（shadcn 依赖） | — |
| **clsx + tailwind-merge** | latest | 类名合并工具（shadcn 依赖） | — |

### 2.2 选型理由

**为什么是 shadcn/ui + Tailwind 而不是 Ant Design / MUI**：

1. **源码可控**：shadcn 组件直接复制到项目内，不是 npm 黑盒依赖，与现有"手写组件"思路一致
2. **Cursor AI 适配**：shadcn + Tailwind 是 Cursor 代码生成准确率最高的 UI 栈
3. **体积可控**：按需引入，不会一次性增加 1MB 依赖
4. **设计克制**：默认风格专业内敛，适合企业级后台（不像 Ant 那样风格固化）
5. **共存友好**：Tailwind 可与现有 CSS Modules 共存，支持渐进迁移

---

## 三、设计风格参考与 Design Token

### 3.0 设计风格参考

**参考来源**：[Baklib AI 内容云平台](https://www.baklib.com/)

Baklib 是国内优秀的企业级 SaaS 平台，其设计风格代表了现代中文企业级 B 端产品的最佳实践。我们提取以下核心设计特征作为 AWCC 的视觉基准：

| 特征 | Baklib 表现 | AWCC 适配 |
|------|-----------|-----------|
| **底色策略** | 纯白主体 + 极浅灰(#f8fafc)分区 | 控制台内容区使用 #f8fafc，卡片白底叠加 |
| **色彩克制** | 冷色调蓝为主色，不滥用色彩 | primary 蓝色系，辅以 6 色分类标记 |
| **阴影风格** | 几乎无阴影，靠边框区分层次 | 卡片使用极轻阴影(opacity 3-5%)，弹窗使用中等阴影 |
| **圆角风格** | 中等圆角(8-12px)，企业感但不过于圆润 | 统一 8px 默认，Badge 使用 full 圆角 |
| **留白策略** | 大量留白，区块间距宽松 | section gap 24px，card padding 20px |
| **信息密度** | 适中，不拥挤也不空旷 | 表格行高适中，卡片内字段清晰分组 |
| **字体策略** | 系统字体栈，中文优先 | 14px 基准正文，层次用 size 而非粗细区分 |
| **导航风格** | 深色侧边栏 + 白色内容区强对比 | 同样方案，侧边栏 #0f1219 |
| **Tab 风格** | 底线指示器，不使用胶囊 Tab | 蓝色底线 2px 指示当前 Tab |
| **卡片风格** | 白底 + 细边框 + 标题分隔线 | 1px #e2e8f0 边框，标题区底部分隔线 |
| **按钮风格** | 实心主色按钮 + 白底描边次要按钮 | primary 实心蓝 + secondary 白底灰框 |
| **标签风格** | 软底色胶囊标签（绿底绿字、黄底黄字） | Badge 使用语义色浅底 + 同色深文字 |

### 3.1 Design Token JSON 标准

完整的设计标准已输出为结构化 JSON 文件：

```
src/core/design/design-tokens.json
```

该文件包含以下维度（共 15 个顶级 key）：

| 维度 | 说明 | 主要内容 |
|------|------|---------|
| `brand` | 品牌信息 | 名称、定位、风格关键词 |
| `colors.primary` | 品牌主色 | 10 级蓝色色阶（50-900） |
| `colors.accent` | 分类标记色 | 6 色系（indigo/violet/emerald/amber/rose/cyan） |
| `colors.semantic` | 语义色 | success/warning/danger/info 各含 3 级（主色/浅底/边框） |
| `colors.neutral` | 中性色 | 背景/表面/边框/文字 4 层 |
| `colors.sidebar` | 侧边栏 | 深色系 6 个色值 |
| `colors.card` | 卡片 | 背景/边框/阴影 |
| `colors.chart` | 图表 | 6 色序列 + 网格/轴/tooltip |
| `typography` | 排版 | 字体栈/8 级字号/4 级字重/字距 |
| `spacing` | 间距 | 页面/区块/卡片/表单/表格/侧边栏 |
| `radius` | 圆角 | 8 级（none → full） |
| `shadows` | 阴影 | 7 级（none → xl + inner + focus） |
| `transitions` | 动效 | 时长 4 级 + 缓动函数 4 种 |
| `components` | 组件规范 | 12 个核心组件的变体/尺寸/规则 |
| `layout` | 布局标准 | 控制台/列表页/详情页/表单 4 种布局 |
| `patterns` | 交互模式 | 加载/反馈/导航/状态映射/图标 |
| `rules` | 硬性规则 | 13 条 must + 8 条 must_not |

### 3.2 色彩系统（摘要）

```
── 品牌色（10 级色阶）──
primary-50:   #eff6ff   (浅背景)
primary-100:  #dbeafe   (hover 背景)
primary-500:  #3b82f6   (主色，按钮/链接/高亮)
primary-600:  #2563eb   (hover 态)
primary-900:  #1e3a8a   (深色文字)

── 语义色（各 3 级：主色/浅底/边框）──
success:      #22c55e / #f0fdf4 / #bbf7d0   (启用/完成)
warning:      #f59e0b / #fffbeb / #fde68a   (草稿/警告)
danger:       #ef4444 / #fef2f2 / #fecaca   (失败/错误)
info:         #3b82f6 / #eff6ff / #bfdbfe   (信息/运行中)

── 分类标记色（6 色系用于模块区分）──
indigo:  #eef2ff / #4338ca   (规划类)
violet:  #f5f3ff / #6d28d9   (协调类)
emerald: #ecfdf5 / #059669   (执行类)
amber:   #fffbeb / #d97706   (配置类)
rose:    #fff1f2 / #e11d48   (终端类)
cyan:    #ecfeff / #0891b2   (数据类)

── 中性色 ──
background:        #ffffff   (主背景)
surface:           #f8fafc   (内容区底色，参考 Baklib 浅灰区块)
foreground:        #0f172a   (主文字)
foreground-secondary: #475569   (次要文字)
foreground-muted:  #94a3b8   (辅助文字/placeholder)
border:            #e2e8f0   (通用边框)

── 侧边栏（深色，对比内容区白底）──
sidebar-bg:        #0f1219
sidebar-text:      #94a3b8
sidebar-active:    #60a5fa
```

### 3.3 间距与圆角

```
── 间距（Baklib 风格：宽松留白）──
页面内衬:     24px
区块间距:     24px
卡片内衬:     20px（紧凑 16px）
表单字段间距: 20px
表格单元格:   12px × 16px

── 圆角（Baklib 风格：中等圆角）──
sm:      4px   (小按钮、内联标签)
md:      6px   (输入框)
DEFAULT: 8px   (按钮、选择器)
lg:      10px  (下拉面板)
xl:      12px  (卡片、弹窗)
2xl:     16px  (大卡片)
full:    9999px (头像、Badge)
```

### 3.4 排版

```
font-family: system-ui, -apple-system, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif

── 字号层级（14px 基准）──
xs:   12px / 16px   辅助文字、时间戳
sm:   13px / 20px   次要内容、表格单元格
base: 14px / 22px   正文、按钮
lg:   16px / 24px   卡片标题、Tab
xl:   18px / 28px   页面标题
2xl:  24px / 32px   指标数字
3xl:  30px / 36px   大指标
4xl:  36px / 40px   仪表盘核心 KPI
```

---

## 四、图标系统规范

### 4.1 侧边栏图标

**Tenant Shell 菜单图标映射**：

| 菜单项 | Lucide 图标 | 分组 |
|--------|------------|------|
| 工作台 | `LayoutDashboard` | 业务运营 |
| 项目中心 | `FolderKanban` | 业务运营 |
| 消息中心 | `MessageSquare` | 业务运营 |
| 流程模板 | `GitBranch` | 流程与任务 |
| 流程规划 | `Route` | 流程与任务 |
| 运行监控 | `Activity` | 流程与任务 |
| 定时任务 | `Clock` | 流程与任务 |
| Agent 库 | `Bot` | 能力资产 |
| 身份库 | `UserCircle` | 能力资产 |
| Skills 库 | `Zap` | 能力资产 |
| 终端管理 | `Monitor` | 终端与数据 |
| 数据源 | `Database` | 终端与数据 |
| 数据分析 | `BarChart3` | 分析与设置 |
| 系统设置 | `Settings` | 分析与设置 |

**System Shell 菜单图标映射**：

| 菜单项 | Lucide 图标 | 分组 |
|--------|------------|------|
| ← 平台工作台 | `ArrowLeft` | — |
| Agent 模板管理 | `Bot` | AI 能力工厂 |
| Skill 模板管理 | `Zap` | AI 能力工厂 |
| LLM 模型配置 | `Brain` | AI 能力工厂 |
| 流程模板管理 | `GitBranch` | 流程资产 |
| 流程规划会话 | `Route` | 流程资产 |
| 终端类型注册 | `MonitorSmartphone` | 基础设施 |
| 数据源配置中心 | `Database` | 基础设施 |
| Webhook 管理 | `Webhook` | 基础设施 |
| 流程运行监控 | `Activity` | 运行监控 |
| 消息管线监控 | `Radio` | 运行监控 |
| 定时任务总览 | `Clock` | 运行监控 |

**Platform Shell 菜单图标映射**：

| 菜单项 | Lucide 图标 |
|--------|------------|
| 平台工作台 | `LayoutDashboard` |
| 租户管理 | `Building2` |
| 平台用户 | `Users` |
| 资源与配额 | `Package` |
| 模板中心 | `Library` |
| 平台审计 | `Shield` |
| 平台设置 | `Settings` |
| 系统控制台 → | `ArrowRight` |

### 4.2 图标使用规范

- 侧边栏菜单：每项必须有图标，折叠模式下只显示图标
- 按钮：主操作按钮建议带图标（如 `<Plus /> 新建`）
- 状态标签：可带小图标增强识别（`<CheckCircle /> 已完成`）
- 空状态：使用大尺寸图标作视觉焦点
- 尺寸规范：侧边栏 18px、按钮内 16px、内容区 14-16px、空状态 48px

---

## 五、菜单结构重构

### 5.1 Tenant Shell（租户后台）

```typescript
// src/core/navigation/tenantMenu.ts — 优化后

export const tenantMenuConfig: MenuItem[] = [
  { key: 'tenant-home', path: '/tenant', label: '工作台', icon: 'LayoutDashboard' },

  { key: 'group-biz', label: '业务运营', isGroupLabel: true },
  { key: 'projects', path: '/tenant/projects', label: '项目中心', icon: 'FolderKanban' },
  { key: 'messages', path: '/tenant/messages', label: '消息中心', icon: 'MessageSquare' },

  { key: 'group-flow', label: '流程与任务', isGroupLabel: true },
  { key: 'wf-templates', path: '/tenant/workflow-templates', label: '流程模板', icon: 'GitBranch' },
  { key: 'wf-planning', path: '/tenant/workflow-planning', label: '流程规划', icon: 'Route' },
  { key: 'wf-runtime', path: '/tenant/workflow-runtime', label: '运行监控', icon: 'Activity' },
  { key: 'scheduled-tasks', path: '/tenant/scheduled-tasks', label: '定时任务', icon: 'Clock' },

  { key: 'group-assets', label: '能力资产', isGroupLabel: true },
  { key: 'agents', path: '/tenant/agents', label: 'Agent 库', icon: 'Bot' },
  { key: 'identities', path: '/tenant/identities', label: '身份库', icon: 'UserCircle' },
  { key: 'skills', path: '/tenant/skills', label: 'Skills 库', icon: 'Zap' },

  { key: 'group-infra', label: '终端与数据', isGroupLabel: true },
  {
    key: 'terminals', path: '/tenant/terminals', label: '终端管理', icon: 'Monitor',
    children: [
      { key: 'terminals-list', path: '/tenant/terminals', label: '终端列表' },
      { key: 'telegram-bots', path: '/tenant/terminals/telegram', label: 'Telegram Bot' },
      { key: 'facebook-pages', path: '/tenant/facebook-pages', label: 'Facebook 主页' },
    ],
  },
  { key: 'datasources', path: '/tenant/datasources', label: '数据源', icon: 'Database' },

  { key: 'group-analytics', label: '分析与设置', isGroupLabel: true },
  { key: 'analytics', path: '/tenant/analytics', label: '数据分析', icon: 'BarChart3' },
  { key: 'settings', path: '/tenant/settings', label: '系统设置', icon: 'Settings' },
]
```

**vs 现状对比**：

| 变化 | 说明 |
|------|------|
| 新增「消息中心」 | 文档 04/05/06 的用户侧入口 |
| 「流程中心」拆散 | 流程模板、流程规划、运行监控各自独立一级 |
| 新增「定时任务」 | 文档 09 的全局管理入口 |
| 身份库路由独立 | `/tenant/agents/identities` → `/tenant/identities` |
| 终端增加 Telegram 子项 | 文档 02 的 Telegram 管理页 |
| 新增「数据源」 | 文档 01 的租户侧使用入口 |
| 删除「任务执行」一级菜单 | 与运行监控重叠，任务入口整合到项目详情和运行监控中 |
| 5 个分组标签 | 信息分层更清晰 |
| 全部菜单项带图标 | 折叠时可识别 |

### 5.2 System Shell（系统管理员后台）

```typescript
// src/core/navigation/systemMenu.ts — 优化后

export const systemMenuConfig: MenuItem[] = [
  { key: 'platform-home', path: '/platform', label: '← 平台工作台', icon: 'ArrowLeft' },

  { key: 'group-ai', label: 'AI 能力工厂', isGroupLabel: true },
  { key: 'agent-factory', path: '/system/agent-factory', label: 'Agent 模板管理', icon: 'Bot' },
  { key: 'skill-factory', path: '/system/skill-factory', label: 'Skill 模板管理', icon: 'Zap' },
  { key: 'llm-configs', path: '/system/llm-configs', label: 'LLM 模型配置', icon: 'Brain' },

  { key: 'group-workflow', label: '流程资产', isGroupLabel: true },
  { key: 'wf-templates', path: '/system/workflow-templates', label: '流程模板管理', icon: 'GitBranch' },
  { key: 'wf-planning', path: '/system/workflow-planning', label: '流程规划会话', icon: 'Route' },

  { key: 'group-infra', label: '基础设施', isGroupLabel: true },
  { key: 'platform-caps', path: '/system/platform-capabilities', label: '终端类型注册', icon: 'MonitorSmartphone' },
  { key: 'datasource-configs', path: '/system/datasource-configs', label: '数据源配置中心', icon: 'Database' },
  { key: 'webhooks', path: '/system/webhooks', label: 'Webhook 管理', icon: 'Webhook' },

  { key: 'group-monitor', label: '运行监控', isGroupLabel: true },
  { key: 'wf-runtime', path: '/system/workflow-runtime', label: '流程运行监控', icon: 'Activity' },
  { key: 'msg-pipeline', path: '/system/message-pipeline', label: '消息管线监控', icon: 'Radio' },
  { key: 'sched-tasks', path: '/system/scheduled-tasks', label: '定时任务总览', icon: 'Clock' },
]
```

**vs 现状对比**：

| 变化 | 说明 |
|------|------|
| 「平台终端能力」→「基础设施」 | 加入数据源和 Webhook 后组名更准确 |
| 新增「数据源配置中心」 | 文档 01 的 Provider 治理入口 |
| 新增「Webhook 管理」 | 文档 02/04 的 Webhook 注册/状态 |
| 新增「消息管线监控」 | 文档 04 的系统级消息统计 |
| 新增「定时任务总览」 | 文档 09 的跨项目调度状态 |
| Skills 管理 → Skill 模板管理 | 命名统一 |
| 全部菜单项带图标 | 折叠时可识别 |

### 5.3 Platform Shell（平台后台）

结构不变，仅补充图标：

```typescript
// src/core/navigation/platformMenu.ts — 优化后

const platformMenuBase: MenuItem[] = [
  { key: 'platform-home', path: '/platform', label: '平台工作台', icon: 'LayoutDashboard' },
  { key: 'tenants', path: '/platform/tenants', label: '租户管理', icon: 'Building2' },
  { key: 'users', path: '/platform/users', label: '平台用户', icon: 'Users' },
  { key: 'quota', path: '/platform/quota', label: '资源与配额', icon: 'Package' },
  { key: 'templates', path: '/platform/templates', label: '模板中心', icon: 'Library' },
  { key: 'audit', path: '/platform/audit', label: '平台审计', icon: 'Shield' },
  { key: 'settings', path: '/platform/settings', label: '平台设置', icon: 'Settings' },
]
```

### 5.4 MenuItem 类型更新

```typescript
// src/core/navigation/types.ts — 新增 icon 字段

export interface MenuItem {
  key: string
  path: string
  label: string
  icon?: string          // Lucide 图标名称（新增）
  isGroupLabel?: boolean
  children?: MenuItem[]
  badge?: number         // 未读数/徽标（新增，消息中心用）
}
```

### 5.5 新增路由汇总

| 新增路由 | 页面 | 对应文档 |
|---------|------|---------|
| `/tenant/messages` | 消息中心 | 04/05/06 |
| `/tenant/scheduled-tasks` | 定时任务管理 | 09 |
| `/tenant/datasources` | 数据源使用管理 | 01 |
| `/tenant/identities` | 身份库（路由独立） | 05 |
| `/tenant/terminals/telegram` | Telegram Bot 管理 | 02 |
| `/system/datasource-configs` | 数据源配置中心 | 01 |
| `/system/webhooks` | Webhook 管理 | 02/04 |
| `/system/message-pipeline` | 消息管线监控 | 04 |
| `/system/scheduled-tasks` | 定时任务总览 | 09 |

---

## 六、Sidebar 组件重构

### 6.1 当前问题

- 折叠模式下完全不可用（无图标，文字隐藏后看不到任何信息）
- 折叠/展开按钮用文字 `→` / `←`，不够直观
- 分组标签折叠时隐藏，逻辑正确但缺少分隔视觉

### 6.2 重构目标

```
展开模式：
┌──────────────────┐
│ 🏢 AWCC 租户后台  │
├──────────────────┤
│ 业务运营          │  ← 分组标签
│ 📋 项目中心       │  ← 图标 + 文字
│ 💬 消息中心    3  │  ← 图标 + 文字 + 徽标
│                  │
│ 流程与任务        │
│ 🔀 流程模板       │
│ 🗺 流程规划       │
│ 📊 运行监控       │
│ ⏰ 定时任务       │
│ ...              │
├──────────────────┤
│ [◀ 收起]          │
└──────────────────┘

折叠模式：
┌────┐
│AWCC│
├────┤
│ ── │  ← 分组分隔线
│ 📋 │  ← 只显示图标（hover 显示 tooltip）
│ 💬3│  ← 图标 + 小徽标
│    │
│ ── │
│ 🔀 │
│ 🗺 │
│ 📊 │
│ ⏰ │
│ ...│
├────┤
│ [▶]│
└────┘
```

### 6.3 Sidebar 组件接口更新

```typescript
interface SidebarProps {
  menuConfig: MenuItem[]
  collapsed: boolean
  onToggleCollapse: () => void
  currentPath: string
  onNavigate: (path: string) => void
  title: string
  collapsedTitle?: string    // 折叠时显示的短标题，如 "AWCC"
}
```

图标渲染：

```tsx
import { icons } from 'lucide-react'

function MenuIcon({ name, size = 18 }: { name: string; size?: number }) {
  const LucideIcon = icons[name as keyof typeof icons]
  if (!LucideIcon) return null
  return <LucideIcon size={size} />
}
```

---

## 七、核心组件升级清单

### 7.1 从 shadcn/ui 引入的组件（按优先级）

**第一批（基座 + 高频复用）**：

| shadcn 组件 | 替代 | 用于 |
|------------|------|------|
| Button | — | 全局所有按钮 |
| Input | — | 全局所有输入框 |
| Label | — | 表单标签 |
| Select | — | 筛选器、类型选择 |
| Badge | StatusTag | 状态标签 |
| Card | Card | 卡片容器 |
| Dialog | Dialog | 弹窗确认 |
| Sheet | Drawer | 侧滑抽屉 |
| Table | Table | 数据表格 |
| Tabs | — | 详情页 Tab 导航 |
| Tooltip | — | 操作按钮提示 |
| Skeleton | — | 加载态骨架屏 |
| Separator | — | 分隔线 |

**第二批（表单 + 交互增强）**：

| shadcn 组件 | 用于 |
|------------|------|
| Form (react-hook-form) | 表单管理 |
| Checkbox | 表格行选择、配置选项 |
| RadioGroup | 单选配置 |
| Switch | 启用/禁用切换 |
| Textarea | 配置助手输入、SOP 输入 |
| Popover | 快速预览 |
| DropdownMenu | 行操作"更多"菜单 |
| Command | 全局搜索（可选） |
| ScrollArea | 长列表滚动 |
| Avatar | 用户头像、Bot 头像 |

**第三批（数据可视化 + 特殊场景）**：

| 组件 | 来源 | 用于 |
|------|------|------|
| DatePicker | shadcn (基于 react-day-picker) | 定时任务时间选择 |
| Progress | shadcn | 流程执行进度 |
| Toast/Sonner | sonner | 操作反馈 |
| LineChart | Recharts | 趋势图 |
| BarChart | Recharts | 对比图 |
| PieChart | Recharts | 成本分布 |

### 7.2 自定义业务组件（在 shadcn 基础上封装）

| 组件 | 说明 | 对应文档 |
|------|------|---------|
| **MetricCard** | 指标卡片（数字 + 趋势箭头 + 对比文字） | 11 |
| **Timeline** | 执行时间线（时间 + 状态点 + 摘要） | 10/11 |
| **ChatMessage** | 消息气泡（用户/Bot/系统三种样式） | 04/05/07 |
| **ConversationPanel** | 对话面板（消息列表 + 输入框） | 05/07 |
| **CronBuilder** | Cron 表达式可视化配置器 | 09 |
| **StatusTimeline** | 流程节点状态可视化 | 10 |
| **CostBreakdown** | 成本分析组件（饼图 + 明细列表） | 11 |
| **KPITracker** | KPI 目标达成追踪（目标 vs 实际 + 进度条） | 11 |

---

## 八、迁移策略

### 8.1 核心原则

1. **新旧共存**：Tailwind 和 CSS Modules 可以在同一项目中共存，不需要一次性替换
2. **新页面用新体系**：所有 01-11 新增的页面直接用 shadcn + Tailwind
3. **旧页面逐步迁移**：利用各阶段开发间隙，逐步将旧页面迁移
4. **组件渐进替换**：先引入 shadcn 组件，新页面使用；旧页面在修改时顺手替换

### 8.2 分批执行计划

**批次 A（与 P0 并行）：安装基座**

```bash
# 1. 安装 Tailwind v4
npm install -D tailwindcss @tailwindcss/vite

# 2. 初始化 shadcn/ui
npx shadcn@latest init

# 3. 安装图标
npm install lucide-react

# 4. 安装表单工具
npm install react-hook-form zod @hookform/resolvers

# 5. 安装 Toast
npm install sonner

# 6. 安装日期处理
npm install date-fns

# 7. 引入第一批 shadcn 组件
npx shadcn@latest add button input label select badge card dialog sheet table tabs tooltip skeleton separator
```

交付标准：
- Tailwind 可用（新写一个测试页面验证）
- shadcn 第一批 13 个组件可用
- Lucide Icons 可用
- Sidebar 组件支持 icon 字段
- 旧页面不受影响

**批次 B（与 P1 并行）：Sidebar 重构 + 菜单更新**

- Sidebar 组件升级（图标 + 折叠优化 + 徽标）
- 三个 Shell 的菜单配置更新
- MenuItem 类型更新（icon、badge）
- 路由常量新增
- Platform Shell 菜单补图标

交付标准：
- 侧边栏折叠模式可用（只显示图标）
- 新菜单结构生效（分组标签 + 图标）
- 新路由注册（消息中心、定时任务、数据源等先注册路由，页面可以是占位骨架）

**批次 C（与 P1-P3 并行）：表单 + 交互组件**

```bash
npx shadcn@latest add form checkbox radio-group switch textarea popover dropdown-menu command scroll-area avatar
```

**批次 D（与 P5 并行）：数据可视化**

```bash
npm install recharts
```

- MetricCard、Timeline、CostBreakdown、KPITracker 等业务组件开发
- 数据分析页面图表实现

**批次 E（持续进行）：旧页面迁移**

逐步将现有 37 个 CSS Modules 页面迁移到 Tailwind：

| 优先级 | 页面 | 原因 |
|--------|------|------|
| 高 | 项目详情工作台 | 使用频率最高，Tab 较多 |
| 高 | Agent 工厂列表 | 模板工厂是核心管理页 |
| 中 | 各列表页 | 统一表格风格 |
| 中 | 各详情工作台 | 统一 Tab + Card 风格 |
| 低 | 登录页 | 使用频率低 |
| 低 | 平台设置 | 改动少 |

---

## 九、Cursor 辅助策略

### 9.1 创建项目 UI Skill

在 `.cursor/skills/` 中新建 UI 生成 Skill，让 Cursor 每次生成页面时自动遵循新体系：

```
.cursor/skills/create-page-with-shadcn/SKILL.md
```

Skill 内容要点：
- 新页面必须使用 shadcn/ui 组件 + Tailwind 类名
- 引用 Lucide Icons 而非文字或 emoji
- 表单使用 react-hook-form + zod
- 操作反馈使用 sonner toast
- 遵循 design token 色彩规范
- 列表页遵循 14-list-page-checklist
- 详情页遵循 15-detail-workbench-checklist

### 9.2 利用 v0.dev 加速原型

对于新增页面（消息中心、定时任务、数据分析），可以先在 v0.dev 中用自然语言描述，生成 shadcn + Tailwind 代码，再粘贴到项目中调整。

适合 v0.dev 的场景：
- 消息中心对话界面布局
- 定时任务 Cron 配置表单
- 数据分析仪表盘卡片布局
- 指标卡片 + 趋势图组合

---

## 十、开发顺序

```
步骤 1: 安装基座（批次 A）
  → Tailwind v4 + shadcn/ui init + Lucide + 第一批组件
  → 验证：新建测试页面，确认 Tailwind + shadcn + Icons 工作正常
  → 旧页面不受影响

步骤 2: Sidebar 重构（批次 B）
  → MenuItem 类型新增 icon、badge 字段
  → Sidebar 组件支持图标渲染、折叠图标模式、徽标
  → 三个 Shell 菜单配置更新
  → 新路由注册（骨架占位页面）

步骤 3: 路由与菜单生效
  → 身份库路由 /tenant/identities 独立
  → 消息中心 /tenant/messages 骨架页
  → 定时任务 /tenant/scheduled-tasks 骨架页
  → 数据源 /tenant/datasources 骨架页
  → System Shell 新增路由骨架页

步骤 4: 表单与交互组件（批次 C）
  → 引入第二批 shadcn 组件
  → 表单基础设施（react-hook-form + zod）

步骤 5: 数据可视化（批次 D）
  → Recharts 引入
  → MetricCard、Timeline 等业务组件

步骤 6: 旧页面渐进迁移（批次 E）
  → 按优先级逐步替换 CSS Modules
```

---

## 十一、验收标准

### 基座安装
- [ ] Tailwind CSS v4 可用，新页面可使用 Tailwind 类名
- [ ] shadcn/ui 第一批 13 个组件可用
- [ ] Lucide Icons 可在组件中引用
- [ ] react-hook-form + zod 可用
- [ ] sonner Toast 可用
- [ ] 旧 CSS Modules 页面不受影响（共存验证）

### Sidebar 重构
- [ ] 所有菜单项有图标
- [ ] 折叠模式下只显示图标，hover 显示 tooltip
- [ ] 分组标签正确显示
- [ ] 消息中心支持徽标（未读数）
- [ ] 三个 Shell 菜单结构与本文档一致

### 菜单与路由
- [ ] Tenant Shell：5 个分组、14 个菜单项
- [ ] System Shell：4 个分组、14 个菜单项
- [ ] Platform Shell：7 个菜单项 + 图标
- [ ] 新增路由已注册（至少有骨架占位页）
- [ ] 身份库路由独立于 Agent

### Design Token
- [ ] 色彩统一定义在 Tailwind 配置中
- [ ] 新页面使用 token 而非硬编码颜色值
- [ ] 语义色（success/warning/danger）全局一致
- [ ] design-tokens.json 中的 components 规范已落实

### 组件覆盖
- [ ] 所有新增页面使用 shadcn + Tailwind（不新增 CSS Modules）
- [ ] 表单场景使用 react-hook-form（不使用手动 useState）
- [ ] 操作反馈使用 sonner Toast（不使用 alert）

---

## 十二、Design Token JSON 使用指南

### 12.1 文件位置

```
src/core/design/design-tokens.json    — 完整设计标准（权威源）
```

### 12.2 谁在什么时候用

| 角色 | 使用场景 | 读取方式 |
|------|---------|---------|
| **开发者** | 新建组件/页面时查阅颜色、间距、圆角标准 | 直接打开 JSON 查阅 |
| **Cursor AI** | 生成代码时遵循设计标准 | 通过 `.cursor/skills` 引用 |
| **Tailwind** | 注入 design token 到 CSS 变量 | 构建时从 JSON 读取 |
| **Code Review** | 检查是否违反设计规则 | 对照 `rules.must` / `rules.must_not` |

### 12.3 JSON → Tailwind 映射

安装基座时，将 design-tokens.json 的色彩注入到 Tailwind CSS 变量中：

```css
/* src/index.css — 在 @layer base 中注入 */
@layer base {
  :root {
    --background: 0 0% 100%;            /* #ffffff */
    --foreground: 222 47% 11%;          /* #0f172a */
    --primary: 217 91% 60%;             /* #3b82f6 */
    --primary-foreground: 0 0% 100%;    /* #ffffff */
    --muted: 210 40% 96%;              /* #f1f5f9 */
    --muted-foreground: 215 16% 47%;   /* #64748b */
    --border: 214 32% 91%;             /* #e2e8f0 */
    --input: 214 32% 91%;             /* #e2e8f0 */
    --ring: 217 91% 60%;              /* #3b82f6 */
    --radius: 0.5rem;                  /* 8px */
    /* ... 完整映射见 shadcn/ui init 后的 globals.css */
  }
}
```

### 12.4 组件规范速查

design-tokens.json 中 `components` 节点定义了 12 个核心组件的设计标准：

| 组件 | 关键规范 |
|------|---------|
| **Button** | 5 种变体（primary/secondary/ghost/danger/link）× 3 种尺寸 |
| **Card** | 白底 + 1px 边框 + 极轻阴影 + 20px 内衬 + 标题分隔线 |
| **Table** | 浅灰表头 + hover 行高亮 + 操作列固定右侧 |
| **Badge** | 7 种变体（success/warning/danger/info/neutral/indigo/violet）+ 胶囊形 |
| **Dialog** | 3 种宽度 + 标题/描述/底部按钮标准 |
| **Drawer** | 4 种宽度 + 头/体/尾三段式 |
| **Tabs** | 底线指示器 + 中文命名 + state 控制 |
| **Input** | 36px 高度 + focus 蓝色 ring + error 红色 ring |
| **Toast** | 右下角定位 + 4s 自动消失 |
| **MetricCard** | 大数字(2xl) + 趋势箭头(绿涨红跌) + 标签(sm) |
| **ChatMessage** | 用户蓝底靠右 / Bot 灰底靠左 / 系统黄底居中 |
| **EmptyState** | 48px 图标 + 引导按钮 |

### 12.5 状态色映射速查

`patterns.status-mapping` 定义了全局状态与 Badge 变体的映射：

```
active     → success(绿)  →「启用」
completed  → success(绿)  →「已完成」
running    → info(蓝)     →「运行中」
pending    → neutral(灰)  →「待处理」
draft      → warning(橙)  →「草稿」
disabled   → neutral(灰)  →「已停用」
archived   → neutral(灰)  →「已归档」
failed     → danger(红)   →「失败」
deprecated → warning(橙)  →「已废弃」
```

### 12.6 开发硬性规则速查

**必须做（13 条）**：
1. 新页面用 Tailwind，不新增 CSS Modules
2. 新组件用 shadcn/ui 或基于 shadcn 封装
3. 所有面向用户文字中文
4. 英文枚举必须有中文映射
5. 操作反馈用 sonner toast
6. 表单用 react-hook-form + zod
7. 图标用 Lucide React
8. 颜色引用 token，不硬编码 hex
9. 阴影用预定义级别
10. 卡片间距用 24px
11. 表格行 hover 有视觉反馈
12. 删除必须二次确认弹窗
13. 空状态必须有引导按钮

**禁止做（8 条）**：
1. 不用 style={{}} 内联样式
2. 不用 !important
3. 不在组件中硬编码中文映射
4. 不新增 .module.css
5. 不用 alert()
6. 不用 window.confirm()
7. 不用大阴影（lg 以上仅弹窗/抽屉）
8. 不用纯黑 #000 或纯白 #fff
