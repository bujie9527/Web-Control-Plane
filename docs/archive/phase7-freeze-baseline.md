# 第七阶段冻结基线文档

## 文档目的
用于冻结第七阶段（Workflow Template Factory 1.0）已确认的数据模型、边界、路由、接口与范围约束，作为第八阶段（Workflow Node Builder 1.0）的执行基线。

---

## 1. 冻结 WorkflowTemplate 主对象字段

第七阶段已通过的数据模型字段定义为冻结基线。第八阶段允许新增扩展字段，但不得重命名、改语义或混入运行态字段。

冻结字段清单：

- id
- name
- code
- description
- scopeType
- tenantId
- status
- version
- isLatest
- isSystemPreset
- sourceTemplateId
- sourceVersion
- clonedFromTemplateId
- supportedProjectTypeId
- supportedGoalTypeIds
- supportedDeliverableModes
- supportedChannels
- supportedIdentityTypeIds
- planningMode
- recommendedAgentTemplateIds
- recommendedSkillIds
- defaultReviewPolicy
- nodeCount
- createdAt
- updatedAt

冻结要求：

- 第八阶段不重命名上述字段。
- 第八阶段不改变上述字段语义。
- 第八阶段不将运行态字段塞入模板对象。

---

## 2. 冻结 WorkflowTemplate 与 WorkflowInstance 的边界

明确边界：

- WorkflowTemplate = 定义层
- WorkflowInstance = 运行层

冻结要求：

- 第八阶段开发 Node Builder 时，不得把实例字段回写到模板对象。
- 不得把模板节点直接当运行节点改写。

该边界为后续系统可持续演进的关键约束。

---

## 3. 冻结 system / tenant 双层作用域规则

冻结要求：

- system 模板仅平台管理。
- tenant 模板仅来源于复制或租户自有创建逻辑。
- 租户不得直接编辑平台模板。
- 平台模板与租户模板页面语义持续分离。

第八阶段节点编辑能力必须继续服从该规则。

---

## 4. 冻结“流程强绑定项目语义边界”原则

流程模板区别于通用 BPM 的核心前提：强绑定项目语义边界。

冻结要求（模板级）：

- supportedProjectTypeId
- supportedGoalTypeIds
- supportedDeliverableModes

第八阶段节点构建器不得将流程弱化为“无边界通用流程”。
节点只能细化执行，不得突破项目语义边界。

---

## 5. 冻结节点基础结构（先用起来，不先推翻）

第八阶段优先强化字段应用与交互，不先推翻模型。

冻结基础字段：

- id
- workflowTemplateId
- key
- name
- description
- executionType
- intentType
- orderIndex
- dependsOnNodeIds
- recommendedAgentTemplateId
- allowedAgentRoleTypes
- allowedSkillIds
- inputMapping
- outputMapping
- executorStrategy
- reviewPolicy
- isOptional
- onFailureStrategy
- status

冻结要求：

- 第八阶段优先“把字段用起来”。
- 不以重构模型为先手动作。

---

## 6. 冻结页面路由与模块命名

建议冻结路由：

平台侧：

- /system/workflow-templates
- /system/workflow-templates/new
- /system/workflow-templates/:id
- /system/workflow-templates/:id/edit

租户侧：

- /tenant/workflow-templates
- /tenant/workflow-templates/:id

冻结要求：

- 第八阶段不重新命名上述路由。
- 不把模板工厂页与节点编辑器页混为同一语义不清页面。
- 节点构建器优先新增子路由或子模块承载。

---

## 7. 冻结 mock 数据契约与接口命名

当前 mock service / repository 作为“假后端契约”冻结。

冻结接口：

- listWorkflowTemplates
- getWorkflowTemplateById
- createWorkflowTemplate
- updateWorkflowTemplate
- cloneWorkflowTemplateToTenant
- changeWorkflowTemplateStatus

冻结要求：

- 第八阶段不随意改名或破坏现有接口语义。
- 节点构建器扩展建议新增接口，避免破坏既有契约。

---

## 8. 冻结第八阶段暂不处理范围

第八阶段暂不处理：

- SOP 对话式规划器
- 真实 LLM 接入
- 运行态监控大屏
- 复杂版本树
- 条件分支执行引擎
- 真实权限系统深改
- 真实 API 持久化

冻结要求：

- 第八阶段聚焦 Workflow Node Builder 1.0。
- 防止范围膨胀，避免并行推进多个大模块。

---

## 执行建议（立刻生效）

- 本文作为第八阶段开发前置约束文档，评审、开发、验收均需对照。
- 第八阶段所有 PR/任务说明需显式标注：是否触及本冻结基线。
