# AI Work Control Center - API 合约规范

## 1. 文档目的

本文档用于定义 AI Work Control Center 第一阶段的统一 API 合约、mock service 结构、资源接口风格、事件命名规范和审计接口预留规则。

目标是确保：

- 各模块接口风格统一
- mock service 与未来真实 API 可平滑替换
- Cursor 在生成 service 层与资源接口时有统一标准
- 后续接入真实后端时无需推翻前端调用方式

---

## 2. 第一阶段接口原则

第一阶段以 mock data 和 mock service 为主。

此阶段重点是：

- 定义统一的数据返回结构
- 定义统一的资源操作方式
- 定义统一的 service / repository 分层
- 预留 event / audit 接口

第一阶段不要求：

- 接入真实数据库
- 接入真实远程 API
- 完整的鉴权后端
- 复杂的错误处理中台

---

## 3. 统一返回结构

所有接口返回必须统一使用如下结构：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "meta": {
    "requestId": "req_xxx",
    "timestamp": "2026-01-01T00:00:00Z"
  }
}
```

---

## 4. 字段说明

### code

表示业务状态码。

约定：

- 0 表示成功
- 非 0 表示失败

### message

表示结果说明。

要求：

- 简洁
- 稳定
- 便于前端展示与调试

### data

表示业务数据主体。

类型可为：

- object
- array
- null

### meta

表示元信息。

至少预留：

- requestId
- timestamp

后续可扩展：

- pagination
- traceId
- debugInfo

---

## 5. 错误返回示例

```json
{
  "code": 4001,
  "message": "permission denied",
  "data": null,
  "meta": {
    "requestId": "req_xxx",
    "timestamp": "2026-01-01T00:00:00Z"
  }
}
```

---

## 6. 资源型接口风格

所有资源统一采用资源型接口思路。

建议的标准动作如下：

- list
- detail
- create
- update
- delete
- patchStatus

这是第一阶段最推荐的资源操作模型。

---

## 7. 资源动作说明

### 7.1 list

获取资源列表。

输入一般包括：

- page
- pageSize
- keyword
- status
- type
- sortBy
- sortOrder

返回：

- 数据列表
- 分页信息

### 7.2 detail

获取资源详情。

输入：

- id

返回：

- 单个对象详情

### 7.3 create

创建资源。

输入：

- 创建所需字段对象

返回：

- 新建成功后的对象

### 7.4 update

更新资源。

输入：

- id
- 更新字段对象

返回：

- 更新后的对象

### 7.5 delete

删除资源。

输入：

- id

返回：

- 删除结果

注意：第一阶段更多作为逻辑占位，不一定真的物理删除。

### 7.6 patchStatus

修改资源状态。

输入：

- id
- status

返回：

- 更新后的状态对象或资源对象

适用对象：

- Tenant
- Project
- Agent
- Skill
- Terminal
- Workflow
- Task

---

## 8. 分页结构建议

列表接口中，建议在 meta.pagination 中返回分页信息：

```json
{
  "page": 1,
  "pageSize": 20,
  "total": 200
}
```

完整示例：

```json
{
  "code": 0,
  "message": "success",
  "data": [{}],
  "meta": {
    "requestId": "req_xxx",
    "timestamp": "2026-01-01T00:00:00Z",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 200
    }
  }
}
```

---

## 9. mock service 规范

第一阶段所有模块均应优先提供 mock service。

### 9.1 mock service 职责

- 模拟接口返回
- 提供页面演示数据
- 支持列表、详情、创建、更新、状态切换等操作
- 保持与未来真实 API 调用形态一致

### 9.2 mock service 禁止行为

- 把数据写死在页面组件中
- 不遵循统一返回结构
- 不区分 list / detail / create 等动作
- 直接耦合页面 UI 状态

### 9.3 推荐目录

每个模块建议包含：

- modules/{module-name}/mock/
- modules/{module-name}/services/
- modules/{module-name}/schemas/

---

## 10. service / repository 分层约定

### 10.1 service 层

负责：

- 业务逻辑
- 数据组装
- 页面使用的数据适配
- 连接 repository / provider

### 10.2 repository 层

负责：

- 数据读写
- mock 数据访问
- 后续 API / DB 适配

### 10.3 page 层

负责：

- 渲染
- 交互
- 调用 service

页面层不得直接写复杂数据访问逻辑。

---

## 11. 事件命名规范

第一阶段应预留事件命名规范，即使暂不实现事件总线。

建议命名格式：

- {resource}.{action}
- {resource}.{subResource}.{action}

示例：

- tenant.created
- tenant.updated
- tenant.status.changed
- user.created
- user.role.updated
- project.created
- project.member.assigned
- workflow.created
- workflow.version.updated
- task.created
- task.started
- task.failed
- task.review.approved
- agent.created
- agent.team.assigned
- skill.updated
- terminal.connected
- terminal.disconnected
- terminal.status.changed

---

## 12. 审计接口预留规范

第一阶段即使不实现完整审计系统，也必须预留审计记录结构。

建议记录字段：

- id
- scope
- actorId
- actorType
- targetType
- targetId
- action
- result
- detail
- createdAt

---

## 13. 审计场景建议

以下操作建议预留审计记录：

- 创建租户
- 更新租户状态
- 创建项目
- 修改项目配置
- 分配项目成员
- 修改角色权限
- 创建 Agent
- 更新 Skill
- 修改终端状态
- 创建 / 更新 Workflow
- 启动 / 终止 Task

---

## 14. 资源命名规范建议

资源命名应统一、稳定、可读。

推荐使用单数资源类型作为 schema / model 名称：

- Tenant
- User
- Project
- Agent
- Skill
- Terminal
- Workflow
- Task
- AuditLog

service / repository 命名可采用：

- TenantService / TenantRepository
- ProjectService / ProjectRepository

不要在命名上混用不同风格。

---

## 15. 第一阶段重点资源建议

第一阶段建议优先为以下资源建立统一 mock contract：

- Tenant
- User
- Project
- Agent
- Skill
- Terminal
- Workflow
- Task

这些对象将构成后台骨架的主体。
