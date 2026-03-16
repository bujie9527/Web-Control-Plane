import fs from 'fs'
import path from 'path'
import type { Express } from 'express'

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

const configDir = path.join(process.cwd(), 'server', 'config')

function readConfigJson<T>(filename: string): T {
  const filePath = path.join(configDir, filename)
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return [] as unknown as T
  }
}

async function getStatsDb() {
  try {
    return await import('../domain/statsDb')
  } catch {
    return null
  }
}

export function registerSystemConfigRoutes(app: Express): void {
  app.get('/api/config/project-types', (_req, res) => {
    const data = readConfigJson<unknown[]>('projectTypes.json')
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  })

  app.get('/api/config/goal-types', (_req, res) => {
    const data = readConfigJson<unknown[]>('goalTypes.json')
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  })

  app.get('/api/config/goal-metric-options', (_req, res) => {
    const data = readConfigJson<unknown[]>('goalMetricOptions.json')
    res.json({ code: 0, message: 'success', data, meta: apiMeta() })
  })

  app.get('/api/stats/tenant-dashboard', async (req, res) => {
    const tenantId = String(req.query.tenantId ?? '')
    if (!tenantId) {
      res.status(400).json({ code: 400, message: '缺少 tenantId', data: null, meta: apiMeta() })
      return
    }
    const db = await getStatsDb()
    if (!db) {
      res.json({
        code: 0,
        message: 'success',
        data: { projectCount: 0, taskCount: 0, instanceCount: 0, identityCount: 0, terminalCount: 0 },
        meta: apiMeta(),
      })
      return
    }
    try {
      const data = await db.dbGetTenantDashboardStats(tenantId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/stats/task-center', async (req, res) => {
    const tenantId = String(req.query.tenantId ?? '')
    if (!tenantId) {
      res.status(400).json({ code: 400, message: '缺少 tenantId', data: null, meta: apiMeta() })
      return
    }
    const db = await getStatsDb()
    if (!db) {
      res.json({
        code: 0,
        message: 'success',
        data: { total: 0, pending: 0, running: 0, completed: 0, failed: 0 },
        meta: apiMeta(),
      })
      return
    }
    try {
      const data = await db.dbGetTaskCenterStats(tenantId)
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/stats/platform-dashboard', async (_req, res) => {
    const db = await getStatsDb()
    if (!db) {
      res.json({
        code: 0,
        message: 'success',
        data: { tenantCount: 0, projectCount: 0, agentCount: 0, skillCount: 0 },
        meta: apiMeta(),
      })
      return
    }
    try {
      const data = await db.dbGetPlatformDashboardStats()
      res.json({ code: 0, message: 'success', data, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })

  app.get('/api/planner-strategy-profiles/:id', async (req, res) => {
    try {
      const { getPlannerStrategyProfileById } = await import('../data/plannerStrategyProfiles')
      const profile = getPlannerStrategyProfileById(req.params.id)
      if (!profile) {
        res.status(404).json({ code: 404, message: '未找到该策略配置', data: null, meta: apiMeta() })
        return
      }
      res.json({ code: 0, message: 'success', data: profile, meta: apiMeta() })
    } catch (e) {
      res.status(500).json({ code: 500, message: e instanceof Error ? e.message : '服务端异常', data: null, meta: apiMeta() })
    }
  })
}
