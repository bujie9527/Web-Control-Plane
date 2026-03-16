# Project Domain Model 1.0 Phase A 结构化自检报告

## 一、逐项检查结论

### 1. 是否已建立 ProjectGoal / ProjectDeliverable / ProjectResourceConfig / ProjectSOP 四个标准对象

**结论：✅ 已建立**

| 对象 | 位置 | 字段覆盖 |
|------|------|----------|
| **ProjectGoal** | `schemas/projectDomain.ts` | id, projectId, goalType, goalName, goalDescription, successCriteria?, kpiDefinition?, isLocked, createdAt, updatedAt |
| **ProjectDeliverable** | 同上 | id, projectId, deliverableType, deliverableName, description?, frequency?, targetValue?, unit?, createdAt, updatedAt |
| **ProjectResourceConfig** | 同上 | id, projectId, resourceType, resourceId, resourceName, resourceSummary?, status, createdAt, updatedAt |
| **ProjectSOP** | 同上 | id, projectId, sopRaw, sopParsed?, status, version, createdAt, updatedAt |

- 类型与架构文档 10 一致：ProjectGoalType、ProjectDeliverableType、ProjectResourceType（identity | terminal | server | api | agentTeam）、ProjectSOPStatus 均已定义。
- 四个对象在 ProjectDetailData 中通过可选字段 projectGoals、projectDeliverables、projectResourceConfigs、projectSOP 承载，与既有 goals（phaseGoals/kpiDefinitions）并存，未替换或删除原有结构。

---

### 2. 是否有清晰的 schema / mock / service / repository 结构

**结论：✅ 结构清晰**

| 层级 | 内容 |
|------|------|
| **Schema** | `schemas/projectDomain.ts` 集中定义四类对象及枚举类型；`projectDetail.ts` 仅引用并扩展 ProjectDetailData。 |
| **Mock** | `projectGoalMock.ts`、`projectDeliverableMock.ts`、`projectResourceConfigMock.ts`、`projectSOPMock.ts` 各提供 getXByProjectId(projectId)，按 projectId 维度的内存数据。 |
| **Repository** | `projectGoalRepository.ts`、`projectDeliverableRepository.ts`、`projectResourceConfigRepository.ts`、`projectSOPRepository.ts` 各提供 fetchXByProjectId(projectId)，内部调 mock 并 wrap 为 ApiResponse&lt;T&gt;，含 meta.requestId、timestamp。 |
| **Service** | `projectDomainService.ts` 统一入口：getGoals、getDeliverables、getResourceConfigs、getSOP，内部调对应 repository 并解包 data 返回。 |

- 调用链：页面/聚合层 → service → repository → mock；与现有 identity、projectDetail 分层一致，符合 03 模块边界与 06 API 合约。

---

### 3. 是否保持了与 Identity / Task / Terminal 的兼容关系

**结论：✅ 已保持兼容**

- **ProjectDetailData**：identities（list、defaultIdentityId）、terminals（list）、workflowTasks（workflows、recentTasks、taskSummary）未做任何删除或修改；仅新增可选字段 projectGoals、projectDeliverables、projectResourceConfigs、projectSOP。
- **projectDetailMock**：buildIdentities、terminals.list、workflowTasks.recentTasks（含 getCreatedTasksForProject）、getTaskDetail 等逻辑未改动；仅在 return 中增加上述四类数据的聚合。
- **Task / Identity**：taskMock、identityMock、taskService、projectDetailService 未改；Task 的 identityId、TaskItem/ResultFeedItem 的 identity 相关字段保持不变。
- **ProjectResourceConfig**：resourceType 包含 identity、terminal、server、api、agentTeam；mock 中以 server、api、agentTeam 为主，仅 p1 含 1 条 terminal 示例，未用 ResourceConfig 重复维护 identities 列表，避免与现有「身份配置」数据源混淆。

---

### 4. 是否正确区分了 Goal、Deliverable、SOP、Workflow

**结论：✅ 已正确区分**

- **Goal**：ProjectGoal 表达「项目为什么存在、要达成什么」；字段为 goalType、goalName、goalDescription、successCriteria、kpiDefinition；无执行步骤、无 Workflow/Task 引用。
- **Deliverable**：ProjectDeliverable 表达「项目交付什么」；字段为 deliverableType、deliverableName、description、frequency、targetValue、unit；与 Goal 独立，无 SOP/Workflow 字段。
- **SOP**：ProjectSOP 表达「这件事如何做」；sopRaw 为自然语言原文，sopParsed 为占位；无 Task 或 Workflow 实例字段，注释明确为「后续 Workflow 解析占位」。
- **Workflow**：未在 projectDomain.ts 中定义；WorkflowItem、workflowTasks 仍在 projectDetail 中，与 Goal/Deliverable/SOP 分离。

符合规则 10：Goal 是业务目标、Deliverable 是交付标的、SOP 是项目级操作方案，未与 Workflow Template/Instance 或 Task 混用。

---

### 5. 是否为后续 Workflow & Task Execution 留出了扩展位

**结论：✅ 已预留**

| 扩展位 | 说明 |
|--------|------|
| **ProjectSOP.sopParsed** | 类型为 `Record<string, unknown> | null`，注释为「结构化解析结果，当前阶段占位」；后续可填入解析后的步骤/节点结构，供 Workflow 生成使用。 |
| **ProjectResourceConfig.resourceType / resourceId** | 已支持 identity、terminal、server、api、agentTeam；执行时可按 resourceType 解析为 Identity、Terminal 等执行上下文。 |
| **ProjectGoal.goalType / kpiDefinition** | 可为流程生成或结果校验提供「目标类型」与「KPI 定义」维度。 |
| **ProjectDetailData 聚合** | 一次 getProjectDetail 即可拿到 projectGoals、projectDeliverables、projectResourceConfigs、projectSOP，后续 Tab 或执行层可直接消费，无需再拆接口。 |

---

### 6. 是否存在命名不统一或对象职责不清的问题

**结论：✅ 无重大问题，仅可做少量微调**

- **命名**：四类对象均带 Project 前缀（ProjectGoal、ProjectDeliverable、ProjectResourceConfig、ProjectSOP）；mock 文件为 projectGoalMock、projectDeliverableMock 等；repository 为 projectGoalRepository 等；service 为 projectDomainService；方法名 getGoals/getDeliverables 与 fetchGoalsByProjectId/fetchDeliverablesByProjectId 对应关系一致。
- **职责**：Goal 只负责目标定义、Deliverable 只负责交付定义、ResourceConfig 只负责资源配置引用、SOP 只负责自然语言 SOP 与解析占位；无交叉字段或职责混合。
- **可微调**：projectDetail 中 projectSOP 类型为 `ProjectSOP | null`，而 getSOPByProjectId 在无数据时返回 null，聚合处直接赋值，语义一致；若希望「无 SOP」在类型上更显式，可保持现状（undefined 与 null 在可选字段下均可接受）。

---

## 二、本阶段完成清单

| 序号 | 项 | 状态 |
|------|----|------|
| 1 | ProjectGoal schema（含 goalType、成功标准、KPI、锁定） | ✅ |
| 2 | ProjectDeliverable schema（含交付类型、说明、频率、目标值、单位） | ✅ |
| 3 | ProjectResourceConfig schema（含 resourceType 五类、resourceId、摘要、状态） | ✅ |
| 4 | ProjectSOP schema（sopRaw、sopParsed 占位、status、version） | ✅ |
| 5 | 四类 mock（getXByProjectId）+ 按 projectId 示例数据 | ✅ |
| 6 | 四类 repository（fetchXByProjectId、ApiResponse 封装） | ✅ |
| 7 | projectDomainService 统一入口（getGoals/getDeliverables/getResourceConfigs/getSOP） | ✅ |
| 8 | ProjectDetailData 扩展（projectGoals/projectDeliverables/projectResourceConfigs/projectSOP） | ✅ |
| 9 | projectDetailMock 聚合四类数据到 getProjectDetail | ✅ |
| 10 | 未破坏 identities/terminals/workflowTasks/Task-Identity | ✅ |
| 11 | Goal/Deliverable/SOP 与 Workflow/Task 概念分离 | ✅ |
| 12 | 为 Workflow & Task Execution 预留 sopParsed、resourceType 等扩展位 | ✅ |

---

## 三、需要微调的项

- **无必须微调**：Phase A 约定范围均已满足，对象模型、分层、兼容性与扩展位均到位。
- **可选**：
  - 若希望与 04 核心领域模型文档对齐，可在 `docs/architecture/04-core-domain-model.md` 中补充 ProjectGoal、ProjectDeliverable、ProjectResourceConfig、ProjectSOP 的简要说明（非代码变更）。
  - projectDetail.ts 中未使用的 `ProjectStatus` 导入可后续在整理时移除（与 Phase A 无关，可放在统一清理）。

---

## 四、是否可以进入 Phase B

**结论：可以进入 Phase B。**

- 四个标准对象已建立且职责清晰，schema / mock / service / repository 结构完整，与 Identity/Task/Terminal 兼容，Goal、Deliverable、SOP、Workflow 边界清晰，扩展位已预留，无命名或职责混乱。
- Phase B 建议：在项目详情工作台新增或强化「目标与交付」「资源配置」「SOP」相关 Tab，基于 `data.projectGoals`、`data.projectDeliverables`、`data.projectResourceConfigs`、`data.projectSOP` 做展示与简单管理（列表/卡片/表单占位），并保持与现有「目标与KPI」「身份配置」「终端分配」等 Tab 的并列关系。
