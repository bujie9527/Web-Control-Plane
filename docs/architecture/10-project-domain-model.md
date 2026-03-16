# AI Work Control Center - 项目领域模型

## 1. 文档目的

本文档用于定义 Project 在系统中的领域定位、核心子对象、对象边界和对象关系。

Project 在本系统中不是普通 CRUD 管理对象，而是承载业务目标、交付、资源、身份、终端、SOP、流程和结果的核心业务容器。

---

## 2. Project 的定位

Project 表示一个业务执行单元。

它需要回答以下问题：

1. 项目目标是什么
2. 项目交付什么
3. 项目拥有哪些资源
4. 项目使用哪些身份
5. 项目在哪些终端上执行
6. 项目 SOP 是什么
7. 项目后续如何生成流程与任务

---

## 3. 核心子对象

### 3.1 ProjectGoal
用于定义项目目标。

建议字段：
- id
- projectId
- goalType
- goalName
- goalDescription
- successCriteria
- kpiDefinition
- isLocked
- createdAt
- updatedAt

---

### 3.2 ProjectDeliverable
用于定义项目交付标的。

建议字段：
- id
- projectId
- deliverableType
- deliverableName
- description
- frequency
- targetValue
- unit
- createdAt
- updatedAt

---

### 3.3 ProjectResourceConfig
用于定义项目资源配置。

建议字段：
- id
- projectId
- resourceType
- resourceId
- resourceName
- resourceSummary
- status
- createdAt
- updatedAt

resourceType 可包括：
- identity
- terminal
- server
- api
- agentTeam

---

### 3.4 ProjectSOP
用于定义项目操作流程说明。

建议字段：
- id
- projectId
- sopRaw
- sopParsed
- status
- version
- createdAt
- updatedAt

说明：
- sopRaw：人工输入的自然语言 SOP
- sopParsed：AI 解析结果，当前阶段可先占位

---

## 4. Project 与现有对象关系

### 4.1 Project 与 Identity
一个 Project 可以绑定多个 Identity，并可设置默认 Identity。

### 4.2 Project 与 Terminal
一个 Project 可以绑定多个 Terminal。

### 4.3 Project 与 Task
Task 应属于 Project 的执行层对象。

### 4.4 Project 与 Workflow
Workflow 是 Project 的执行路径，不是 Project 本身。

---

## 5. 当前阶段重点

当前阶段重点是：

1. 在数据模型中引入 Goal / Deliverable / Resource / SOP
2. 在项目详情页中承载这些模块
3. 保持与 Identity 1.0 的兼容
4. 为下一阶段 Workflow / Task Execution 做准备

---

## 6. 页面建议

项目详情页建议新增或强化以下页签：

- 目标与交付
- 资源配置
- SOP 配置

也可以拆成：
- 目标与KPI
- 交付标的
- 资源配置
- SOP

应根据当前项目详情工作台结构做最合理接入。

---

## 7. 当前阶段成功标准

Project Domain Model 1.0 完成后，应满足：

1. 项目目标被显式建模
2. 项目交付被显式建模
3. 项目资源被显式建模
4. 项目 SOP 被显式建模
5. 项目详情页能清晰展示和管理这些结构
6. 后续进入 Workflow / Task Execution 时无需返工项目对象
