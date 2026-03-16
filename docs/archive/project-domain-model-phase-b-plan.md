# Project Domain Model 1.0 Phase B 实施计划：升级项目详情页

## 1. 本阶段目标理解

- **定位**：让项目详情页从「项目信息展示」升级为**项目业务定义中心**，用户能明确看到目标、交付、资源、身份、终端、SOP 被系统约束，为后续发起流程和任务打基础。
- **必须完成**：在项目详情工作台中合理接入 Goal、Deliverable、Resources、SOP 四个模块；概览增强；保持工作台风格、不破坏已有结构、与身份/终端/流程与任务兼容。
- **不做**：复杂写操作（可做展示与配置骨架、占位按钮）；不把多个对象挤在一个混乱页签中。

---

## 2. 接入方式建议：方案 A 与方案 B 的取舍

### 2.1 方案 A：在现有项目详情页中新增页签

- **做法**：为 Goal、Deliverable、Resources、SOP 各设独立页签（或「目标」「交付」「资源配置」「SOP」四个新 Tab）。
- **优点**：每个对象单独一页，边界清晰。
- **缺点**：当前已有 9 个 Tab，再增 4 个会到 13 个，导航过长、用户认知负担大；且 Goal 与 Deliverable 语义接近（要达成什么 + 交付什么），拆成两 Tab 略碎。

### 2.2 方案 B：复用现有页签并扩展清晰区块

- **做法**：在现有「目标与KPI」Tab 内增加「项目目标（Goal）」「交付标的（Deliverable）」两个清晰区块，再新增「资源配置」「SOP」两个 Tab。
- **优点**：Tab 总数可控（9 → 11）；目标与交付同属「项目定义」的上半部分，放在同一 Tab 内用 Card 分区即可，符合「目标固定、交付明确」一起看的习惯。
- **缺点**：目标与KPI Tab 内容增多，需靠区块划分和标题避免混乱。

### 2.3 推荐结论：**混合方式（以 B 为主 + 适度新增 Tab）**

| 模块 | 接入方式 | 说明 |
|------|----------|------|
| **Goal + Deliverable** | **复用并扩展现有「目标与KPI」Tab** | 将该 Tab 升级为「目标与交付」：上半部分用两个独立 Card 展示 `data.projectGoals`、`data.projectDeliverables`（列表/表格），下半部分保留现有「阶段目标」「核心指标定义」Card 作为沿用结构，或收束为「阶段与KPI（沿用）」一个 Card，避免一页内对象过多且主次不分。 |
| **Resources** | **新增页签「资源配置」** | 独立 Tab，专门展示 `data.projectResourceConfigs`，按资源类型分组或表格展示，与「身份配置」「终端分配」并列且不合并，职责清晰。 |
| **SOP** | **新增页签「SOP」** | 独立 Tab，专门展示 `data.projectSOP`（自然语言 SOP 为主、解析占位为辅），不与其他对象混在同一页。 |

- **Tab 顺序建议**：概览 → **目标与交付**（原目标与KPI，改名并扩展）→ 渠道配置 → Agent团队 → 身份配置 → 终端分配 → **资源配置**（新）→ 流程与任务 → 结果反馈 → 项目设置 → **SOP**（新）。  
- 这样共 **11 个 Tab**，新增 2 个、改造 1 个，既保证「每个业务对象有清晰承载」，又避免 Tab 过多。

---

## 3. 各模块的页面结构方案

### 3.1 目标与交付 Tab（原「目标与KPI」升级）

- **Tab 名称**：由「目标与KPI」改为 **「目标与交付」**。
- **数据来源**：`data.projectGoals`、`data.projectDeliverables`；沿用数据 `data.goals`（phaseGoals、kpiDefinitions）仅作保留展示。

**区块结构（自上而下）：**

1. **Card「项目目标」**
   - 说明：本项目要达成的业务目标，确认后不宜随意变更。
   - 内容：`data.projectGoals` 列表；每条展示 goalName、goalType、goalDescription、successCriteria、kpiDefinition、isLocked（用 StatusTag 或文案「已锁定」）。
   - 无数据时：EmptyState 或「暂无项目目标」。
   - 可预留「新增目标」「编辑（占位）」入口，本阶段可不实现写逻辑。

2. **Card「交付标的」**
   - 说明：本项目具体交付什么、频率与目标值。
   - 内容：`data.projectDeliverables` 列表；每条展示 deliverableName、deliverableType、description、frequency、targetValue、unit。
   - 无数据时：EmptyState 或「暂无交付标的」。
   - 可预留「新增交付（占位）」入口。

3. **Card「阶段与KPI（沿用）」**
   - 说明：沿用现有阶段目标与指标定义，后续可迁移到上述对象。
   - 内容：保留现有 phaseGoals 表格、kpiDefinitions 表格，或合并为一个折叠/次要 Card，避免与上面两个 Card 视觉权重冲突。

- **要求**：Goal 区块要体现「目标固定、不能漂移」：通过说明文案 + isLocked 展示强化；不以长表单堆叠，以列表/表格为主。

### 3.2 资源配置 Tab（新）

- **Tab 名称**：**「资源配置」**。
- **数据来源**：`data.projectResourceConfigs`。

**区块结构：**

1. **Card「项目资源配置」**
   - 说明：本项目可用的资源（身份、终端、服务、API、Agent 团队等），供流程与任务执行使用。
   - 内容：表格，列包括 resourceType（可转为中文：身份/终端/服务/API/Agent团队）、resourceName、resourceSummary、status；可选「操作」列（查看占位）。
   - 可按 resourceType 分组展示（先类型后列表），或单一表格加 type 列。
   - 无数据时：EmptyState 或「暂无资源配置」。

- **要求**：不替代「身份配置」「终端分配」Tab；仅展示 ResourceConfig 统一视图，与 09/10 规则一致。

### 3.3 SOP Tab（新）

- **Tab 名称**：**「SOP」**。
- **数据来源**：`data.projectSOP`（单条或 null）。

**区块结构：**

1. **Card「项目 SOP」**
   - 说明：本项目「如何做」的自然语言操作说明，可被解析为后续流程与任务（解析结果占位）。
   - 内容：
     - **自然语言 SOP**：主展示区，展示 `projectSOP.sopRaw`（多行文本或保留换行）。
     - **解析结果（占位）**：展示 `projectSOP.sopParsed`；若为空则展示「解析结果占位，后续由 Workflow 解析生成」类文案。
   - 元信息：status、version、updatedAt 在 Card 内摘要或描述区展示。
   - 无数据时：EmptyState 或「暂无 SOP，后续可在此配置项目操作说明」。

- **要求**：不出现 Workflow 执行或 Task 列表；仅展示 SOP 定义与占位，符合规则 10（SOP ≠ Task ≠ Workflow）。

---

## 4. 项目概览增强

- **位置**：OverviewTab 内，在现有「项目当前状态与关键指标」「身份摘要」之间或之后，增加 **「项目定义摘要」** Card。
- **内容**：
  - **目标**：`data.projectGoals` 数量 + 首条 goalName 或「共 N 项目标」；无则「暂无」。
  - **交付**：`data.projectDeliverables` 数量 + 首条 deliverableName 或「共 N 项交付」；无则「暂无」。
  - **资源**：`data.projectResourceConfigs` 数量 + 按 resourceType 的简单统计（如「身份 2、终端 1、API 1」）；无则「暂无」。
  - **SOP**：若有 `data.projectSOP` 则「已配置」+ 版本或状态；无则「未配置」。
- **操作**：可提供「前往目标与交付」「前往资源配置」「前往 SOP」等按钮，切换 activeTab 到对应 Tab（与「前往身份配置」一致）。
- **要求**：摘要级信息，不展开长列表；用户不切 Tab 即可理解「本项目目标、交付、资源、SOP 是否被明确约束」。

---

## 5. 计划修改的页面与服务范围

| 类型 | 路径 | 变更说明 |
|------|------|----------|
| **Workbench** | `ProjectDetailWorkbench.tsx` | TAB_KEYS 增加 `resources`、`sop`；TAB_LABELS 中 `goals` 改为「目标与交付」、新增「资源配置」「SOP」；content 区增加 resources、sop 的 Tab 渲染；为 OverviewTab 传入 onNavigateToGoals / onNavigateToResources / onNavigateToSOP 等回调（或统一 onNavigateToTab）。 |
| **Tab 组件** | `tabs/GoalsKpiTab.tsx` | 改造为「目标与交付」：顶部增加「项目目标」Card（data.projectGoals）、「交付标的」Card（data.projectDeliverables）；保留或收束「阶段与KPI（沿用）」Card；复用 Card、Table、StatusTag、EmptyState、kvGrid、styles。 |
| **Tab 组件** | **新建** `tabs/ProjectResourcesTab.tsx` | 资源配置 Tab：单 Card「项目资源配置」，表格展示 projectResourceConfigs，列 resourceType/resourceName/resourceSummary/status；无数据 EmptyState。 |
| **Tab 组件** | **新建** `tabs/ProjectSOPTab.tsx` | SOP Tab：单 Card「项目 SOP」，展示 sopRaw、sopParsed 占位、status/version；无数据 EmptyState。 |
| **Tab 组件** | `tabs/OverviewTab.tsx` | 增加「项目定义摘要」Card（目标/交付/资源/SOP 四项摘要 + 前往各 Tab 的按钮）；props 增加 onNavigateToGoals、onNavigateToResources、onNavigateToSOP（或单一 onNavigate 传入 tabKey）。 |
| **Service / Mock** | 无 | 数据已由 Phase A 通过 getProjectDetail 聚合（projectGoals、projectDeliverables、projectResourceConfigs、projectSOP），本阶段仅消费 data，不新增接口。 |

- **不修改**：IdentityConfigTab、TerminalsTab、WorkflowTasksTab、ResultsTab、SettingsTab、ChannelsTab、AgentTeamTab 的职责与数据结构；仅保证 Workbench 的 Tab 顺序与命名一致。

---

## 6. 风险点

| 风险 | 说明 | 缓解 |
|------|------|------|
| 目标与KPI Tab 内容过多 | 同一 Tab 内既有 projectGoals、projectDeliverables，又保留 phaseGoals、kpiDefinitions，可能显得拥挤 | 明确主次：前两个 Card 为「项目目标」「交付标的」（主）；第三块「阶段与KPI（沿用）」收束为一块或折叠，弱化视觉权重；控制表格行数（如 phaseGoals/kpiDefinitions 最多展示 5 条 +「更多」占位）。 |
| 资源配置与身份/终端 Tab 概念混淆 | 用户可能不清楚「资源配置」与「身份配置」「终端分配」的区别 | 在「资源配置」Card 说明中写明：本页为项目可用资源的统一视图（含身份、终端、服务、API、Agent 团队）；具体身份与终端的绑定仍在「身份配置」「终端分配」中管理。 |
| 概览摘要信息量不足或过多 | 摘要过简无法传达「被约束」感，过详则重复详情 | 仅展示数量 + 首条或类型统计 + 是否配置 SOP；详细内容引导至对应 Tab。 |
| 类型/枚举展示 | projectGoalType、deliverableType、resourceType 为英文枚举 | 在 Tab 内用本地化映射（如 growth→增长、brand→品牌、identity→身份、terminal→终端）展示，不直接展示枚举值。 |

---

## 7. 实施顺序建议

1. **Workbench**：TAB_KEYS、TAB_LABELS、content 分支；新增 ProjectResourcesTab、ProjectSOPTab 的占位渲染（可先空组件）。
2. **目标与交付**：改造 GoalsKpiTab，接入 projectGoals、projectDeliverables 两个 Card，保留或收束阶段与KPI。
3. **资源配置**：实现 ProjectResourcesTab，表格 + resourceType 展示与空状态。
4. **SOP**：实现 ProjectSOPTab，sopRaw + sopParsed 占位 + 空状态。
5. **概览**：OverviewTab 增加「项目定义摘要」Card 与跳转回调。
6. **自检**：与 Identity/终端/流程与任务兼容、无长表单堆叠、Goal 体现「目标固定」、命名与 05 规范一致。

---

请确认是否按此方案执行；确认后再进入具体实现。
