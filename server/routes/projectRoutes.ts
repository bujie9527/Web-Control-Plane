import type { Express } from 'express'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getProjectDb() {
  try {
    return await import('../domain/projectDb')
  } catch {
    return null
  }
}

async function getProjectAgentConfigDb() {
  try {
    return await import('../domain/projectAgentConfigDb')
  } catch {
    return null
  }
}

export function registerProjectRoutes(app: Express): void {
  app.get('/api/projects', async (req, res) => {
    const db = await getProjectDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const params = {
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
        keyword: req.query.keyword as string | undefined,
        status: req.query.status as string | undefined,
        tenantId: req.query.tenantId as string | undefined,
      }
      const result = await db.dbListProjects(params)
      res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/projects/:id', async (req, res) => {
    const db = await getProjectDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbGetProjectById(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/projects', async (req, res) => {
    const db = await getProjectDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const payload = {
        tenantId: String(body.tenantId ?? ''),
        name: String(body.name ?? ''),
        description: body.description != null ? String(body.description) : undefined,
        status: body.status != null ? String(body.status) : 'draft',
        ownerId: String(body.ownerId ?? ''),
        projectTypeCode: body.projectTypeCode != null ? String(body.projectTypeCode) : undefined,
        goalSummary: body.goalSummary != null ? String(body.goalSummary) : undefined,
        kpiSummary: body.kpiSummary != null ? String(body.kpiSummary) : undefined,
        allowedAgentTemplateIds: Array.isArray(body.allowedAgentTemplateIds)
          ? (body.allowedAgentTemplateIds as string[])
          : undefined,
        preferredAgentTemplateIds: Array.isArray(body.preferredAgentTemplateIds)
          ? (body.preferredAgentTemplateIds as string[])
          : undefined,
        defaultPlannerAgentTemplateId:
          body.defaultPlannerAgentTemplateId != null
            ? String(body.defaultPlannerAgentTemplateId)
            : undefined,
        selectedWorkflowTemplateId:
          body.selectedWorkflowTemplateId != null
            ? String(body.selectedWorkflowTemplateId)
            : undefined,
      }
      const data = await db.dbCreateProject(payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.put('/api/projects/:id', async (req, res) => {
    const db = await getProjectDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const payload: Record<string, unknown> = {}
      if (body.name !== undefined) payload.name = String(body.name)
      if (body.description !== undefined) payload.description = String(body.description)
      if (body.status !== undefined) payload.status = String(body.status)
      if (body.goalSummary !== undefined) payload.goalSummary = String(body.goalSummary)
      if (body.kpiSummary !== undefined) payload.kpiSummary = String(body.kpiSummary)
      if (body.allowedAgentTemplateIds !== undefined)
        payload.allowedAgentTemplateIds = body.allowedAgentTemplateIds as string[]
      if (body.preferredAgentTemplateIds !== undefined)
        payload.preferredAgentTemplateIds = body.preferredAgentTemplateIds as string[]
      if (body.defaultPlannerAgentTemplateId !== undefined)
        payload.defaultPlannerAgentTemplateId = String(body.defaultPlannerAgentTemplateId)
      if (body.selectedWorkflowTemplateId !== undefined)
        payload.selectedWorkflowTemplateId = String(body.selectedWorkflowTemplateId)
      const data = await db.dbUpdateProject(req.params.id, payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.delete('/api/projects/:id', async (req, res) => {
    const db = await getProjectDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbDeleteProject(req.params.id)
      res.json({ code: 0, message: 'success', data: true, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.patch('/api/projects/:id/status', async (req, res) => {
    const db = await getProjectDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const status = (req.body as { status?: string })?.status
      if (!status) {
        res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbPatchProjectStatus(req.params.id, status)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/projects/:projectId/goals', async (req, res) => {
    const db = await getProjectDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbGetGoalsByProjectId(req.params.projectId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/projects/:projectId/goals', async (req, res) => {
    const db = await getProjectDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const payload = {
        goalType: String(body.goalType ?? 'other'),
        goalName: String(body.goalName ?? ''),
        goalDescription: String(body.goalDescription ?? ''),
        successCriteria: body.successCriteria != null ? String(body.successCriteria) : undefined,
        kpiDefinition: body.kpiDefinition != null ? String(body.kpiDefinition) : undefined,
        goalTypeCode: body.goalTypeCode != null ? String(body.goalTypeCode) : undefined,
        primaryMetricCode: body.primaryMetricCode != null ? String(body.primaryMetricCode) : undefined,
        secondaryMetricCodes: Array.isArray(body.secondaryMetricCodes)
          ? (body.secondaryMetricCodes as string[])
          : undefined,
      }
      const data = await db.dbCreateGoal(req.params.projectId, payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/projects/:projectId/sop', async (req, res) => {
    const db = await getProjectDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbGetSOPByProjectId(req.params.projectId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.put('/api/projects/:projectId/sop', async (req, res) => {
    const db = await getProjectDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const sopRaw = (req.body as { sopRaw?: string })?.sopRaw
      if (typeof sopRaw !== 'string') {
        res.status(400).json({ code: 400, message: '缺少 sopRaw', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbUpdateProjectSOP(req.params.projectId, { sopRaw })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  // ProjectAgentConfig（P1.5-D）
  app.get('/api/projects/:projectId/agent-configs', async (req, res) => {
    const db = await getProjectAgentConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目 Agent 配置持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListProjectAgentConfigs(req.params.projectId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/projects/:projectId/agent-configs/:agentTemplateId', async (req, res) => {
    const db = await getProjectAgentConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目 Agent 配置持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbGetProjectAgentConfig(req.params.projectId, req.params.agentTemplateId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.put('/api/projects/:projectId/agent-configs/:agentTemplateId', async (req, res) => {
    const db = await getProjectAgentConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目 Agent 配置持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const data = await db.dbUpsertProjectAgentConfig({
        projectId: req.params.projectId,
        agentTemplateId: req.params.agentTemplateId,
        instructionOverride:
          body.instructionOverride != null ? String(body.instructionOverride) : undefined,
        channelStyleOverride:
          body.channelStyleOverride != null && typeof body.channelStyleOverride === 'object'
            ? (body.channelStyleOverride as Record<string, unknown>)
            : undefined,
        temperatureOverride:
          body.temperatureOverride != null ? Number(body.temperatureOverride) : undefined,
        maxTokensOverride: body.maxTokensOverride != null ? Number(body.maxTokensOverride) : undefined,
        modelConfigIdOverride:
          body.modelConfigIdOverride != null ? String(body.modelConfigIdOverride) : undefined,
        customParams:
          body.customParams != null && typeof body.customParams === 'object'
            ? (body.customParams as Record<string, unknown>)
            : undefined,
        isEnabled: body.isEnabled != null ? Boolean(body.isEnabled) : undefined,
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.delete('/api/projects/:projectId/agent-configs/:agentTemplateId', async (req, res) => {
    const db = await getProjectAgentConfigDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '项目 Agent 配置持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbDeleteProjectAgentConfig(req.params.projectId, req.params.agentTemplateId)
      res.json({ code: 0, message: 'success', data: { success: data }, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
}
