import type { Express } from 'express'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

async function getProjectReportDb() {
  try {
    return await import('../domain/projectReportDb')
  } catch {
    return null
  }
}

export function registerReportRoutes(app: Express): void {
  app.get('/api/projects/:id/dashboard', async (req, res) => {
    const db = await getProjectReportDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '报表服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbGenerateProjectDashboard(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '查询失败', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/projects/:id/reports', async (req, res) => {
    const db = await getProjectReportDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '报表服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListProjectReports(req.params.id)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '查询失败', data: null, meta: apiMeta() })
    }
  })

  app.post('/api/projects/:id/reports', async (req, res) => {
    const db = await getProjectReportDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '报表服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const body = req.body as Record<string, unknown>
      const tenantId = String(body.tenantId ?? '')
      if (!tenantId) {
        res.status(400).json({ code: 400, message: '缺少 tenantId', data: null, meta: apiMeta() })
        return
      }
      const data = await db.dbCreateProjectReport({
        projectId: req.params.id,
        tenantId,
        periodType: (body.periodType as 'daily' | 'weekly' | 'monthly' | 'custom') ?? 'daily',
        periodStart: String(body.periodStart ?? ''),
        periodEnd: String(body.periodEnd ?? ''),
        summaryJson: (body.summaryJson as Record<string, unknown> | undefined) ?? undefined,
        kpiJson: (body.kpiJson as Record<string, unknown> | undefined) ?? undefined,
        generatedBy: body.generatedBy ? String(body.generatedBy) : undefined,
      })
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '创建失败', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/analytics/tenant/:tenantId', async (req, res) => {
    const db = await getProjectReportDb()
    if (!db) {
      res.status(503).json({ code: 503, message: '报表服务未就绪', data: null, meta: apiMeta() })
      return
    }
    try {
      const data = await db.dbListTenantAnalytics(req.params.tenantId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '查询失败', data: null, meta: apiMeta() })
    }
  })
}

