import type { Express } from 'express'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getDataSourceDb() {
  try {
    return await import('../domain/dataSourceDb')
  } catch {
    return null
  }
}

export function registerDataSourceRoutes(app: Express): void {
  app.get('/api/data-source-credentials', async (_req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListDataSourceCredentials()
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/data-source-credentials', async (req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const name = String(body.name ?? '').trim()
      const providerType = String(body.providerType ?? '').trim()
      const secret = String(body.secret ?? '').trim()
      if (!name) {
        res.status(400).json({ code: 400, message: '凭证名称不能为空', data: null, meta: apiMeta() })
        return
      }
      if (!providerType) {
        res.status(400).json({ code: 400, message: 'providerType 不能为空', data: null, meta: apiMeta() })
        return
      }
      if (!secret) {
        res.status(400).json({ code: 400, message: '密钥不能为空', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbCreateDataSourceCredential({
        id: body.id != null ? String(body.id) : undefined,
        name,
        nameZh: body.nameZh != null ? String(body.nameZh) : undefined,
        providerType,
        secret,
        status: body.status != null ? String(body.status) : undefined,
        notes: body.notes != null ? String(body.notes) : undefined,
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.put('/api/data-source-credentials/:id', async (req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const data = await db.dbUpdateDataSourceCredential(req.params.id, {
        name: body.name != null ? String(body.name) : undefined,
        nameZh: body.nameZh != null ? String(body.nameZh) : undefined,
        providerType: body.providerType != null ? String(body.providerType) : undefined,
        secret: body.secret != null ? String(body.secret) : undefined,
        status: body.status != null ? String(body.status) : undefined,
        notes: body.notes != null ? String(body.notes) : undefined,
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(400).json({ code: 400, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.delete('/api/data-source-credentials/:id', async (req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbDeleteDataSourceCredential(req.params.id)
      res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
    } catch (e) {
      res.status(400).json({ code: 400, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/data-source-providers', async (_req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListDataSourceProviders()
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/data-source-providers', async (req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const name = String(body.name ?? '').trim()
      const providerType = String(body.providerType ?? '').trim()
      if (!name) {
        res.status(400).json({ code: 400, message: 'Provider 名称不能为空', data: null, meta: apiMeta() })
        return
      }
      if (!providerType) {
        res.status(400).json({ code: 400, message: 'providerType 不能为空', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbCreateDataSourceProvider({
        id: body.id != null ? String(body.id) : undefined,
        name,
        nameZh: body.nameZh != null ? String(body.nameZh) : undefined,
        providerType,
        baseUrl: body.baseUrl != null ? String(body.baseUrl) : undefined,
        credentialId: body.credentialId != null ? String(body.credentialId) : undefined,
        status: body.status != null ? String(body.status) : undefined,
        isSystemPreset: body.isSystemPreset === true,
        notes: body.notes != null ? String(body.notes) : undefined,
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(400).json({ code: 400, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.put('/api/data-source-providers/:id', async (req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const data = await db.dbUpdateDataSourceProvider(req.params.id, {
        name: body.name != null ? String(body.name) : undefined,
        nameZh: body.nameZh != null ? String(body.nameZh) : undefined,
        providerType: body.providerType != null ? String(body.providerType) : undefined,
        baseUrl: body.baseUrl != null ? String(body.baseUrl) : undefined,
        credentialId: body.credentialId != null ? String(body.credentialId) : undefined,
        status: body.status != null ? String(body.status) : undefined,
        isSystemPreset: body.isSystemPreset === true,
        notes: body.notes != null ? String(body.notes) : undefined,
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(400).json({ code: 400, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/data-source-providers/:id/test', async (req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbTestDataSourceProviderConnection(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(400).json({ code: 400, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.delete('/api/data-source-providers/:id', async (req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbDeleteDataSourceProvider(req.params.id)
      res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
    } catch (e) {
      res.status(400).json({ code: 400, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/data-source-configs', async (_req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListDataSourceConfigs()
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/data-source-configs', async (req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const providerId = String(body.providerId ?? '').trim()
      if (!providerId) {
        res.status(400).json({ code: 400, message: 'providerId 不能为空', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbCreateDataSourceConfig({
        id: body.id != null ? String(body.id) : undefined,
        providerId,
        tenantId: body.tenantId != null ? String(body.tenantId) : undefined,
        configJson: body.configJson != null ? String(body.configJson) : undefined,
        rateLimitJson: body.rateLimitJson != null ? String(body.rateLimitJson) : undefined,
        status: body.status != null ? String(body.status) : undefined,
        notes: body.notes != null ? String(body.notes) : undefined,
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(400).json({ code: 400, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.put('/api/data-source-configs/:id', async (req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const data = await db.dbUpdateDataSourceConfig(req.params.id, {
        providerId: body.providerId != null ? String(body.providerId) : undefined,
        tenantId: body.tenantId != null ? String(body.tenantId) : undefined,
        configJson: body.configJson != null ? String(body.configJson) : undefined,
        rateLimitJson: body.rateLimitJson != null ? String(body.rateLimitJson) : undefined,
        status: body.status != null ? String(body.status) : undefined,
        notes: body.notes != null ? String(body.notes) : undefined,
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(400).json({ code: 400, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.delete('/api/data-source-configs/:id', async (req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      await db.dbDeleteDataSourceConfig(req.params.id)
      res.json({ code: 0, message: 'success', data: { success: true }, meta: apiMeta() })
    } catch (e) {
      res.status(400).json({ code: 400, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/data-source/execute', async (req, res) => {
    const db = await getDataSourceDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '数据源中心未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const providerId = String(body.providerId ?? '').trim()
      const query = String(body.query ?? '').trim()
      const limit = body.limit != null ? Number(body.limit) : undefined
      if (!providerId || !query) {
        res.status(400).json({ code: 400, message: 'providerId 和 query 均不能为空', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbExecuteDataSource({ providerId, query, limit })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(400).json({ code: 400, message: e instanceof Error ? e.message : '执行失败', data: null, meta: apiMeta() })
    }
  })
}
