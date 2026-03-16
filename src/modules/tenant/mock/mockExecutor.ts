/**
 * Mock Executor：模拟 WorkflowNode → AgentTemplate → Skill → Result 执行
 * 不接入真实终端，仅用于调度闭环演示
 */
import type { WorkflowTemplateNode } from '../schemas/workflowExecution'

export interface MockExecContext {
  projectId: string
  taskName: string
  identityName?: string
  /** 上一节点输出（用于链式传递） */
  previousOutput?: string
}

/** 各模板对应的 Mock 输出 */
const MOCK_OUTPUTS: Record<string, (ctx: MockExecContext) => string> = {
  'at-facebook-content-creator': (ctx) =>
    `[Mock] Facebook Content Creator 执行完成。生成内容：标题「${ctx.taskName}-春季推广」、正文 120 字、Hashtag 5 个。模型 gpt-4，Skill: content-write。`,
  'at-content-reviewer': (_ctx) =>
    `[Mock] Content Reviewer 执行完成。审核通过，置信度 0.95。反馈：品牌调性一致、无合规风险。Skill: content-review, compliance-check。`,
  'at-publisher': (_ctx) =>
    `[Mock] Publisher 执行完成。已发布到 Facebook（模拟）。postId: fb_mock_${Date.now()}，publishedAt: ${new Date().toISOString().slice(0, 19)}。未接入真实终端。`,
  'at-performance-recorder': (_ctx) =>
    `[Mock] Performance Recorder 执行完成。已记录到项目结果：曝光 +1、互动 +0、更新 1 条。Skill: metrics-write。`,
}

/**
 * 执行单个节点（Mock）
 * WorkflowNode → AgentTemplate → Skill → Mock Executor → Result
 */
export function executeNodeMock(
  templateNode: WorkflowTemplateNode,
  ctx: MockExecContext
): string {
  const snapshot = templateNode.templateSnapshot
  const agentTemplateId = templateNode.agentTemplateId || snapshot?.id
  if (!agentTemplateId) {
    return `[Mock] 节点「${templateNode.nodeName}」未绑定 Agent 模板，跳过。`
  }
  const fn = MOCK_OUTPUTS[agentTemplateId]
  if (fn) return fn(ctx)
  return `[Mock] 节点「${templateNode.nodeName}」使用模板 ${agentTemplateId}，执行完成（占位）。`
}
