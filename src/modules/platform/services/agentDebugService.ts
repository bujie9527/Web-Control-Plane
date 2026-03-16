/**
 * Agent 调试服务：构建 Prompt、执行调试对话、保存覆盖到模板
 */
import type { AgentTemplate } from '../schemas/agentTemplate'
import type { AgentDebugConfigOverrides, AgentDebugExecuteResult } from '../schemas/agentDebug'
import { getTemplateById } from './agentTemplateService'
import { updateTemplate } from './agentTemplateService'

/** 合并模板与覆盖，得到最终 systemPrompt */
export function buildAgentDebugSystemPrompt(
  template: AgentTemplate,
  overrides: AgentDebugConfigOverrides
): string {
  const base =
    overrides.systemPromptTemplate ??
    template.systemPromptTemplate ??
    '你是 AI 助手，请根据用户输入完成任务。'
  const instruction =
    overrides.instructionTemplate ?? template.instructionTemplate ?? ''
  const fmt = overrides.outputFormat ?? template.outputFormat ?? ''
  const parts = [base]
  if (instruction.trim()) parts.push('\n\n' + instruction.trim())
  if (fmt.trim()) parts.push('\n\n输出格式要求：' + fmt.trim())
  return parts.join('')
}

/** 虚拟合并：返回应用了 overrides 的模板副本，不写回存储 */
export function mergeDebugOverrides(
  template: AgentTemplate,
  overrides: AgentDebugConfigOverrides
): AgentTemplate {
  const merged = { ...template }
  if (overrides.systemPromptTemplate !== undefined)
    merged.systemPromptTemplate = overrides.systemPromptTemplate
  if (overrides.instructionTemplate !== undefined)
    merged.instructionTemplate = overrides.instructionTemplate
  if (overrides.outputFormat !== undefined)
    merged.outputFormat = overrides.outputFormat
  if (overrides.temperature !== undefined)
    merged.temperature = overrides.temperature
  if (overrides.maxTokens !== undefined)
    merged.maxTokens = overrides.maxTokens
  return merged
}

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

/** 执行一次调试对话，调用 /api/llm/execute */
export async function executeAgentDebug(
  agentTemplateId: string,
  userMessage: string,
  overrides?: AgentDebugConfigOverrides
): Promise<AgentDebugExecuteResult> {
  const template = await getTemplateById(agentTemplateId)
  if (!template) {
    return {
      ok: false,
      errorCode: 'AGENT_NOT_FOUND',
      errorMessageZh: 'Agent 模板不存在',
    }
  }

  const systemPrompt = buildAgentDebugSystemPrompt(template, overrides ?? {})
  const temperature =
    overrides?.temperature ?? template.temperature ?? 0.7
  const maxTokens = overrides?.maxTokens ?? template.maxTokens ?? 1000

  try {
    const res = await fetch(`${API_BASE}/api/llm/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentTemplateId,
        systemPrompt,
        userPrompt: userMessage,
        temperature,
        maxTokens,
        outputMode: 'none',
      }),
    })

    const data = (await res.json()) as {
      success?: boolean
      rawText?: string
      parsedJson?: Record<string, unknown>
      modelKey?: string
      latencyMs?: number
      errorCode?: string
      errorMessageZh?: string
    }

    if (!res.ok) {
      return {
        ok: false,
        errorCode: data.errorCode ?? 'API_ERROR',
        errorMessageZh: data.errorMessageZh ?? '请求失败',
        latencyMs: data.latencyMs,
        modelKey: data.modelKey,
      }
    }

    return {
      ok: data.success ?? true,
      rawText: data.rawText,
      parsedJson: data.parsedJson,
      latencyMs: data.latencyMs,
      modelKey: data.modelKey,
      errorCode: data.errorCode,
      errorMessageZh: data.errorMessageZh,
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    const isNetwork = /fetch|network|failed/i.test(msg)
    return {
      ok: false,
      errorCode: 'NETWORK_OR_RUNTIME_ERROR',
      errorMessageZh: isNetwork
        ? '无法连接 LLM 服务，请确认已启动 API 服务（npm run dev:api）并配置 OPENAI_API_KEY'
        : `调用异常：${msg.slice(0, 80)}`,
    }
  }
}

/** 将当前调试覆盖保存到模板 */
export async function saveDebugOverridesToTemplate(
  agentTemplateId: string,
  overrides: AgentDebugConfigOverrides
): Promise<AgentTemplate | null> {
  const patch: Partial<AgentTemplate> = {}
  if (overrides.systemPromptTemplate !== undefined)
    patch.systemPromptTemplate = overrides.systemPromptTemplate
  if (overrides.instructionTemplate !== undefined)
    patch.instructionTemplate = overrides.instructionTemplate
  if (overrides.outputFormat !== undefined)
    patch.outputFormat = overrides.outputFormat
  if (overrides.temperature !== undefined)
    patch.temperature = overrides.temperature
  if (overrides.maxTokens !== undefined)
    patch.maxTokens = overrides.maxTokens
  return updateTemplate(agentTemplateId, patch)
}
