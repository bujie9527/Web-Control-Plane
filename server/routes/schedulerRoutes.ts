import type { Express } from 'express'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getSchedulerDb() {
  try {
    return await import('../domain/schedulerDb')
  } catch {
    return null
  }
}

async function getSchedulerEngine() {
  try {
    return await import('../domain/schedulerEngine')
  } catch {
    return null
  }
}

export function registerSchedulerRoutes(app: Express): void {
  app.get('/api/scheduled-tasks', async (req, res) => {
    const db = await getSchedulerDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '调度服务未就绪', data: null, meta: apiMeta() })
      return
    }
    const tenantId = String(req.query.tenantId ?? '')
    if (!tenantId) {
      res.status(400).json({ code: 400, message: '缺少 tenantId', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListScheduledTasks(tenantId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '查询失败', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/scheduled-tasks/:id', async (req, res) => {
    const db = await getSchedulerDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '调度服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbGetScheduledTask(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '查询失败', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/scheduled-tasks', async (req, res) => {
    const db = await getSchedulerDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '调度服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const data = await db.dbCreateScheduledTask({
        tenantId: String(body.tenantId ?? ''),
        projectId: body.projectId ? String(body.projectId) : undefined,
        name: String(body.name ?? ''),
        description: body.description ? String(body.description) : undefined,
        cronExpr: body.cronExpr ? String(body.cronExpr) : undefined,
        runAt: body.runAt ? String(body.runAt) : undefined,
        timezone: body.timezone ? String(body.timezone) : undefined,
        targetType: (body.targetType as 'workflow_instance' | 'skill_execution' | 'system') ?? 'workflow_instance',
        targetRefId: body.targetRefId ? String(body.targetRefId) : undefined,
        payloadJson: (body.payloadJson as Record<string, unknown> | undefined) ?? undefined,
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '创建失败', data: null, meta: apiMeta() })
    }
  })

  app.put('/api/scheduled-tasks/:id', async (req, res) => {
    const db = await getSchedulerDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '调度服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbUpdateScheduledTask(req.params.id, req.body as Record<string, unknown>)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '更新失败', data: null, meta: apiMeta() })
    }
  })

  app.patch('/api/scheduled-tasks/:id/status', async (req, res) => {
    const db = await getSchedulerDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '调度服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const status = String((req.body as { status?: string }).status ?? '')
      if (!['active', 'paused', 'completed', 'failed'].includes(status)) {
        res.status(400).json({ code: 400, message: 'status 不合法', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbPatchScheduledTaskStatus(req.params.id, status as 'active' | 'paused' | 'completed' | 'failed')
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '状态更新失败', data: null, meta: apiMeta() })
    }
  })

  app.delete('/api/scheduled-tasks/:id', async (req, res) => {
    const db = await getSchedulerDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '调度服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbDeleteScheduledTask(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '删除失败', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/scheduled-tasks/:id/executions', async (req, res) => {
    const db = await getSchedulerDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '调度服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListTaskExecutions(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '查询失败', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/scheduled-tasks/:id/run', async (req, res) => {
    const engine = await getSchedulerEngine()
    if (!engine) {
      res.status(503).json({ code: 503, message: '调度引擎未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await engine.runScheduledTaskNow(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '执行失败', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/scheduler/state', async (_req, res) => {
    const engine = await getSchedulerEngine()
    if (!engine) {
      res.status(503).json({ code: 503, message: '调度引擎未就绪', data: null, meta: apiMeta() })
      return
    }
    res.json({ code: 0, message: 'success', data: engine.getSchedulerState(), meta: apiMeta() })
  })
}

