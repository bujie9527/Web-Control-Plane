# Phase 15 冻结基线

本文档锁定 Phase 15 建立的 Real LLM Executor 1.0 基线，后续阶段不得在未规划前提下弱化或突破以下 8 条约束。

---

## 1. 冻结真实 LLM 的首个接入对象

当前真实模型只接：

- **Base Workflow Planner Agent**

后续阶段不得在未规划前提下随意把真实模型扩散到其他 Agent。

---

## 2. 冻结 LLM Executor 为统一入口

所有真实模型调用必须继续走：

- **llmExecutor.ts**

禁止后续在页面层、service 层、skill 层直接散落 provider 调用。

---

## 3. 冻结 Planner Adapter 责任

`workflowPlannerLLMAdapter.ts` 继续负责：

- prompt 组装
- schema 指定
- 模型调用适配
- Draft 数据组装

不要让 plannerService 再次膨胀。

---

## 4. 冻结 Output Parser 保护逻辑

`planningLLMOutputParser.ts` 的职责必须稳定：

- 提取 JSON
- 解析
- schema 校验
- 中文错误输出

---

## 5. 冻结「失败不覆盖当前 Draft」

这是非常重要的一条，不允许后续被弱化。

---

## 6. 冻结「Validator 不可跳过」

真实模型输出仍然必须经过：

- schema
- validator

不允许为了「成功率」直接绕过。

---

## 7. 冻结单 Provider / 单主模型基线

当前先不扩成复杂模型调度平台。
后续扩展必须作为单独阶段处理。

---

## 8. 冻结前台中文模型状态提示

工作台中的：

- 调用中
- 解析中
- 校验中
- 成功
- 失败

这些中文提示已经形成统一体验，后续继续沿用。
