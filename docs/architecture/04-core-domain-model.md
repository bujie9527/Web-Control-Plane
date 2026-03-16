# AI Work Control Center - 核心领域模型

## 1. 文档目的

本文档用于定义第一阶段需要统一理解的核心业务对象及其关系。

重点是建立“领域模型语言”，便于产品设计、架构设计和后续数据建模保持一致。

---

## 2. 顶层领域对象

第一阶段核心对象包括：

- Tenant
- User
- Role
- Permission
- Project
- ProjectMember
- Agent
- AgentTeam
- Skill
- Terminal
- Workflow
- Task
- AuditLog

---

## 3. 对象说明

### 3.1 Tenant
表示租户，是平台内的企业工作空间。

核心属性：
- id
- name
- code
- status
- plan
- quota
- createdAt
- updatedAt

说明：
一个 Tenant 拥有自己的成员、项目、流程、Agent、Skills、终端和任务。

---

### 3.2 User
表示系统用户。

核心属性：
- id
- name
- email / account
- status
- tenantId（平台用户可为空）
- roles
- createdAt
- updatedAt

说明：
用户既可能属于平台侧，也可能属于某个租户侧。

---

### 3.3 Role
表示角色。

示例：
- platform_owner
- platform_admin
- platform_operator
- tenant_owner
- tenant_admin
- project_manager
- operator
- reviewer
- viewer

说明：
Role 用于定义职责范围，具体权限由 Permission 和 scope 控制。

---

### 3.4 Permission
表示权限定义。

建议维度：
- scope
- module
- action

示例：
- tenant.project.read
- tenant.project.update
- tenant.task.review
- platform.tenant.manage

---

### 3.5 Project
表示租户内的业务项目。

核心属性：
- id
- tenantId
- name
- description
- status
- ownerId
- goalSummary
- kpiSummary
- createdAt
- updatedAt

说明：
Project 是租户后台最核心的业务对象。

一个项目可以关联：
- Agent Team
- Channels（后续可扩展）
- Terminals
- Workflows
- Tasks
- Results

---

### 3.6 ProjectMember
表示项目成员关系。

核心属性：
- id
- projectId
- userId
- roleInProject
- joinedAt

说明：
后续可支持项目级权限和职责划分。

---

### 3.7 Agent
表示单个 Agent 资源。

核心属性：
- id
- tenantId
- name
- roleName
- description
- model
- promptVersion
- status
- createdAt
- updatedAt

说明：
Agent 是系统中的 AI 执行单元，但在第一阶段主要以配置资源形态存在。

---

### 3.8 AgentTeam
表示项目或场景使用的 Agent 团队。

核心属性：
- id
- tenantId
- name
- description
- status
- createdAt
- updatedAt

说明：
一个 AgentTeam 包含多个 Agent，并可绑定到项目。

---

### 3.9 Skill
表示可复用能力模块。

核心属性：
- id
- tenantId
- name
- type
- description
- version
- status
- createdAt
- updatedAt

说明：
Skill 是未来复用能力的重要资产。第一阶段先以结构管理和展示为主。

---

### 3.10 Terminal
表示执行终端。

示例：
- Facebook 账号
- X 账号
- TikTok 账号
- 浏览器自动化
- Windows 终端
- API 接入终端

核心属性：
- id
- tenantId
- name
- type
- status
- capabilities
- riskStatus
- createdAt
- updatedAt

说明：
第一阶段先作为资源管理对象，不做真实接入。

---

### 3.11 Workflow
表示流程模板。

核心属性：
- id
- tenantId
- name
- type
- description
- version
- status
- createdAt
- updatedAt

说明：
Workflow 用于定义任务如何完成。第一阶段先做结构管理和页面骨架。

---

### 3.12 Task
表示任务实例。

核心属性：
- id
- tenantId
- projectId
- workflowId
- assignedAgentTeamId
- status
- priority
- createdAt
- updatedAt

说明：
Task 是未来任务执行中心的核心对象。第一阶段先做 mock 驱动的展示和状态管理结构。

---

### 3.13 AuditLog
表示审计日志。

核心属性：
- id
- scope
- actorId
- actorType
- targetType
- targetId
- action
- result
- createdAt

说明：
所有关键资源操作应预留审计记录能力。

---

## 4. 对象关系（逻辑层面）

### 4.1 平台级关系
- 一个平台管理多个 Tenant
- 一个 Tenant 拥有多个 User
- 一个 Tenant 拥有多个 Project

---

### 4.2 租户级关系
- 一个 Project 可以有多个 ProjectMember
- 一个 Project 可以绑定一个或多个 AgentTeam
- 一个 Project 可以绑定多个 Terminal
- 一个 Project 可以启用多个 Workflow
- 一个 Project 可以产生多个 Task

---

### 4.3 能力层关系
- 一个 AgentTeam 包含多个 Agent
- 一个 Agent 可关联多个 Skill
- 一个 Workflow 可调用多个 Skill
- 一个 Task 可基于某个 Workflow 执行

---

## 5. 第一阶段实现建议

第一阶段不需要把所有对象都做到“完整逻辑可用”，但至少要做到：

- 类型定义清晰
- mock 数据结构统一
- 列表页 / 详情页可以展示对象关系
- 后续能平滑升级到真实数据层

---

## 6. 建议的第一批重点对象

第一阶段优先重点实现以下对象的展示和骨架：

- Tenant
- User
- Project
- Agent
- Skill
- Terminal
- Workflow
- Task

这些对象会构成第一轮中控后台演示的主体。

---

## 7. 文档用途

本文件适合作为以下内容的参考来源：

- schema 设计
- mock data 设计
- 列表页字段设计
- 详情页结构设计
- 后续数据库 ER 模型设计
