import type { Express } from 'express'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getPlanningDb() {
  try {
    return await import('../domain/planningSessionDb')
  } catch {
    return null
  }
}

export function registerPlanningRoutes(app: Express): void {
  app.get('/api/planning-sessions', async (req, res) => {
    const db = await getPlanningDb()
    if (!db) {
      res.status(503).json({
        code: 503,
        message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    try {
      const params = {
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
        scopeType: req.query.scopeType as string | undefined,
        tenantId: req.query.tenantId as string | undefined,
        status: req.query.status as string | undefined,
        projectTypeId: req.query.projectTypeId as string | undefined,
        deliverableMode: req.query.deliverableMode as string | undefined,
        sourceType: req.query.sourceType as string | undefined,
      }
      const result = await db.dbListPlanningSessions(params)
      res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  app.get('/api/planning-sessions/:id', async (req, res) => {
    const db = await getPlanningDb()
    if (!db) {
      res.status(503).json({
        code: 503,
        message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    try {
      const data = await db.dbGetPlanningSessionById(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  app.post('/api/planning-sessions', async (req, res) => {
    const db = await getPlanningDb()
    if (!db) {
      res.status(503).json({
        code: 503,
        message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const payload = {
        scopeType: String(body.scopeType ?? 'tenant'),
        tenantId: body.tenantId != null ? String(body.tenantId) : undefined,
        title: String(body.title ?? ''),
        description: body.description != null ? String(body.description) : undefined,
        projectTypeId: String(body.projectTypeId ?? ''),
        goalTypeId: String(body.goalTypeId ?? ''),
        deliverableMode: String(body.deliverableMode ?? ''),
        sourceType: String(body.sourceType ?? 'sop_input'),
        sourceText: body.sourceText != null ? String(body.sourceText) : undefined,
        plannerAgentTemplateId:
          body.plannerAgentTemplateId != null ? String(body.plannerAgentTemplateId) : undefined,
        plannerExecutionBackend: String(body.plannerExecutionBackend ?? 'llm'),
        status: String(body.status ?? 'draft'),
        createdBy: String(body.createdBy ?? ''),
      }
      const data = await db.dbCreatePlanningSession(payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  app.put('/api/planning-sessions/:id/status', async (req, res) => {
    const db = await getPlanningDb()
    if (!db) {
      res.status(503).json({
        code: 503,
        message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    try {
      const status = (req.body as { status?: string })?.status
      if (!status) {
        res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbUpdatePlanningSessionStatus(req.params.id, status)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  app.put('/api/planning-sessions/:id/current-draft', async (req, res) => {
    const db = await getPlanningDb()
    if (!db) {
      res.status(503).json({
        code: 503,
        message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    try {
      const draftId = (req.body as { draftId?: string })?.draftId
      if (!draftId) {
        res.status(400).json({ code: 400, message: '缺少 draftId', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbSetCurrentDraft(req.params.id, draftId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  app.delete('/api/planning-sessions/:id', async (req, res) => {
    const db = await getPlanningDb()
    if (!db) {
      res.status(503).json({
        code: 503,
        message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    try {
      await db.dbDeletePlanningSession(req.params.id)
      res.json({ code: 0, message: 'success', data: true, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  app.get('/api/planning-sessions/:sessionId/drafts', async (req, res) => {
    const db = await getPlanningDb()
    if (!db) {
      res.status(503).json({
        code: 503,
        message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    try {
      const data = await db.dbListPlanningDrafts(req.params.sessionId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  app.post('/api/planning-sessions/:sessionId/drafts', async (req, res) => {
    const db = await getPlanningDb()
    if (!db) {
      res.status(503).json({
        code: 503,
        message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const payload = {
        sessionId: req.params.sessionId,
        version: body.version != null ? Number(body.version) : undefined,
        summary: body.summary != null ? String(body.summary) : undefined,
        parsedSOP: body.parsedSOP != null ? String(body.parsedSOP) : undefined,
        nodes: Array.isArray(body.nodes) ? body.nodes : [],
        suggestedAgentTemplateIds: Array.isArray(body.suggestedAgentTemplateIds)
          ? (body.suggestedAgentTemplateIds as string[])
          : undefined,
        suggestedSkillIds: Array.isArray(body.suggestedSkillIds)
          ? (body.suggestedSkillIds as string[])
          : undefined,
        changeSummary: body.changeSummary != null ? String(body.changeSummary) : undefined,
        riskNotes: body.riskNotes != null ? String(body.riskNotes) : undefined,
        missingCapabilities: Array.isArray(body.missingCapabilities)
          ? (body.missingCapabilities as string[])
          : undefined,
        capabilityNotes: body.capabilityNotes != null ? String(body.capabilityNotes) : undefined,
        status: String(body.status ?? 'suggested'),
      }
      const data = await db.dbCreatePlanningDraft(payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  app.get('/api/planning-drafts/:id', async (req, res) => {
    const db = await getPlanningDb()
    if (!db) {
      res.status(503).json({
        code: 503,
        message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    try {
      const data = await db.dbGetPlanningDraftById(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  app.get('/api/planning-sessions/:sessionId/messages', async (req, res) => {
    const db = await getPlanningDb()
    if (!db) {
      res.status(503).json({
        code: 503,
        message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    try {
      const data = await db.dbListPlanningMessages(req.params.sessionId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  app.post('/api/planning-sessions/:sessionId/messages', async (req, res) => {
    const db = await getPlanningDb()
    if (!db) {
      res.status(503).json({
        code: 503,
        message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const payload = {
        sessionId: req.params.sessionId,
        role: String(body.role ?? 'user'),
        content: String(body.content ?? ''),
        relatedDraftVersion:
          body.relatedDraftVersion != null ? Number(body.relatedDraftVersion) : undefined,
        messageType: String(body.messageType ?? 'chat'),
      }
      const data = await db.dbAddPlanningMessage(payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })

  app.get('/api/planning-drafts/referencing-agent/:agentTemplateId', async (req, res) => {
    const db = await getPlanningDb()
    if (!db) {
      res.status(503).json({
        code: 503,
        message: '规划持久化未就绪，请先运行 npx prisma generate 与 npx prisma migrate dev',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    try {
      const data = await db.dbGetDraftNodesReferencingAgent(req.params.agentTemplateId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({
        code: 500,
        message: e instanceof Error ? e.message : '服务端异常',
        data: null,
        meta: apiMeta(),
      })
    }
  })
}
