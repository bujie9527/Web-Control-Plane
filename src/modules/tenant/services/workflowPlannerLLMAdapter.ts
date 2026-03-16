import type {
  WorkflowPlanningDraft,
  WorkflowPlanningDraftNode,
  WorkflowPlanningSession,
} from '../schemas/workflowPlanningSession'
import { executeLLM } from './llmExecutor'
import {
  parsePlanningLLMOutput,
  type PlanningLLMParseError,
  type ParsedPlanningLLMOutput,
} from './planningLLMOutputParser'
import { getAgentPrimaryModelConfigAsync } from './llmBindingService'
import { getTemplateList } from '@/modules/platform/services/agentTemplateService'
import { getSkillList } from '@/modules/platform/services/skillService'

const BASE_PLANNER_AGENT_TEMPLATE_ID = 'at-workflow-planner'

type PlannerAction = 'generate' | 'revise'

interface BaseAdapterInput {
  session: WorkflowPlanningSession
  action: PlannerAction
  skillCode: 'GenerateWorkflowDraft' | 'ReviseWorkflowDraft'
  baseDraft?: WorkflowPlanningDraft
  userMessage?: string
}

// ─── 系统能力上下文构�?────────────────────────────────────────────────────────

/**
 * SystemCapabilityContext
 * Planner Prompt 中注入的系统能力上下�?
 * 包含当前平台所�?active Agent �?Skill 的摘要信�?
 */
interface SystemCapabilityContext {
  agentLines: string[]   // 每个 Agent 一行文本，�?Prompt 拼接
  skillLines: string[]   // 每个 Skill 一行文本，�?Prompt 拼接
}

/**
 * loadSystemCapabilityContext
 * 加载当前系统中所�?active AgentTemplate �?Skill
 * 转换�?Planner Prompt 可直接拼接的文本�?
 *
 * AgentTemplate 行格式：
 *   {id} | {nameZh} | 分类: {category} | 支持技�? {supportedSkillIds.join(', ')}
 *
 * Skill 行格式：
 *   {id} | {nameZh} | {description}
 *
 * 若加载失败，返回空列表（不阻�?Planner 执行，仅降级为无能力上下文）
 */
async function loadSystemCapabilityContext(): Promise<SystemCapabilityContext> {
  const agentRes = await getTemplateList({ page: 1, pageSize: 999, status: 'active' }).catch(() => ({ items: [] }))
  const skillRes = await getSkillList({ page: 1, pageSize: 999, status: 'active' }).catch(() => ({ items: [] }))
  const agentLines = (agentRes.items ?? []).map(
    (a) =>
      `${a.id} | ${a.nameZh ?? a.name} | 分类: ${a.category ?? '未知'} | 支持技能: ${(a.supportedSkillIds ?? []).join(', ') || '无'}`,
  )
  const skillLines = (skillRes.items ?? []).map(
    (s) => `${s.id} | ${s.nameZh ?? s.name} | ${s.description ?? '暂无'}`,
  )
  return { agentLines, skillLines }
}

function buildCapabilityContextSection(ctx: SystemCapabilityContext): string {
  const agentBlock =
    ctx.agentLines.length > 0
      ? `【当前系统可�?Agent】\n${ctx.agentLines.join('\n')}`
      : '【当前系统可�?Agent】\n（暂无）'
  const skillBlock =
    ctx.skillLines.length > 0
      ? `【当前系统可�?Skills】\n${ctx.skillLines.join('\n')}`
      : '【当前系统可�?Skills】\n（暂无）'
  const requirements = `
【输出要求�?
1. 每个 agent_task 节点�?recommendedAgentTemplateId 必须使用以上 Agent ID 之一�?
2. 如果某节点所需能力在以上列表中不存在，将缺失能力描述添加到 missingCapabilities 数组�?
3. missingCapabilities 中每条格式：「[节点名]需要[能力描述]，但当前无支持的 Agent/Skill�?

【节点字段约束�?
4. executionType 只能是以下之一：agent_task, human_review, approval_gate, result_writer, system_task, manual_input, branch_decision�?
5. intentType 只能是以下之一：create, review, search, research, publish, record, analyze, summarize, classify, reply�?
6. 每个节点�?allowedSkillIds 只能使用以上【当前系统可�?Skills】列表中�?ID，不得自行编造。`
  return `${agentBlock}\n\n${skillBlock}\n${requirements}`
}

export interface PlannerLLMAdapterSuccess {
  ok: true
  data: ParsedPlanningLLMOutput
}

export interface PlannerLLMAdapterFail {
  ok: false
  errorCode: string
  errorMessage: string
  errorMessageZh: string
}

export type PlannerLLMAdapterResult = PlannerLLMAdapterSuccess | PlannerLLMAdapterFail

/**
 * plannerOutputSchema
 * 构造传�?OpenAI response_format.json_schema.schema �?JSON Schema�?
 *
 * strict: true 要求�?
 * 1. 每个 object 必须�?additionalProperties: false
 * 2. 每个 object �?properties 必须全量列在 required �?
 * 3. 可选字段使�?anyOf: [{type: "..."}, {type: "null"}]
 */
function plannerOutputSchema(): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    required: [
      'summary',
      'changeSummary',
      'riskNotes',
      'suggestedAgentTemplateIds',
      'suggestedSkillIds',
      'missingCapabilities',
      'capabilityNotes',
      'nodes',
    ],
    properties: {
      summary: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      changeSummary: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      riskNotes: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      suggestedAgentTemplateIds: {
        anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }],
      },
      suggestedSkillIds: {
        anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }],
      },
      /** 系统当前无法覆盖的能力需求，格式：「[节点名]需要[能力描述]，但当前无支持的 Agent/Skill�?*/
      missingCapabilities: {
        anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }],
      },
      /** Planner �?Agent/Skills 覆盖情况的补充说�?*/
      capabilityNotes: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      nodes: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: [
            'key',
            'name',
            'executionType',
            'intentType',
            'orderIndex',
            'dependsOnNodeIds',
            'id',
            'description',
            'recommendedAgentTemplateId',
            'allowedAgentRoleTypes',
            'allowedSkillIds',
          ],
          properties: {
            id: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            key: { type: 'string' },
            name: { type: 'string' },
            description: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            executionType: { type: 'string' },
            intentType: { type: 'string' },
            orderIndex: { type: 'number' },
            dependsOnNodeIds: { type: 'array', items: { type: 'string' } },
            recommendedAgentTemplateId: { anyOf: [{ type: 'string' }, { type: 'null' }] },
            allowedAgentRoleTypes: {
              anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }],
            },
            allowedSkillIds: {
              anyOf: [{ type: 'array', items: { type: 'string' } }, { type: 'null' }],
            },
          },
        },
      },
    },
  }
}

/**
 * buildPrompts
 * 构�?Planner LLM 调用�?systemPrompt �?userPrompt
 *
 * 新增：capabilitySection 段落注入
 * - �?userPrompt 中的 SOP/草案信息之前，插�?【当前系统可�?Agent/Skills�?章节
 * - 该章节由 buildCapabilityContextSection(capabilityCtx) 生成
 * - 同时在输出要求中要求 LLM 填写 missingCapabilities �?capabilityNotes 字段
 *
 * @param input - 基础适配器输�?
 * @param capabilityCtx - 系统能力上下文（�?loadSystemCapabilityContext 加载�?
 */
function buildPrompts(
  input: BaseAdapterInput,
  capabilityCtx: SystemCapabilityContext,
): { systemPrompt: string; userPrompt: string } {
  const capabilitySection = buildCapabilityContextSection(capabilityCtx)

  const systemPrompt =
    '你是 Base Workflow Planner Agent。请仅输出 JSON，不要输出额外说明。' +
    '必须包含 nodes，且节点字段满足规划系统要求。' +
    '当系统能力不足以覆盖某节点需求时，必须在 missingCapabilities 数组中列出缺失能力。'

  if (input.action === 'generate') {
    return {
      systemPrompt,
      userPrompt:
        `${capabilitySection}\n\n` +
        `请基于以下会话信息生成流程草案：\n` +
        `项目类型：${input.session.projectTypeId}\n` +
        `目标类型：${input.session.goalTypeId}\n` +
        `交付模式：${input.session.deliverableMode}\n` +
        `SOP：${input.session.sourceText ?? '（空）'}`,
    }
  }

  const baseNodeText = (input.baseDraft?.nodes ?? [])
    .map((n) => `${n.orderIndex}. ${n.name}(${n.executionType}/${n.intentType})`)
    .join('\n')

  return {
    systemPrompt,
    userPrompt:
      `${capabilitySection}\n\n` +
      `请基于当前草案并结合用户建议进行修订。\n` +
      `当前草案节点：\n${baseNodeText}\n` +
      `用户建议：${input.userMessage ?? '请优化流程结构'}`,
  }
}

function parseWithRetry(
  rawText: string,
  fallbackRawText?: string
): { ok: true; data: ParsedPlanningLLMOutput } | { ok: false; error: PlanningLLMParseError } {
  const first = parsePlanningLLMOutput(rawText)
  if (first.ok) return first
  if (!fallbackRawText) return first
  const second = parsePlanningLLMOutput(fallbackRawText)
  return second.ok ? second : first
}

async function runLLMWithOneRetryOnParseFail(input: BaseAdapterInput): Promise<PlannerLLMAdapterResult> {
  if (
    input.session.plannerAgentTemplateId &&
    input.session.plannerAgentTemplateId !== BASE_PLANNER_AGENT_TEMPLATE_ID
  ) {
    return {
      ok: false,
      errorCode: 'PLANNER_AGENT_NOT_ALLOWED',
      errorMessage: 'Only Base Workflow Planner Agent is allowed in Phase 15',
      errorMessageZh: '当前阶段仅允�?Base Workflow Planner Agent 接入真实模型',
    }
  }

  const primaryConfig = await getAgentPrimaryModelConfigAsync(BASE_PLANNER_AGENT_TEMPLATE_ID)
  if (!primaryConfig || !primaryConfig.isEnabled) {
    return {
      ok: false,
      errorCode: 'PLANNER_MODEL_BINDING_NOT_FOUND',
      errorMessage: 'No primary model config bound for Base Workflow Planner',
      errorMessageZh: '未配置流程规划助手主模型，请在模型配置中心绑定。',
    }
  }

  // 加载系统 Agent/Skills 能力上下文，注入 Planner Prompt
  // 若加载失败则降级为空上下文（不阻�?LLM 调用�?
  const capabilityCtx = await loadSystemCapabilityContext().catch(() => ({
    agentLines: [],
    skillLines: [],
  }))
  const { systemPrompt, userPrompt } = buildPrompts(input, capabilityCtx)
  const reqMeta: Record<string, unknown> = {
    action: input.action,
    sourceText: input.session.sourceText,
    userMessage: input.userMessage,
    baseNodes: input.baseDraft?.nodes as WorkflowPlanningDraftNode[] | undefined,
    sessionId: input.session.id,
  }

  const first = await executeLLM({
    modelConfigId: primaryConfig.id,
    systemPrompt,
    userPrompt,
    structuredSchema: plannerOutputSchema(),
    outputMode: 'json_schema',
    metadata: reqMeta,
  })
  /* LLM execution log: see server WorkflowRuntimeLog */
  if (!first.success) {
    return {
      ok: false,
      errorCode: first.errorCode ?? 'LLM_CALL_FAILED',
      errorMessage: first.errorMessage ?? 'LLM call failed',
      errorMessageZh: first.errorMessageZh ?? '流程规划助手调用失败',
    }
  }

  let retryRawText: string | undefined
  const parsedFirst = parsePlanningLLMOutput(first.rawText)
  if (!parsedFirst.ok) {
    const retry = await executeLLM({
      modelConfigId: primaryConfig.id,
      systemPrompt,
      userPrompt,
      structuredSchema: plannerOutputSchema(),
      outputMode: 'json_schema',
      metadata: reqMeta,
    })
    /* LLM execution log: see server WorkflowRuntimeLog */
    if (retry.success) retryRawText = retry.rawText
  }

  const parsed = parseWithRetry(first.rawText, retryRawText)
  if (!parsed.ok) {
    return {
      ok: false,
      errorCode: parsed.error.code,
      errorMessage: parsed.error.message,
      errorMessageZh: parsed.error.messageZh,
    }
  }
  return { ok: true, data: parsed.data }
}

export async function generateDraftByPlannerLLM(
  session: WorkflowPlanningSession
): Promise<PlannerLLMAdapterResult> {
  return runLLMWithOneRetryOnParseFail({
    session,
    action: 'generate',
    skillCode: 'GenerateWorkflowDraft',
  })
}

export async function reviseDraftByPlannerLLM(
  session: WorkflowPlanningSession,
  baseDraft: WorkflowPlanningDraft,
  userMessage: string
): Promise<PlannerLLMAdapterResult> {
  return runLLMWithOneRetryOnParseFail({
    session,
    action: 'revise',
    skillCode: 'ReviseWorkflowDraft',
    baseDraft,
    userMessage,
  })
}

// ─── ClarifyOrGenerate（渐进式澄清 �?生成决策）────────────────────────────────────

export interface ClarifyOrGenerateOutput {
  phase: 'clarifying' | 'generating'
  clarifyQuestion: string | null
  clarifyReason: string | null
}

function clarifyOrGenerateSchema(): Record<string, unknown> {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['phase', 'clarifyQuestion', 'clarifyReason'],
    properties: {
      phase: { type: 'string', enum: ['clarifying', 'generating'] },
      clarifyQuestion: { anyOf: [{ type: 'string' }, { type: 'null' }] },
      clarifyReason: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    },
  }
}

/**
 * 根据当前会话与用户消息，判断是继续澄清需求还是可以生成草案�?
 * 仅在没有草案时由 handlePlannerChat 调用�?
 */
export async function clarifyOrGenerateByPlannerLLM(
  session: WorkflowPlanningSession,
  userMessage: string
): Promise<
  | { ok: true; data: ClarifyOrGenerateOutput }
  | { ok: false; errorCode: string; errorMessage: string; errorMessageZh: string }
> {
  if (
    session.plannerAgentTemplateId &&
    session.plannerAgentTemplateId !== BASE_PLANNER_AGENT_TEMPLATE_ID
  ) {
    return {
      ok: false,
      errorCode: 'PLANNER_AGENT_NOT_ALLOWED',
      errorMessage: 'Only Base Workflow Planner Agent is allowed',
      errorMessageZh: '当前阶段仅允�?Base Workflow Planner Agent 接入真实模型',
    }
  }

  const primaryConfig = await getAgentPrimaryModelConfigAsync(BASE_PLANNER_AGENT_TEMPLATE_ID)
  if (!primaryConfig?.isEnabled) {
    return {
      ok: false,
      errorCode: 'PLANNER_MODEL_BINDING_NOT_FOUND',
      errorMessage: 'No primary model config bound for Base Workflow Planner',
      errorMessageZh: '未配置流程规划助手主模型，请在模型配置中心绑定。',
    }
  }

  const systemPrompt =
    '你是流程规划助手。根据用户当前输入与已有会话，判断信息是否足以生成流程草案。' +
    '若关键信息不足（如目标、交付物、步骤范围、审核要求等未明确），则 phase 为 clarifying，并给出 1 个追问（clarifyQuestion）及原因（clarifyReason）。' +
    '若信息已足够，则 phase 为 generating，clarifyQuestion 与 clarifyReason 为 null。' +
    '仅输出 JSON，不要输出其他说明。'

  const userPrompt =
    `项目类型：${session.projectTypeId}\n` +
    `目标类型：${session.goalTypeId}\n` +
    `交付模式：${session.deliverableMode}\n` +
    `SOP/需求原文：${session.sourceText ?? '（空）'}\n\n` +
    `用户最新消息：${userMessage}`

  const result = await executeLLM({
    modelConfigId: primaryConfig.id,
    systemPrompt,
    userPrompt,
    structuredSchema: clarifyOrGenerateSchema(),
    outputMode: 'json_schema',
    metadata: { sessionId: session.id, action: 'clarifyOrGenerate' },
  })

  /* LLM execution log: see server WorkflowRuntimeLog */

  if (!result.success) {
    return {
      ok: false,
      errorCode: result.errorCode ?? 'LLM_CALL_FAILED',
      errorMessage: result.errorMessage ?? 'LLM call failed',
      errorMessageZh: result.errorMessageZh ?? '流程规划助手调用失败',
    }
  }

  try {
    const parsed = JSON.parse(result.rawText || '{}') as ClarifyOrGenerateOutput
    const phase = parsed?.phase === 'clarifying' || parsed?.phase === 'generating' ? parsed.phase : 'generating'
    return {
      ok: true,
      data: {
        phase,
        clarifyQuestion: typeof parsed.clarifyQuestion === 'string' ? parsed.clarifyQuestion : null,
        clarifyReason: typeof parsed.clarifyReason === 'string' ? parsed.clarifyReason : null,
      },
    }
  } catch {
    return {
      ok: true,
      data: { phase: 'generating', clarifyQuestion: null, clarifyReason: null },
    }
  }
}


