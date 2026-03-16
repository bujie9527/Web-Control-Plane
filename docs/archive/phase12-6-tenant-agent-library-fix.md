# Phase 12.6 租户端 Agent 库数据源与只读视图收口

## 一、租户端原先占位数据来源

- **文件**：`src/modules/tenant/mock/skeletonMock.ts`
- **导出**：`agentSkeleton.agents`
- **结构**：仅 2 条占位数据
  ```ts
  agents: [
    { id: 'a1', name: '内容撰写 Agent', role: '撰写', model: 'GPT-4', status: '启用' },
    { id: 'a2', name: '审核 Agent', role: '审核', model: 'GPT-4', status: '启用' },
  ]
  ```
- **使用处**：`src/modules/tenant/pages/AgentCenter.tsx` 中导入 `agentSkeleton`，将 `agents` 作为 Agent 库列表的 `dataSource`

---

## 二、本次改成的真实数据源

- **数据源**：`@/modules/platform/services/agentTemplateService.getTemplateList`
- **底层**：`agentTemplateRepository` → `agentTemplateMock`（平台级 AgentTemplate mock）
- **入参**：`{ status: 'active' }`，仅展示已发布模板
- **类型**：`AgentTemplate`（平台 schema）
- **数量**：9 个真实预置 Agent（流程规划、内容生成/审核、发布、结果记录、研究/搜索、执行监督等）

---

## 三、租户端与平台端 Agent 页面权限差异

| 能力 | 平台端（Agent 模板工厂） | 租户端（Agent 库） |
|------|--------------------------|---------------------|
| 查看列表 | 是，支持 status 筛选 | 是，仅 status=active |
| 查看详情 | 是 | 是 |
| 新建模板 | 是 | 否 |
| 编辑模板 | 是 | 否 |
| 复制模板 | 是 | 否 |
| 状态切换 | 是 | 否 |
| 引用关系链接 | 可跳转系统流程/规划页面 | 仅展示文案，不跳转 |

---

## 四、兼容占位数据与后续清理

### 仍保留的占位数据

| 来源 | 用途 | 是否可删 |
|------|------|----------|
| `skeletonMock.agentSkeleton.agents` | 原 Agent 库列表 | **可删**，已不再使用 |
| `skeletonMock.agentSkeleton.teams` | Agent 团队 | 暂保留，Agent 库已切换数据源，团队仍为占位 |
| `skeletonMock.agentSkeleton.roleTemplates` | 角色模板 | 暂保留，同上 |

### 建议后续清理

1. **agents 字段**：可从 `agentSkeleton` 中删除 `agents` 数组，AgentCenter 已完全改用 `getTemplateList`
2. **teams / roleTemplates**：仍被 AgentCenter 使用，待 Agent 团队、角色模板有真实模型后再切换并删除占位

---

## 五、修改文件列表

| 文件 | 变更 |
|------|------|
| `src/modules/tenant/pages/AgentCenter.tsx` | 改为使用 getTemplateList，展示 AgentTemplate，支持搜索、分页、跳转详情 |
| `src/modules/tenant/pages/AgentCenter/AgentLibraryDetail.tsx` | 新增租户只读详情页 |
| `src/core/constants/routes.ts` | 新增 `TENANT.AGENT_LIBRARY_DETAIL(id)` |
| `src/app/routes.tsx` | 新增 `agents/:id` 路由 |
