# AI Work Control Center - 模块边界说明

## 1. 文档目的

本文档用于定义项目各模块之间的职责边界，避免出现以下问题：

- 业务逻辑混乱
- 页面层过度膨胀
- 模块之间相互耦合
- 平台后台和租户后台混杂
- 重复造轮子

---

## 2. 总体模块结构

建议项目模块划分为四类：

### 2.1 app
负责路由入口、页面入口、布局入口。

### 2.2 components
负责通用 UI 组件，不承载复杂业务含义。

### 2.3 modules
负责按业务模块组织页面、service、schema、mock 等内容。

### 2.4 core
负责全局基础能力：
- 配置
- 常量
- 导航
- 权限
- 请求响应规范
- schema公共基类
- event
- audit
- utils

---

## 3. 平台后台与租户后台边界

### 平台后台职责
平台后台只负责平台级内容：

- 租户
- 平台用户
- 配额
- 模板
- 平台审计
- 平台设置

平台后台不负责租户项目业务。

---

### 租户后台职责
租户后台只负责租户内部业务：

- 项目
- 任务
- 流程
- Agent
- Skills
- 终端
- 数据分析
- 成员与权限

租户后台不负责平台级租户治理。

---

## 4. 页面层边界

页面层（page / view）只负责：

- 页面布局
- 组件组合
- 数据展示
- 简单交互绑定
- 调用 service

页面层不负责：

- 写复杂业务逻辑
- 写数据拼装规则
- 写真实数据访问逻辑
- 写第三方接入逻辑

---

## 5. service 层边界

service 层负责：

- 业务逻辑处理
- 页面数据组装
- 资源状态处理
- 调用 repository / provider
- 适配 mock / real service

service 层不负责：

- 页面渲染
- 大量 UI 状态控制

---

## 6. repository 层边界

repository 层负责：

- 数据读取
- 数据写入
- mock data 读写
- 后续 API / DB 替换位

repository 层不负责：

- 页面逻辑
- 复杂业务规则

---

## 7. schema 层边界

schema 层负责：

- 资源类型定义
- 状态定义
- 字段结构
- 基础校验结构

schema 层是整个系统资源一致性的基础。

---

## 8. components 边界

通用 components 只负责 UI 复用：

- Layout
- Table
- Card
- Drawer
- Dialog
- EmptyState
- StatusTag
- Toolbar

不要把某个业务模块强耦合逻辑直接做进通用组件。

---

## 9. modules 组织原则

每个模块建议至少包含：

- pages
- services
- schemas
- mock

当模块复杂度上升后，可扩展出：

- components
- hooks
- mappers
- repository

---

## 10. 统一开发原则

### 原则 1：优先复用
新增页面前先检查是否已有可复用组件、布局、toolbar、表格容器。

### 原则 2：不乱改无关文件
每次任务只修改与当前目标相关的文件。

### 原则 3：不在页面里堆逻辑
复杂逻辑应沉到 service / repository。

### 原则 4：先计划后实现
复杂任务应先分析影响范围，再动代码。

### 原则 5：保持命名一致
页面、模块、schema、service 命名应统一。

---

## 11. 第一阶段模块优先级

### P0
- auth
- platform/tenants
- tenant/dashboard
- tenant/projects
- tenant/system
- shared layout / navigation / permissions

### P1
- tenant/tasks
- tenant/workflows
- tenant/agents
- tenant/skills
- tenant/terminals

### P2
- analytics
- template center
- event / audit 增强
- 真实 provider 接入

---

## 12. 最终目标

模块边界设计的最终目标是：

后续接入真实能力时，不需要推翻页面层和信息架构，只需要逐步替换 service / provider / repository 层。
