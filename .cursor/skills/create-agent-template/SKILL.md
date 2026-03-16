---
name: create-agent-template
description: 在 Agent 工厂中新增一个垂直能力 Agent 模板（含 LLM 绑定 + Skills 配置）
---

# Skill: Create Agent Template

## 使用场景

当系统需要新增一种垂直能力 Agent 时使用（由系统管理员在 System Console 的 Agent 工厂中操作）。

---

## 核心概念再确认（开始前必读）

**Agent 是垂直能力单元，不是人格载体。**

- Agent 的能力来自：`LLM（理解与生成）+ Skills（领域操作最短路径）`
- Agent **不定义"我是谁"**——那是 Identity（身份）的职责，Identity 属于项目层
- Agent 定义"我能做什么"——按领域/平台划分

**错误示例：** 创建"日本经济学家 Agent"❌  
**正确示例：** 创建"财经评论内容创作 Agent"，执行时由项目的 Identity 决定立场✓

---

## Agent 模板必须包含的字段

### 基础信息
```typescript
{
  id: string                    // 如 'at-facebook-content-creator'
  name: string                  // 英文名，如 "Facebook Content Creator"
  nameZh: string                // 中文名，如 "Facebook 内容创作智能体"
  code: string                  // 大写下划线，如 'FACEBOOK_CONTENT_CREATOR'
  category: AgentCategory       // 'content' | 'operation' | 'analysis' | 'planning' | 'system'
  roleType: AgentTemplateRoleType // 如 'content_creator' | 'reviewer' | 'planner' | 'executor'
  description: string           // 能力描述（中文）
  executionPath: 'llm' | 'skill' | 'hybrid'
  status: 'active' | 'draft' | 'deprecated'
}
```

### LLM 配置建议
```typescript
{
  defaultSystemPrompt: string   // 该 Agent 的系统提示词（描述能力范围，不描述人格）
  preferredOutputMode: 'json_schema' | 'markdown_json' | 'none'
  recommendedModelConfigId?: string  // 推荐使用的 LLM 配置
}
```

### Skills 配置
```typescript
{
  skillIds: string[]  // 该 Agent 绑定的 Skills ID 列表
  // Skills 描述操作步骤，不描述内容视角
  // Skills 格式与 OpenClaw 兼容
}
```

---

## 系统提示词写作规范

Agent 的 `defaultSystemPrompt` 必须：
- 描述能力范围（"你是一个擅长…的内容创作助手"）
- **不得**写入身份/人格（"你是日本人"、"你的性格是…"）
- 预留 Identity 注入位：`{{identity_context}}` 占位符，执行时由系统注入

**示例：**
```
你是一个专业的 Facebook 平台内容创作助手，擅长生成适合 Facebook 算法推荐的帖子内容。
执行任务时，你将以以下身份视角进行创作：
{{identity_context}}
请根据任务指令和身份设定，生成符合 Facebook 平台规范的内容。
```

---

## Mock 数据位置

新增 AgentTemplate 后，必须在以下文件中添加 mock 数据：
`src/modules/platform/mock/agentTemplateMock.ts`

---

## 禁止行为

- 禁止在 Agent 模板中写入人格、身份、国籍、个性等属性（那是 Identity 的职责）
- 禁止创建"通用全能 Agent"（Agent 必须是垂直能力）
- 禁止 Skills 列表为空（至少绑定 1 个 Skill）
- 禁止系统提示词中硬编码身份视角

---

## 完成后自检

```
□ id / name / nameZh / code 命名清晰，体现垂直能力
□ category 和 roleType 选择正确
□ systemPrompt：描述能力范围，含 {{identity_context}} 占位符，无人格描述
□ skillIds：至少 1 个，技能与 Agent 能力匹配
□ mock 数据已添加到 agentTemplateMock.ts
□ Agent 工厂列表页可以看到新模板
```
