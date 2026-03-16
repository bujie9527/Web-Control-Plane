import * as agentDb from './agentTemplateDb'
import * as identityDb from './identityTerminalDb'
import * as projectAgentConfigDb from './projectAgentConfigDb'

interface SkillLike {
  name?: string
  nameZh?: string
  promptTemplate?: string
  openClawSpec?: { steps?: string[] }
}

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value ?? '')
  }
}

function applyTemplate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{([^}]+)\}/g, (_m, rawKey: string) => {
    const key = rawKey.trim()
    if (key.startsWith('input.')) {
      const k = key.slice('input.'.length)
      return safeJson(vars[`input.${k}`] ?? '')
    }
    return safeJson(vars[key] ?? '')
  })
}

export async function assembleSkillPrompt(input: {
  agentTemplateId?: string
  skill: SkillLike
  nodeName: string
  instanceId: string
  runtimeInput?: Record<string, unknown>
  runtimeContext?: Record<string, unknown>
}) {
  const runtimeInput = input.runtimeInput ?? {}
  const runtimeContext = input.runtimeContext ?? {}

  const agent = input.agentTemplateId
    ? await agentDb.dbGetAgentTemplateById(input.agentTemplateId)
    : null

  const projectId =
    typeof runtimeContext.projectId === 'string' ? runtimeContext.projectId : undefined
  const terminalId =
    typeof runtimeContext.terminalId === 'string' ? runtimeContext.terminalId : undefined

  const projectAgentConfig =
    projectId && input.agentTemplateId
      ? await projectAgentConfigDb.dbGetProjectAgentConfig(projectId, input.agentTemplateId)
      : null

  let channelType = typeof runtimeContext.channelType === 'string' ? runtimeContext.channelType : undefined
  if (!channelType && terminalId) {
    const terminal = await identityDb.dbGetTerminalById(terminalId)
    channelType = terminal?.type || undefined
  }

  const agentProfiles =
    (agent &&
      'channelStyleProfiles' in agent &&
      typeof (agent as Record<string, unknown>).channelStyleProfiles === 'object'
      ? ((agent as { channelStyleProfiles?: Record<string, unknown> }).channelStyleProfiles ?? {})
      : {}) ?? {}
  const profileByChannel =
    channelType && agentProfiles[channelType] && typeof agentProfiles[channelType] === 'object'
      ? (agentProfiles[channelType] as Record<string, unknown>)
      : undefined
  const overrideProfile =
    projectAgentConfig?.channelStyleOverride && typeof projectAgentConfig.channelStyleOverride === 'object'
      ? projectAgentConfig.channelStyleOverride
      : undefined
  const mergedChannelStyle = {
    ...(profileByChannel ?? {}),
    ...(overrideProfile ?? {}),
  }

  let identitySummary = '未配置 Identity'
  const identityId = typeof runtimeContext.identityId === 'string' ? runtimeContext.identityId : undefined
  if (identityId) {
    const identity = await identityDb.dbGetIdentityById(identityId)
    if (identity) {
      identitySummary = `${identity.name}｜定位：${identity.corePositioning || '未填写'}｜语气：${identity.toneStyle || '未填写'}`
    }
  }

  const stepText =
    input.skill.openClawSpec?.steps?.length
      ? input.skill.openClawSpec.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
      : '1. 分析输入\n2. 产出结果'

  const fallbackUserPrompt =
    `你正在执行流程节点：${input.nodeName}\n` +
    `Skill：${input.skill.nameZh || input.skill.name || '未命名 Skill'}\n` +
    `执行步骤：\n${stepText}\n\n` +
    `运行输入：\n${safeJson(runtimeInput)}\n\n` +
    `运行上下文：\n${safeJson(runtimeContext)}\n\n` +
    `请输出中文结果，若可结构化请返回 JSON。`

  const vars: Record<string, unknown> = {
    agentRole: agent?.nameZh || agent?.name || '执行 Agent',
    skillSteps: stepText,
    identity: identitySummary,
    channelStyle:
      Object.keys(mergedChannelStyle).length > 0
        ? mergedChannelStyle
        : runtimeContext.channelStyle ?? '未配置',
    goal: runtimeContext.goal ?? '',
    projectOverride: projectAgentConfig?.instructionOverride ?? '',
    input: runtimeInput,
    context: runtimeContext,
    instanceId: input.instanceId,
  }
  for (const [k, v] of Object.entries(runtimeInput)) vars[`input.${k}`] = v

  const userPrompt = input.skill.promptTemplate
    ? applyTemplate(input.skill.promptTemplate, vars)
    : fallbackUserPrompt

  const systemPrompt =
    agent?.systemPromptTemplate ||
    `你是流程执行引擎中的专业 Agent，请按要求执行 Skill 并输出中文结果。`

  const userPromptWithProjectOverride =
    projectAgentConfig?.instructionOverride?.trim()
      ? `${userPrompt}\n\n【项目级覆盖指令】\n${projectAgentConfig.instructionOverride.trim()}`
      : userPrompt

  return {
    systemPrompt,
    userPrompt: userPromptWithProjectOverride,
    modelConfigId: projectAgentConfig?.modelConfigIdOverride ?? (undefined as string | undefined),
    temperature: projectAgentConfig?.temperatureOverride ?? agent?.temperature,
    maxTokens: projectAgentConfig?.maxTokensOverride ?? agent?.maxTokens,
    channelType,
    channelStyleApplied: Object.keys(mergedChannelStyle).length > 0 ? mergedChannelStyle : undefined,
  }
}
