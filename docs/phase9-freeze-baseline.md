# 第九阶段冻结基线文档

## 文档目的
用于冻结第九阶段（Tenant Workflow Template 1.0）已确认的继承链、字段约束、复制机制、状态控制与边界规则，作为后续阶段执行基线。

---

## 1️⃣ WorkflowTemplate 继承链冻结

```
system template
   ↓ clone
tenant template
```

**冻结要求**：

- 不得直接编辑 system 模板。
- 租户仅能通过复制 system 模板生成 tenant 模板，或编辑自身 tenant 模板。

---

## 2️⃣ sourceTemplateId / sourceVersion 冻结

**冻结字段**：

- sourceTemplateId
- sourceVersion

**用途（未来）**：

- 模板升级
- 差异比较
- 自动迁移

**冻结要求**：

- 上述字段不能被 tenant 修改。
- 复制时由系统写入，后续仅由系统维护。

---

## 3️⃣ node clone 机制冻结

**复制模板时必须**：

1. 完整复制节点（WorkflowTemplateNode）
2. 重映射 dependsOnNodeIds（旧 node id → 新 node id）
3. 保持 orderIndex

**冻结要求**：

- 任何复制逻辑不得省略节点复制。
- 不得破坏 dependsOnNodeIds 的引用正确性。
- 不得打乱 orderIndex 顺序。

---

## 4️⃣ active 状态控制冻结

**状态规则**：

只有 `status = active` 的模板才能进入：

- getRecommendedTemplates

**冻结要求**：

- 项目创建、流程选择等场景，必须基于 status=active 过滤。
- 不得将 draft、archived、deprecated 等非 active 模板纳入可选范围。

---

## 5️⃣ Node Builder 不允许修改模板语义边界

**Node Builder 只能编辑**：

- 节点结构（key、name、description、executionType、intentType、dependsOnNodeIds、orderIndex）
- Agent（allowedAgentRoleTypes、recommendedAgentTemplateId）
- Skill（allowedSkillIds）
- executorStrategy
- reviewPolicy
- inputMapping / outputMapping

**Node Builder 不能修改**：

- supportedProjectTypeId
- supportedGoalTypeIds
- supportedDeliverableModes

**冻结要求**：

- 上述语义边界字段不得通过 Node Builder 写入或改写。
- 语义边界仅能在模板级表单（WorkflowTemplateFactoryForm）中维护。

---

## 执行建议（立刻生效）

- 本文作为第九阶段冻结基线，后续开发、评审、验收均需对照。
- 所有 PR/任务说明需显式标注：是否触及本冻结基线。
