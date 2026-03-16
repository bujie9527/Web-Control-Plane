---
name: create-detail-workbench
description: 创建工作台型详情页（多 Tab 结构，非普通详情页）
---

# Skill: Create Detail Workbench

## 使用场景

用于创建复杂资源的详情页，要求有"工作台感"，而非普通信息展示页。
适用于：项目详情、租户详情、Agent 详情、身份（Identity）详情、终端详情等。

---

## 页面结构（必须完整实现）

### 1. 顶部返回条
- 返回按钮（←）+ 面包屑路径
- 位置固定在页面最顶部

### 2. 资源摘要条（Header Summary Bar）
- 资源名称（大字体）
- 核心状态标签（使用 StatusTag）
- 3~5 个关键字段的摘要（如：类型、创建时间、关联数量）
- 主操作按钮区（编辑、状态切换、删除等）

### 3. Tab 导航（页内二级导航）
- 水平 Tab 栏，固定在摘要条下方
- Tab 切换不刷新页面，使用本地 state 控制当前 Tab
- 每个 Tab 对应一个子业务模块

### 4. Tab 内容区
- 每个 Tab 用独立子组件实现（如 OverviewTab.tsx、SettingsTab.tsx）
- Tab 内使用 Card 组件分区展示
- 空状态用 EmptyState 组件

---

## 典型 Tab 结构示例

### 项目详情
概览 / 目标与KPI / 身份配置 / Agent团队 / 终端分配 / 流程任务 / 结果反馈 / 项目设置

### Agent 详情
基础信息 / LLM绑定 / Skills配置 / 执行记录

### 身份（Identity）详情
基础信息 / 表达规则 / 行为规则 / 平台适配 / 绑定项目 / 绑定终端

---

## 重要概念约束（必须遵守）

- **Identity（身份）** 属于项目层配置，不是 Agent 的属性
- **Agent** 是垂直能力单元（LLM + Skills），不承载人格
- **Terminal（终端）** 绑定到 Identity 下，代表该身份在某平台的操作入口
- 详情页只调用 service，不直接访问 repository 或 mock 数据

---

## 禁止行为

- 禁止把详情页做成长表单页
- 禁止在 Tab 组件内写复杂业务逻辑（沉到 service）
- 禁止把 Identity 作为 Agent 的子属性展示
- 禁止页面直连 mock 数据

---

## 完成后自检

```
□ 顶部有返回条 + 面包屑
□ 摘要条：名称、状态标签、关键字段、主操作按钮
□ Tab 导航：水平排列，state 控制切换，不刷页
□ 每个 Tab 是独立子组件文件
□ Tab 内用 Card 分区，空状态用 EmptyState
□ 未混用 Identity / Agent 概念
```
