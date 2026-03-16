---
name: refactor-standard-layout
description: 将不符合规范的页面重构为标准后台布局和分层结构
---

# Skill: Refactor Standard Layout

## 使用场景

当发现以下问题时使用：
- 页面风格与系统不一致
- 页面组件内有复杂业务逻辑
- 未使用通用组件（自建了重复的 Table / Modal 等）
- 列表页缺少标准能力（删除确认、批量选、空状态等）

---

## 重构检查清单

### UI 层面
- [ ] 是否使用了系统通用组件：Table、Card、Drawer、Dialog、EmptyState、StatusTag、ListPageToolbar、Pagination
- [ ] 页面布局是否符合：顶部工具栏 → 主内容区 → 底部分页
- [ ] 状态标签是否使用 StatusTag，中文枚举是否来自 labels 文件
- [ ] 是否有自建的重复样式（应删除，改用通用组件）

### 功能层面（列表页）
- [ ] 是否有搜索 + 状态筛选
- [ ] 行操作是否包含：查看、编辑、删除（含确认弹窗）
- [ ] 是否有 Checkbox 多选 + 批量删除
- [ ] 空状态是否区分"无数据"和"搜索无结果"两种场景

### 分层层面
- [ ] 页面是否直接写了 mock 数据（应移至 mock 文件）
- [ ] 页面是否直接写了业务逻辑（应下沉至 service）
- [ ] 是否缺少 repository 层（service 直接调用 mock 函数）

---

## 重构步骤

1. **先读代码，列出所有问题**，不要直接开始改
2. 输出改动计划（涉及哪些文件，新增什么，删除什么）
3. 确认后再执行
4. 每改一个层，验证上层调用不受影响

---

## 禁止行为

- 禁止在重构中顺手修改无关模块
- 禁止把功能组件拆得过碎（一个 Tab = 一个文件即可）
- 禁止删除已有路由或菜单配置

---

## 完成后自检

```
□ 通用组件：Table / Card / Dialog / EmptyState / StatusTag 均已复用
□ 分层正确：page → service → repository → schema
□ 列表页能力完整：搜索、筛选、行操作、批量删除、空状态、分页
□ 未改动无关文件
```
