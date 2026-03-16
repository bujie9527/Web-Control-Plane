/**
 * 租户工作台聚合数据类型
 */
export interface MetricCard {
  key: string
  value: number | string
  label: string
}

export interface TodoItem {
  id: string
  title: string
  link?: string
  type?: string
}

export interface AlertItem {
  id: string
  level: 'info' | 'warning' | 'error'
  message: string
}

export interface RecentTask {
  id: string
  taskName: string
  projectName: string
  status: string
  updatedAt: string
  /** 展示用：使用身份名称 */
  identityName?: string
}

export interface QuickEntry {
  key: string
  label: string
  path: string
}

export interface TenantDashboardData {
  metricCards: MetricCard[]
  todoItems: TodoItem[]
  alerts: AlertItem[]
  recentTasks: RecentTask[]
  quickEntries: QuickEntry[]
}
