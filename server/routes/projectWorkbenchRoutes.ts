import type { Express } from 'express'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getProjectSubdomainDb() {
  try {
    return await import('../domain/projectSubdomainDb')
  } catch {
    return null
  }
}

async function getProjectWorkbenchDb() {
  try {
    return await import('../domain/projectWorkbenchDb')
  } catch {
    return null
  }
}

export function registerProjectWorkbenchRoutes(app: Express): void {
  app.get('/api/projects/:id/workbench', async (req, res) => {
    const db = await getProjectWorkbenchDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '工作台聚合服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbGetProjectWorkbench(req.params.id)
      if (!data) {
        res.status(404).json({ code: 404, message: '项目不存在', data: null, meta: apiMeta() })
        return
      }
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/projects/:id/identity-bindings', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListProjectIdentityBindings(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/projects/:id/identity-bindings', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as { identityId?: string; isDefault?: boolean }
      if (!body.identityId) {
        res.status(400).json({ code: 400, message: '缺少 identityId', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbAddProjectIdentityBinding({
        projectId: req.params.id,
        identityId: body.identityId,
        isDefault: body.isDefault ?? false,
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.delete('/api/projects/:id/identity-bindings/:identityId', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbRemoveProjectIdentityBinding(req.params.id, req.params.identityId)
      res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.patch('/api/projects/:id/identity-bindings/:identityId/set-default', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbSetDefaultProjectIdentityBinding(req.params.id, req.params.identityId)
      res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/projects/:id/deliverables', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListProjectDeliverables(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/projects/:id/deliverables', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as {
        deliverableType?: string
        description?: string
        frequency?: string
        target?: string
        notes?: string
      }
      if (!body.deliverableType || !body.description) {
        res.status(400).json({ code: 400, message: '缺少必填字段', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbCreateProjectDeliverable({
        projectId: req.params.id,
        ...(body as Required<typeof body>),
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.put('/api/projects/:id/deliverables/:deliverableId', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbUpdateProjectDeliverable(
        req.params.deliverableId,
        req.body as Record<string, unknown>
      )
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.delete('/api/projects/:id/deliverables/:deliverableId', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbDeleteProjectDeliverable(req.params.deliverableId)
      res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/projects/:id/deliverables/replace-all', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const items = (req.body as { items?: unknown[] })?.items ?? []
      const data = await db.dbReplaceProjectDeliverables(
        req.params.id,
        items as Parameters<typeof db.dbReplaceProjectDeliverables>[1]
      )
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/projects/:id/resource-configs', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListProjectResourceConfigs(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/projects/:id/resource-configs', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as { configType?: string; label?: string; value?: string; notes?: string }
      if (!body.configType || !body.label || !body.value) {
        res.status(400).json({ code: 400, message: '缺少必填字段', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbCreateProjectResourceConfig({
        projectId: req.params.id,
        ...(body as Required<typeof body>),
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.put('/api/projects/:id/resource-configs/:configId', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbUpdateProjectResourceConfig(
        req.params.configId,
        req.body as Record<string, unknown>
      )
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.delete('/api/projects/:id/resource-configs/:configId', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbDeleteProjectResourceConfig(req.params.configId)
      res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/projects/:id/resource-configs/replace-all', async (req, res) => {
    const db = await getProjectSubdomainDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const items = (req.body as { items?: unknown[] })?.items ?? []
      const data = await db.dbReplaceProjectResourceConfigs(
        req.params.id,
        items as Parameters<typeof db.dbReplaceProjectResourceConfigs>[1]
      )
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
}
