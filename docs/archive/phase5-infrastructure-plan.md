# Phase 5：通用基础设施补齐与结构清理 — 实施计划

**目标**：把第一轮开发成果收拢到统一规范下，补齐通用组件、mock/service/repository 分层与结构性占位，使项目进入「可持续扩展」状态。本阶段**不**以新增业务页面为重点，而是统一、收口、规范化与基础设施补齐。

**依据**：`docs/architecture/03、04、06、07`，`.cursor/rules/`，现有 Phase 1～4 实现。

---

## 1. 当前结构问题清单

### 1.1 类型与合约重复

| 问题 | 位置 | 说明 |
|------|------|------|
| **ListResult / ApiResponse 重复** | `platform/schemas/tenant.ts`、`tenant/schemas/project.ts` | 两处各自定义相同结构，后续扩展易不一致；06 要求统一返回结构。 |
| **无统一基类或 core 层共享类型** | core 无 `types/api.ts` 或 `schemas/common.ts` | 分页、响应、错误码等应在 core 或共享处定义一次。 |

### 1.2 分层不一致

| 问题 | 位置 | 说明 |
|------|------|------|
| **租户侧无 repository** | `tenant/services/projectService.ts`、`projectDetailService.ts`、`tenantDashboardService.ts` | 直接调 mock，与 03/06「service 调 repository、repository 调 mock/API」不符；平台侧 tenant 已有 repository。 |
| **平台 dashboard 无 repository** | `platform/services/platformDashboardService.ts` | 直接调 mock，未经过 repository。 |
| **Service 返回形态不统一** | 平台 tenantService 返回 `ListResult<T>`（解包后），tenant projectService 也返回 `ListResult<Project>`，但 platform repository 返回 `ApiResponse<ListResult<T>>` | 统一为：repository 返回 ApiResponse，service 解包后返回 data 或抛错。 |

### 1.3 通用组件缺口与重复

| 问题 | 说明 |
|------|------|
| **无通用 Toolbar/筛选区组件** | 03 要求通用 Toolbar；当前 TenantList、ProjectList 各自用 `actionBar + toolbar + filters` 的 div + 本页 CSS，两处 CSS 几乎完全相同。 |
| **无通用 Dialog/Modal** | 仅有 Drawer；06/07 提到「通用弹窗表单容器」，确认、轻量表单等场景需 Modal。 |
| **无通用 MetricCard** | 工作台指标卡用 Card + 自定义内容，可接受；若需「数字+标签」统一样式可抽 MetricCard，非必须。 |
| **列表页样式重复** | TenantList.module.css 与 ProjectList.module.css 的 actionBar、primaryBtn、toolbar、filters、search、select、queryBtn、actions、linkBtn 等高度一致，应抽成共享样式或组件。 |

### 1.4 Schema 分散与未统一

| 问题 | 说明 |
|------|------|
| **核心资源 schema 不集中** | Tenant、Project、Task、ProjectDetail 等分布在 platform/tenant 各模块；User、Role、Permission、Agent、AgentTeam、Skill、Terminal、Workflow、AuditLog 等无统一定义或仅存在于骨架 mock 的局部类型。 |
| **04 领域模型未落地为统一 schema** | 04 列出的 Tenant、User、Role、Permission、Project、Agent、AgentTeam、Skill、Terminal、Workflow、Task、AuditLog 应在 core 或各模块有对应 schema 文件，便于 mock/service 统一引用。 |

### 1.5 Mock 与 CRUD 不完整

| 问题 | 说明 |
|------|------|
| **Mock 仅有 list/detail** | tenantMock 有 getTenantList、getTenantDetail，无 create/update/delete/patchStatus；projectMock 仅有 getProjectList、getProjectById，无写操作占位。 |
| **未统一 list/detail/create/update/delete/patchStatus** | 06 要求资源型接口统一这六类动作；当前仅部分 list/detail，写操作与状态变更无占位。 |

### 1.6 Event / Audit 未预留

| 问题 | 说明 |
|------|------|
| **core 无 event 命名文件** | 06 要求事件命名规范（如 tenant.created、project.updated）；当前无集中定义。 |
| **core 无 audit 接口占位** | 06/04 要求审计记录结构与场景预留；当前仅租户详情、平台审计页有 mock 展示，无统一 audit 类型与调用占位。 |

### 1.7 代码与目录小问题

| 问题 | 说明 |
|------|------|
| **ProjectDetailPlaceholder 未删除** | 路由已切到 ProjectDetailWorkbench，占位页文件仍存在，可删或明确标注弃用。 |
| **PlatformShell 的 PlatformPlaceholder** | 使用 PageContainer/EmptyState 已补 import，若 routes 未使用可保留供将来占位。 |
| **命名不统一** | 平台侧 getTenantList/getTenantDetail，租户侧 fetchProjectList/fetchProjectDetail——建议统一为「模块内 getXxx 或 fetchXxx 二选一」并文档化。 |

---

## 2. 建议优先修正的基础设施项

按优先级排序，**先做对扩展影响大、改动面可控**的项：

| 优先级 | 项 | 理由 |
|--------|-----|------|
| **P0** | core 层统一 ApiResponse / ListResult / PaginationMeta | 消除重复定义，所有模块从 core 引用；为 repository 统一返回形态打基础。 |
| **P0** | 通用 ListPage 样式（或 Toolbar + FilterBar 组件） | 消除 TenantList/ProjectList 两处重复 CSS，新列表页直接复用。 |
| **P1** | 租户侧 project 增加 repository，service 经 repository 调 mock | 与平台 tenant 分层一致，为后续 create/update 占位做准备。 |
| **P1** | 核心资源 schema 集中补齐（见下节） | User、Role、Permission、Agent、AgentTeam、Skill、Terminal、Workflow、Task、AuditLog 在 core/schemas 或各模块 schemas 中定义，与 04 对齐。 |
| **P1** | Mock 统一形态：list/detail/create/update/delete/patchStatus 占位 | 主要对 Tenant、Project 先做；其余资源可只做 list/detail 占位。 |
| **P2** | 通用 Dialog/Modal 组件 | 确认框、轻量表单用；Drawer 保留用于复杂表单。 |
| **P2** | core/events、core/audit 占位文件 | 事件命名常量、AuditLog 类型、auditService.record() 占位。 |
| **P2** | 未完成模块占位优化 | 平台审计、租户系统管理等已有 Card+EmptyState，可补充「审计场景说明」「后续扩展点」等结构化占位文案。 |

---

## 3. 通用组件统一方案

### 3.1 已有且保留

- **PageContainer**：标题区 + 描述区 + body，不改。
- **Card**：标题/描述/内容，不改。
- **Table**：列配置、dataSource、rowKey、loading、emptyText，不改。
- **Pagination**：page、pageSize、total、onPageChange、onPageSizeChange，不改。
- **StatusTag**：type=success|warning|error|info|neutral，不改。
- **EmptyState**：title、description，不改。
- **Drawer**：open、onClose、title、width、children，不改。

### 3.2 补齐或统一

| 组件 | 方案 | 说明 |
|------|------|------|
| **页面容器** | 沿用 PageContainer | 已满足「标题区/描述区」；无需新增。 |
| **标题区/描述区** | 沿用 PageContainer 的 title/description | 不单独拆组件。 |
| **Toolbar / 筛选区** | **方案 A（推荐）**：新增 `ListPageToolbar` 组件，接收 `primaryAction?`、`children`（筛选表单项）；内部提供统一 actionBar + toolbar 布局与样式。**方案 B**：只抽共享 CSS 模块（如 `ListPage.module.css`），页面仍用 div 结构。 | 方案 A 复用率更高；方案 B 改动最小。建议方案 A，便于后续列表页统一扩展「高级筛选」「导出」等。 |
| **表格容器** | 沿用 Table + 外层 div；可选提供 `TableContainer` 仅做边框与 loading 占位样式 | 当前 Table 已够用；若需要可加无逻辑的 TableContainer 样式包装。 |
| **指标卡** | **方案 A**：新增 `MetricCard`，props：value、label、desc?。**方案 B**：继续用 Card + 自定义内容。 | 建议方案 B 维持现状，减少组件数量；若多处需要「大数字+标签」再抽 MetricCard。 |
| **状态标签** | 沿用 StatusTag | 已统一。 |
| **空状态** | 沿用 EmptyState | 已统一。 |
| **详情抽屉** | 沿用 Drawer；约定「详情类内容用 Drawer，标题为资源名」 | 不新增，文档约定即可。 |
| **通用弹窗表单容器** | **新增 Dialog**：open、onClose、title、width?、footer?、children；用于确认框、单表单项等；表单内容由调用方传入。 | 与 Drawer 区分：Dialog 居中、小尺寸、轻量；Drawer 侧滑、大内容。 |

### 3.3 实施建议

- 新增：**ListPageToolbar**（或 ListToolbar）+ **Dialog**。
- 抽共享样式：若不做 ListPageToolbar 组件，则抽 `components/ListPage/ListPage.module.css`（或 `styles/listPage.css`），TenantList、ProjectList 引用，删除重复 CSS。
- 不新增：MetricCard、TableContainer（除非后续多页强烈需要）。

---

## 4. Schema / Service / Repository 补齐方案

### 4.1 Core 层共享类型

- **新建** `core/types/api.ts`（或 `core/schemas/common.ts`）：
  - `ApiResponse<T>`
  - `ListResult<T>`（items, total）
  - `PaginationMeta`（page, pageSize, total）
  - 可选：`ApiError`、通用 status 枚举
- **删除或收口**：platform/schemas/tenant.ts、tenant/schemas/project.ts 中的 `ListResult`/`ApiResponse`，改为从 `@/core/types/api` 引用。

### 4.2 核心资源 Schema 补齐

**原则**：与 04 领域模型对齐；可放在 core 或各模块，以「谁用谁定义、core 只放跨模块共享」为界。

| 资源 | 建议位置 | 说明 |
|------|----------|------|
| Tenant | 保持 platform/schemas/tenant.ts | 已存在，补充从 core 引用 ApiResponse/ListResult。 |
| User | core/types/user.ts 或 platform/schemas/user.ts | 平台用户、租户成员都会用；id、name、email、status、tenantId?、roles、createdAt、updatedAt。 |
| Role | core/types/role.ts 或各模块 | id、name、code、scope?、permissionIds?。 |
| Permission | core/types/permission.ts | id、scope、module、action、name?。 |
| Project | 保持 tenant/schemas/project.ts | 已存在，引用 core 类型。 |
| Agent | tenant/schemas/agent.ts 或 core | id、tenantId、name、roleName、model、status、createdAt、updatedAt。 |
| AgentTeam | tenant/schemas/agentTeam.ts | id、tenantId、name、description、status、createdAt、updatedAt。 |
| Skill | tenant/schemas/skill.ts | id、tenantId、name、type、version、status、createdAt、updatedAt。 |
| Terminal | tenant/schemas/terminal.ts | id、tenantId、name、type、status、capabilities?、createdAt、updatedAt。 |
| Workflow | tenant/schemas/workflow.ts | id、tenantId、name、version、status、createdAt、updatedAt。 |
| Task | 保持 tenant/schemas/task.ts | 已存在，可扩展与 04 一致。 |
| AuditLog | core/types/audit.ts | id、scope、actorId、actorType、targetType、targetId、action、result、detail?、createdAt。 |

**实施**：优先在 **core** 下建 `types/` 或 `schemas/`，放置 ApiResponse/ListResult/PaginationMeta、User、Role、Permission、AuditLog；在 **tenant** 下补 agent、agentTeam、skill、terminal、workflow 的 schema 文件（可与现有 skeletonMock 中的局部类型对齐）。Platform 的 Tenant 保持不动，仅类型引用 core。

### 4.3 Service / Repository 分层补齐

| 模块 | 当前 | 目标 |
|------|------|------|
| **Platform – Tenant** | service → repository → mock ✅ | 保持；tenantMock 增加 create/update/delete/patchStatus 占位（返回成功或模拟 id）。 |
| **Platform – Dashboard** | service → mock 直调 | 可选：增加 platformDashboardRepository，service 经 repo 调 mock；或保持现状并文档约定「简单聚合数据可直调 mock」。 |
| **Tenant – Project** | service → mock 直调 | **增加** projectRepository；projectService 改为调 projectRepository；projectMock 增加 create/update/delete/patchStatus 占位。 |
| **Tenant – ProjectDetail** | service → mock 直调 | 可保持 service → mock（详情为只读聚合），或 projectDetailRepository 仅封装 getDetail，与 projectRepository 并列。 |
| **Tenant – Dashboard** | service → mock 直调 | 可保持；或 tenantDashboardRepository 封装 getDashboard。 |

**统一约定**：

- Repository 层：返回 `ApiResponse<T>`；内部调 mock 或后续 API。
- Service 层：调 repository；解包 `res.data`，若 `res.code !== 0` 抛错；对外返回业务数据（如 `ListResult<T>`、`T`），不返回包装。
- 列表分页：repository 的 list 在 `meta.pagination` 中带 page、pageSize、total；service 返回 `{ items, total }` 或保持与现有一致。

### 4.4 Mock 统一形态

对 **Tenant**（平台）、**Project**（租户）两个重点资源：

- **list**：已有。
- **detail**：已有。
- **create**：mock 内新增 `createTenant(payload)`、`createProject(payload)`，返回新对象（生成 id、createdAt、updatedAt）；repository 暴露 `createXxx`，service 暴露 `createXxx`。
- **update**：mock 内新增 `updateTenant(id, payload)`、`updateProject(id, payload)`，返回更新后对象；repository/service 同上。
- **delete**：mock 内新增 `deleteTenant(id)`、`deleteProject(id)`，返回 success；可只做逻辑删除或从内存列表移除。
- **patchStatus**：mock 内新增 `patchTenantStatus(id, status)`、`patchProjectStatus(id, status)`，返回更新后对象。

其余资源（Agent、Skill、Terminal、Workflow、Task）第一阶段可仅 **list/detail** mock 占位，create/update/delete/patchStatus 在 schema 与 repository 上留接口占位即可。

---

## 5. Event / Audit 预留方案

### 5.1 统一事件命名

- **新建** `core/constants/events.ts`（或 `core/events.ts`）：
  - 常量枚举或字面量：`tenant.created`、`tenant.updated`、`tenant.status.changed`、`project.created`、`project.updated`、`user.created`、`workflow.created`、`task.created`、`task.started`、`agent.created`、`skill.updated`、`terminal.status.changed` 等，与 06 示例对齐。
  - 用途：后续埋点、审计 action 字段、消息推送等统一引用，本阶段仅占位。

### 5.2 统一 Audit 接口占位

- **新建** `core/types/audit.ts`：定义 `AuditLog` 接口（id、scope、actorId、actorType、targetType、targetId、action、result、detail?、createdAt）。
- **新建** `core/services/auditService.ts`（或 `modules/platform/services/auditService.ts`）：
  - `record(log: Omit<AuditLog, 'id'|'createdAt'>)`：占位实现，可 console.log 或写入内存数组；返回 void 或 Promise<void>。
- **新建** `core/mock/auditMock.ts`（可选）：内存数组存最近 N 条，`getAuditList(scope?, params?)` 供平台审计页使用。
- **文档**：在 `docs/architecture/06` 或 `docs/phase5-infrastructure-plan.md` 中列出「关键资源预留审计场景」（创建/更新租户、创建/更新项目、分配成员、修改权限、Agent/Skill/Terminal/Workflow/Task 关键操作），后续在写操作处调用 `auditService.record()`。

### 5.3 关键资源审计场景说明

与 06 一致，以下操作预留审计记录（本阶段仅说明，不强制每处调用）：

- 创建/更新租户、租户状态变更
- 创建/更新项目、项目配置、项目成员分配
- 角色/权限变更
- 创建/更新 Agent、Agent 团队分配
- Skill 更新、Terminal 状态变更
- Workflow 创建/更新、Task 启动/终止/审核

---

## 6. 代码结构清理（不推翻现有页面）

### 6.1 命名统一

- **Service 方法**：建议统一为 `getXxxList`、`getXxxDetail`、`createXxx`、`updateXxx`、`deleteXxx`、`patchXxxStatus`；若当前为 fetchXxx，可保留或逐步改为 getXxx，文档约定即可。
- **Repository 方法**：与 service 对应，如 `fetchTenantList` 保持；新增 `createTenant`、`updateTenant` 等。
- **文件命名**：小驼峰或 kebab-case 统一一种（当前多为 camelCase 如 tenantService.ts），保持即可。

### 6.2 目录边界

- **core**：constants、types（api、auth、user、role、permission、audit）、navigation、permission、auth、services（auditService 占位）、mock（auditMock 可选）。
- **modules/platform**：schemas（tenant、可选 user）、mock、repositories、services、pages；不放入租户业务 schema。
- **modules/tenant**：schemas（project、task、projectDetail、tenantDashboard、agent、skill、terminal、workflow 等）、mock、repositories（projectRepository 等）、services、pages。

### 6.3 去掉明显重复

- 删除或合并 TenantList.module.css 与 ProjectList.module.css 中重复的 actionBar、toolbar、filters、search、select、queryBtn、primaryBtn、actions、linkBtn——通过 ListPageToolbar 或共享 CSS 解决。
- 删除未再使用的 ProjectDetailPlaceholder（或改为 re-export 到 ProjectDetailWorkbench 的 fallback），避免混淆。

### 6.4 不相关逻辑下沉

- 列表页「查询」逻辑：保持页面 setState + 调 service；若存在复杂筛选构建逻辑，可下沉到 service 的 getXxxList(params)。
- 状态码映射（如 statusMap）：可保留在页面或抽成模块内 constants（如 tenant/constants/statusMap.ts），不强制进 core。

### 6.5 页面之间复用统一结构

- 列表页：PageContainer + ListPageToolbar（或共享 toolbar 样式）+ Table + Pagination；新建列表页按此结构。
- 工作台型详情：已有项目详情工作台为范本；租户详情（平台）保持锚点式，不强制改为 Tab。

---

## 7. 未完成模块占位优化

对以下模块，确保「非空白、高质量结构化占位」：

- **平台审计**：已有 3 个 Card（操作/安全/事件日志）+ EmptyState；可补充 Card description 为「预留：创建租户、更新状态、配额变更等」；可选增加「最近 5 条」mock 列表占位。
- **租户系统管理**：已有成员、角色、菜单/工作区、审计；可补充每个 Card 内 1～2 句「后续将支持 xxx」。
- **任务/流程/Agent/Skills/终端/分析**：已有 skeletonMock + 多 Card，可接受；若某 Card 仅一句 placeholder，可补一句「扩展点：xxx」。

不做大改，仅文案与占位内容略增强。

---

## 8. 风险点

| 风险 | 应对 |
|------|------|
| **大改导致回归** | 不改已成型页面的信息架构与路由；仅抽组件、抽样式、补 schema/repository、补占位。 |
| **core 类型与现有模块冲突** | 先只在 core 定义 ApiResponse/ListResult，platform、tenant 改为从 core 引用并逐步删除本地定义；若有兼容问题可保留模块内类型并 extend core。 |
| **Mock create/update 与真实 API 形态不一致** | 占位实现仅返回成功与模拟数据；接口签名（入参、返回）与 06 一致，后续替换为真实 API 时只换 repository 实现。 |
| **ListPageToolbar 无法满足所有列表页** | 组件设计为「主按钮 + children（筛选区）」，足够灵活；若某页需特殊布局，可不用该组件仍用原有 div。 |
| **事件/审计占位被遗忘** | 事件与 audit 仅做文件和 1 个 record 占位；在协作文档或 PR 模板中提醒「写操作可调用 auditService.record」。 |

---

## 9. 实施顺序建议（确认后执行）

1. **Core 类型**：新增 core/types/api.ts（ApiResponse、ListResult、PaginationMeta）；platform/tenant 中引用并删除重复定义。
2. **核心 Schema 补齐**：core/types 或各模块增加 User、Role、Permission、AuditLog；tenant 增加 agent、agentTeam、skill、terminal、workflow 等 schema。
3. **通用组件**：新增 ListPageToolbar（或共享 ListPage CSS）；新增 Dialog；文档约定 MetricCard/Table 用法。
4. **租户 Project repository**：新增 projectRepository，projectService 经 repo 调 mock；projectMock 增加 create/update/delete/patchStatus 占位。
5. **平台 Tenant mock 补齐**：tenantMock 增加 create/update/delete/patchStatus；tenantRepository 暴露对应方法；tenantService 暴露对应方法。
6. **Event / Audit 占位**：core/constants/events.ts；core/types/audit.ts；core/services/auditService.ts（record 占位）；可选 auditMock。
7. **列表页样式统一**：TenantList、ProjectList 改用 ListPageToolbar 或共享 CSS，删除重复样式。
8. **未完成模块占位文案**：平台审计、租户系统管理等补充结构化说明。
9. **清理**：删除或标注 ProjectDetailPlaceholder；命名与目录自检。

请确认或调整本计划后，再开始 Phase 5 的代码实施。
