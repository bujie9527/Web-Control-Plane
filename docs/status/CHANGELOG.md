# AI Work Control Center — 开发进度日志

> 本文档为动态更新的开发变更日志。每次开发完成后，需在此文档顶部追加新条目。
> Cursor Rule `99-dev-progress-tracking.mdc` 会自动提醒开发者更新此文档。

---

## [2026-03-16] P00-P13 代码全面审计与修复

### 变更内容
- **[修复 H-1]** `workflowSupervisorDecisionDb.ts`：删除重复的 `const now` 声明（第 23 行），消除编译期报错风险
- **[修复 H-2/H-3/H-4]** `planningSessionDb.ts`：所有 `JSON.parse` 调用增加 `try-catch` 保护（`nodes`、`capabilityPoolSnapshot`、`dbGetDraftNodesReferencingAgent` 全表扫描三处），防止脏数据导致请求崩溃
- **[修复 H-3 性能]** `dbGetDraftNodesReferencingAgent` 改为仅 `select` 必要字段（`id, sessionId, version, nodes`），避免全量加载所有草案字段
- **[修复 M-5]** `schedulerDb.ts`：安装 `cron-parser` 库，`calcNextRunAt()` 函数正确解析 cron 表达式计算下次执行时间；修复原来 `nextRunAt = ts`（当前时间）导致定时任务立即重复触发的问题
- **[修复 M-6]** `projectReportDb.ts`：仪表盘消息统计从"按 tenantId 统计全租户消息"修正为"按属于该项目的 terminalIds 过滤消息"，统计结果不再误导
- **[修复 Schema]** `prisma/schema.prisma`：补充 `ScheduledTaskExecution → ScheduledTask` 的 Prisma relation 声明（`onDelete: Cascade`），并在 `ScheduledTask` 侧添加 `executions` 数组字段，支持关联查询；已执行 `prisma migrate dev`
- **[修复导航]** `tenantMenu.ts`：添加「任务执行」菜单入口（`/tenant/tasks`），消除路由孤岛
- **[修复 CSS Module]** `AnalyticsPage.tsx`：移除违规的 `SkeletonPages.module.css` 引入，全部改为 Tailwind CSS 类名
- **[修复 Mock 日志]** `workflowPlannerLLMAdapter.ts`：移除对 `appendLLMExecutionLog`（写入 mock 内存数组）的依赖，LLM 执行日志的持久化由服务端 `WorkflowRuntimeLog` 负责
- **[修复字符损坏]** `workflowPlannerLLMAdapter.ts`：修复因 PowerShell 编码操作导致多处中文字符串字面量损坏问题（`分类:`, `支持技能:`, `项目类型:` 等模板字符串）

### 影响范围
- `server/domain/workflowSupervisorDecisionDb.ts`
- `server/domain/planningSessionDb.ts`
- `server/domain/schedulerDb.ts`
- `server/domain/projectReportDb.ts`
- `prisma/schema.prisma`（新迁移：`add-scheduled-task-relation`）
- `src/core/navigation/tenantMenu.ts`
- `src/modules/tenant/pages/AnalyticsPage.tsx`
- `src/modules/tenant/services/workflowPlannerLLMAdapter.ts`

### 审计结论（未修复的已知问题）
- **中风险（已记录）**：`messagePipelineDb.ts` 消息处理使用占位 fakeSkillId 路由、无事务保护 → 待 M2+ 迭代完善
- **中风险（已记录）**：`dataSourceDb.ts` `dbExecuteDataSource` 仍返回 mock 数据 → 待接入真实 Provider API
- **中风险（已记录）**：`projectDb.ts`、`identityTerminalDb.ts` 删除操作缺少引用检查 → 待后续迭代按 Rule-13 补全
- **低风险（已记录）**：`tenantDb.ts` plan/memberCount/projectCount 等字段长期占位 → 待后续迭代接入真实统计
- **占位页（已记录）**：`/tenant/datasources`、`/system/message-pipeline`、`/system/scheduled-tasks`、`/system/webhooks` 仍为 RoutePlaceholderPage
- **数据缺口（已记录）**：`analyticsService.ts` 真实 API 路径下 `projectStats` 返回空数组

---

## 更新格式

```markdown
## [YYYY-MM-DD] 变更标题

### 变更内容
- 具体变更项 1
- 具体变更项 2

### 影响范围
- 影响的模块/文件

### 方向调整（如有）
- 策略或架构调整说明

### 代码结构变化（如有）
- 新增/删除/重命名的目录或文件
```

---

## [2026-03-16] ← 填写本次变更标题

### 变更内容
- ← 填写具体变更说明（可多条）

### 影响范围（共 67 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package-lock.json`、`package.json`、`src/index.css`、`src/main.tsx`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/agentTemplateDb.ts`、`server/domain/agentTemplateSeed.ts`、`server/domain/planningSessionDb.ts`、`server/domain/skillDb.ts`、`server/domain/skillSeed.ts`、`server/domain/workflowInstanceDb.ts`、`server/domain/workflowNodeExecutor.ts`、`server/domain/workflowSupervisorDecisionDb.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **路由与应用入口**：`src/app/routes.tsx`
- **通用 UI 组件**：`src/components/Sidebar/Sidebar.module.css`、`src/components/Sidebar/Sidebar.tsx`
- **核心层**：`src/core/constants/routes.ts`、`src/core/navigation/platformMenu.ts`、`src/core/navigation/systemMenu.ts`、`src/core/navigation/tenantMenu.ts`、`src/core/navigation/types.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **Agent 模板工厂**：`src/modules/platform/pages/AgentFactory/AgentFactoryEdit.tsx`、`src/modules/platform/pages/AgentFactory/AgentFactoryList.module.css`、`src/modules/platform/pages/AgentFactory/AgentFactoryNew.tsx`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **Skill 工厂**：`src/modules/platform/pages/SkillFactory/SkillFactory.module.css`、`src/modules/platform/pages/SkillFactory/SkillFactoryList.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台后台数据层**：`src/modules/platform/repositories/skillRepository.ts`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/agentTemplate.ts`、`src/modules/platform/schemas/skill.ts`
- **平台后台服务层**：`src/modules/platform/services/skillService.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **项目详情工作台**：`src/modules/tenant/pages/ProjectDetail/ProjectDetailWorkbench.tsx`、`src/modules/tenant/pages/ProjectDetail/tabs.module.css`、`src/modules/tenant/pages/ProjectDetail/tabs/AgentTeamTab.tsx`、`src/modules/tenant/pages/ProjectDetail/tabs/ResultsTab.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`、`src/modules/tenant/repositories/terminalRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/analyticsService.ts`、`src/modules/tenant/services/llmProviderService.ts`、`src/modules/tenant/services/terminalService.ts`、`src/modules/tenant/services/workflowPlannerLLMAdapter.ts`

### 方向调整（如有）
- —

---

## [2026-03-16] P13 批次推进：消息管线/调度/报表与状态统一

### 变更内容
- 新增消息管线后端主链路：Telegram Webhook 接入、Incoming/Conversation/Outgoing 入库、路由处理与批量消费接口
- 新增定时任务后端主链路：ScheduledTask/ScheduledTaskExecution 数据模型、任务 CRUD、手动触发与调度引擎状态接口
- 新增项目报表与分析 API：项目仪表盘、项目报告记录、租户分析聚合接口
- 租户侧新增可用页面：`/tenant/messages` 消息中心、`/tenant/scheduled-tasks` 定时任务页；数据分析优先走后端聚合接口
- 对齐 Agent/Skill 种子基线，补充 Interaction/Community/Config/Research 相关模板与技能
- 统一开发文档状态与路线图阶段状态，消除“阶段表待开发 vs 文档索引已完成”的口径冲突

### 影响范围（共 64 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package-lock.json`、`package.json`、`src/index.css`、`src/main.tsx`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/agentTemplateDb.ts`、`server/domain/agentTemplateSeed.ts`、`server/domain/skillDb.ts`、`server/domain/skillSeed.ts`、`server/domain/workflowInstanceDb.ts`、`server/domain/workflowNodeExecutor.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **路由与应用入口**：`src/app/routes.tsx`
- **通用 UI 组件**：`src/components/Sidebar/Sidebar.module.css`、`src/components/Sidebar/Sidebar.tsx`
- **核心层**：`src/core/constants/routes.ts`、`src/core/navigation/platformMenu.ts`、`src/core/navigation/systemMenu.ts`、`src/core/navigation/tenantMenu.ts`、`src/core/navigation/types.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **Agent 模板工厂**：`src/modules/platform/pages/AgentFactory/AgentFactoryEdit.tsx`、`src/modules/platform/pages/AgentFactory/AgentFactoryList.module.css`、`src/modules/platform/pages/AgentFactory/AgentFactoryNew.tsx`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **Skill 工厂**：`src/modules/platform/pages/SkillFactory/SkillFactory.module.css`、`src/modules/platform/pages/SkillFactory/SkillFactoryList.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台后台数据层**：`src/modules/platform/repositories/skillRepository.ts`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/agentTemplate.ts`、`src/modules/platform/schemas/skill.ts`
- **平台后台服务层**：`src/modules/platform/services/skillService.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **项目详情工作台**：`src/modules/tenant/pages/ProjectDetail/ProjectDetailWorkbench.tsx`、`src/modules/tenant/pages/ProjectDetail/tabs.module.css`、`src/modules/tenant/pages/ProjectDetail/tabs/AgentTeamTab.tsx`、`src/modules/tenant/pages/ProjectDetail/tabs/ResultsTab.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`、`src/modules/tenant/repositories/terminalRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/analyticsService.ts`、`src/modules/tenant/services/llmProviderService.ts`、`src/modules/tenant/services/terminalService.ts`

### 方向调整（如有）
- —

---

## [2026-03-16] P1.5-B 补齐：节点执行输入映射接入 Skill 运行时

### 变更内容
- `workflowNodeExecutor` 在执行节点前读取模板 `inputMapping`，并按模板表达式解析为 `runtimeInput`
- 新增模板值解析能力，支持从实例上下文、当前节点信息、已完成节点输出中提取变量
- Skill 执行时 `runtimeContext` 补充 `instanceId`、`nodeId`，提升后续 Prompt 组装与审计可追踪性

### 影响范围（共 62 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package-lock.json`、`package.json`、`src/index.css`、`src/main.tsx`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/agentTemplateDb.ts`、`server/domain/agentTemplateSeed.ts`、`server/domain/skillDb.ts`、`server/domain/skillSeed.ts`、`server/domain/workflowInstanceDb.ts`、`server/domain/workflowNodeExecutor.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **路由与应用入口**：`src/app/routes.tsx`
- **通用 UI 组件**：`src/components/Sidebar/Sidebar.module.css`、`src/components/Sidebar/Sidebar.tsx`
- **核心层**：`src/core/constants/routes.ts`、`src/core/navigation/platformMenu.ts`、`src/core/navigation/systemMenu.ts`、`src/core/navigation/tenantMenu.ts`、`src/core/navigation/types.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **Agent 模板工厂**：`src/modules/platform/pages/AgentFactory/AgentFactoryEdit.tsx`、`src/modules/platform/pages/AgentFactory/AgentFactoryList.module.css`、`src/modules/platform/pages/AgentFactory/AgentFactoryNew.tsx`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **Skill 工厂**：`src/modules/platform/pages/SkillFactory/SkillFactory.module.css`、`src/modules/platform/pages/SkillFactory/SkillFactoryList.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台后台数据层**：`src/modules/platform/repositories/skillRepository.ts`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/agentTemplate.ts`、`src/modules/platform/schemas/skill.ts`
- **平台后台服务层**：`src/modules/platform/services/skillService.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **项目详情工作台**：`src/modules/tenant/pages/ProjectDetail/ProjectDetailWorkbench.tsx`、`src/modules/tenant/pages/ProjectDetail/tabs.module.css`、`src/modules/tenant/pages/ProjectDetail/tabs/AgentTeamTab.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`、`src/modules/tenant/repositories/terminalRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`、`src/modules/tenant/services/terminalService.ts`

### 方向调整（如有）
- —

---

## [2026-03-16] P1.5-D 推进：项目详情 Agent 团队接入项目级调参入口

### 变更内容
- 项目详情 `AgentTeam` Tab 新增「项目级 Agent 调参」卡片：支持选择模板并编辑指令覆盖、模型覆盖、温度/Token、渠道风格覆盖和自定义参数
- 接入 `ProjectAgentConfig` 数据层服务，支持按项目加载、保存、删除覆盖配置
- 增加「已配置覆盖列表」展示，支持一键回填到编辑器继续修改
- ProjectDetail 工作台将 `projectId` 下传到 AgentTeamTab，形成页面级可操作闭环

### 影响范围（共 62 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package-lock.json`、`package.json`、`src/index.css`、`src/main.tsx`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/agentTemplateDb.ts`、`server/domain/agentTemplateSeed.ts`、`server/domain/skillDb.ts`、`server/domain/skillSeed.ts`、`server/domain/workflowInstanceDb.ts`、`server/domain/workflowNodeExecutor.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **路由与应用入口**：`src/app/routes.tsx`
- **通用 UI 组件**：`src/components/Sidebar/Sidebar.module.css`、`src/components/Sidebar/Sidebar.tsx`
- **核心层**：`src/core/constants/routes.ts`、`src/core/navigation/platformMenu.ts`、`src/core/navigation/systemMenu.ts`、`src/core/navigation/tenantMenu.ts`、`src/core/navigation/types.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **Agent 模板工厂**：`src/modules/platform/pages/AgentFactory/AgentFactoryEdit.tsx`、`src/modules/platform/pages/AgentFactory/AgentFactoryList.module.css`、`src/modules/platform/pages/AgentFactory/AgentFactoryNew.tsx`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **Skill 工厂**：`src/modules/platform/pages/SkillFactory/SkillFactory.module.css`、`src/modules/platform/pages/SkillFactory/SkillFactoryList.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台后台数据层**：`src/modules/platform/repositories/skillRepository.ts`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/agentTemplate.ts`、`src/modules/platform/schemas/skill.ts`
- **平台后台服务层**：`src/modules/platform/services/skillService.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **项目详情工作台**：`src/modules/tenant/pages/ProjectDetail/ProjectDetailWorkbench.tsx`、`src/modules/tenant/pages/ProjectDetail/tabs.module.css`、`src/modules/tenant/pages/ProjectDetail/tabs/AgentTeamTab.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`、`src/modules/tenant/repositories/terminalRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`、`src/modules/tenant/services/terminalService.ts`

### 方向调整（如有）
- —

---

## [2026-03-16] P1.5-C 收口补齐：Agent 工厂支持渠道风格 JSON 配置

### 变更内容
- Agent 工厂新建/编辑页新增 `channelStyleProfiles` JSON 编辑区，支持直接录入渠道风格配置
- 表单提交时增加 JSON 合法性校验，避免非法配置写入
- 结合前序后端字段与执行注入链路，形成「配置中心可编辑 → Prompt 组装可读取」的闭环

### 影响范围（共 59 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package-lock.json`、`package.json`、`src/index.css`、`src/main.tsx`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/agentTemplateDb.ts`、`server/domain/agentTemplateSeed.ts`、`server/domain/skillDb.ts`、`server/domain/skillSeed.ts`、`server/domain/workflowInstanceDb.ts`、`server/domain/workflowNodeExecutor.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **路由与应用入口**：`src/app/routes.tsx`
- **通用 UI 组件**：`src/components/Sidebar/Sidebar.module.css`、`src/components/Sidebar/Sidebar.tsx`
- **核心层**：`src/core/constants/routes.ts`、`src/core/navigation/platformMenu.ts`、`src/core/navigation/systemMenu.ts`、`src/core/navigation/tenantMenu.ts`、`src/core/navigation/types.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **Agent 模板工厂**：`src/modules/platform/pages/AgentFactory/AgentFactoryEdit.tsx`、`src/modules/platform/pages/AgentFactory/AgentFactoryList.module.css`、`src/modules/platform/pages/AgentFactory/AgentFactoryNew.tsx`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **Skill 工厂**：`src/modules/platform/pages/SkillFactory/SkillFactory.module.css`、`src/modules/platform/pages/SkillFactory/SkillFactoryList.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台后台数据层**：`src/modules/platform/repositories/skillRepository.ts`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/agentTemplate.ts`、`src/modules/platform/schemas/skill.ts`
- **平台后台服务层**：`src/modules/platform/services/skillService.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`、`src/modules/tenant/repositories/terminalRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`、`src/modules/tenant/services/terminalService.ts`

### 方向调整（如有）
- —

---

## [2026-03-16] P1.5-E/F 推进：Skill 基线增强 + OpenClaw 导入通道打通

### 变更内容
- 新增后端 OpenClaw 导入能力：`/api/skills/import-openclaw`，支持 JSON/YAML 解析并映射为 Skill 对象
- 新增 `skillOpenClawImport` 领域模块，统一处理格式识别、字段映射与默认值补齐
- Skill 工厂列表页新增「导入 OpenClaw」弹窗，支持粘贴内容并一键导入
- 扩展 Skill 前后端 schema/repository/service，补齐 `executionConfigJson`、`promptTemplate`、schema 字段透传
- 重构 `skillSeed`，新增 `seedSkillBaselines` 持续对齐机制，补全现有 Skill 执行配置并新增研究/发布类 Skill 基线
- 服务启动新增 `seedSkillBaselines()`，确保数据库中 Skill 能力结构与当前执行引擎保持一致

### 影响范围（共 56 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package-lock.json`、`package.json`、`src/index.css`、`src/main.tsx`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/agentTemplateDb.ts`、`server/domain/agentTemplateSeed.ts`、`server/domain/skillDb.ts`、`server/domain/skillSeed.ts`、`server/domain/workflowInstanceDb.ts`、`server/domain/workflowNodeExecutor.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **路由与应用入口**：`src/app/routes.tsx`
- **通用 UI 组件**：`src/components/Sidebar/Sidebar.module.css`、`src/components/Sidebar/Sidebar.tsx`
- **核心层**：`src/core/constants/routes.ts`、`src/core/navigation/platformMenu.ts`、`src/core/navigation/systemMenu.ts`、`src/core/navigation/tenantMenu.ts`、`src/core/navigation/types.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **Skill 工厂**：`src/modules/platform/pages/SkillFactory/SkillFactory.module.css`、`src/modules/platform/pages/SkillFactory/SkillFactoryList.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台后台数据层**：`src/modules/platform/repositories/skillRepository.ts`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/agentTemplate.ts`、`src/modules/platform/schemas/skill.ts`
- **平台后台服务层**：`src/modules/platform/services/skillService.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`、`src/modules/tenant/repositories/terminalRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`、`src/modules/tenant/services/terminalService.ts`

### 方向调整（如有）
- —

---

## [2026-03-16] P1.5-F 推进：Agent 服务端安全删除补强（引用检查）

### 变更内容
- `agentTemplateDb.dbDeleteAgentTemplate` 增加服务端删除前引用检查（WorkflowTemplateNode / 运行中 WorkflowInstanceNode / ProjectAgentConfig）
- 引用存在时返回中文错误信息，阻断删除，避免前端绕过检查误删模板
- 保持系统预置模板不可删除约束，同时保留 `AgentLLMBinding` 清理逻辑

### 影响范围（共 52 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package-lock.json`、`package.json`、`src/index.css`、`src/main.tsx`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/agentTemplateDb.ts`、`server/domain/agentTemplateSeed.ts`、`server/domain/skillDb.ts`、`server/domain/skillSeed.ts`、`server/domain/workflowInstanceDb.ts`、`server/domain/workflowNodeExecutor.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **路由与应用入口**：`src/app/routes.tsx`
- **通用 UI 组件**：`src/components/Sidebar/Sidebar.module.css`、`src/components/Sidebar/Sidebar.tsx`
- **核心层**：`src/core/constants/routes.ts`、`src/core/navigation/platformMenu.ts`、`src/core/navigation/systemMenu.ts`、`src/core/navigation/tenantMenu.ts`、`src/core/navigation/types.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/agentTemplate.ts`、`src/modules/platform/schemas/skill.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`、`src/modules/tenant/repositories/terminalRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`、`src/modules/tenant/services/terminalService.ts`

### 方向调整（如有）
- —

---

## [2026-03-16] P1.5-B/C/D 推进：Prompt 组装接入渠道风格与项目级 Agent 调参

### 变更内容
- Prisma 新增 `ProjectAgentConfig` 模型，并为 `AgentTemplate` 增加 `channelStyleProfiles` 字段，完成迁移
- 新增后端 `projectAgentConfigDb` 与项目级 API：支持按项目+Agent 查询、更新、删除调参配置
- `skillPromptAssembler` 接入项目级覆盖链路：指令覆盖、温度/Token 覆盖、模型覆盖、渠道风格合并
- `workflowNodeExecutor` 在 Skill 执行完成后写入 `channelType/channelStyleApplied` 运行态信息
- 前端新增 `projectAgentConfig` schema/repository/service，为项目详情页调参入口做数据层准备

### 影响范围（共 52 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package-lock.json`、`package.json`、`src/index.css`、`src/main.tsx`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/agentTemplateDb.ts`、`server/domain/agentTemplateSeed.ts`、`server/domain/skillDb.ts`、`server/domain/skillSeed.ts`、`server/domain/workflowInstanceDb.ts`、`server/domain/workflowNodeExecutor.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **路由与应用入口**：`src/app/routes.tsx`
- **通用 UI 组件**：`src/components/Sidebar/Sidebar.module.css`、`src/components/Sidebar/Sidebar.tsx`
- **核心层**：`src/core/constants/routes.ts`、`src/core/navigation/platformMenu.ts`、`src/core/navigation/systemMenu.ts`、`src/core/navigation/tenantMenu.ts`、`src/core/navigation/types.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/agentTemplate.ts`、`src/modules/platform/schemas/skill.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`、`src/modules/tenant/repositories/terminalRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`、`src/modules/tenant/services/terminalService.ts`

### 方向调整（如有）
- —

---

## [2026-03-16] P1.5-A 启动：Skill 执行引擎后端主链路打通（llm/external_api/internal_api/hybrid）

### 变更内容
- Prisma 扩展 `Skill` 执行字段（`inputSchemaJson`、`outputSchemaJson`、`executionConfigJson`、`promptTemplate`、重试策略等），并补充 `WorkflowInstanceNode` 的运行态字段（`selectedSkillIds`、`skillExecutionLog`、渠道相关字段）
- 新增 `skillPromptAssembler`、`skillOutputValidator`、`skillExecutionEngine` 三个后端模块，实现 Skill 执行路由与结果校验
- `workflowNodeExecutor` 从“仅按 Agent 占位执行”增强为“优先按 Skill 列表执行”，支持 `llm/external_api/internal_api/hybrid` 四类执行方式
- `skillDb` 与 Skill API 路由同步支持新增字段，便于后续在 Skill 工厂页配置执行参数
- 完成数据库迁移、Prisma Client 重新生成，并通过 `typecheck + lint:server + build` 验证

### 影响范围（共 49 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package-lock.json`、`package.json`、`src/index.css`、`src/main.tsx`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillDb.ts`、`server/domain/skillSeed.ts`、`server/domain/workflowInstanceDb.ts`、`server/domain/workflowNodeExecutor.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **路由与应用入口**：`src/app/routes.tsx`
- **通用 UI 组件**：`src/components/Sidebar/Sidebar.module.css`、`src/components/Sidebar/Sidebar.tsx`
- **核心层**：`src/core/constants/routes.ts`、`src/core/navigation/platformMenu.ts`、`src/core/navigation/systemMenu.ts`、`src/core/navigation/tenantMenu.ts`、`src/core/navigation/types.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`、`src/modules/tenant/repositories/terminalRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`、`src/modules/tenant/services/terminalService.ts`

### 方向调整（如有）
- —

---

## [2026-03-16] P1 收口：数据源中心 + Telegram 发送首批打通

### 变更内容
- 完成 P1-A 数据源配置中心首版：后端新增 `/api/data-source-*` 接口、Provider 连接测试与统一执行器联调接口
- 新增数据源中心系统页 `DataSourceConfigCenterPage`，支持凭证/Provider/配置三块 CRUD 与联调执行
- Prisma 新增数据源三模型并完成迁移，服务启动时自动种子四个 Provider（Tavily / Apify / Jina Reader / RSS）
- 完成 P1-B 第一批 Telegram 发送能力：新增终端动作接口 `/api/terminals/:id/actions/telegram/send`，支持文本/图片/投票
- 新增租户页 `TelegramTerminalPage`，支持创建 Telegram Bot 终端、测试连接、发送消息
- `/tenant/terminals/telegram` 从占位页切换为可操作页面，前端 `terminalService/repository` 增加 Telegram 发送方法

### 影响范围（共 46 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package-lock.json`、`package.json`、`src/index.css`、`src/main.tsx`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillSeed.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **路由与应用入口**：`src/app/routes.tsx`
- **通用 UI 组件**：`src/components/Sidebar/Sidebar.module.css`、`src/components/Sidebar/Sidebar.tsx`
- **核心层**：`src/core/constants/routes.ts`、`src/core/navigation/platformMenu.ts`、`src/core/navigation/systemMenu.ts`、`src/core/navigation/tenantMenu.ts`、`src/core/navigation/types.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`、`src/modules/tenant/repositories/terminalRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`、`src/modules/tenant/services/terminalService.ts`

### 方向调整（如有）
- —

---

## [2026-03-16] P1-A 启动：数据源配置中心首版落地（后端 API + 系统页）

### 变更内容
- 新增数据源中心 Prisma 模型：`DataSourceCredential`、`DataSourceProvider`、`DataSourceConfig`，并创建迁移 `add_data_source_center`
- 新增后端领域层 `server/domain/dataSourceDb.ts`：实现凭证/Provider/配置的 CRUD、Provider 连接测试、统一执行器 `dbExecuteDataSource`
- 新增后端路由 `server/routes/dataSourceRoutes.ts`，注册 `/api/data-source-*` 系列接口和 `/api/data-source/execute`
- `server/index.ts` 挂载数据源路由并接入 `seedDataSourceProvidersIfEmpty`，首批预置 Tavily / Apify / Jina Reader / RSS
- 新增系统页 `DataSourceConfigCenterPage`，替换 `/system/datasource-configs` 占位页，支持三块管理（凭证/Provider/配置）与联调执行
- 新增前端数据层：`dataSourceCenter` schema + repository + service，统一走标准 API 合约

### 影响范围（共 44 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package-lock.json`、`package.json`、`src/index.css`、`src/main.tsx`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillSeed.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **路由与应用入口**：`src/app/routes.tsx`
- **通用 UI 组件**：`src/components/Sidebar/Sidebar.module.css`、`src/components/Sidebar/Sidebar.tsx`
- **核心层**：`src/core/constants/routes.ts`、`src/core/navigation/platformMenu.ts`、`src/core/navigation/systemMenu.ts`、`src/core/navigation/tenantMenu.ts`、`src/core/navigation/types.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`

### 方向调整（如有）
- —

---

## [2026-03-16] 白屏紧急修复：回退 Tailwind Vite 插件接入并重启前端服务

### 变更内容
- 定位到白屏根因不是页面逻辑异常，而是前端 dev server 对 `5173` 请求无响应（HTTP 超时）
- 回退 `vite.config.ts` 中 `@tailwindcss/vite` 插件挂载，避免当前环境下请求阻塞
- 回退 `src/index.css` 顶部 `@import "tailwindcss"`，保留基础全局样式与 token 变量
- 清理挂死的旧前端进程并重新启动 `npm run dev`，恢复 `http://localhost:5173/` 正常响应
- 补充验证：`curl -I http://localhost:5173/` 返回 `HTTP 200`，`npm run typecheck` 通过

### 影响范围（共 44 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package-lock.json`、`package.json`、`src/index.css`、`src/main.tsx`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillSeed.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **路由与应用入口**：`src/app/routes.tsx`
- **通用 UI 组件**：`src/components/Sidebar/Sidebar.module.css`、`src/components/Sidebar/Sidebar.tsx`
- **核心层**：`src/core/constants/routes.ts`、`src/core/navigation/platformMenu.ts`、`src/core/navigation/systemMenu.ts`、`src/core/navigation/tenantMenu.ts`、`src/core/navigation/types.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`

### 方向调整（如有）
- UI 基座采用“先稳定可访问，再渐进接入 Tailwind”的策略，避免阻塞后续 Phase 1 功能开发联调

---

## [2026-03-16] P0 收口：UI 基座接入 + Sidebar 菜单重构 + 新路由骨架

### 变更内容
- 安装并接入 UI 基础依赖：`tailwindcss` + `@tailwindcss/vite`、`lucide-react`、`sonner`、`react-hook-form`、`zod`、`@hookform/resolvers`
- `vite.config.ts` 接入 Tailwind v4 Vite 插件；`src/index.css` 引入 Tailwind 并补充基础 design token 变量
- `src/main.tsx` 挂载 `sonner` 全局 `Toaster`，统一前端交互反馈能力
- Sidebar 完成图标化与折叠优化：支持 Lucide 图标、折叠态图标按钮、菜单 badge、折叠态 title 提示
- 三 Shell 菜单按文档 12 更新：Tenant 新增消息中心/定时任务/数据源/Telegram 子项并独立身份库路由；System 新增数据源配置/Webhook/消息管线/定时任务总览；Platform 补全图标
- 新增 `src/modules/shared/pages/RoutePlaceholderPage.tsx`，并在 `src/app/routes.tsx` 注册 Tenant/System 新增路由骨架页
- 更新路线图 `docs/development/00-development-roadmap.md`：P0-5/P0-6/P0-7 状态改为“已完成”

### 影响范围（共 45 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package-lock.json`、`package.json`、`src/index.css`、`src/main.tsx`、`vite.config.ts`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillSeed.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **路由与应用入口**：`src/app/routes.tsx`
- **通用 UI 组件**：`src/components/Sidebar/Sidebar.module.css`、`src/components/Sidebar/Sidebar.tsx`
- **核心层**：`src/core/constants/routes.ts`、`src/core/navigation/platformMenu.ts`、`src/core/navigation/systemMenu.ts`、`src/core/navigation/tenantMenu.ts`、`src/core/navigation/types.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`

### 方向调整（如有）
- P0 从“后端路由拆分优先”扩展为“后端拆分 + 前端壳层能力同步收口”，为 Phase 1 的消息/数据源/调度模块开发提前打通入口与导航承载面

---

## [2026-03-16] P0 路由拆分持续推进：AgentFactory 与 Project 域模块化

### 变更内容
- 新增 `server/routes/agentFactoryRoutes.ts`，承接 AgentTemplate / Skill / LLMProvider / LLMModelConfig / AgentLLMBinding 全量接口
- 新增 `server/routes/projectRoutes.ts`，承接 Project、ProjectGoal、ProjectSOP 相关接口
- 新增 `server/routes/tenantRoutes.ts`，承接 Tenant 资源完整生命周期接口
- 新增 `server/routes/identityTerminalRoutes.ts`，承接 Identity / Terminal 及 Facebook 终端动作接口
- 新增 `server/routes/workflowRoutes.ts`，承接 WorkflowTemplate / WorkflowInstance / Task 相关接口
- `server/index.ts` 移除对应内联路由并改为统一 `registerXxxRoutes(app)` 挂载，主入口进一步瘦身（约 64 行）
- `docs/development/00-development-roadmap.md` 更新 P0-8 为“已完成”
- 持续验证 `npm run typecheck` 与 `npm run lint:server` 通过，确保拆分后行为稳定

### 影响范围（共 33 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package.json`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillSeed.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`

### 方向调整（如有）
- 路由拆分顺序从“系统能力域”扩展到“核心业务域”，优先迁移边界明确且复用度高的 API 组，降低主入口维护成本

---

## [2026-03-16] P0 路由拆分再推进：SystemTerminal 与平台能力域模块化

### 变更内容
- 新增 `server/routes/systemTerminalRoutes.ts`，承接 `system-terminal-types` 与 `platform-capabilities` 相关 API
- `server/index.ts` 移除批次 8 内联实现（终端类型工厂 + 平台终端能力注册）并改为 `registerSystemTerminalRoutes(app)`
- 清理主入口中已无引用的 `getSystemTerminalTypeDb` 等逻辑，进一步降低主入口复杂度
- 更新路线图：P0-8 进度新增 SystemTerminal 域

### 影响范围（共 33 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package.json`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillSeed.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`

### 方向调整（如有）
- 路由拆分优先“数据结构稳定、接口边界清晰”的模块，先完成系统管理域，再继续推进高耦合业务域

---

## [2026-03-16] P0 路由拆分推进：Facebook 集成域模块化

### 变更内容
- 新增 `server/routes/facebookRoutes.ts`，承接 Facebook 平台集成配置、OAuth 授权、主页列表、撤销授权、即时发帖、定时发帖相关 API
- `server/index.ts` 移除 Facebook 域内联路由及其辅助函数，改为 `registerFacebookRoutes(app)` 挂载
- 清理主入口不再使用的导入项与 `crypto` 依赖，进一步降低耦合
- 更新路线图：P0-8 路由拆分进度新增 Facebook 域

### 影响范围（共 33 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package.json`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillSeed.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`

### 方向调整（如有）
- 采用“按业务域完整迁移”策略，每次拆分保持接口路径与行为不变，优先保证可用性后再做内部优化

---

## [2026-03-16] P0 收敛：tenantId 统一、serverStore 退役、lint 稳定化

### 变更内容
- 清理租户侧页面 `tenantId` 硬编码回退（`'t1'`），统一改为从 `useAuth().user?.tenant?.tenantId` 获取
- 平台流程模板工厂复制弹窗默认租户 ID 从硬编码改为留空输入，避免跨租户误用
- 完成 `serverStoreDb` 替代收尾：`llmResolverService` 与 `testProviderServer` 不再依赖 `serverStore`，改为直接读取 `credentialStore`
- 删除无引用的 `server/llm/serverStore.ts` 旧实现，避免后续误回退
- 为解决全量 lint OOM，重构 `package.json` lint 脚本为 `src/server` 分域执行（`lint:src` + `lint:server`），并验证 `npm run lint` 可稳定通过
- 更新路线图状态：P0-2、P0-3、P0-4 标记完成

### 影响范围（共 33 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package.json`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillSeed.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/llmResolverService.ts`、`server/llm/serverStore.ts`、`server/llm/serverStoreDb.ts`、`server/llm/testProviderServer.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **流程模板工厂**：`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryForm.tsx`、`src/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactoryList.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台页面**：`src/modules/tenant/pages/AnalyticsPage.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx`、`src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx`、`src/modules/tenant/pages/SystemSettings.tsx`、`src/modules/tenant/pages/TaskCenter.tsx`、`src/modules/tenant/pages/TerminalCenter.tsx`、`src/modules/tenant/pages/WorkflowRuntime/WorkflowRuntimeList.tsx`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`

### 方向调整（如有）
- 工程质量检查从“单次全量扫描”调整为“分域稳定执行”，在不降低标准前提下提升 CI/本地执行稳定性

---

## [2026-03-16] P0 路由拆分再推进：Project Workbench 与子域 CRUD 模块化

### 变更内容
- 新增 `server/routes/projectWorkbenchRoutes.ts`，承接项目工作台聚合、身份绑定、交付物、资源配置相关 API
- `server/index.ts` 移除项目子域内联路由与对应延迟加载辅助函数，改为 `registerProjectWorkbenchRoutes(app)` 统一挂载
- 继续降低主入口复杂度，为后续继续拆分 project/workflow/terminal 域铺路
- 更新路线图：P0-8 路由拆分进度纳入 ProjectWorkbench 域

### 影响范围（共 21 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package.json`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillSeed.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/testProviderServer.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`

### 方向调整（如有）
- 主入口瘦身采用“高频变更域优先拆分”策略，先拆项目工作台相关路由，便于后续多模块并行开发

---

## [2026-03-16] P0 路由拆分继续：Runtime/Publish 相关 API 模块化

### 变更内容
- 新增 `server/routes/runtimeRoutes.ts`，承接运行日志、监督决策、发布记录相关 API
- `server/index.ts` 移除对应内联实现（`/api/workflow-instances/:id/runtime-logs`、`/api/workflow-instances/:id/supervisor-decisions`、`/api/supervisor-decisions/:id`、`/api/workflow-templates/:id/publish-records`）
- 主入口新增 `registerRuntimeRoutes(app)`，继续采用按域注册模式
- 清理 `index.ts` 中已无引用的 runtime 延迟加载辅助函数
- 更新路线图：P0-8 路由拆分进度扩展到 Runtime 域

### 影响范围（共 21 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package.json`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillSeed.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/testProviderServer.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`

### 方向调整（如有）
- P0 先以“路由模块化 + 稳态迁移”为主线，后续再按模块逐步下沉 service/repository 细化边界

---

## [2026-03-16] P0 路由拆分推进：Planning/Credentials/Config-Stats 模块化

### 变更内容
- 新增 `server/routes/planningRoutes.ts`，承接规划会话与草案相关 API（`/api/planning-*`）
- 新增 `server/routes/credentialRoutes.ts`，承接凭证 CRUD API（`/api/credentials`）
- 新增 `server/routes/systemConfigRoutes.ts`，承接配置与统计 API（`/api/config/*`、`/api/stats/*`、`/api/planner-strategy-profiles/:id`）
- `server/index.ts` 移除对应内联路由实现，改为统一注册 `registerXxxRoutes(app)`，继续降低主入口复杂度
- 更新路线图状态：P0-8 路由拆分进度从“仅 LLM”扩展到“LLM/Planning/Credentials/Config&Stats”

### 影响范围（共 21 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package.json`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillSeed.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/testProviderServer.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`

### 方向调整（如有）
- 路由拆分按“功能域优先 + 无行为变更”原则推进，先拆低耦合域，再逐步迁移高耦合业务域

---

## [2026-03-16] P0 开发推进：路线图状态更新与文档二次同步

### 变更内容
- 更新 `00-development-roadmap.md`：P0-8 标记为进行中（已拆分 LLM 路由），P0-9 标记为已完成
- 执行 `npm run docs:update` 完成本轮代码与文档状态二次同步
- 保持 CHANGELOG 与 codebase-index 同步，便于后续持续迭代追踪

### 影响范围（共 21 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package.json`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillSeed.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/testProviderServer.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`

### 方向调整（如有）
- —

---

## [2026-03-16] P0 启动：Skill 执行类型迁移与 LLM 路由拆分首批落地

### 变更内容
- 完成 Skill `executionType` 迁移：种子数据从 `tool` 统一改为 `external_api`，并新增启动时历史数据修复逻辑（`tool` → `external_api`）
- 前端 Skill 类型与中文映射同步升级为四类执行方式：`llm` / `external_api` / `internal_api` / `hybrid`
- 启动 `server/index.ts` 路由拆分：抽离 `/api/llm/execute` 与 `/api/llm/test-provider` 到 `server/routes/llmRoutes.ts` 并完成挂载
- 对齐 Prisma 注释与新枚举，确保文档、类型、种子、运行时保持一致

### 影响范围（共 21 个文件）
- **AI 协作指南**：`CLAUDE.md`
- **文档**：`docs/deployment/00-deployment-guide.md`、`docs/deployment/cloud-update-rules.md`
- **其他**：`package.json`
- **Prisma 数据模型/迁移**：`prisma/schema.prisma`
- **运维脚本**：`scripts/deploy-to-cloud.ps1`
- **数据领域层（Prisma）**：`server/domain/skillSeed.ts`
- **后端路由主入口**：`server/index.ts`
- **LLM 服务层**：`server/llm/testProviderServer.ts`
- **中文标签映射**：`src/core/labels/skillLabels.ts`
- **模型配置中心**：`src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`
- **平台/系统后台（其他）**：`src/modules/platform/schemas/skill.ts`
- **租户后台数据层**：`src/modules/tenant/repositories/llmProviderRepository.ts`
- **租户后台服务层**：`src/modules/tenant/services/llmProviderService.ts`

### 方向调整（如有）
- 路由拆分采用“先拆核心域、再逐步迁移”的增量策略，确保每次拆分可独立验证、不中断现有功能

---

## [2026-03-16] 云端部署脚本升级为快速路径标准

### 变更内容
- 重构 `scripts/deploy-to-cloud.ps1`，改为“增量上传 + 变更感知执行”部署模式
- 新增部署策略判定：`docs-only`、`script-only`、`code-change`
- 根据变更类型自动跳过不必要步骤（`npm ci` / `prisma generate` / `build` / `migrate` / `pm2 restart`）
- 优化远端目录创建逻辑：批量 `mkdir -p`，减少 SSH 往返次数
- 增加 `-DryRun` 输出用于发布前预演，降低误操作风险
- 将部署文档更新为固定标准：默认执行 `.\scripts\deploy-to-cloud.ps1`

### 影响范围
- `scripts/deploy-to-cloud.ps1`
- `docs/deployment/cloud-update-rules.md`
- `docs/deployment/00-deployment-guide.md`

### 方向调整
- 从“每次全量构建重启”调整为“按变更类型最小执行”，把云端更新时延稳定压低到必要步骤范围

---

## [2026-03-16] LLM 提供商测试模型策略优化（百炼兼容）

### 变更内容
- `/api/llm/test-provider` 支持可选参数 `testModelKey`，可在测试时手动指定模型标识
- 移除测试连接中的硬编码回退模型 `gpt-4o-mini`，避免误将 GPT 模型发给 OpenAI 兼容提供商
- 当提供商无可用模型时，返回明确中文提示：先配置并启用模型，或手动填写测试模型
- 增强“模型不支持”场景的中文错误提示，直接说明当前测试模型并给出修复方向
- 模型配置中心“测试连接”弹窗新增“测试模型（可选）”输入框，并展示本次测试模型来源

### 影响范围
- `server/llm/testProviderServer.ts`
- `server/index.ts`
- `src/modules/tenant/repositories/llmProviderRepository.ts`
- `src/modules/tenant/services/llmProviderService.ts`
- `src/modules/platform/pages/LLMConfigCenter/LLMConfigCenterPage.tsx`

### 方向调整
- Provider 测试从“默认假设 OpenAI 模型”调整为“优先显式模型”，更适配百炼等 OpenAI 兼容平台

---

## [2026-03-16] 系统文档体系建设与规则清理

### 变更内容
- 新建 `docs/status/` 系列文档：system-architecture.md、codebase-index.md、completed-features.md、product-blueprint.md、CHANGELOG.md
- 合并 68 个 `.cursor/rules/` 为约 17 个精简规则文件
- 归档 40+ 份历史阶段文档至 `docs/archive/`
- 精简 `docs/architecture/` 目录
- 更新 CLAUDE.md 同步新规则引用
- 新建 `99-dev-progress-tracking.mdc` 自动提醒规则

### 影响范围
- `.cursor/rules/` — 规则文件大幅精简
- `docs/` — 文档体系重组
- `CLAUDE.md` — 更新规则引用

### 方向调整
- 建立标准化的开发进度追踪机制，替代此前分散的 phase 自检文档
- 规则文件从 68 个合并为 ~17 个，降低 AI 协作上下文负担

### 代码结构变化
- 新增 `docs/status/` 目录（5 个文件）
- 新增 `docs/archive/` 目录（历史文档归档）
- 删除 `.cursor/rules/` 中 50+ 个旧规则文件
- 新增 `.cursor/rules/99-dev-progress-tracking.mdc`

---

## [2026-03-15] Git 化云端部署

### 变更内容
- 将云端服务器从 tar 上传切换为 Git 化部署
- 配置 GitHub 远程仓库
- 创建标准部署脚本 `scripts/deploy-update.sh`
- 更新部署文档 `docs/deployment/cloud-update-rules.md`

### 影响范围
- `scripts/deploy-update.sh` — 新建
- `docs/deployment/` — 更新
- `.gitignore` / `.gitattributes` — 新建/更新
- 服务器 `/opt/awcc` — 从 tar 目录切换为 Git 仓库

---

## [2026-03-14] Facebook 集成与终端真实化（Phase 17.8）

### 变更内容
- Facebook Pages API 真实接入（OAuth、主页管理、发帖、定时发帖）
- 终端中心真实化（CRUD + 测试连接 + Token 刷新）
- 任务中心真实化
- 平台能力注册与凭证配置
- 回调地址动态生成（不再硬编码 localhost）

### 影响范围
- `server/index.ts` — 新增 Facebook 相关 API
- `server/data/` — Facebook 凭证存储
- `src/modules/tenant/pages/FacebookPageAuth/` — 新增
- `src/modules/tenant/pages/TerminalCenter/` — 真实化
- `src/modules/platform/pages/PlatformCapabilities/` — 新增

---

## [2026-03-13] LLM 运行时切换（Phase 17.7a/17.7b）

### 变更内容
- LLM 调用从前端环境变量模式切换到服务端执行模式
- 新建 serverStoreDb（从 Prisma 读取 LLM 配置）
- Worker Agent 节点执行真实化（内容创作/审核）
- 流程节点执行 API（POST /api/workflow-instances/:id/nodes/:nodeId/execute）

### 影响范围
- `server/llm/` — 执行器重构
- `server/domain/workflowNodeExecutor.ts` — 新增
- `src/modules/tenant/services/workerAgentExecutionService.ts` — 新增

---

## [基线] 系统状态快照

截至 2026-03-16，系统状态：

- **前端**：React 18 + TypeScript + Vite 6，三 Shell 架构
- **后端**：Express.js + Prisma + SQLite，29 个模型，120+ API 端点
- **部署**：Ubuntu + Nginx + PM2 + Certbot，Git 化部署
- **LLM**：OpenAI 通过服务端 Executor 调用
- **集成**：Facebook Pages API 真实接入
- **数据**：主要模块已从 mock 迁移到 Prisma 持久化，少量 mock 残留

