# Project Domain Model 1.0 Phase A 实施计划

## 1. 本阶段目标理解

### 1.1 定位

- 将 **Project** 从「带摘要字段的列表实体」升级为**业务核心对象**，具备显式的目标、交付、资源、SOP 子结构。
- 本阶段**只做对象模型与数据/服务分层**：引入四个标准子对象（ProjectGoal、ProjectDeliverable、ProjectResourceConfig、ProjectSOP），建立 schema、mock、service、repository，并保持统一 API 合约与现有关系兼容。
- **不**在本阶段做：复杂解析、Workflow 逻辑、页面改版；页面接入放在 Phase B。

### 1.2 必须达成的结果

- 四个子对象在类型系统与运行时数据中**显式存在**，而不是散落在描述字段里。
- 工程上具备：schema 定义、按 projectId 维度的 mock 数据、mock service、repository 分层、与 06 一致的 API 风格。
- 不破坏现有 Project↔Identity、Task↔Identity、项目详情 workbench 的 identities/terminals/workflowTasks 等结构；ResourceConfig 在类型上兼容 identity/terminal/server/api/agentTeam；SOP 预留 sopParsed 等后续 Workflow 解析位。

---

## 2. 计划新增或修改的 schema / mock / service / repository

### 2.1 Schema

| 文件 | 操作 | 说明 |
|------|------|------|
| **新增** `src/modules/tenant/schemas/projectDomain.ts` | 新建 | 集中定义四个子对象类型及枚举/参数类型 |

**内容要点：**

- **ProjectGoal**  
  - 字段：id, projectId, goalType, goalName, goalDescription, successCriteria?, kpiDefinition?, isLocked, createdAt, updatedAt  
  - goalType 建议为 string 或枚举（如 growth / brand / conversion / other）

- **ProjectDeliverable**  
  - 字段：id, projectId, deliverableType, deliverableName, description?, frequency?, targetValue?, unit?, createdAt, updatedAt  
  - deliverableType 建议为 string 或枚举（如 content / leads / data / other）

- **ProjectResourceConfig**  
  - 字段：id, projectId, resourceType, resourceId, resourceName, resourceSummary?, status, createdAt, updatedAt  
  - resourceType: `'identity' | 'terminal' | 'server' | 'api' | 'agentTeam'`（与架构文档一致）

- **ProjectSOP**  
  - 字段：id, projectId, sopRaw, sopParsed?, status, version, createdAt, updatedAt  
  - sopRaw：必填，自然语言原文  
  - sopParsed：可选，占位（如 `Record<string, unknown> | null`），为后续 Workflow 解析预留

- 可补充列表/筛选用参数类型（如 ProjectGoalListParams）和统一导出，便于 repository 使用。

### 2.2 Mock

| 文件 | 操作 | 说明 |
|------|------|------|
| **新增** `src/modules/tenant/mock/projectGoalMock.ts` | 新建 | 按 projectId 返回 ProjectGoal[]，内存结构 projectGoalsByProject |
| **新增** `src/modules/tenant/mock/projectDeliverableMock.ts` | 新建 | 按 projectId 返回 ProjectDeliverable[]，内存结构 projectDeliverablesByProject |
| **新增** `src/modules/tenant/mock/projectResourceConfigMock.ts` | 新建 | 按 projectId 返回 ProjectResourceConfig[]，内存结构 projectResourceConfigsByProject；含 identity/terminal/server/api/agentTeam 类型示例 |
| **新增** `src/modules/tenant/mock/projectSOPMock.ts` | 新建 | 按 projectId 返回 ProjectSOP | null（单条），内存结构 projectSOPByProject；sopParsed 可为 null 或空对象占位 |

- 每个 mock 导出至少：`getByProjectId(projectId: string)`。
- 数据量：每个 projectId 至少 1～2 条 Goal/Deliverable、若干 ResourceConfig、0 或 1 条 SOP，保证项目详情后续可展示。

### 2.3 Repository

| 文件 | 操作 | 说明 |
|------|------|------|
| **新增** `src/modules/tenant/repositories/projectGoalRepository.ts` | 新建 | fetchGoalsByProjectId(projectId) → Promise<ApiResponse<ProjectGoal[]>>，内部调 projectGoalMock + wrap |
| **新增** `src/modules/tenant/repositories/projectDeliverableRepository.ts` | 新建 | fetchDeliverablesByProjectId(projectId) → Promise<ApiResponse<ProjectDeliverable[]>> |
| **新增** `src/modules/tenant/repositories/projectResourceConfigRepository.ts` | 新建 | fetchResourceConfigsByProjectId(projectId) → Promise<ApiResponse<ProjectResourceConfig[]>> |
| **新增** `src/modules/tenant/repositories/projectSOPRepository.ts` | 新建 | fetchSOPByProjectId(projectId) → Promise<ApiResponse<ProjectSOP | null>> |

- 返回结构符合 06：code、message、data、meta（requestId、timestamp）；不在此阶段加分页 meta，仅数组或单对象。

### 2.4 Service

| 文件 | 操作 | 说明 |
|------|------|------|
| **新增** `src/modules/tenant/services/projectDomainService.ts` | 新建 | 对外统一入口：getGoals(projectId)、getDeliverables(projectId)、getResourceConfigs(projectId)、getSOP(projectId)；内部调对应 repository，解包 data 后返回或保留 ApiResponse 由调用方定（与现有 projectDetailService 风格对齐） |

- 若现有习惯是 service 直接返回 data，可在此层解包 `res.data` 返回，与 fetchProjectDetailWorkbench 的用法一致。

### 2.5 与项目详情聚合的关系（可选但推荐）

| 文件 | 操作 | 说明 |
|------|------|------|
| **修改** `src/modules/tenant/schemas/projectDetail.ts` | 扩展 | 在 ProjectDetailData 上增加可选字段：projectGoals?: ProjectGoal[], projectDeliverables?: ProjectDeliverable[], projectResourceConfigs?: ProjectResourceConfig[], projectSOP?: ProjectSOP | null |
| **修改** `src/modules/tenant/mock/projectDetailMock.ts` | 扩展 | 在 getProjectDetail(projectId) 的返回值中，从上述四个 mock 读取并赋值到 summary 同级的 projectGoals、projectDeliverables、projectResourceConfigs、projectSOP；不删、不改现有 goals/identities/terminals/workflowTasks 等 |

- 这样 Phase B 可直接用 `data.projectGoals` 等渲染新 Tab，且一次拉取即可；同时保留独立 service 调用能力（如未来按需刷新某一类）。

---

## 3. 对象之间的关系说明

### 3.1 与 Project 的关系

- 四个子对象均通过 **projectId** 归属项目；不改变现有 `Project` 接口字段（如 goalSummary、kpiSummary 仍可保留为列表/摘要用）。
- Project 在「项目详情」上下文中，通过 ProjectDetailData 承载：summary、overview、**projectGoals**、**projectDeliverables**、**projectResourceConfigs**、**projectSOP**，以及既有 identities、terminals、workflowTasks 等。

### 3.2 与 Identity / Terminal 的关系

- **不修改**现有 `identities`、`terminals` 在 ProjectDetailData 中的结构与 mock（buildIdentities、terminals.list）。
- **ProjectResourceConfig** 的 resourceType 包含 identity、terminal、server、api、agentTeam；同一项目既可保留「身份配置」「终端分配」的现有用法，又可在「资源配置」中通过 ResourceConfig 做统一视图（如：resourceType=identity 且 resourceId=某 identityId）。当前阶段仅做类型与 mock 数据兼容，不要求两套数据源合并或去重。

### 3.3 与 Task / Workflow 的关系

- Task 仍属于 Project 的执行层；本阶段不新增 Task 或 Workflow 的 schema。
- **ProjectSOP.sopParsed** 为占位字段，为后续「由 SOP 解析生成 Workflow Instance / Task」留结构位；本阶段不实现解析与执行逻辑。

### 3.4 四个子对象之间

- Goal、Deliverable、ResourceConfig、SOP 之间**不**在本阶段建立外键或引用；仅通过 projectId 与 Project 关联。后续若需要「某 Goal 对应某 Deliverable」等，可在后续迭代加字段。

---

## 4. 风险点

| 风险 | 说明 | 缓解 |
|------|------|------|
| 与现有 goals 块混淆 | 项目详情现有 `goals: { goalDescription, phaseGoals, kpiDefinitions }` 用于目标与KPI Tab | 不删除、不替换；新增 projectGoals/projectDeliverables 等独立键；Phase B 再决定是否迁移 Tab 数据源或并存 |
| ResourceConfig 与 identities/terminals 重复 | 若 mock 中同时维护 identities 与 projectResourceConfigs(type=identity) 可能重复 | 本阶段 mock 中 ResourceConfig 可只做 server/api/agentTeam 或少量 identity/terminal 示例；或明确「ResourceConfig 是统一视图，identity/terminal 仍以现有列表为主」 |
| ProjectDetailData 膨胀 | 一次 getProjectDetail 携带更多数据 | 仅增加四个可选字段，且为数组/单对象；若后续项目很多再考虑按需加载 |
| 命名与 04/08 冲突 | 与核心领域模型、Identity 命名一致 | 子对象统一加 Project 前缀；resourceType 与架构文档 10 完全一致 |

---

## 5. 本阶段结束后如何进入项目详情页接入（Phase B 建议）

- **数据**：Phase A 结束后，`fetchProjectDetailWorkbench(projectId)` 已可在返回的 ProjectDetailData 中带上 projectGoals、projectDeliverables、projectResourceConfigs、projectSOP（若采用 2.5 的扩展）。
- **页签**：Phase B 在项目详情工作台新增或调整页签，例如：  
  - **目标与交付**：列表/卡片展示 `data.projectGoals`、`data.projectDeliverables`（可复用 Card、Table、kvGrid）；  
  - **资源配置**：展示 `data.projectResourceConfigs`，按 resourceType 分组或表格展示；  
  - **SOP**：展示 `data.projectSOP`（sopRaw 主展示，sopParsed 占位可折叠或仅占位文案）。  
- **与现有 Tab 的关系**：现有「目标与KPI」可暂时保留，与「目标与交付」并存一段时间，或 Phase B 中将「目标与KPI」改为从 projectGoals/projectDeliverables 派生展示，再逐步弃用旧 goals 块。
- **扩展位**：为后续 Workflow & Task Execution 留好的结构位包括：ProjectSOP.sopParsed、ProjectResourceConfig.resourceType/resourceId、ProjectGoal 的 goalType/kpiDefinition，均可在下一轮用于流程生成与执行上下文。

---

## 6. 实施顺序建议

1. **Schema**：新增 `projectDomain.ts`，定义四个接口及 resourceType 等类型。  
2. **Mock**：新增四个 mock 文件，实现 getByProjectId，并准备 1～2 个 projectId 的示例数据。  
3. **Repository**：新增四个 repository 文件，统一 wrap 为 ApiResponse。  
4. **Service**：新增 projectDomainService，封装四个 get 方法。  
5. **可选**：扩展 ProjectDetailData 与 projectDetailMock，在 getProjectDetail 中聚合上述四类数据。  
6. **自检**：对照「对象模型、模块边界、Identity/Task/Terminal 兼容、Workflow 扩展位」做一次自检。

---

请确认是否按此计划执行；确认后再进入具体实现。
