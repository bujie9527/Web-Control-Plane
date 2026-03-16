# AI Work Control Center - Workflow & Task Execution 开发路线

## 1. 当前目标

当前轮次优先实现：

**Workflow & Task Execution 1.0**

目标是把“流程与任务”从占位升级为真实定义和最小执行闭环。

---

## 2. 当前阶段范围

### 必须完成
- WorkflowTemplate
- WorkflowTemplateNode
- WorkflowInstance
- WorkflowInstanceNode
- Task 与 Workflow 的关系接入
- 项目详情页发起基于流程的任务
- 任务详情执行页
- SOP 解析建议占位
- 按 Identity 执行上下文接入

### 非目标
- 复杂拖拽
- 自动执行引擎
- 多分支流程
- 第三方平台真实执行

---

## 3. 推荐开发顺序

### Phase A
建立 WorkflowTemplate / WorkflowInstance 领域对象与基础结构

### Phase B
流程中心升级：模板列表、模板详情、实例列表骨架

### Phase C
项目详情页“流程与任务”升级：选择流程模板、基于 SOP 推荐流程、创建流程实例 / 任务

### Phase D
任务执行详情页：节点时间线、当前节点、身份上下文、结果回写

---

## 4. 当前演示路径

项目详情页  
↓  
查看项目 Goal / Deliverable / SOP / Identity  
↓  
选择或推荐流程模板  
↓  
创建 WorkflowInstance  
↓  
生成 Task  
↓  
进入任务执行详情页  
↓  
查看节点状态与结果  
↓  
结果回写项目

---

## 5. 当前阶段成功标准

1. 流程模板成为正式资源对象
2. 任务不再是孤立对象，而与流程实例建立关系
3. 按 Identity 执行有明确上下文
4. 任务执行页具备运行感
5. 项目真正能从定义进入执行
