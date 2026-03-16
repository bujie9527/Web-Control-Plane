---
name: create-schema-service-repository
description: 为新资源创建完整数据层（schema + mock + repository + service）
---

# Skill: Create Schema Service Repository

## 使用场景

为系统新增任何资源对象时使用，确保四层结构完整，命名一致。
适用于：Project、Agent、Identity、Skill、Terminal、WorkflowTemplate 等任何资源。

---

## 必须生成的四个文件

### 1. schema（类型定义）
文件位置：`src/modules/{platform|tenant}/schemas/{resourceName}.ts`

必须包含：
- 主对象接口（如 `AgentTemplate`）
- 状态枚举（如 `AgentTemplateStatus`）
- 列表项类型（如 `AgentTemplateListItem`）
- 创建/更新 DTO 类型（如 `CreateAgentTemplateInput`）
- 分页返回类型（复用 `src/core/types/api.ts` 中的 `PaginatedResult<T>`）

### 2. mock 数据
文件位置：`src/modules/{platform|tenant}/mock/{resourceName}Mock.ts`

必须包含：
- 静态种子数据数组（5~10 条，覆盖各种状态）
- `list(params)` 函数：支持关键词搜索、状态筛选、分页
- `getById(id)` 函数
- `create(input)` 函数（生成 id、createdAt、updatedAt）
- `update(id, input)` 函数
- `delete(id)` 函数（从数组移除）
- `patchStatus(id, status)` 函数

### 3. repository（数据访问层）
文件位置：`src/modules/{platform|tenant}/repositories/{resourceName}Repository.ts`

必须包含：
- 直接调用 mock 函数，不含业务逻辑
- 后续替换真实 API 时只改这一层
- 每个方法返回与 mock 一致的类型

### 4. service（业务逻辑层）
文件位置：`src/modules/{platform|tenant}/services/{resourceName}Service.ts`

必须包含：
- `list(params)` → 调用 repository.list，组装分页数据
- `getById(id)` → 调用 repository.getById
- `create(input)` → 校验 → 调用 repository.create → 触发 audit（预留）
- `update(id, input)` → 校验 → 调用 repository.update
- `delete(id)` → 检查引用关系 → 调用 repository.delete
- `patchStatus(id, status)` → 调用 repository.patchStatus

---

## 命名规范

| 层 | 文件名 | 导出名 |
|---|---|---|
| schema | `agentTemplate.ts` | `AgentTemplate`, `AgentTemplateStatus` |
| mock | `agentTemplateMock.ts` | `agentTemplateMock` |
| repository | `agentTemplateRepository.ts` | `agentTemplateRepository` |
| service | `agentTemplateService.ts` | `agentTemplateService` |

---

## 禁止行为

- 禁止页面层直接调用 repository 或 mock
- 禁止 service 层包含 UI 状态逻辑
- 禁止在 schema 中混入运行态字段（模板定义与运行实例严格分离）
- 禁止 mock 数据写死在页面组件里

---

## 完成后自检

```
□ schema：主对象、状态枚举、DTO 类型齐全
□ mock：含 list/getById/create/update/delete/patchStatus
□ mock list 支持搜索、状态筛选、分页
□ repository：仅透传 mock 调用，无业务逻辑
□ service：含完整 CRUD，校验在 service 层
□ 四个文件命名一致，无拼写错误
```
