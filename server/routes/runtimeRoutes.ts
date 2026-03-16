import type { Express } from 'express'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getWorkflowRuntimeLogDb() {
  try {
    return await import('../domain/workflowRuntimeLogDb')
  } catch {
    return null
  }
}

async function getWorkflowSupervisorDecisionDb() {
  try {
    return await import('../domain/workflowSupervisorDecisionDb')
  } catch {
    return null
  }
}

async function getWorkflowPublishRecordDb() {
  try {
    return await import('../domain/workflowPublishRecordDb')
  } catch {
    return null
  }
}

export function registerRuntimeRoutes(app: Express): void {
  app.get('/api/workflow-instances/:id/runtime-logs', async (req, res) => {
    const db = await getWorkflowRuntimeLogDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '运行日志服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListRuntimeLogs(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/workflow-instances/:id/runtime-logs', async (req, res) => {
    const db = await getWorkflowRuntimeLogDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '运行日志服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as {
        eventType?: string
        messageZh?: string
        nodeId?: string
        operatorId?: string
        meta?: Record<string, unknown>
      }
      if (!body.eventType || !body.messageZh) {
        res.status(400).json({ code: 400, message: '缺少 eventType / messageZh', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbAppendRuntimeLog({
        instanceId: req.params.id,
        ...(body as Required<typeof body>),
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/workflow-instances/:id/supervisor-decisions', async (req, res) => {
    const db = await getWorkflowSupervisorDecisionDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '监督决策服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListSupervisorDecisions(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/workflow-instances/:id/supervisor-decisions', async (req, res) => {
    const db = await getWorkflowSupervisorDecisionDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '监督决策服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as {
        decisionType?: string
        reason?: string
        nodeId?: string
        suggestedNextAction?: string
        relatedErrorSummary?: string
      }
      if (!body.decisionType || !body.reason) {
        res.status(400).json({ code: 400, message: '缺少 decisionType / reason', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbCreateSupervisorDecision({
        instanceId: req.params.id,
        ...(body as Required<typeof body>),
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/supervisor-decisions/:id', async (req, res) => {
    const db = await getWorkflowSupervisorDecisionDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '监督决策服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbGetSupervisorDecisionById(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.patch('/api/supervisor-decisions/:id/status', async (req, res) => {
    const db = await getWorkflowSupervisorDecisionDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '监督决策服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as { status?: string; appliedBy?: string }
      if (!body.status || !['applied', 'dismissed'].includes(body.status)) {
        res.status(400).json({ code: 400, message: 'status 必须为 applied 或 dismissed', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbUpdateSupervisorDecisionStatus(
        req.params.id,
        body.status as 'applied' | 'dismissed',
        body.appliedBy
      )
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/workflow-templates/:id/publish-records', async (req, res) => {
    const db = await getWorkflowPublishRecordDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '发布记录服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListPublishRecords(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/workflow-templates/:id/publish-records', async (req, res) => {
    const db = await getWorkflowPublishRecordDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '发布记录服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as {
        publishedBy?: string
        planningSessionId?: string
        planningDraftId?: string
        draftVersion?: number
        notes?: string
      }
      if (!body.publishedBy) {
        res.status(400).json({ code: 400, message: '缺少 publishedBy', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbCreatePublishRecord({
        templateId: req.params.id,
        ...(body as Required<typeof body>),
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
}
