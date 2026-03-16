# Phase 12.6 Agent Scope & Workflow Entry Baseline 开发总结

## 一、新增和修改的文件列表

### 新增
- `src/core/labels/agentTemplateLabels.ts` - Agent 模板前台中文映射
- `src/modules/tenant/pages/ProjectCreationWizard/steps/Step2GoalDeliverable.tsx` - 目标与交付模式（合并）
- `src/modules/tenant/pages/ProjectCreationWizard/steps/Step3WorkflowTask.tsx` - 流程与任务
- `src/modules/tenant/pages/ProjectCreationWizard/steps/Step4AgentScope.tsx` - Agent 范围与协作偏好
- `docs/phase12-6-agent-scope-workflow-entry-summary.md` - 本文档

### 修改
- `src/modules/platform/schemas/agentTemplate.ts` - 新增 `nameZh`
- `src/modules/platform/mock/agentTemplateMock.ts` - 补齐 9 个真实 Agent、nameZh、category、新增研究/搜索与执行监督 Agent
- `src/modules/platform/pages/AgentFactory/AgentFactoryList.tsx` - 列表列：中文名称、分类、默认执行器、关联 Skill、中文映射
- `src/modules/platform/pages/AgentFactory/AgentFactoryDetail.tsx` - 详情：中文说明、绑定 Skill、适用项目类型、引用关系
- `src/modules/platform/services/agentTemplateService.ts` - `getAgentTemplateReferences`
- `src/modules/platform/repositories/agentTemplateRepository.ts` - `getAgentTemplateReferences`
- `src/modules/tenant/mock/workflowTemplateNodeMock.ts` - `getTemplateNodesReferencingAgent`
- `src/modules/tenant/mock/workflowPlanningSessionMock.ts` - `getDraftNodesReferencingAgent`
- `src/modules/tenant/schemas/project.ts` - `allowedAgentTemplateIds`、`preferredAgentTemplateIds`、`defaultPlannerAgentTemplateId`、`defaultSupervisorAgentTemplateId`
- `src/modules/tenant/pages/ProjectDetail/tabs/AgentTeamTab.tsx` - 文案改为「可用 Agent 范围」「推荐 Agent 组合」「默认流程规划助手」
- `src/modules/tenant/pages/ProjectCreationWizard/types.ts` - STEP_LABELS 重排、form 新增 Agent 字段
- `src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.tsx` - 7 步新顺序
- `src/modules/tenant/pages/ProjectCreationWizard/steps/Step7Confirm.tsx` - 确认页新增流程与 Agent 摘要
- `src/modules/tenant/services/projectCreationService.ts` - 支持 Agent 字段
- `src/modules/tenant/mock/projectMock.ts` - createProject 支持 Agent 字段
- `src/core/labels/planningDisplayLabels.ts` - AGENT_CATEGORY_LABELS 补充 planning/execution/coordination、pt-acount-operation 兼容
- `src/components/AgentTemplateSelector/AgentTemplateSelector.tsx` - 下拉展示 nameZh
- `src/modules/tenant/pages/ProjectCreationWizard/ProjectCreationWizard.module.css` - formHint 样式

---

## 二、Agent Library 补齐说明

### 预置 Agent 列表（9 个）

| code | nameZh | category | roleType |
|------|--------|----------|----------|
| BASE_CONTENT_CREATOR | 内容生成 Agent | execution | creator |
| BASE_REVIEWER | 基础审核 Agent | execution | reviewer |
| FB_CONTENT_CREATOR | Facebook 内容生成 Agent | execution | creator |
| CONTENT_REVIEWER | 内容审核 Agent | execution | reviewer |
| PUBLISHER | 发布 Agent | execution | publisher |
| WORKFLOW_PLANNER | 流程规划助手 | planning | planner |
| PERFORMANCE_RECORDER | 结果记录 Agent | execution | recorder |
| RESEARCH_SEARCH | 研究/搜索 Agent | execution | other |
| EXECUTION_SUPERVISOR | 执行监督 Agent | coordination | coordinator |

### 分类与中文

- **category**：planning、execution、coordination，前台映射为 规划、执行、协调
- **roleType**：creator、reviewer、publisher、recorder、planner、coordinator、other，统一使用 `agentTemplateLabels.ts`
- **defaultExecutorType**：human、agent、system、api，映射为 人工、Agent、系统、API

### 详情页新增区块

- 绑定 Skill
- 适用项目类型（项目类型、目标类型，均用中文）
- 引用关系：WorkflowTemplateNode 引用、WorkflowPlanningDraftNode 推荐

---

## 三、Project / Workflow Agent 边界说明

### Project 层（项目配置）

- **allowedAgentTemplateIds**：可用 Agent 范围
- **preferredAgentTemplateIds**：推荐 Agent 组合
- **defaultPlannerAgentTemplateId**：默认流程规划助手
- **defaultSupervisorAgentTemplateId**：执行监督 Agent（预留）

项目层仅限定范围和偏好，不决定具体节点执行。

### Workflow 层（流程模板/草案）

- WorkflowTemplateNode / WorkflowPlanningDraftNode 继续使用：
  - recommendedAgentTemplateId
  - allowedAgentRoleTypes
  - allowedSkillIds
  - executorStrategy
  - reviewPolicy

节点级执行与审核由流程层负责。

### 文案调整

- 已停用：「项目执行 Agent」「项目绑定 Agent」「项目节点 Agent」
- 已改为：「可用 Agent 范围」「推荐 Agent 组合」「默认流程规划助手」

---

## 四、项目创建/编辑顺序调整说明

### 新顺序（7 步）

1. 基础信息
2. 目标与交付模式（合并原目标建模 + 交付标的）
3. 流程与任务（前移，含推荐流程、进入规划会话）
4. Agent 范围与协作偏好（默认流程规划助手、可用范围占位）
5. 身份/渠道/资源
6. 预算与审核（SOP）
7. 确认创建

### 流程与任务步骤内容

- 按目标与交付模式展示推荐流程模板
- 提供「进入流程规划会话」入口链接
- 创建项目后可在项目详情中选择流程

---

## 五、中文映射补充说明

### 新增 agentTemplateLabels.ts

- AGENT_TEMPLATE_STATUS_LABELS
- AGENT_ROLE_TYPE_LABELS
- AGENT_CATEGORY_LABELS（planning/execution/coordination + 旧分类兼容）
- EXECUTOR_TYPE_LABELS

### 使用范围

- AgentFactoryList、AgentFactoryDetail
- AgentTemplateSelector（nameZh 优先）
- Step4AgentScope、Step7Confirm
- planningDisplayLabels 中 PLANNING_PROJECT_TYPE_LABELS、PLANNING_GOAL_TYPE_LABELS、AGENT_CATEGORY_LABELS

---

## 六、当前仍保留但未来建议清理的兼容项

| 项 | 说明 |
|----|------|
| pt-acount-operation | 项目类型拼写错误，已通过 PLANNING_PROJECT_TYPE_LABELS 兼容，建议统一为 pt-account-operation |
| AgentTeamTab 内 Agent 模板选择 | 现为单选的「可用 Agent 范围」，未来应改为 allowedAgentTemplateIds 多选 |
| Step4AgentScope「可用 Agent 范围」 | 当前为占位说明，未来应支持 allowedAgentTemplateIds、preferredAgentTemplateIds 多选 |
| Step5SOP 标题 | 仍为「预算与审核」，当前内容以 SOP 为主，可逐步补充预算相关字段 |
| workflowTemplateNodeMock 中 agentTemplateId | 与 recommendedAgentTemplateId 并存，属兼容字段，后续可只保留 recommendedAgentTemplateId |
