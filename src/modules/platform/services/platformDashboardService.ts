/**
 * 平台工作台统计（从 /api/stats/platform-dashboard 聚合）
 */
export interface PlatformDashboardStats {
  totalTenants: number
  activeTenants: number
  resourceSummary: string
  alerts: { id: string; level: string; message: string }[]
  recentActivities: { id: string; message: string; time: string }[]
}

const API_BASE = typeof window !== 'undefined' ? '' : 'http://localhost:3001'

export async function getDashboardStats(): Promise<PlatformDashboardStats> {
  try {
    const res = await fetch(`${API_BASE}/api/stats/platform-dashboard`, {
      headers: { 'Content-Type': 'application/json' },
    })
    const json = (await res.json()) as {
      code: number
      data?: { tenantCount?: number; projectCount?: number; agentCount?: number; skillCount?: number }
    }
    if (res.ok && json.code === 0 && json.data) {
      const d = json.data
      return {
        totalTenants: d.tenantCount ?? 0,
        activeTenants: d.tenantCount ?? 0,
        resourceSummary: `租户 ${d.tenantCount ?? 0}，项目 ${d.projectCount ?? 0}，Agent ${d.agentCount ?? 0}，Skill ${d.skillCount ?? 0}`,
        alerts: [],
        recentActivities: [],
      }
    }
  } catch {
    // fallthrough
  }
  return {
    totalTenants: 0,
    activeTenants: 0,
    resourceSummary: '—',
    alerts: [],
    recentActivities: [],
  }
}
