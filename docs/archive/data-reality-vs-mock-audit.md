# 系统数据真实 vs Mock 对照表

> 本文档基于代码与 API 梳理，标明各模块数据来源：**真实**（服务端 Prisma/文件存储 + REST API 持久化）或 **Mock**（前端/服务端内存或 mock 文件，刷新或重启后重置）。  
> 最后更新：2026-03-14

---

## 一、总览结论

| 类别 | 真实数据 | Mock 数据 |
|------|----------|-----------|
| **核心资源 CRUD** | 租户、项目、身份、终端、系统终端类型、Agent 模板、Skill、流程模板/节点、流程实例/节点、任务、规划会话/草案/消息、LLM Provider/ModelConfig/Binding、凭证 | — |
| **项目创建与领域子对象** | 项目列表/单条、项目目标(Goal)、项目 SOP | 项目交付(Deliverable)、项目资源配置(ResourceConfig)、项目↔身份绑定、项目详情工作台聚合数据 |
| **流程与运行** | 流程模板/节点 CRUD、流程实例/节点 CRUD、规划会话/草案/消息、任务 CRUD | 流程运行日志、监督决策、发布记录、草案→模板发布（写 mock）、流程执行/人工操作（mock） |
| **参考数据与仪表盘** | — | 项目类型、目标类型、指标选项、平台/租户工作台、任务中心汇总、终端最近日志、策略配置、LLM 执行日志 |
| **引用检查** | 凭证被引用（异步查 API） | 流程模板/Agent/模型配置/项目被引用（读 mock） |

---

## 二、按模块逐项说明

### 2.1 平台后台（Platform Shell）

| 数据/功能 | 真实 / Mock | 说明 |
|-----------|-------------|------|
| 租户列表/详情/创建/更新/删除/状态 | **真实** | `tenantRepository` → `/api/tenants`，Prisma `Tenant` |
| 平台工作台统计与卡片 | **Mock** | `platformDashboardService` → `platformDashboardMock` |
| 其余（平台用户、资源配额、模板中心、审计、设置） | **Mock 或占位** | 无对应后端 API 或为占位页 |

---

### 2.2 系统后台（System Shell）

| 数据/功能 | 真实 / Mock | 说明 |
|-----------|-------------|------|
| Agent 模板列表/详情/创建/更新/删除/状态/复制 | **真实** | `agentTemplateRepository` → `/api/agent-templates`，Prisma `AgentTemplate` |
| Skill 列表/详情/创建/更新/删除/状态 | **真实** | `skillRepository` → `/api/skills`，Prisma `Skill` |
| 流程模板列表/详情/节点/创建/更新/删除/克隆/状态 | **真实** | `workflowTemplateRepository` + `workflowTemplateNodeRepository` → `/api/workflow-templates` 等，Prisma |
| 流程规划会话/草案/消息 列表与 CRUD | **真实** | `workflowPlanningSessionRepository` → `/api/planning-sessions` 等，Prisma |
| 模型配置中心：Provider / ModelConfig / Binding 全 CRUD | **真实** | `llmProviderRepository`、`llmModelConfigRepository`、`agentLLMBindingRepository` → `/api/llm-providers` 等，Prisma |
| LLM 凭证 创建/更新/删除/列表（密钥不回显） | **真实** | `credentialStore` 文件存储，`/api/credentials` |
| 终端类型工厂：系统终端类型 全 CRUD + 使用统计 | **真实** | `systemTerminalTypeRepository` → `/api/system-terminal-types`，Prisma `SystemTerminalType` |
| 流程运行中心：实例列表/详情/节点 | **真实** | `workflowRuntimeService` 内部调 `workflowInstanceMock` / `workflowInstanceNodeMock` → **Mock**（见下） |
| 流程运行中心：运行日志、监督建议、人工操作（重试/暂停/继续等） | **Mock** | `workflowRuntimeLogMock`、`workflowSupervisorDecisionMock`，内存态 |
| 规划策略配置（Planner 策略档案） | **Mock** | `plannerStrategyProfileService` → `plannerStrategyProfileMock` |
| 引用检查（删除前） | **混合** | 凭证引用：`checkCredentialReferencesAsync` 走 API；流程模板/Agent/模型配置/项目引用：读 `workflowInstanceMock`、`agentLLMBindingMock`、`llmProviderMock`、`agentTemplateMock` → **Mock** |

---

### 2.3 租户后台（Tenant Shell）

#### 项目

| 数据/功能 | 真实 / Mock | 说明 |
|-----------|-------------|------|
| 项目列表/单条/创建/更新/删除/状态 | **真实** | `projectRepository` → `/api/projects`，Prisma `Project` |
| 项目目标（Goal）列表/创建 | **真实** | `projectGoalRepository` → `/api/projects/:id/goals`，Prisma |
| 项目 SOP 获取/更新 | **真实** | `projectSOPRepository` → `/api/projects/:id/sop`，Prisma |
| 项目详情工作台 聚合数据（摘要、身份、任务、概览、目标阶段、KPI、结果反馈等） | **Mock** | `projectDetailService.fetchProjectDetailWorkbench` → `projectDetailMock.getProjectDetail`，由 `projectMock`、`identityMock`、`taskMock`、`projectGoalMock`、`projectDeliverableMock`、`projectResourceConfigMock`、`projectSOPMock` 等组装；**刷新后与真实项目/Goal/SOP 可能不一致** |
| 项目创建向导：项目、Goal、SOP 写入 | **真实** | `projectCreationService` 调 `projectRepo` / `projectGoalRepo` / `projectSOPRepo` → API |
| 项目创建向导：Deliverable、ResourceConfig、身份绑定写入 | **Mock** | `projectCreationService` 调 `projectDeliverableMock`、`projectResourceConfigMock`、`projectDetailMock.setProjectIdentityBinding` 等 |
| 项目类型 / 目标类型 / 指标选项（创建向导下拉与校验） | **Mock** | `projectTypeRepository`、`goalTypeRepository`、`goalMetricOptionRepository` 均包装 `projectTypeMock`、`goalTypeMock`、`goalMetricOptionMock` |
| 项目交付（Deliverable）列表 | **Mock** | `projectDeliverableRepository.fetchDeliverablesByProjectId` → `projectDeliverableMock` |
| 项目资源配置（ResourceConfig）列表 | **Mock** | `projectResourceConfigRepository.fetchResourceConfigsByProjectId` → `projectResourceConfigMock` |

#### 身份

| 数据/功能 | 真实 / Mock | 说明 |
|-----------|-------------|------|
| 身份列表/详情/创建/更新/删除/状态 | **真实** | `identityRepository` → `/api/identities`，Prisma `Identity` |

#### 终端

| 数据/功能 | 真实 / Mock | 说明 |
|-----------|-------------|------|
| 终端列表/详情/创建/更新/删除/状态/测试连接 | **真实** | `terminalRepository` → `/api/terminals`，Prisma `Terminal`；总览统计 `getTerminalOverview` 已改为基于真实列表计算 |
| 终端最近执行日志 | **Mock** | `terminalService.getRecentTerminalLogs` → `terminalMock.getRecentTerminalLogs` |

#### 流程与任务

| 数据/功能 | 真实 / Mock | 说明 |
|-----------|-------------|------|
| 流程模板列表/详情/节点（租户侧查看与节点配置） | **真实** | 同 System Shell，走 `/api/workflow-templates` 等 |
| 流程实例列表/详情/节点 的 读 | **真实** | `workflowInstanceRepository`、`workflowInstanceNodeRepository` → `/api/workflow-instances` 等 |
| 任务列表/详情/创建/更新状态 | **真实** | `taskRepository` → `/api/tasks`，Prisma `Task` |
| 任务创建时「项目是否存在、身份是否在项目内」校验 | **Mock** | `taskService.createTask` 用 `projectDetailMock.getProjectDetail(projectId)` 取允许的身份列表 |
| 流程运行中心（Runtime Center）实例列表/详情/节点/日志/监督建议/人工操作 | **Mock** | `workflowRuntimeService` 使用 `workflowInstanceMock`、`workflowInstanceNodeMock`、`workflowRuntimeLogMock`、`workflowSupervisorDecisionMock` 等，未走实例 API |
| 流程「发布草案为模板」 | **Mock 写入** | `workflowTemplatePublishService.publishDraftAsTemplate` 中 `createWorkflowTemplate`、`addNodesFromDraftConversion`、`createPublishRecord` 均为 mock；**发布后的模板不会落入 Prisma** |
| 流程执行（runMockExecutionFlow）、Worker/监督/恢复 | **Mock** | `workflowExecutionService`、`workerAgentExecutionService`、`workflowSupervisorService`、`workflowSupervisorRecoveryService` 使用 mock 实例/节点/日志/决策 |

#### 规划

| 数据/功能 | 真实 / Mock | 说明 |
|-----------|-------------|------|
| 规划会话/草案/消息 列表与 CRUD | **真实** | 同 System Shell，`/api/planning-sessions` 等 |
| Planner 策略与技能（规划用） | **Mock** | `planningSkillsMock`、`plannerStrategyProfileService` 等 |

#### Agent / Skills / LLM

| 数据/功能 | 真实 / Mock | 说明 |
|-----------|-------------|------|
| Agent 中心列表/详情（租户侧只读） | **真实** | `agentTemplateService.getTemplateList` / `getTemplateById` → `/api/agent-templates` |
| Skills 能力库展示 | **真实** | 依赖 Skill/Agent API，数据来自 Prisma |
| 模型配置（Provider/ModelConfig/Binding）在租户侧的使用 | **真实** | 读 API，与系统后台一致 |
| LLM 执行日志（按会话） | **Mock** | `llmExecutionLogService` → `llmExecutionLogMock` |

#### 工作台与设置

| 数据/功能 | 真实 / Mock | 说明 |
|-----------|-------------|------|
| 租户工作台统计与卡片 | **Mock** | `tenantDashboardService` → `tenantDashboardMock` |
| 任务中心汇总与列表 | **Mock** | `taskCenterService.getTaskCenterData` → `taskCenterMock` |
| 租户设置（成员/角色/审计日志） | **Mock** | `tenantSettingsService` → `tenantSettingsMock` |
| 数据分析页 | **Mock 或占位** | 无真实统计 API |

---

### 2.4 服务端 API 与存储（server/）

| 资源 | 持久化 | 说明 |
|------|--------|------|
| 租户 / 项目 / 项目 Goal / 项目 SOP | Prisma (SQLite) | `tenantDb`、`projectDb` |
| 身份 / 终端 | Prisma | `identityTerminalDb` |
| 系统终端类型 | Prisma | `systemTerminalTypeDb` + 种子 `systemTerminalTypeSeed` |
| 流程模板 / 节点、流程实例 / 节点、任务 | Prisma | `workflowTemplateDb`、`workflowInstanceDb` |
| 规划会话 / 草案 / 消息 | Prisma | `planningSessionDb` |
| Agent 模板 / Skill / LLM Provider / ModelConfig / AgentLLMBinding | Prisma | `agentTemplateDb`、`skillDb`、`llmConfigDb` + 种子 |
| LLM 凭证（密钥） | 文件 | `data/credentialStore.ts` → `credentials.json` |
| 流程运行日志、监督决策、发布记录、Terminal 执行日志 | **无** | 无对应表或文件，前端用 mock |

---

## 三、Mock 文件与入口一览（便于后续迁移）

| Mock 文件（src/modules/tenant/mock/ 或 platform/mock） | 被谁使用 | 建议迁移优先级 |
|--------------------------------------------------------|----------|----------------|
| `projectDetailMock` | projectDetailService、projectCreationService、taskService、workflowExecutionService、workflowRuntimeService | P0（项目详情与任务校验） |
| `projectMock` | projectDetailMock、workflowRuntimeService、workflowExecutionService | P0 |
| `projectDeliverableMock` / `projectResourceConfigMock` | projectCreationService、projectDomainService（经 repository 包装） | P1 |
| `projectTypeMock` / `goalTypeMock` / `goalMetricOptionMock` | projectTypeRepository、goalTypeRepository、goalMetricOptionRepository | P1（参考数据可后接配置表或 API） |
| `workflowInstanceMock` / `workflowInstanceNodeMock` | workflowRuntimeService、workflowExecutionService、workflowSupervisorService、workerAgentExecutionService、referenceCheckService | P0（运行中心与引用检查） |
| `workflowRuntimeLogMock` / `workflowSupervisorDecisionMock` | workflowRuntimeService、workflowSupervisorService、workerAgentExecutionService | P1 |
| `workflowTemplateMock` / `workflowTemplateNodeMock` / `workflowTemplatePublishRecordMock` | workflowTemplatePublishService、workflowRuntimeService | P1（发布结果需落库） |
| `taskCenterMock` / `tenantDashboardMock` / `platformDashboardMock` | taskCenterService、tenantDashboardService、platformDashboardService | P2 |
| `tenantSettingsMock` | tenantSettingsService | P2 |
| `terminalMock`（仅 getRecentTerminalLogs / getTerminalOverview 已移除） | terminalService.getRecentTerminalLogs | P2 |
| `identityMock` | projectDetailMock、projectCreationService | 随 projectDetail 迁移 |
| `taskMock` | projectDetailMock、taskService（类型）、workflowExecutionService | 随 projectDetail/任务中心迁移 |
| `agentTemplateMock` / `agentLLMBindingMock` / `llmProviderMock` | referenceCheckService（同步检查） | P1（引用检查应统一走 API） |
| `plannerStrategyProfileMock` / `planningSkillsMock` / `llmExecutionLogMock` | plannerStrategyProfileService、plannerService、llmExecutionLogService | P2 |
| `facebookPageBindingMock` / `facebookPageCredentialMock` 等 | projectCreationService、平台集成相关 | P2 或按产品需求 |

---

## 四、使用与排错提示

1. **项目详情页**：当前整页数据来自 mock。若在「项目中心」从列表点进的是真实项目 ID，详情内的摘要、身份、任务、目标阶段等仍为 mock 组装，可能与真实 Goal/SOP 不一致；仅「目标与 KPI」等 Tab 若单独调 `projectDomainService.getGoals(projectId)` 会拿到真实 Goal。
2. **流程运行中心**：实例与节点列表、日志、监督建议、人工操作均为 mock，与「流程实例」API 数据不同步。
3. **发布草案为模板**：点击发布后模板和节点只写入 mock，不会在「流程模板工厂」列表中持久出现（除非另有入口从 API 创建）。
4. **引用检查**：删除凭证时用的是 API 的 Provider 列表（正确）；删除流程模板/Agent/模型配置/项目时用的是 mock 实例与绑定数据，可能漏报或误报引用。
5. **终端**：列表/详情/创建/更新/删除/测试/总览统计均为真实；仅「执行日志」Tab 为 mock。

如需将某块改为真实数据，可优先：  
- 为该项目补充或改用「项目详情聚合 API」与项目身份绑定 API；  
- 为流程运行中心改为读/写 `/api/workflow-instances` 与运行日志/监督决策表；  
- 为发布草案改为调用「创建流程模板 + 节点」的 API；  
- 为引用检查统一改为调用各资源列表 API（或专用引用查询 API）。
