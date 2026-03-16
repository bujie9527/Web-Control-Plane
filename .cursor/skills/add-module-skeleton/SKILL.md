---
name: add-module-skeleton
description: 为系统新增完整业务模块骨架（含页面、数据层、路由、菜单）
---

# Skill: Add Module Skeleton

## 使用场景

当系统需要新增一个完整业务模块时使用，确保目录结构规范、路由注册、菜单配置一次完成。
适用于：新增 Agent 中心、Skills 中心、终端中心、新项目类型等。

---

## 必须生成的完整结构

```
src/modules/{platform|tenant}/
  pages/
    {ModuleName}/
      {ModuleName}List.tsx         # 列表页（参照 create-admin-list-page skill）
      {ModuleName}Detail/
        {ModuleName}Workbench.tsx  # 详情工作台（参照 create-detail-workbench skill）
        tabs/
          OverviewTab.tsx          # 概览 Tab（必须）
          SettingsTab.tsx          # 设置 Tab（必须）
  schemas/
    {moduleName}.ts                # 资源类型定义
  mock/
    {moduleName}Mock.ts            # mock 数据与函数
  repositories/
    {moduleName}Repository.ts      # 数据访问层
  services/
    {moduleName}Service.ts         # 业务逻辑层
```

---

## 还必须完成

### 路由注册
在 `src/app/routes.tsx` 中注册：
- 列表页路由：`/{platform|tenant|system}/{module-name}`
- 详情页路由：`/{platform|tenant|system}/{module-name}/:id`
- 新建页路由（如需要）：`/{platform|tenant|system}/{module-name}/new`

### 路由常量
在 `src/core/constants/routes.ts` 中新增对应常量。

### 菜单配置
在对应的菜单文件（`platformMenu.ts` / `tenantMenu.ts` / `systemMenu.ts`）中新增菜单项。

---

## 核心概念约束

新增模块时必须确认模块归属：

| 模块类型 | 归属 Shell | 菜单文件 |
|---|---|---|
| 平台运营功能（租户管理、配额等） | PlatformShell `/platform` | `platformMenu.ts` |
| 系统能力配置（Agent工厂、LLM配置） | SystemShell `/system` | `systemMenu.ts` |
| 租户业务功能（项目、身份、终端等） | TenantShell `/tenant` | `tenantMenu.ts` |

**严禁跨 Shell 混放模块。**

---

## 禁止行为

- 禁止在页面层写业务逻辑
- 禁止在模块外随意创建文件
- 禁止路由注册后不更新路由常量
- 禁止新增菜单项后不测试菜单层级

---

## 完成后自检

```
□ 目录结构：pages / schemas / mock / repositories / services 齐全
□ 列表页：符合 create-admin-list-page skill 标准
□ 详情页：符合 create-detail-workbench skill 标准
□ 路由：已在 routes.tsx 注册，常量已在 routes.ts 更新
□ 菜单：已在正确的菜单文件中添加菜单项
□ 归属 Shell 正确，未跨 Shell 混放
```
