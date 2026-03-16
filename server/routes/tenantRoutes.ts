import type { Express } from 'express'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getTenantDb() {
  try {
    return await import('../domain/tenantDb')
  } catch {
    return null
  }
}

export function registerTenantRoutes(app: Express): void {
  app.get('/api/tenants', async (req, res) => {
    const db = await getTenantDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '租户持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const result = await db.dbListTenants({
        page: req.query.page ? Number(req.query.page) : undefined,
        pageSize: req.query.pageSize ? Number(req.query.pageSize) : undefined,
        keyword: req.query.keyword as string | undefined,
        status: req.query.status as string | undefined,
      })
      res.json({ code: 0, message: 'success', data: result, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/tenants/:id', async (req, res) => {
    const db = await getTenantDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '租户持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbGetTenantById(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/tenants', async (req, res) => {
    const db = await getTenantDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '租户持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const payload = {
        name: String(body.name ?? ''),
        code: body.code != null ? String(body.code) : undefined,
        status: body.status != null ? String(body.status) : 'active',
      }
      const data = await db.dbCreateTenant(payload)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.put('/api/tenants/:id', async (req, res) => {
    const db = await getTenantDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '租户持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbUpdateTenant(req.params.id, req.body as Record<string, unknown>)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.delete('/api/tenants/:id', async (req, res) => {
    const db = await getTenantDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '租户持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbDeleteTenant(req.params.id)
      res.json({ code: 0, message: 'success', data: true, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.patch('/api/tenants/:id/status', async (req, res) => {
    const db = await getTenantDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '租户持久化未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const status = (req.body as { status?: string })?.status
      if (!status) {
        res.status(400).json({ code: 400, message: '缺少 status', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbPatchTenantStatus(req.params.id, status)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
}
