---
name: generate-mock-service
description: 为资源模块生成标准 mock 数据与函数（CRUD + 分页 + 状态切换）
---

# Skill: Generate Mock Service

## 使用场景

为任何新资源生成 mock 数据文件，保证列表页、详情页、表单的数据驱动。
当前阶段所有数据必须先通过 mock，禁止直接接真实 API。

---

## Mock 文件标准结构

```typescript
// src/modules/{platform|tenant}/mock/{resourceName}Mock.ts

// 1. 种子数据（5~10 条，覆盖各状态）
const MOCK_{RESOURCE}_DATA: {ResourceType}[] = [
  { id: '{resource}-001', name: '...', status: 'active', createdAt: '...', updatedAt: '...' },
  { id: '{resource}-002', name: '...', status: 'disabled', ... },
  // ...
]

// 2. list —— 支持搜索、状态筛选、分页
export function list{Resource}(params: {
  keyword?: string
  status?: string
  page?: number
  pageSize?: number
}): PaginatedResult<{ResourceType}> { ... }

// 3. getById
export function get{Resource}ById(id: string): {ResourceType} | undefined { ... }

// 4. create
export function create{Resource}(input: Create{Resource}Input): {ResourceType} { ... }

// 5. update
export function update{Resource}(id: string, input: Partial<Create{Resource}Input>): {ResourceType} | undefined { ... }

// 6. delete
export function delete{Resource}(id: string): boolean { ... }

// 7. patchStatus
export function patch{Resource}Status(id: string, status: {ResourceStatus}): {ResourceType} | undefined { ... }
```

---

## 种子数据要求

- 至少 5 条，覆盖所有状态枚举值
- id 格式统一：`{resource-code}-001`、`{resource-code}-002`
- 时间字段使用 ISO 格式字符串
- 名称有业务意义（不要用 "测试1"、"item1"）

---

## 分页返回格式

```typescript
// 复用 src/core/types/api.ts 中的 PaginatedResult
{
  items: T[]
  total: number
  page: number
  pageSize: number
}
```

---

## API 返回格式（service 层包装后）

```typescript
{
  code: 0,
  message: 'success',
  data: { items, total, page, pageSize },
  meta: { requestId: '', timestamp: new Date().toISOString() }
}
```

---

## 禁止行为

- 禁止调用真实 API
- 禁止把 mock 数据写死在页面组件里
- 禁止缺少 delete 和 patchStatus 函数（列表页删除/状态切换依赖这两个）
- 禁止 list 函数不支持分页（会导致列表页分页失效）

---

## 完成后自检

```
□ 种子数据：5+ 条，覆盖所有状态，名称有业务意义
□ list：支持 keyword / status / page / pageSize 参数
□ getById / create / update / delete / patchStatus 均已实现
□ 分页格式符合 PaginatedResult<T>
□ 文件命名规范：{resourceName}Mock.ts
```
