import { executeLLMServer } from '../llm/llmExecutorServer'
import * as dataSourceDb from './dataSourceDb'
import * as identityTerminalDb from './identityTerminalDb'
import * as skillDb from './skillDb'
import { assembleSkillPrompt } from './skillPromptAssembler'
import { validateSkillOutputBySchema } from './skillOutputValidator'

interface SkillDefinition {
  id: string
  code: string
  name?: string
  nameZh?: string
  executionType: string
  promptTemplate?: string
  inputSchemaJson?: string
  outputSchemaJson?: string
  executionConfigJson?: string
  openClawSpec?: { steps?: string[] }
}

interface RuntimeContext {
  instanceId: string
  nodeId: string
  nodeName: string
  agentTemplateId?: string
  executionType?: string
  runtimeInput?: Record<string, unknown>
  runtimeContext?: Record<string, unknown>
}

interface SkillExecutionItem {
  skillId: string
  skillCode: string
  success: boolean
  executionType: string
  output?: unknown
  errorMessageZh?: string
}

function parseJsonObject(s?: string): Record<string, unknown> | undefined {
  if (!s?.trim()) return undefined
  try {
    const parsed = JSON.parse(s) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : undefined
  } catch {
    return undefined
  }
}

function readPathValue(source: Record<string, unknown>, pathExpr: string): unknown {
  const path = pathExpr.split('.').filter(Boolean)
  let current: unknown = source
  for (const segment of path) {
    if (current && typeof current === 'object' && segment in (current as Record<string, unknown>)) {
      current = (current as Record<string, unknown>)[segment]
      continue
    }
    return undefined
  }
  return current
}

function resolveTemplateValue(
  value: unknown,
  input: Record<string, unknown>,
  context: Record<string, unknown>,
  stages: Record<string, unknown>
): unknown {
  if (typeof value === 'string') {
    const matched = value.match(/^\{\{\s*([^}]+)\s*\}\}$/)
    if (!matched) return value
    const expr = matched[1].trim()
    if (expr.startsWith('input.')) return readPathValue(input, expr.slice('input.'.length))
    if (expr.startsWith('context.')) return readPathValue(context, expr.slice('context.'.length))
    if (expr.startsWith('stages.')) return readPathValue(stages, expr.slice('stages.'.length))
    return value
  }
  if (Array.isArray(value)) {
    return value.map((v) => resolveTemplateValue(v, input, context, stages))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = resolveTemplateValue(v, input, context, stages)
    }
    return out
  }
  return value
}

async function executeTelegramAction(payload: {
  terminalId: string
  actionType: 'text' | 'photo' | 'poll'
  chatId?: string
  text?: string
  photoUrl?: string
  caption?: string
  question?: string
  options?: string[]
}) {
  const terminal = await identityTerminalDb.dbGetTerminalById(payload.terminalId)
  if (!terminal) throw new Error('Telegram 终端不存在')
  if (terminal.type !== 'telegram_bot') throw new Error('目标终端不是 Telegram Bot 类型')

  const credentials = terminal.credentialsJson
    ? (JSON.parse(terminal.credentialsJson) as Record<string, unknown>)
    : {}
  const config = terminal.configJson ? (JSON.parse(terminal.configJson) as Record<string, unknown>) : {}
  const botToken = String(credentials.botToken ?? credentials.token ?? '').trim()
  const chatId = String(payload.chatId ?? config.defaultChatId ?? credentials.defaultChatId ?? '').trim()

  if (!botToken) throw new Error('Telegram Bot Token 未配置')
  if (!chatId) throw new Error('Telegram chatId 未配置')

  let apiPath = 'sendMessage'
  let body: Record<string, unknown> = { chat_id: chatId }
  if (payload.actionType === 'text') {
    if (!payload.text?.trim()) throw new Error('发送文本不能为空')
    body = { ...body, text: payload.text.trim() }
  } else if (payload.actionType === 'photo') {
    if (!payload.photoUrl?.trim()) throw new Error('图片链接不能为空')
    apiPath = 'sendPhoto'
    body = { ...body, photo: payload.photoUrl.trim(), caption: payload.caption?.trim() || undefined }
  } else {
    const options = (payload.options ?? []).map((o) => o.trim()).filter(Boolean)
    if (!payload.question?.trim() || options.length < 2) throw new Error('投票参数不完整')
    apiPath = 'sendPoll'
    body = { ...body, question: payload.question.trim(), options, is_anonymous: false }
  }

  const response = await fetch(`https://api.telegram.org/bot${encodeURIComponent(botToken)}/${apiPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = (await response.json()) as { ok?: boolean; description?: string; result?: unknown }
  if (!response.ok || !json.ok) {
    throw new Error(json.description || `Telegram API 调用失败（HTTP ${response.status}）`)
  }
  return { actionType: payload.actionType, result: json.result }
}

async function executeExternalApiSkill(input: {
  skill: SkillDefinition
  executionConfig: Record<string, unknown>
  runtimeInput: Record<string, unknown>
  runtimeContext: Record<string, unknown>
  stageOutputs: Record<string, unknown>
}) {
  const provider = String(input.executionConfig.provider ?? '').trim()
  if (provider === 'telegram') {
    const mapped = resolveTemplateValue(
      input.executionConfig.paramMapping ?? {},
      input.runtimeInput,
      input.runtimeContext,
      input.stageOutputs
    ) as Record<string, unknown>
    const terminalId = String(mapped.terminalId ?? input.runtimeContext.terminalId ?? '').trim()
    if (!terminalId) throw new Error('缺少 terminalId，无法执行 Telegram Skill')
    const actionType = String(mapped.actionType ?? 'text') as 'text' | 'photo' | 'poll'
    return executeTelegramAction({
      terminalId,
      actionType,
      chatId: mapped.chatId ? String(mapped.chatId) : undefined,
      text: mapped.text ? String(mapped.text) : undefined,
      photoUrl: mapped.photoUrl ? String(mapped.photoUrl) : undefined,
      caption: mapped.caption ? String(mapped.caption) : undefined,
      question: mapped.question ? String(mapped.question) : undefined,
      options: Array.isArray(mapped.options) ? mapped.options.map(String) : undefined,
    })
  }

  const mapped = resolveTemplateValue(
    input.executionConfig.paramMapping ?? {},
    input.runtimeInput,
    input.runtimeContext,
    input.stageOutputs
  ) as Record<string, unknown>
  const providers = await dataSourceDb.dbListDataSourceProviders()
  const providerIdFromConfig = String(input.executionConfig.providerId ?? '').trim()
  const resolvedProvider = providerIdFromConfig
    ? providers.find((p) => p.id === providerIdFromConfig)
    : providers.find((p) => p.providerType === provider && p.status === 'active')
  if (!resolvedProvider) throw new Error(`未找到可用的数据源 Provider：${provider || providerIdFromConfig}`)

  return dataSourceDb.dbExecuteDataSource({
    providerId: resolvedProvider.id,
    query: String(mapped.query ?? input.runtimeInput.query ?? '').trim(),
    limit: Number(mapped.limit ?? input.runtimeInput.limit ?? 5),
  })
}

async function executeLlmSkill(input: {
  skill: SkillDefinition
  runtime: RuntimeContext
  runtimeInput: Record<string, unknown>
  runtimeContext: Record<string, unknown>
}) {
  const prompt = await assembleSkillPrompt({
    agentTemplateId: input.runtime.agentTemplateId,
    skill: input.skill,
    nodeName: input.runtime.nodeName,
    instanceId: input.runtime.instanceId,
    runtimeInput: input.runtimeInput,
    runtimeContext: input.runtimeContext,
  })
  const result = await executeLLMServer({
    agentTemplateId: input.runtime.agentTemplateId,
    modelConfigId: prompt.modelConfigId,
    userPrompt: prompt.userPrompt,
    systemPrompt: prompt.systemPrompt,
    temperature: prompt.temperature,
    maxTokens: prompt.maxTokens,
    outputMode: 'json_object',
  })
  if (!result.success) {
    throw new Error(result.errorMessageZh || result.errorMessage || 'LLM 执行失败')
  }
  return {
    content: result.parsedJson ?? { rawText: result.rawText },
    promptMeta: {
      channelType: prompt.channelType,
      channelStyleApplied: prompt.channelStyleApplied,
      modelKey: result.modelKey,
    },
  }
}

async function executeInternalApiSkill(input: {
  executionConfig: Record<string, unknown>
  runtimeInput: Record<string, unknown>
  runtimeContext: Record<string, unknown>
  stageOutputs: Record<string, unknown>
}) {
  const endpoint = String(input.executionConfig.endpoint ?? '').trim()
  const mapped = resolveTemplateValue(
    input.executionConfig.paramMapping ?? {},
    input.runtimeInput,
    input.runtimeContext,
    input.stageOutputs
  ) as Record<string, unknown>

  if (endpoint.includes('/api/terminals') && endpoint.includes('telegram/send')) {
    const terminalId = String(mapped.terminalId ?? input.runtimeContext.terminalId ?? '').trim()
    if (!terminalId) throw new Error('internal_api 缺少 terminalId')
    return executeTelegramAction({
      terminalId,
      actionType: String(mapped.actionType ?? 'text') as 'text' | 'photo' | 'poll',
      chatId: mapped.chatId ? String(mapped.chatId) : undefined,
      text: mapped.text ? String(mapped.text) : undefined,
      photoUrl: mapped.photoUrl ? String(mapped.photoUrl) : undefined,
      caption: mapped.caption ? String(mapped.caption) : undefined,
      question: mapped.question ? String(mapped.question) : undefined,
      options: Array.isArray(mapped.options) ? mapped.options.map(String) : undefined,
    })
  }

  return {
    endpoint,
    method: String(input.executionConfig.method ?? 'POST'),
    payload: mapped,
    messageZh: 'internal_api 占位执行成功',
  }
}

async function executeHybridSkill(input: {
  skill: SkillDefinition
  executionConfig: Record<string, unknown>
  runtime: RuntimeContext
  runtimeInput: Record<string, unknown>
  runtimeContext: Record<string, unknown>
}) {
  const stages = Array.isArray(input.executionConfig.stages)
    ? (input.executionConfig.stages as Array<Record<string, unknown>>)
    : []
  if (stages.length === 0) {
    throw new Error('Hybrid Skill 缺少 stages 配置')
  }
  const outputs: Record<string, unknown> = {}
  for (const stage of stages) {
    const stageName = String(stage.name ?? `stage_${Object.keys(outputs).length + 1}`)
    const stageType = String(stage.executionType ?? 'llm')
    if (stageType === 'llm') {
      const stageSkill: SkillDefinition = {
        ...input.skill,
        executionType: 'llm',
        promptTemplate: String(stage.promptTemplate ?? input.skill.promptTemplate ?? ''),
      }
      outputs[stageName] = await executeLlmSkill({
        skill: stageSkill,
        runtime: input.runtime,
        runtimeInput: input.runtimeInput,
        runtimeContext: { ...input.runtimeContext, stages: outputs },
      })
    } else if (stageType === 'external_api') {
      outputs[stageName] = await executeExternalApiSkill({
        skill: input.skill,
        executionConfig: stage,
        runtimeInput: input.runtimeInput,
        runtimeContext: input.runtimeContext,
        stageOutputs: outputs,
      })
    } else if (stageType === 'internal_api') {
      outputs[stageName] = await executeInternalApiSkill({
        executionConfig: stage,
        runtimeInput: input.runtimeInput,
        runtimeContext: input.runtimeContext,
        stageOutputs: outputs,
      })
    } else {
      throw new Error(`Hybrid stage executionType 不支持：${stageType}`)
    }
  }
  return { stages: outputs, final: outputs[Object.keys(outputs).pop() ?? ''] }
}

async function executeBySkillDefinition(input: {
  skill: SkillDefinition
  runtime: RuntimeContext
  runtimeInput: Record<string, unknown>
  runtimeContext: Record<string, unknown>
}) {
  const executionConfig = parseJsonObject(input.skill.executionConfigJson) ?? {}
  const executionType = input.skill.executionType
  if (executionType === 'llm') {
    return executeLlmSkill(input)
  }
  if (executionType === 'external_api') {
    return executeExternalApiSkill({
      skill: input.skill,
      executionConfig,
      runtimeInput: input.runtimeInput,
      runtimeContext: input.runtimeContext,
      stageOutputs: {},
    })
  }
  if (executionType === 'internal_api') {
    return executeInternalApiSkill({
      executionConfig,
      runtimeInput: input.runtimeInput,
      runtimeContext: input.runtimeContext,
      stageOutputs: {},
    })
  }
  if (executionType === 'hybrid') {
    return executeHybridSkill({
      skill: input.skill,
      executionConfig,
      runtime: input.runtime,
      runtimeInput: input.runtimeInput,
      runtimeContext: input.runtimeContext,
    })
  }
  throw new Error(`不支持的 Skill executionType：${executionType}`)
}

export async function executeSkillsForNode(input: {
  skillIds: string[]
  runtime: RuntimeContext
}) {
  const resultItems: SkillExecutionItem[] = []
  const outputs: Record<string, unknown> = {}
  const runtimeInput = { ...(input.runtime.runtimeInput ?? {}) }
  const runtimeContext = { ...(input.runtime.runtimeContext ?? {}) }

  for (const skillId of input.skillIds) {
    const skill = (await skillDb.dbGetSkillById(skillId)) as SkillDefinition | null
    if (!skill) {
      resultItems.push({
        skillId,
        skillCode: 'UNKNOWN',
        success: false,
        executionType: 'unknown',
        errorMessageZh: 'Skill 不存在',
      })
      continue
    }

    try {
      const output = await executeBySkillDefinition({
        skill,
        runtime: input.runtime,
        runtimeInput: { ...runtimeInput, previousOutputs: outputs },
        runtimeContext,
      })
      const validation = validateSkillOutputBySchema(output, skill.outputSchemaJson)
      if (!validation.ok) {
        resultItems.push({
          skillId: skill.id,
          skillCode: skill.code,
          success: false,
          executionType: skill.executionType,
          errorMessageZh: validation.messageZh,
        })
        return {
          success: false,
          errorMessageZh: validation.messageZh,
          skillExecutionLog: resultItems,
          output: outputs,
        }
      }
      outputs[skill.id] = output
      resultItems.push({
        skillId: skill.id,
        skillCode: skill.code,
        success: true,
        executionType: skill.executionType,
        output,
      })
    } catch (e) {
      resultItems.push({
        skillId: skill.id,
        skillCode: skill.code,
        success: false,
        executionType: skill.executionType,
        errorMessageZh: e instanceof Error ? e.message : 'Skill 执行异常',
      })
      return {
        success: false,
        errorMessageZh: e instanceof Error ? e.message : 'Skill 执行异常',
        skillExecutionLog: resultItems,
        output: outputs,
      }
    }
  }

  return {
    success: true,
    skillExecutionLog: resultItems,
    output: outputs,
  }
}
