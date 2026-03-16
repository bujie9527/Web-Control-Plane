import type { Express } from 'express'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getAgentTemplateDb() {
  try {
    return await import('../domain/agentTemplateDb')
  } catch {
    return null
  }
}

async function getSkillDb() {
  try {
    return await import('../domain/skillDb')
  } catch {
    return null
  }
}

async function getLLMConfigDb() {
  try {
    return await import('../domain/llmConfigDb')
  } catch {
    return null
  }
}

export function registerAgentFactoryRoutes(app: Express): void {
  // AgentTemplate
  app.get('/api/agent-templates', async (req, res) => {
    const db = await getAgentTemplateDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const params = {
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
        keyword: req.query.keyword as string | undefined,
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
        domain: req.query.domain as string | undefined,
        roleType: req.query.roleType as string | undefined,
        isSystemPreset:
          req.query.isSystemPreset === 'true'
            ? true
            : req.query.isSystemPreset === 'false'
              ? false
              : undefined,
        platformType: req.query.platformType as string | undefined,
      }
      const result = await db.dbListAgentTemplates(params)
      res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.get('/api/agent-templates/:id', async (req, res) => {
    const db = await getAgentTemplateDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbGetAgentTemplateById(req.params.id)
      if (!data) {
        res.status(404).json({ code: 404, message: 'Agent 模板不存在', data: null, meta: apiMeta() })
        return
      }
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.post('/api/agent-templates', async (req, res) => {
    const db = await getAgentTemplateDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      if (!body.name || !String(body.name).trim()) {
        res.status(400).json({ code: 400, message: '模板名称不能为空', data: null, meta: apiMeta() })
        return
      }
      if (!body.code || !String(body.code).trim()) {
        res.status(400).json({ code: 400, message: '模板编码不能为空', data: null, meta: apiMeta() })
        return
      }
      const payload = {
        name: String(body.name).trim(),
        code: String(body.code).trim(),
        description: body.description != null ? String(body.description) : undefined,
        roleType: String(body.roleType ?? 'other'),
        category: body.category != null ? String(body.category) : undefined,
        domain: body.domain != null ? String(body.domain) : undefined,
        sceneTags: Array.isArray(body.sceneTags) ? (body.sceneTags as string[]) : undefined,
        platformType: body.platformType != null ? String(body.platformType) : undefined,
        archetypeCode: body.archetypeCode != null ? String(body.archetypeCode) : undefined,
        parentTemplateId: body.parentTemplateId != null ? String(body.parentTemplateId) : undefined,
        supportedProjectTypeIds: Array.isArray(body.supportedProjectTypeIds)
          ? (body.supportedProjectTypeIds as string[])
          : undefined,
        supportedGoalTypeIds: Array.isArray(body.supportedGoalTypeIds)
          ? (body.supportedGoalTypeIds as string[])
          : undefined,
        supportedSkillIds: Array.isArray(body.supportedSkillIds) ? (body.supportedSkillIds as string[]) : undefined,
        defaultExecutorType: String(body.defaultExecutorType ?? 'agent'),
        allowedExecutorTypes: Array.isArray(body.allowedExecutorTypes)
          ? (body.allowedExecutorTypes as string[])
          : undefined,
        allowedTerminalTypes: Array.isArray(body.allowedTerminalTypes)
          ? (body.allowedTerminalTypes as string[])
          : undefined,
        defaultModelKey: body.defaultModelKey != null ? String(body.defaultModelKey) : undefined,
        fallbackModelKeys: Array.isArray(body.fallbackModelKeys)
          ? (body.fallbackModelKeys as string[])
          : undefined,
        temperature: body.temperature != null ? Number(body.temperature) : undefined,
        maxTokens: body.maxTokens != null ? Number(body.maxTokens) : undefined,
        systemPromptTemplate:
          body.systemPromptTemplate != null ? String(body.systemPromptTemplate) : undefined,
        instructionTemplate:
          body.instructionTemplate != null ? String(body.instructionTemplate) : undefined,
        outputFormat: body.outputFormat != null ? String(body.outputFormat) : undefined,
        channelStyleProfiles:
          body.channelStyleProfiles != null && typeof body.channelStyleProfiles === 'object'
            ? (body.channelStyleProfiles as Record<string, unknown>)
            : undefined,
        requireGoalContext: body.requireGoalContext as boolean | undefined,
        requireIdentityContext: body.requireIdentityContext as boolean | undefined,
        requireSOPContext: body.requireSOPContext as boolean | undefined,
        requireStructuredOutput: body.requireStructuredOutput as boolean | undefined,
        disallowDirectTerminalAction: body.disallowDirectTerminalAction as boolean | undefined,
        requireHumanReview: body.requireHumanReview as boolean | undefined,
        requireNodeReview: body.requireNodeReview as boolean | undefined,
        autoApproveWhenConfidenceGte:
          body.autoApproveWhenConfidenceGte != null
            ? Number(body.autoApproveWhenConfidenceGte)
            : undefined,
        manual: body.manual as boolean | undefined,
        semi_auto: body.semi_auto as boolean | undefined,
        full_auto: body.full_auto as boolean | undefined,
      }
      const data = await db.dbCreateAgentTemplate(payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.put('/api/agent-templates/:id', async (req, res) => {
    const db = await getAgentTemplateDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbUpdateAgentTemplate(req.params.id, req.body as Record<string, unknown>)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.post('/api/agent-templates/:id/clone', async (req, res) => {
    const db = await getAgentTemplateDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as {
        name?: string
        code?: string
        category?: string
        domain?: string
        sceneTags?: string[]
        inheritSkills?: boolean
        inheritModelConfig?: boolean
        inheritGuardrails?: boolean
        inheritReviewPolicy?: boolean
      }
      const payload = {
        name: String(body.name ?? ''),
        code: String(body.code ?? ''),
        category: body.category != null ? String(body.category) : undefined,
        domain: body.domain != null ? String(body.domain) : undefined,
        sceneTags: Array.isArray(body.sceneTags) ? body.sceneTags : undefined,
        inheritSkills: body.inheritSkills,
        inheritModelConfig: body.inheritModelConfig,
        inheritGuardrails: body.inheritGuardrails,
        inheritReviewPolicy: body.inheritReviewPolicy,
      }
      const data = await db.dbCloneAgentTemplate(req.params.id, payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.patch('/api/agent-templates/:id/status', async (req, res) => {
    const db = await getAgentTemplateDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const status = (req.body as { status?: string })?.status
      if (!status) {
        res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbChangeAgentTemplateStatus(req.params.id, status)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.delete('/api/agent-templates/:id', async (req, res) => {
    const db = await getAgentTemplateDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Agent 模板持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbDeleteAgentTemplate(req.params.id)
      res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  // Skills
  app.get('/api/skills', async (req, res) => {
    const db = await getSkillDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Skill 持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const params = {
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
        keyword: req.query.keyword as string | undefined,
        status: req.query.status as string | undefined,
        category: req.query.category as string | undefined,
      }
      const result = await db.dbListSkills(params)
      res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.get('/api/skills/:id', async (req, res) => {
    const db = await getSkillDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Skill 持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbGetSkillById(req.params.id)
      if (!data) {
        res.status(404).json({ code: 404, message: 'Skill 不存在', data: null, meta: apiMeta() })
        return
      }
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.post('/api/skills', async (req, res) => {
    const db = await getSkillDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Skill 持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      if (!body.name || !String(body.name).trim()) {
        res.status(400).json({ code: 400, message: 'Skill 名称不能为空', data: null, meta: apiMeta() })
        return
      }
      if (!body.code || !String(body.code).trim()) {
        res.status(400).json({ code: 400, message: 'Skill 编码不能为空', data: null, meta: apiMeta() })
        return
      }
      const payload = {
        name: String(body.name).trim(),
        nameZh: body.nameZh != null ? String(body.nameZh) : undefined,
        code: String(body.code).trim(),
        category: String(body.category ?? ''),
        executionType: String(body.executionType ?? 'llm'),
        description: body.description != null ? String(body.description) : undefined,
        version: body.version != null ? String(body.version) : undefined,
        status: body.status != null ? String(body.status) : undefined,
        inputSchemaJson: body.inputSchemaJson != null ? String(body.inputSchemaJson) : undefined,
        outputSchemaJson: body.outputSchemaJson != null ? String(body.outputSchemaJson) : undefined,
        executionConfigJson:
          body.executionConfigJson != null ? String(body.executionConfigJson) : undefined,
        promptTemplate: body.promptTemplate != null ? String(body.promptTemplate) : undefined,
        requiredContextFields: Array.isArray(body.requiredContextFields)
          ? (body.requiredContextFields as string[])
          : undefined,
        estimatedDurationMs:
          body.estimatedDurationMs != null ? Number(body.estimatedDurationMs) : undefined,
        retryable: body.retryable != null ? Boolean(body.retryable) : undefined,
        maxRetries: body.maxRetries != null ? Number(body.maxRetries) : undefined,
        openClawSpec:
          body.openClawSpec != null && typeof body.openClawSpec === 'object'
            ? (body.openClawSpec as { steps?: string[]; inputSchemaJson?: string; outputSchemaJson?: string })
            : undefined,
      }
      const data = await db.dbCreateSkill(payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.put('/api/skills/:id', async (req, res) => {
    const db = await getSkillDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Skill 持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const payload: Record<string, unknown> = {}
      if (body.name !== undefined) payload.name = body.name
      if (body.nameZh !== undefined) payload.nameZh = body.nameZh
      if (body.description !== undefined) payload.description = body.description
      if (body.category !== undefined) payload.category = body.category
      if (body.executionType !== undefined) payload.executionType = body.executionType
      if (body.version !== undefined) payload.version = body.version
      if (body.status !== undefined) payload.status = body.status
      if (body.inputSchemaJson !== undefined) payload.inputSchemaJson = body.inputSchemaJson
      if (body.outputSchemaJson !== undefined) payload.outputSchemaJson = body.outputSchemaJson
      if (body.executionConfigJson !== undefined) payload.executionConfigJson = body.executionConfigJson
      if (body.promptTemplate !== undefined) payload.promptTemplate = body.promptTemplate
      if (body.requiredContextFields !== undefined)
        payload.requiredContextFields = body.requiredContextFields
      if (body.estimatedDurationMs !== undefined) payload.estimatedDurationMs = body.estimatedDurationMs
      if (body.retryable !== undefined) payload.retryable = body.retryable
      if (body.maxRetries !== undefined) payload.maxRetries = body.maxRetries
      if (body.openClawSpec !== undefined) payload.openClawSpec = body.openClawSpec
      const data = await db.dbUpdateSkill(req.params.id, payload as Parameters<typeof db.dbUpdateSkill>[1])
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.patch('/api/skills/:id/status', async (req, res) => {
    const db = await getSkillDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Skill 持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const status = (req.body as { status?: string })?.status
      if (!status) {
        res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbChangeSkillStatus(req.params.id, status)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.delete('/api/skills/:id', async (req, res) => {
    const db = await getSkillDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Skill 持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbDeleteSkill(req.params.id)
      res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  // OpenClaw 导入 Skill（P1.5-F）
  app.post('/api/skills/import-openclaw', async (req, res) => {
    const db = await getSkillDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'Skill 持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as {
        content?: string
        format?: 'auto' | 'json' | 'yaml'
      }
      const content = String(body.content ?? '').trim()
      if (!content) {
        res.status(400).json({ code: 400, message: '请提供 OpenClaw 内容', data: null, meta: apiMeta() })
        return
      }
      const { mapOpenClawToCreateSkillPayload } = await import('../domain/skillOpenClawImport')
      const payload = mapOpenClawToCreateSkillPayload({
        content,
        format: body.format ?? 'auto',
      })
      const data = await db.dbCreateSkill(payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(400).json({
        code: 400,
        message: e instanceof Error ? `OpenClaw 导入失败：${e.message}` : 'OpenClaw 导入失败',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  // LLM Providers
  app.get('/api/llm-providers', async (_req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListProviders()
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.get('/api/llm-providers/:id', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbGetProviderById(req.params.id)
      if (!data) {
        res.status(404).json({ code: 404, message: '模型提供商不存在', data: null, meta: apiMeta() })
        return
      }
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.post('/api/llm-providers', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      if (!body.name || !String(body.name).trim()) {
        res.status(400).json({ code: 400, message: '提供商名称不能为空', data: null, meta: apiMeta() })
        return
      }
      const payload = {
        name: String(body.name).trim(),
        nameZh: body.nameZh != null ? String(body.nameZh) : undefined,
        providerType: String(body.providerType ?? 'openai'),
        baseUrl: body.baseUrl != null ? String(body.baseUrl) : undefined,
        credentialId: body.credentialId != null ? String(body.credentialId) : undefined,
        status: body.status != null ? String(body.status) : undefined,
        notes: body.notes != null ? String(body.notes) : undefined,
      }
      const data = await db.dbCreateProvider(payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.put('/api/llm-providers/:id', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbUpdateProvider(req.params.id, req.body as Record<string, unknown>)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.patch('/api/llm-providers/:id/status', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const status = (req.body as { status?: string })?.status
      if (!status) {
        res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbChangeProviderStatus(req.params.id, status)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.delete('/api/llm-providers/:id', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbDeleteProvider(req.params.id)
      res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
    } catch (e) {
      const msg = e instanceof Error ? e.message : '服务端异常'
      res.status(400).json({ code: 400, message: msg, data: null, meta: apiMeta() })
    }
  })

  // LLM ModelConfigs
  app.get('/api/llm-model-configs', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const providerId = req.query.providerId as string | undefined
      const data = await db.dbListModelConfigs(providerId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.get('/api/llm-model-configs/:id', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbGetModelConfigById(req.params.id)
      if (!data) {
        res.status(404).json({ code: 404, message: '模型配置不存在', data: null, meta: apiMeta() })
        return
      }
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.post('/api/llm-model-configs', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      if (!body.name || !String(body.name).trim()) {
        res.status(400).json({ code: 400, message: '模型配置名称不能为空', data: null, meta: apiMeta() })
        return
      }
      if (!body.providerId || !String(body.providerId).trim()) {
        res.status(400).json({ code: 400, message: '必须指定模型提供商', data: null, meta: apiMeta() })
        return
      }
      if (!body.modelKey || !String(body.modelKey).trim()) {
        res.status(400).json({
          code: 400,
          message: '模型标识（modelKey）不能为空',
          data: null,
          meta: apiMeta(),
        })
        return
      }
      const payload = {
        id: body.id != null ? String(body.id) : undefined,
        name: String(body.name).trim(),
        nameZh: body.nameZh != null ? String(body.nameZh) : undefined,
        providerId: String(body.providerId).trim(),
        modelKey: String(body.modelKey).trim(),
        isEnabled: body.isEnabled as boolean | undefined,
        isDefault: body.isDefault as boolean | undefined,
        temperature: body.temperature != null ? Number(body.temperature) : undefined,
        maxTokens: body.maxTokens != null ? Number(body.maxTokens) : undefined,
        timeoutMs: body.timeoutMs != null ? Number(body.timeoutMs) : undefined,
        retryCount: body.retryCount != null ? Number(body.retryCount) : undefined,
        structuredOutputMode:
          body.structuredOutputMode != null ? String(body.structuredOutputMode) : undefined,
        fallbackModelConfigId:
          body.fallbackModelConfigId != null ? String(body.fallbackModelConfigId) : undefined,
        supportedAgentCategories: Array.isArray(body.supportedAgentCategories)
          ? (body.supportedAgentCategories as string[])
          : undefined,
        notes: body.notes != null ? String(body.notes) : undefined,
      }
      const data = await db.dbCreateModelConfig(payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.put('/api/llm-model-configs/:id', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbUpdateModelConfig(req.params.id, req.body as Record<string, unknown>)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.patch('/api/llm-model-configs/:id/enabled', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const isEnabled = (req.body as { isEnabled?: boolean })?.isEnabled
      if (typeof isEnabled !== 'boolean') {
        res.status(400).json({ code: 400, message: '缺少 isEnabled', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbSetModelConfigEnabled(req.params.id, isEnabled)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.patch('/api/llm-model-configs/:id/default', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbSetDefaultModelConfig(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.delete('/api/llm-model-configs/:id', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbDeleteModelConfig(req.params.id)
      res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
    } catch (e) {
      const msg = e instanceof Error ? e.message : '服务端异常'
      res.status(400).json({ code: 400, message: msg, data: null, meta: apiMeta() })
    }
  })

  // Agent LLM Bindings
  app.get('/api/agent-llm-bindings', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const agentTemplateId = req.query.agentTemplateId as string | undefined
      const data = await db.dbListBindings(agentTemplateId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.post('/api/agent-llm-bindings', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const payload = {
        agentTemplateId: String(body.agentTemplateId ?? ''),
        modelConfigId: String(body.modelConfigId ?? ''),
        bindingType: String(body.bindingType ?? 'primary'),
        priority: body.priority != null ? Number(body.priority) : undefined,
        isEnabled: body.isEnabled as boolean | undefined,
        notes: body.notes != null ? String(body.notes) : undefined,
      }
      const data = await db.dbCreateBinding(payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.put('/api/agent-llm-bindings/:id', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbUpdateBinding(req.params.id, req.body as Record<string, unknown>)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.delete('/api/agent-llm-bindings/:id', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbDeleteBinding(req.params.id)
      res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
  app.post('/api/agent-llm-bindings/set-primary', async (req, res) => {
    const db = await getLLMConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: 'LLM 配置未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as { agentTemplateId?: string; modelConfigId?: string }
      const agentTemplateId = body?.agentTemplateId
      const modelConfigId = body?.modelConfigId
      if (!agentTemplateId || !modelConfigId) {
        res.status(400).json({
          code: 400,
          message: '缺少 agentTemplateId 或 modelConfigId',
          data: null,
          meta: apiMeta(),
        })
        return
      }
      const data = await db.dbSetPrimaryBinding(agentTemplateId, modelConfigId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
}
