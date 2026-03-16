import type { Project, ProjectStatus } from '../schemas/project'

const _list: Project[] = [
  {
    id: 'p1',
    tenantId: 't1',
    name: '春季 campaign',
    description: 'Q1 社媒推广与内容运营',
    status: 'running',
    ownerId: 'u1',
    goalSummary: '完成 3 大渠道内容发布与效果追踪',
    kpiSummary: '曝光 50w+，互动率 5%',
    createdAt: '2025-02-01',
    updatedAt: '2025-03-08 10:00',
    channel: '社媒综合',
    ownerName: '张三',
    agentTeamName: '内容运营组',
    terminalCount: 4,
    taskProgress: '12/20',
  },
  {
    id: 'p2',
    tenantId: 't1',
    name: '数据看板',
    description: '多源数据汇总与报表',
    status: 'running',
    ownerId: 'u2',
    goalSummary: '每日自动拉取并更新核心指标',
    kpiSummary: '准时率 99%',
    createdAt: '2025-01-15',
    updatedAt: '2025-03-08 09:30',
    channel: 'API 接入',
    ownerName: '李四',
    agentTeamName: '数据组',
    terminalCount: 2,
    taskProgress: '28/28',
  },
  {
    id: 'p3',
    tenantId: 't1',
    name: '内容运营',
    description: '内容生产与审核流程',
    status: 'running',
    ownerId: 'u1',
    goalSummary: '自动化内容审核与发布',
    kpiSummary: '日审 100+ 条',
    createdAt: '2025-02-20',
    updatedAt: '2025-03-08 08:15',
    channel: '社媒综合',
    ownerName: '张三',
    agentTeamName: '内容运营组',
    terminalCount: 3,
    taskProgress: '5/15',
  },
  {
    id: 'p5',
    tenantId: 't1',
    name: 'Facebook 运营示例',
    description: 'AI 执行闭环演示：内容生成 → 审核 → 发布 → 结果记录',
    status: 'running',
    ownerId: 'u1',
    goalSummary: '展示 WorkflowNode → AgentTemplate → Skill → Mock Executor → Result 调度闭环',
    kpiSummary: 'Mock 执行演示',
    createdAt: '2025-03-01',
    updatedAt: '2025-03-08 11:00',
    channel: 'Facebook',
    ownerName: '张三',
    agentTeamName: '内容运营组',
    terminalCount: 1,
    taskProgress: '0/1',
  },
  {
    id: 'p4',
    tenantId: 't1',
    name: '系统运维',
    description: '自动化巡检与告警',
    status: 'paused',
    ownerId: 'u2',
    goalSummary: '关键服务健康检查',
    kpiSummary: '7×24 覆盖',
    createdAt: '2024-12-01',
    updatedAt: '2025-03-05 16:00',
    channel: '系统终端',
    ownerName: '李四',
    agentTeamName: '运维组',
    terminalCount: 1,
    taskProgress: '0/8',
  },
]

export const projectListMock: Project[] = _list

export function getProjectList(params: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: string
}): { items: Project[]; total: number } {
  const { page = 1, pageSize = 10, keyword, status } = params
  let list = [..._list]
  if (keyword?.trim()) {
    const k = keyword.trim().toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(k))
  }
  if (status) {
    list = list.filter((p) => p.status === status)
  }
  const total = list.length
  const start = (page - 1) * pageSize
  const items = list.slice(start, start + pageSize)
  return { items, total }
}

export function getProjectById(id: string): Project | undefined {
  return _list.find((p) => p.id === id)
}

/** 创建项目（占位：写入内存并返回新对象） */
export function createProject(payload: Partial<Project> & { name: string; tenantId: string }): Project {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const id = `p${Date.now()}`
  const project: Project = {
    id,
    tenantId: payload.tenantId,
    name: payload.name,
    description: payload.description,
    status: (payload.status as ProjectStatus) ?? 'draft',
    ownerId: payload.ownerId ?? '',
    projectTypeCode: payload.projectTypeCode,
    goalSummary: payload.goalSummary,
    kpiSummary: payload.kpiSummary,
    ownerName: payload.ownerName,
    allowedAgentTemplateIds: payload.allowedAgentTemplateIds,
    preferredAgentTemplateIds: payload.preferredAgentTemplateIds,
    defaultPlannerAgentTemplateId: payload.defaultPlannerAgentTemplateId,
    selectedWorkflowTemplateId: payload.selectedWorkflowTemplateId,
    createdAt: now,
    updatedAt: now,
  }
  _list.push(project)
  return project
}

/** 更新项目（占位） */
export function updateProject(id: string, payload: Partial<Project>): Project | null {
  const i = _list.findIndex((p) => p.id === id)
  if (i < 0) return null
  const next = { ..._list[i], ...payload, updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' ') }
  _list[i] = next
  return next
}

/** 删除项目（占位：从内存移除） */
export function deleteProject(id: string): boolean {
  const i = _list.findIndex((p) => p.id === id)
  if (i < 0) return false
  _list.splice(i, 1)
  return true
}

/** 修改项目状态（占位） */
export function patchProjectStatus(id: string, status: ProjectStatus): Project | null {
  return updateProject(id, { status })
}
