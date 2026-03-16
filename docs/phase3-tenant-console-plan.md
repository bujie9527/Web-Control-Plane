# Phase 3：租户后台核心页面 — 实施计划

**目标**：完成租户后台 9 个核心页面骨架，形成企业租户可使用的**业务控制台**基础。重点打磨工作台与项目列表，其余为高质量骨架。

**依据**：`docs/architecture/02、03、04、05、07`，`.cursor/rules/02、04、05`，Phase 2 已建立的通用组件与分层方式。

---

## 1. 本阶段页面拆分方案

| 序号 | 页面 | 类型 | 路由 | 说明 |
|------|------|------|------|------|
| 1 | 工作台 | **重点打磨** | `/tenant` | 今日工作入口：指标卡、我的待办、预警中心、最近任务、快捷入口；非花哨大屏 |
| 2 | 项目列表页 | **重点打磨** | `/tenant/projects` | 标准列表：项目名称、渠道、负责人、目标、状态、Agent Team、终端数、任务进度、操作；可跳转项目详情（Phase 4 再做详情） |
| 3 | 任务中心页 | 骨架级 | `/tenant/tasks` | 任务列表/状态/优先级/负责人/最近执行骨架，分组或 Tab 占位 |
| 4 | 流程中心页 | 骨架级 | `/tenant/workflows` | 流程列表、模板、节点模板、版本骨架 |
| 5 | Agent 中心页 | 骨架级 | `/tenant/agents` | Agent 库、Agent 团队、角色模板、Prompt 管理骨架 |
| 6 | Skills 能力库页 | 骨架级 | `/tenant/skills` | 技能总览、分类、测试台、版本骨架 |
| 7 | 终端中心页 | 骨架级 | `/tenant/terminals` | 社媒账号、Web 自动化、系统终端、API 接入、执行日志骨架 |
| 8 | 数据分析页 | 骨架级 | `/tenant/analytics` | 数据总览、项目/任务/Agent/Skill 分析骨架 |
| 9 | 系统管理页 | 骨架级 | `/tenant/settings` | 成员管理、角色权限、菜单权限、工作区设置、审计日志骨架 |

**与平台后台的区分**：

- 租户侧为**业务控制台**：项目、任务、流程、Agent、终端、分析、成员与权限，均围绕「本租户如何干活」。
- 平台侧为**治理控制台**：租户管理、平台用户、配额、模板、审计、平台设置。
- 菜单顺序体现业务流程：工作台 → 项目中心 → 任务执行 → 流程中心 → Agent → Skills → 终端 → 数据分析 → 系统管理（已在 04-tenant-console 与 tenantMenu 中固定，本阶段不调整菜单顺序）。

**项目详情页**：Phase 4 单独做；本阶段项目列表「查看」可跳转至占位详情或仅占位按钮，待 Phase 4 再接真实项目详情工作台。

---

## 2. 工作台和项目列表页的重点打磨思路

### 2.1 工作台（今日工作入口）

- **定位**：企业工作中台首页，不是数据大屏；强调「今日要做什么」与「从哪里开始」。
- **结构**（与 02、07 一致）：
  1. **核心指标卡**：3～4 个，如「进行中项目数」「待办任务数」「待审核数」「本周完成」等，数字 + 简短文案，用 Card 承载。
  2. **我的待办**：列表占位（标题 + 2～3 条 mock 待办，如「审核任务 xxx」「处理异常任务 yyy」），每条可带「去处理」占位链接。
  3. **预警中心**：2～3 条 mock 预警（如「任务超时」「终端异常」），用 StatusTag 区分级别，克制不花哨。
  4. **最近任务**：表格或列表占位，列：任务名、所属项目、状态、更新时间；3～5 条 mock。
  5. **快捷入口**：4～6 个入口（如「新建项目」「任务中心」「流程中心」「Agent 中心」），用按钮或小卡片，链到对应路由。
- **数据**：工作台专用 mock（dashboardMock），一次返回上述各区块所需数据；页面通过 tenantDashboardService 拉取，不写复杂拼装。
- **风格**：与平台工作台区分——平台偏「租户总数、资源、平台预警」；租户偏「我的待办、最近任务、快捷入口」，突出**业务入口**。

### 2.2 项目列表页（项目管理模式）

- **定位**：租户内业务核心列表，体现「项目 + 渠道 + 负责人 + 目标 + 执行资源 + 进度」。
- **结构**（标准列表页，与 05、07 一致）：
  - **标题区**：PageContainer title + description（如「项目中心」「管理当前租户下的业务项目与执行资源」）。
  - **操作区**：「新建项目」主按钮占位。
  - **筛选区**：搜索（项目名称）、状态筛选、负责人/渠道筛选（若 mock 支持则做，否则占位）。
  - **表格区**：列——项目名称、所属渠道、负责人、当前目标（简短）、当前状态、绑定 Agent Team、绑定终端数、任务进度、更新时间、操作（查看/编辑占位）。
  - **分页区**：Pagination。
- **数据**：Project 列表 mock（projectMock + projectService），字段与 04 领域模型对齐，并扩展「渠道、负责人、agentTeamName、terminalCount、taskProgress」等展示用字段（可 mock 出来）。
- **交互**：「查看」跳转 `/tenant/projects/:id`，Phase 4 再实现详情工作台；本阶段可为占位页或简单占位。

---

## 3. 骨架页面的统一实现方式

- **统一结构**：每页均为 **PageContainer（title + description）+ 2～4 个 Card 分组**，每个 Card 含 title、description、内容区。
- **内容区**：以**占位列表/表格/键值**为主，配合少量 mock 文案或 2～3 条 mock 数据，避免整页空白；使用现有 **EmptyState** 时文案改为「本模块将在后续完善」或与该页业务相关的说明。
- **分组与 02 对应**：
  - 任务中心：任务中心总览、运行中任务、待审核/异常/已完成 等分组。
  - 流程中心：流程列表、流程模板、节点模板、流程版本。
  - Agent 中心：Agent 库、Agent 团队、角色模板、Prompt 管理。
  - Skills：技能总览、技能分类、技能测试台、技能版本。
  - 终端中心：终端总览、社媒账号、Web 自动化、系统终端、API 接入、执行日志（可合并为 3～4 个 Card）。
  - 数据分析：数据总览、项目分析、任务分析、Agent/Skill 分析。
  - 系统管理：成员管理、角色权限、菜单权限、工作区设置、审计日志。
- **不实现**：真实 CRUD、真实筛选、复杂图表；仅结构 + mock 数据 + 明确占位，保证「高质量骨架、可演示」。

---

## 4. 计划新增或复用的组件

### 4.1 复用（已有）

- **PageContainer**：所有页面。
- **Card**：工作台指标卡与区块、项目列表外的骨架页分组。
- **Table**：项目列表、工作台「最近任务」、骨架页中的列表占位。
- **Pagination**：项目列表。
- **StatusTag**：状态列、预警级别。
- **EmptyState**：骨架页 Card 内占位、空表格提示。

### 4.2 计划新增（若尚未有）

| 组件 | 用途 | 说明 |
|------|------|------|
| **MetricCard**（可选） | 工作台指标卡 | 可与现有 Card 复用，仅样式略区分（大数字 + 标签）；若 Card 可满足则不再新增 |
| **QuickEntry**（可选） | 工作台快捷入口 | 一组按钮或小卡片，链到路由；若用 Card + 按钮组可满足则不新增 |

**原则**：优先用现有 Card/Table/StatusTag 组合；仅当复用会导致结构冗余或风格不统一时再抽简短组件。

### 4.3 不新增

- 不与平台后台重复造「列表页」「工作台」形态；租户侧列表页与平台侧列表页共用 Table、Pagination、StatusTag、PageContainer。

---

## 5. 需要补充的 mock service / schema

### 5.1 Schema（`modules/tenant/schemas/` 或 `core/types` 若跨模块）

| 类型 | 说明 |
|------|------|
| **Project** | 与 04 一致：id, tenantId, name, description, status, ownerId, goalSummary, kpiSummary, createdAt, updatedAt；列表展示扩展：channel?, ownerName?, agentTeamName?, terminalCount?, taskProgress? |
| **Task** | 与 04 一致：id, tenantId, projectId, workflowId, status, priority, createdAt, updatedAt；列表展示可加 taskName, projectName, assigneeName |
| **TenantDashboard** | 工作台聚合：metricCards[], todoItems[], alerts[], recentTasks[], quickEntries[]（含 path、label） |

其余（Workflow、Agent、Skill、Terminal、Member、Role 等）可在骨架页用**局部类型**或简单 interface 占位，Phase 4 再与项目详情、真实能力对接时补齐。

### 5.2 Mock 与 Service

| 模块 | Mock | Service | 说明 |
|------|------|---------|------|
| 工作台 | tenantDashboardMock | tenantDashboardService | 返回指标卡、待办、预警、最近任务、快捷入口配置 |
| 项目 | projectMock | projectService（+ projectRepository 可选） | 列表 list、分页、筛选占位；detail 可返回单条占位供 Phase 4 用 |
| 任务/流程/Agent/Skills/终端/分析/系统管理 | 各 1 个 mock 文件或统一 tenantSkeletonMock | 各 1 个 service 或统一 getXxxSkeleton() | 返回 2～3 条占位数据或分组配置，供骨架页展示 |

**接口形态**：与 06 一致，`{ code, message, data, meta }`；列表 `data: { items, total }`，`meta.pagination` 可选。

---

## 6. 涉及模块与文件范围

- **仅限租户后台**：`src/modules/tenant/`，不修改 `modules/platform`、`core`（除常量/路由若需则最小改动）。
- **建议目录**：
  - `modules/tenant/pages/`：TenantDashboard.tsx, ProjectList.tsx, TaskCenter.tsx, WorkflowCenter.tsx, AgentCenter.tsx, SkillsCenter.tsx, TerminalCenter.tsx, AnalyticsPage.tsx, SystemSettings.tsx
  - `modules/tenant/services/`：tenantDashboardService, projectService；其余可为 skeletonService 或按资源拆小文件
  - `modules/tenant/schemas/`：project.ts, task.ts, tenantDashboard.ts（及骨架用类型）
  - `modules/tenant/mock/`：tenantDashboardMock.ts, projectMock.ts，及 skeleton 或各资源 mock
- **路由**：在 `app/routes.tsx` 中，将租户下当前 `TenantPlaceholder` 替换为上述页面组件；项目列表「查看」指向 `/tenant/projects/:id`，详情页 Phase 4 再做，本阶段可为占位页。

---

## 7. 风险点与注意事项

| 风险 | 应对 |
|------|------|
| 租户工作台与平台工作台「长得一样」 | 内容与信息架构区分：平台侧重租户数/资源/平台预警；租户侧重待办/最近任务/快捷入口；区块命名与 mock 文案都体现「我的」「今日」 |
| 项目列表字段过多导致表头拥挤 | 优先保证 07 要求的列都有，可适当收窄列宽或次要信息放 Tooltip/详情；先保证信息完整再优化排版 |
| 骨架页过于空 | 每个 Card 内至少：标题 + 1～2 句说明 + 2～3 条 mock 或「即将开放」类占位，避免整块空白 |
| 与 Phase 4 项目详情脱节 | 项目列表的「查看」路由先定为 `/tenant/projects/:id`，本阶段详情页用占位组件即可，Phase 4 直接替换为项目详情工作台 |
| mock 与平台侧混用 | 租户侧 mock 均放在 `modules/tenant/mock/`，不引用 platform mock；若需「当前租户」从 useAuth 取 tenantId 注入请求参数（mock 可忽略） |

---

## 8. 实施顺序建议（供确认后执行）

1. **Schema 与 mock**：TenantDashboard、Project 及 projectMock、tenantDashboardMock；projectService、tenantDashboardService。
2. **工作台页**：TenantDashboard.tsx，接 dashboardService，渲染指标卡、待办、预警、最近任务、快捷入口。
3. **项目列表页**：ProjectList.tsx，接 projectService，表格 + 筛选 + 分页 + 操作区「新建项目」+ 查看跳转占位详情。
4. **项目详情占位页**：ProjectDetailPlaceholder.tsx，路由 `/tenant/projects/:id`，简单展示「项目详情（Phase 4 实现）」。
5. **7 个骨架页**：按 02 分组用 PageContainer + Card + 占位内容/mock 列表；每页 2～4 个 Card。
6. **路由与 Shell**：TenantShell 改为始终渲染 Outlet；routes 中租户子路由指向上述 9 个页面 + 项目详情占位。
7. **自检**：租户侧与平台侧区分清晰、工作台与项目列表产品感达标、骨架页无大面积空白、菜单与业务流程顺序一致。

---

请确认或调整本计划后，再开始 Phase 3 的代码实现。
