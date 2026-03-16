# AI Work Control Center - 项目模型开发路线

## 1. 当前目标

当前轮次优先实现：

**Project Domain Model 1.0**

目标是补齐 Project 的核心业务含义，而不是立即做复杂流程执行。

---

## 2. 当前阶段范围

### 必须完成
- ProjectGoal
- ProjectDeliverable
- ProjectResourceConfig
- ProjectSOP
- 项目详情页接入这些模块
- mock / schema / service / repository 基础结构

### 非目标
- 复杂流程引擎
- SOP 自动拆解执行
- 多分支工作流
- 自动执行 Agent

---

## 3. 推荐开发顺序

### Phase A
建立 Project Domain Model 基础对象：
- schema
- mock
- service
- repository

### Phase B
升级项目详情页：
- 目标与交付
- 资源配置
- SOP 配置

### Phase C（下一轮）
Workflow / Task Execution 1.0

---

## 4. 当前阶段演示路径

项目详情页  
↓  
查看项目目标  
↓  
查看交付标的  
↓  
查看资源配置  
↓  
查看身份配置  
↓  
查看 SOP  
↓  
为后续发起任务和流程生成做准备

---

## 5. 下一轮衔接方向

Project Domain Model 1.0 完成后，下一轮进入：

- Workflow Template
- Workflow Instance
- Task Execution
- 按 Identity 执行
- 结果回写
