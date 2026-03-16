# Phase 4：项目详情工作台与关键业务页 — 实施计划

**目标**：打造第一阶段最重要的业务页面——项目详情工作台，让系统真正体现「项目管理 + AI 协作中控」的产品价值。

**依据**：`docs/architecture/02、04、05、07`，`.cursor/rules/`，Phase 3 已完成的租户后台与项目列表、占位详情页。

---

## 1. 对「项目详情工作台」的理解

### 1.1 它是什么

项目详情工作台是**以单个项目为边界的业务指挥中心**：

- **工作台**：一屏内可看到项目状态、关键指标、待办与预警，并能快速进入目标、渠道、Agent、终端、流程与任务、结果、设置等模块；强调「在这里决定接下来做什么」。
- **业务中心**：项目是租户内业务的聚合单元，工作台集中展示并串联「目标 → 渠道 → Agent 团队 → 终端 → 流程与任务 → 结果反馈」，形成可理解的业务闭环，而不是分散的配置页。
- **可扩展容器**：顶部摘要 + 页内导航 + 模块内容区的结构固定后，后续新增 Tab 或区块（如「成本」「权限明细」）不需推翻整体布局。

### 1.2 它不是什么

- **普通详情页**：不是「字段罗列 + 保存」的对象详情，而是多模块、多入口的业务视图。
- **长表单页**：编辑能力通过抽屉/弹窗在具体模块内完成，工作台主体以展示与入口为主。
- **简单 Tab 信息页**：每个 Tab 内是**多 Card、多区块**的「小工作台」，而不是一个 Tab 里只塞一张表。

### 1.3 与租户详情页的对比

| 维度 | 平台·租户详情 | 租户·项目详情工作台 |
|------|----------------|----------------------|
| 视角 | 平台治理（看一个租户的资源与配额） | 业务执行（管一个项目的目标、渠道、Agent、终端、任务） |
| 导航 | 锚点滚动（基本信息、配额、成员、项目、审计） | Tab 切换（概览、目标与KPI、渠道、Agent、终端、流程与任务、结果、设置） |
| 内容密度 | 以概览与列表为主 | 每 Tab 多 Card，指标 + 列表 + 占位扩展位 |
| 产品感 | 「查看这个租户」 | 「在这里运营这个项目」 |

---

## 2. 页面整体结构方案

### 2.1 三层结构（自上而下）

```
┌─────────────────────────────────────────────────────────────────┐
│  [ 返回项目列表 ]  面包屑：工作台 > 项目中心 > 项目名称（可选）     │
├─────────────────────────────────────────────────────────────────┤
│  顶部摘要区（SummaryBar）                                          │
│  项目名称 | 状态 | 负责人 | 周期 | 渠道数 | Agent Team | 终端数 | 任务摘要 | KPI 摘要 │
├─────────────────────────────────────────────────────────────────┤
│  页内导航（TabNav）                                                │
│  [ 概览 ] [ 目标与KPI ] [ 渠道配置 ] [ Agent团队 ] [ 终端分配 ]    │
│  [ 流程与任务 ] [ 结果反馈 ] [ 项目设置 ]                          │
├─────────────────────────────────────────────────────────────────┤
│  当前 Tab 对应的模块内容区                                         │
│  ┌─────────────┐ ┌─────────────┐                                 │
│  │ Card A      │ │ Card B      │   （每个 Tab 内 1～3 个 Card，   │
│  │ title/desc  │ │ title/desc  │    结构真实、可扩展）            │
│  │ 内容        │ │ 内容        │                                 │
│  └─────────────┘ └─────────────┘                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 页内导航方式

- **推荐**：**Tab 式切换**，单页内用 state（或 URL hash）记录当前 Tab，不采用 8 个区块纵向锚点滚动。
- **理由**：8 个模块若全部纵向排列会形成超长页，不利于「工作台感」；Tab 切换后只渲染当前模块内容，视觉层级清晰，且便于后续为每个 Tab 增加更多 Card 而不撑爆首屏。
- **URL**：保持 `/tenant/projects/:id`；可选支持 hash（如 `#overview`、`#goals`）与 Tab 双向同步，便于书签与分享到具体 Tab。
- **默认 Tab**：进入页面默认展示「概览」。

### 2.3 与现有项目详情占位页的衔接

- 用新的**项目详情工作台页面**替换当前的 `ProjectDetailPlaceholder`。
- 路由不变：`/tenant/projects/:id` 由新页面接管；「返回项目列表」保留（可放在摘要区左侧或面包屑旁）。

---

## 3. 顶部摘要区的设计建议

### 3.1 信息项（与 05 规范一致，略作扩展）

| 项 | 说明 | 数据来源 / Mock |
|----|------|------------------|
| 项目名称 | 主标题，可加粗或略大 | project.name |
| 项目状态 | StatusTag：草稿/进行中/已暂停/已归档 | project.status |
| 项目负责人 | 姓名 | project.ownerName |
| 项目周期 | 如「2025-02-01 ～ 2025-04-30」或「—」 | mock：startDate, endDate |
| 绑定渠道数 | 数字 | mock：channelCount |
| 绑定 Agent Team | 名称，无则「未绑定」 | project.agentTeamName |
| 终端数 | 数字 | project.terminalCount |
| 当前任务状态摘要 | 如「进行中 3 / 待审核 1 / 已完成 12」或「12/20」 | mock：taskSummary |
| 关键 KPI 摘要 | 一句话，如「曝光 50w+，互动率 5%」 | project.kpiSummary |

### 3.2 布局与交互

- **布局**：单行或两行紧凑排列，项之间用分隔符或留白区分；小屏可折行。
- **操作**：左侧或右侧固定「返回项目列表」链接（Link 到 `ROUTES.TENANT.PROJECTS`）。
- **样式**：与租户详情页的 summary 区风格统一（背景、字号、StatusTag），但信息项为项目维度，避免与平台摘要混淆。

### 3.3 扩展位

- 后续可在摘要区右侧增加「编辑项目」「归档」等主操作，本阶段仅「返回列表」即可。

---

## 4. 各页签的内容结构方案

### 4.1 概览

- **定位**：项目当前状态与「一眼能看到的」关键信息。
- **结构**：
  - **Card：项目当前状态与关键指标**  
    短文案：状态、目标摘要、KPI 摘要、任务进度；可 2～4 个 key-value 或迷你指标卡。
  - **Card：最近任务**  
    表格或列表：任务名、状态、更新时间；3～5 条 mock。
  - **Card：预警与待办**  
    2～3 条 mock 预警或待办（如「任务 xxx 待审核」「终端 yyy 即将过期」），带 StatusTag。
- **不实现**：实时刷新、复杂图表；以 mock 数据为主，结构真实即可。

### 4.2 目标与 KPI

- **定位**：项目目标、阶段目标、核心指标定义。
- **结构**：
  - **Card：项目目标**  
    展示 goalSummary、可选 1～2 段描述（mock）。
  - **Card：阶段目标**  
    列表：阶段名、时间范围、目标描述、状态；2～3 条 mock。
  - **Card：核心指标定义**  
    列表或表格：指标名、目标值、当前值、单位；2～4 条 mock。
- **不实现**：目标编辑、指标公式计算。

### 4.3 渠道配置

- **定位**：项目关联的业务渠道及状态。
- **结构**：
  - **Card：渠道列表**  
    表格：渠道名称、类型、状态、绑定时间、操作（占位）；2～3 条 mock。
  - **Card：渠道说明（可选）**  
    简短说明「渠道用于 xxx」，或占位「后续可配置渠道规则」。
- **不实现**：渠道增删改、真实渠道 API。

### 4.4 Agent 团队

- **定位**：项目绑定的 Agent Team 及角色结构。
- **结构**：
  - **Card：绑定 Agent Team**  
    展示当前绑定的团队名称、状态、描述（mock）；无则「未绑定」+ 占位「绑定」按钮。
  - **Card：团队角色结构**  
    列表或表格：角色名、Agent 名称、模型、状态；2～4 条 mock，体现「团队内多角色」。
- **不实现**：切换团队、编辑角色、真实 Agent API。

### 4.5 终端分配

- **定位**：项目绑定的终端资源。
- **结构**：
  - **Card：终端列表**  
    表格：终端名称、类型（社媒/Web/API/系统）、状态、分配时间、操作（占位）；2～4 条 mock。
  - **Card：终端说明（可选）**  
    一句说明或占位「终端用于执行任务 xxx」。
- **不实现**：分配/回收、真实终端 API。

### 4.6 流程与任务

- **定位**：当前启用流程与近期任务、任务状态。
- **结构**：
  - **Card：当前启用流程**  
    列表：流程名称、版本、状态、最近运行时间；1～2 条 mock。
  - **Card：近期任务**  
    表格：任务名、流程、状态、负责人、更新时间；3～5 条 mock。
  - **Card：任务状态汇总（可选）**  
    运行中 / 待审核 / 异常 / 已完成 数量或进度条占位。
- **不实现**：流程配置、任务重跑、真实 Workflow/Task API。

### 4.7 结果反馈

- **定位**：结果回流与 KPI 达成骨架。
- **结构**：
  - **Card：结果回流概览**  
    2～3 条 mock：来源、条数、最近更新时间；或 key-value 列表。
  - **Card：KPI 达成情况**  
    表格或列表：指标名、目标、当前、达成率；2～4 条 mock。
- **不实现**：真实数据接入、图表。

### 4.8 项目设置

- **定位**：项目基础信息、权限、归档、配置骨架。
- **结构**：
  - **Card：基础信息**  
    dl 或 key-value：名称、描述、负责人、状态、创建/更新时间（与 schema 一致）。
  - **Card：项目成员/权限（骨架）**  
    列表：成员名、角色、权限范围；2 条 mock 或占位「后续开放」。
  - **Card：归档与配置**  
    占位「归档项目」「高级配置」等说明或按钮占位。
- **不实现**：真实编辑、权限配置、归档接口。

---

## 5. 计划复用或新增的组件

### 5.1 复用（已有）

- **PageContainer**：整页标题可选用项目名称，description 用项目描述或一句话说明。
- **Card**：所有 Tab 内区块均用 Card，带 title、description。
- **Table**：概览最近任务、渠道列表、终端列表、近期任务、KPI 达成、角色结构等。
- **StatusTag**：项目状态、任务状态、渠道/终端状态、预警级别。
- **EmptyState**：某 Card 无数据时使用，文案与业务相关。
- **Link / 按钮**：返回列表、占位「绑定」「编辑」等。

### 5.2 新增（建议）

| 组件 | 用途 | 说明 |
|------|------|------|
| **TabNav**（或内联于页面） | 8 个页签切换 | 可用一组 button + 当前 key 状态实现；若需复用可抽成 `ProjectDetailTabs`，接收 tabs + activeKey + onChange。 |
| **SummaryBar**（或内联） | 顶部摘要区 | 与 TenantDetail 的 summary 类似，可抽成通用「键值+状态+操作」横条，供项目详情与后续工作台型详情复用。 |

- **原则**：优先在页面内用现有 Card + 状态 + 表格完成；仅当摘要区或 Tab 在多个页面复用时再抽组件。

### 5.3 不新增

- 不引入与平台/租户现有列表、工作台重复的「详情壳」；项目详情是租户内唯一的工作台型详情，结构可单独实现后再考虑抽象。

---

## 6. 涉及文件范围

### 6.1 新增

| 路径 | 说明 |
|------|------|
| `src/modules/tenant/pages/ProjectDetail/ProjectDetailWorkbench.tsx` | 项目详情工作台主页面：摘要区 + TabNav + 各 Tab 内容渲染。 |
| `src/modules/tenant/pages/ProjectDetail/ProjectDetailWorkbench.module.css` | 工作台布局与摘要、Tab、内容区样式。 |
| `src/modules/tenant/pages/ProjectDetail/tabs/OverviewTab.tsx` | 概览 Tab 内容（多 Card）。 |
| `src/modules/tenant/pages/ProjectDetail/tabs/GoalsKpiTab.tsx` | 目标与 KPI Tab。 |
| `src/modules/tenant/pages/ProjectDetail/tabs/ChannelsTab.tsx` | 渠道配置 Tab。 |
| `src/modules/tenant/pages/ProjectDetail/tabs/AgentTeamTab.tsx` | Agent 团队 Tab。 |
| `src/modules/tenant/pages/ProjectDetail/tabs/TerminalsTab.tsx` | 终端分配 Tab。 |
| `src/modules/tenant/pages/ProjectDetail/tabs/WorkflowTasksTab.tsx` | 流程与任务 Tab。 |
| `src/modules/tenant/pages/ProjectDetail/tabs/ResultsTab.tsx` | 结果反馈 Tab。 |
| `src/modules/tenant/pages/ProjectDetail/tabs/SettingsTab.tsx` | 项目设置 Tab。 |
| `src/modules/tenant/schemas/projectDetail.ts` | 项目详情扩展类型：周期、渠道数、任务摘要、渠道/终端/流程/结果等 mock 结构。 |
| `src/modules/tenant/mock/projectDetailMock.ts` | 按项目 id 返回详情 mock（摘要 + 各 Tab 所需数据）。 |
| `src/modules/tenant/services/projectDetailService.ts` | 拉取项目详情的 service，内部调 mock 或后续 API。 |

以上 Tab 组件可合并为少量文件（如 2～3 个）以减少文件数，但需保证每个 Tab 内结构清晰、多 Card。

### 6.2 修改

| 路径 | 说明 |
|------|------|
| `src/app/routes.tsx` | `/tenant/projects/:id` 由 `ProjectDetailPlaceholder` 改为 `ProjectDetailWorkbench`。 |
| `src/modules/tenant/services/projectService.ts` | 若详情数据统一由 projectDetailService 拉取，可保留 projectService 仅用于列表，或让 projectDetailService 复用 getProjectById 并扩展。 |

### 6.3 删除或保留

- **ProjectDetailPlaceholder**：路由替换后可从 routes 移除引用；文件可保留为备份或删除，按你方习惯。
- **ProjectDetailPlaceholder.module.css**：若删除占位页则一并删除。

---

## 7. 风险点与注意事项

| 风险 | 应对 |
|------|------|
| **范围蔓延** | 本阶段只做「结构真实、可演示」的骨架：mock 数据 + 多 Card，不实现真实编辑、流程配置、Agent/终端 API；编辑与复杂逻辑留待后续。 |
| **Tab 与 URL 不同步** | 若采用 hash 同步，需在 mount 时读 hash、在 Tab 切换时写 hash，并考虑浏览器前进/后退；若先不做 hash，仅 state 切换 Tab，则实现简单，后续再加 hash。 |
| **摘要区信息过多** | 摘要区控制在 8～10 项内，多余信息放入「概览」或对应 Tab；小屏可折行或省略次要项。 |
| **与租户详情页风格不一致** | 摘要区、页内导航的视觉层级（字号、分割线、背景）尽量与 TenantDetail 对齐，差异主要体现在「项目维度」的信息项和 8 Tab 结构。 |
| **各 Tab 仅一张表** | 每个 Tab 至少 2 个 Card（个别可 1 个），且 Card 内为「指标/列表/键值」组合，避免「一个 Tab 里只有一个 Table」的单薄感。 |
| **mock 与列表页数据不一致** | 项目详情 mock 以 project 列表 mock 的 id（如 p1）为 key，摘要与各 Tab 数据与列表页展示的 name、ownerName、agentTeamName、terminalCount、taskProgress 等一致，避免割裂感。 |

---

## 8. 实施顺序建议（确认后执行）

1. **Schema + Mock**：新增 `projectDetail.ts`、`projectDetailMock.ts`（含摘要 + 各 Tab 所需结构），`projectDetailService.ts`。
2. **主页面骨架**：`ProjectDetailWorkbench.tsx`：读 `:id`，拉详情，渲染摘要区 + TabNav（8 Tab）+ 当前 Tab 内容区占位（如先只渲染「概览」内容）。
3. **各 Tab 内容**：按顺序实现 8 个 Tab 组件（或 2～3 个文件内分块），每个 Tab 内 1～3 个 Card，接 mock 数据。
4. **路由与替换**：routes 中 `/tenant/projects/:id` 指向 `ProjectDetailWorkbench`，移除或保留 `ProjectDetailPlaceholder`。
5. **样式与层级**：摘要区、TabNav、内容区间距与分割统一，保证「工作台感」和「业务中心」可感知。
6. **自检**：摘要信息完整、8 Tab 可切换、每 Tab 多 Card 无大面积空白、返回列表正常、与列表页数据一致。

---

请确认或调整本计划后，再开始 Phase 4 的代码实现。
