# AI Work Control Center - Workflow & Task Execution 模型

## 1. 文档目的

本文档用于定义 Workflow / Task Execution 在系统中的对象模型、对象边界、状态模型和与 Project / Identity / SOP 的关系。

---

## 2. 模块定位

Workflow / Task Execution 是系统中“定义到执行”的桥梁层。

它连接：

- Project
- Goal / Deliverable
- SOP
- Identity
- Task
- Result

---

## 3. 核心对象

### 3.1 WorkflowTemplate
标准流程模板。

建议字段：
- id
- tenantId
- name
- code
- type
- description
- applicableGoalTypes
- applicableDeliverableTypes
- status
- version
- createdAt
- updatedAt

---

### 3.2 WorkflowTemplateNode
模板节点。

建议字段：
- id
- templateId
- nodeKey
- nodeName
- nodeType
- role
- executorType
- needReview
- orderIndex
- nextNodeKey
- description
- createdAt
- updatedAt

---

### 3.3 WorkflowInstance
流程实例。

建议字段：
- id
- projectId
- templateId
- goalId
- deliverableId
- sopId
- identityId
- status
- currentNodeKey
- sourceType
- sourceSummary
- createdAt
- updatedAt

说明：
identityId 属于实例上下文。

---

### 3.4 WorkflowInstanceNode
实例节点。

建议字段：
- id
- workflowInstanceId
- templateNodeId
- nodeKey
- nodeName
- nodeType
- executorType
- executorId
- terminalId
- status
- reviewStatus
- startedAt
- finishedAt
- resultSummary
- createdAt
- updatedAt

---

### 3.5 Task
Task 作为业务操作对象存在，但应明确来源于 WorkflowInstance 或 WorkflowInstanceNode。

建议扩展字段：
- workflowTemplateId
- workflowInstanceId
- workflowNodeId
- currentNodeKey
- identityId
- identityName
- executionStatus

---

## 4. 对象边界

### WorkflowTemplate
定义“应该怎么做”。

### WorkflowInstance
定义“这次具体怎么做”。

### Task
定义“业务上如何查看和操作执行对象”。

不要混淆三者。

---

## 5. 与 SOP 的关系

SOP 是项目级自然语言定义。

当前阶段建议支持：

- SOP 解析建议占位
- 根据 Goal / Deliverable / SOP 推荐流程模板
- 人工确认后生成 WorkflowInstance

---

## 6. Identity 的位置

Identity 属于 WorkflowInstance，而不是 WorkflowTemplate。

原因：
- 模板可复用
- 实例按本次身份执行
- Task 与 Result 需追溯该 Identity

---

## 7. 状态模型建议

### WorkflowInstance
- draft
- pending
- running
- waiting_review
- success
- failed
- canceled

### WorkflowInstanceNode
- pending
- running
- waiting_review
- success
- failed
- skipped

### Task（展示层）
- 待执行
- 执行中
- 待审核
- 已完成
- 失败
- 已取消

---

## 8. 第一阶段目标

Workflow & Task Execution 1.0 必须实现：

1. 流程模板管理
2. 流程实例生成
3. 任务与流程关联
4. 任务执行详情页
5. 按身份执行上下文接入
6. 结果回写项目

---

## 9. 当前阶段不做

- 拖拽式设计器
- 复杂分支编排
- 真实自动执行
- 深度审批引擎
