# Identity 1.0 整体开发情况汇报

## 一、总览

围绕「**Identity 作为标准对象进入项目与任务链路，并为后续矩阵账号管理打基础**」的目标，已完成三个阶段的开发：**Phase A（身份标准对象与身份库）**、**Phase B（项目绑定 Identity）**、**Phase C（任务使用 Identity）**。当前 Identity 1.0 已形成完整闭环：身份被建模、在项目中可配置、在任务中可选与可追溯，结果与终端已预留身份结构，为内容/账号矩阵扩展留好接口。

---

## 二、阶段与目标达成

### Phase A：身份标准对象与身份库

**目标**：将 Identity 建模为标准资源对象，提供身份库列表与详情工作台，并预留与项目/任务/终端的扩展位。

**完成要点**：

- **Schema**：`Identity` 具备 id、tenantId、name、type、corePositioning、toneStyle、contentDirections、behaviorRules、platformAdaptations、status、createdAt/updatedAt；`IdentityStatus`、`IdentityType` 独立定义；与规则 07 一致，非文案形态。
- **分层**：schema / mock / repository / service 齐全；列表与详情仅调用 service，不直连 mock。
- **身份库列表页**：PageContainer + ListPageToolbar（新建、搜索、状态/类型筛选）+ Table + Pagination；列含名称、类型、核心定位、适用平台、状态、更新时间、操作（查看）；支持关键词搜索与分页，租户隔离。
- **身份详情工作台**：返回条 + 摘要条 + 多 Card（基础信息、表达规则、行为规则、平台适配、绑定项目/终端/最近任务占位），工作台型详情而非单表单。
- **入口与路由**：身份库挂在 Agent 中心下二级菜单「身份库」，路由 `/tenant/agents/identities`、`/tenant/agents/identities/:id`，主导航未膨胀。

**产出文件（示例）**：`schemas/identity.ts`，`mock/identityMock.ts`，`repositories/identityRepository.ts`，`services/identityService.ts`，`pages/IdentityList.tsx`，`pages/IdentityDetail/IdentityDetailWorkbench.tsx`，以及相关样式与路由配置。

---

### Phase B：项目绑定 Identity

**目标**：让项目正式支持 Identity 绑定，在项目详情中可看到、管理「本项目用哪些身份」与「默认身份」，身份从资源库进入业务上下文。

**完成要点**：

- **关系模型**：项目可绑定多个 Identity，可设置一个默认 Identity；`ProjectDetailData.identities` 含 `list: ProjectIdentityBindingItem[]`、`defaultIdentityId?: string`；summary 增加 identityCount、defaultIdentityName、identityPlatformSummary。
- **身份配置页签**：项目详情新增「身份配置」Tab（位于 Agent团队 与 终端分配 之间）；IdentityConfigTab 含说明 Card、已绑定身份表格（名称、类型、适用平台、默认、操作：查看/设为默认/解绑）、添加身份入口；查看跳转身份库详情，设为默认/解绑/添加为占位。
- **概览与摘要**：OverviewTab 增加「身份摘要」Card（已绑定身份数、默认身份、适用平台）+「前往身份配置」；项目详情顶部 summary 条增加「身份数」「默认身份」。
- **Mock**：`projectIdentityBindings` 按 projectId 维护 identityIds 与 defaultIdentityId；`buildIdentities(projectId)` 拼 list，与 identityMock 联动。

**产出文件（示例）**：`schemas/projectDetail.ts`（ProjectIdentityBindingItem、identities、summary 扩展），`mock/projectDetailMock.ts`（buildIdentities、buildSummary 身份相关），`tabs/IdentityConfigTab.tsx`，`tabs/OverviewTab.tsx` 身份摘要，`ProjectDetailWorkbench.tsx` 页签与摘要条。

---

### Phase C：任务使用 Identity

**目标**：让 Task 正式支持使用 Identity，使 Identity 从项目配置进入任务执行链路；任务与结果可追踪身份；终端预留主身份绑定位。

**完成要点**：

- **任务创建选 Identity**：流程与任务 Tab 增加「创建任务」按钮与抽屉；表单含「执行身份」下拉，选项仅来自项目 `identities.list`，默认带出 `defaultIdentityId` 或 list[0]；提交时必填 identityId，taskService 用项目已绑定身份做 allowedIdentityIds 校验。
- **任务详情展示 Identity**：近期任务表「查看」打开任务详情抽屉；独立区块「本任务使用的身份」展示名称、类型、核心定位摘要及「查看身份详情」链接；getTaskDetail 返回 TaskDetailView（含 identitySummary）。
- **结果与列表保留 Identity**：TaskItem、RecentTaskItem、ResultFeedItem、RecentTask 等增加 identityId/identityName；项目详情近期任务/概览最近任务/结果反馈表、任务中心、租户工作台最近任务均增加「身份」或「使用身份」列；mock 中任务与结果数据带身份。
- **终端预留**：Terminal / TerminalItem 增加 primaryIdentityId、identityName；项目终端分配 Tab、终端中心社媒账号处展示「绑定身份」列或占位文案；无绑定/解绑业务逻辑，仅结构位与展示。
- **链路**：项目 identities → 任务创建选 identityId → 任务与结果带 identityId/identityName → 任务详情与各列表可追溯；为后续按身份筛选、矩阵策略预留结构。

**产出文件（示例）**：`schemas/task.ts`、`schemas/projectDetail.ts`（TaskItem/RecentTaskItem/ResultFeedItem/TaskDetailView/TerminalItem 扩展）、`schemas/tenantDashboard.ts`、`schemas/terminal.ts`，`mock/taskMock.ts`、`mock/projectDetailMock.ts`（getTaskDetail、合并已创建任务）、`services/taskService.ts`、`projectDetailService`（fetchTaskDetail），`tabs/WorkflowTasksTab.tsx`（创建/详情抽屉与列）、`tabs/OverviewTab.tsx`、`tabs/ResultsTab.tsx`、`tabs/TerminalsTab.tsx`，`TaskCenter.tsx`、`TenantDashboard.tsx`、`TerminalCenter.tsx` 身份列/占位。

---

## 三、架构与数据关系

### 3.1 数据模型关系

```
Identity（标准对象）
    ↑ 绑定
Project ← identities: { list, defaultIdentityId }
    ↑ 归属
Task    ← identityId, identityName（执行身份）
    ↑ 产出/关联
ResultFeedItem / 任务结果 ← identityId, identityName

Terminal ← primaryIdentityId（预留主身份）
```

- **Identity**：租户级资源，有完整 CRUD 与列表/详情；类型、状态、核心定位、平台适配等字段齐全。
- **Project ↔ Identity**：多对多绑定 + 单默认；在项目详情「身份配置」中展示与管理（添加/解绑/设为默认为占位）。
- **Task → Identity**：任务创建时从项目已绑定身份中选一个；Task/TaskItem 持有一个 identityId（及展示用 name/type/summary）。
- **Result / Terminal**：结果回流与终端在 schema 与展示上预留 identity 字段，形成可追溯与可扩展。

### 3.2 分层与调用关系

- **页面**：仅调用 service（identityService、projectDetailService、taskService）；不直连 mock 或 repository。
- **Service**：解包 repository 或直接调用 mock（projectDetail、task）；taskService 内用 getProjectDetail 取 allowedIdentityIds 再调 taskMock。
- **Mock**：identityMock（身份 CRUD/列表）、projectDetailMock（项目工作台聚合 + buildIdentities + getTaskDetail）、taskMock（createTask、getCreatedTasksForProject）；projectDetailMock 合并 taskMock 的已创建任务到 recentTasks。
- **Schema**：identity、projectDetail、task、terminal、tenantDashboard 等统一在 tenant/schemas 下，类型与字段与规则 07/08 一致。

### 3.3 路由与入口

- **身份库**：`/tenant/agents/identities`（列表）、`/tenant/agents/identities/:id`（详情）；入口为 Agent 中心 → 身份库（二级菜单 + 中心页 Card）。
- **项目身份**：项目详情 → 身份配置 Tab；概览「前往身份配置」切到同一项目身份配置 Tab。
- **任务与身份**：项目详情 → 流程与任务 Tab → 创建任务 / 近期任务查看；任务详情内「查看身份详情」跳转身份库详情。

---

## 四、涉及文件清单（按类型）

| 类型 | 路径 |
|------|------|
| **Schema** | `tenant/schemas/identity.ts`，`projectDetail.ts`（Identity 相关类型与扩展），`task.ts`，`terminal.ts`，`tenantDashboard.ts` |
| **Mock** | `identityMock.ts`，`projectDetailMock.ts`，`taskMock.ts`，`skeletonMock.ts`（terminal/task），`tenantDashboardMock.ts` |
| **Repository** | `identityRepository.ts` |
| **Service** | `identityService.ts`，`projectDetailService.ts`（含 fetchTaskDetail），`taskService.ts` |
| **页面** | `IdentityList.tsx`，`IdentityDetail/IdentityDetailWorkbench.tsx`，`ProjectDetail/ProjectDetailWorkbench.tsx`，`ProjectDetail/tabs/IdentityConfigTab.tsx`，`OverviewTab.tsx`，`WorkflowTasksTab.tsx`，`ResultsTab.tsx`，`TerminalsTab.tsx`，`TaskCenter.tsx`，`TenantDashboard.tsx`，`TerminalCenter.tsx` |
| **样式** | `tabs.module.css`（身份/任务/表单相关），`IdentityDetail` 与列表页样式，`SkeletonPages.module.css`（identityTag） |
| **文档** | `docs/identity-phase-a-self-check.md`，`identity-phase-b-plan.md`，`identity-phase-b-self-check-done.md`，`identity-phase-c-plan.md`，`identity-phase-c-selfcheck.md` |

---

## 五、当前能力与边界

### 已具备

- Identity 标准对象与身份库列表/详情、租户隔离与统一 UI。
- 项目多身份绑定与默认身份；项目详情身份配置 Tab、概览身份摘要、摘要条身份数/默认身份。
- 任务创建时从项目已绑定身份中选择、默认身份带出与校验；任务详情与各任务列表展示「使用身份」；任务结果与项目结果、最近任务/结果保留并展示身份信息。
- 终端在 schema 与列表/详情处预留主身份绑定位与占位文案。
- 「项目—身份—任务—结果」基础链路贯通；结构上支持后续按身份筛选、矩阵策略与账号矩阵扩展。

### 未实现（留待后续）

- 身份库「新建身份」表单与真实创建流程（当前为占位）。
- 项目身份配置的「添加绑定」「解绑」「设为默认」的可写逻辑（当前为占位）。
- 终端「绑定/解绑主身份」的业务与配置页。
- 真实任务执行引擎、流程实例与单次任务运行结果实体；当前任务与结果为 mock 与占位数据。
- 内容矩阵/账号矩阵的筛选、看板与策略配置产品能力。

---

## 六、结论与建议

- **Identity 1.0**：三个阶段目标均已达成，身份从标准对象 → 项目配置 → 任务与结果链路贯通，终端预留到位，可视为**基本完成**。
- **质量**：Schema 与分层清晰，Mock 与 UI 风格统一，风险点（单入口创建、默认身份、校验、无身份展示）已按方案落实；无必须补修项，仅有可选增强（如创建任务关联流程、单次运行结果实体、终端绑定交互）。
- **下一步**：建议在「流程/工作流与任务执行」「终端与执行环境」「结果与 KPI 闭环」「内容/账号矩阵」中择一推进；优先前两者可与 Identity 1.0 形成「谁的身份、在哪个终端、执行什么任务」的完整闭环。

以上为 Identity 1.0 前期开发的整体情况汇报。
