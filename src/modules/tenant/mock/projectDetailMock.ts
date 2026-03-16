import type {
  ProjectDetailData,
  ProjectDetailSummary,
  ProjectIdentityBindingItem,
  ResultFeedItem,
  TaskDetailView,
  TaskItem,
} from '../schemas/projectDetail'
import type { Identity } from '../schemas/identity'
import { getProjectById } from './projectMock'
import { getIdentityById } from './identityMock'
import { getCreatedTasksForProject } from './taskMock'
import { getGoalsByProjectId } from './projectGoalMock'
import { getDeliverablesByProjectId } from './projectDeliverableMock'
import { getResourceConfigsByProjectId } from './projectResourceConfigMock'
import { getSOPByProjectId } from './projectSOPMock'

/** 动态结果回流（任务/实例完成后写入，供结果反馈展示） */
const dynamicResultFeedsByProject: Record<string, ResultFeedItem[]> = {}

function nextFeedId(projectId: string): string {
  const list = dynamicResultFeedsByProject[projectId] ?? []
  const max = list.reduce((m, f) => {
    const n = parseInt(f.id.replace(/\D/g, ''), 10)
    return isNaN(n) ? m : Math.max(m, n)
  }, 0)
  return `df${max + 1}`
}

export function appendResultFeed(
  projectId: string,
  item: Omit<ResultFeedItem, 'id'>
): ResultFeedItem {
  if (!dynamicResultFeedsByProject[projectId]) dynamicResultFeedsByProject[projectId] = []
  const feed: ResultFeedItem = { ...item, id: nextFeedId(projectId) }
  dynamicResultFeedsByProject[projectId].push(feed)
  return feed
}

export function getDynamicResultFeeds(projectId: string): ResultFeedItem[] {
  return dynamicResultFeedsByProject[projectId] ?? []
}

const PLATFORM_LABELS: Record<string, string> = {
  wechat: '微信',
  x: 'X',
  douyin: '抖音',
  xiaohongshu: '小红书',
  weibo: '微博',
}

const IDENTITY_TYPE_LABELS: Record<string, string> = {
  brand_official: '品牌官号',
  koc: 'KOC',
  expert: '专家',
  assistant: '助手',
  other: '其他',
}

const CORE_POSITIONING_MAX_LEN = 60

function toPlatformLabels(adaptations: Record<string, string>): string {
  const keys = Object.keys(adaptations || {}).filter(Boolean)
  return keys.map((k) => PLATFORM_LABELS[k] ?? k).join('、') || '—'
}

/** 项目 ↔ 身份绑定（projectId -> identityIds + defaultIdentityId），仅同租户 */
const projectIdentityBindings: Record<
  string,
  { identityIds: string[]; defaultIdentityId?: string }
> = {
  p1: { identityIds: ['id1', 'id2'], defaultIdentityId: 'id1' },
  p2: { identityIds: ['id3'], defaultIdentityId: 'id3' },
  p3: { identityIds: ['id1', 'id4'], defaultIdentityId: 'id4' },
  p4: { identityIds: [], defaultIdentityId: undefined },
  p5: { identityIds: ['id1'], defaultIdentityId: 'id1' },
}

/** 设置项目身份绑定（项目创建向导使用） */
export function setProjectIdentityBinding(
  projectId: string,
  binding: { identityIds: string[]; defaultIdentityId?: string }
): void {
  projectIdentityBindings[projectId] = {
    identityIds: binding.identityIds ?? [],
    defaultIdentityId: binding.defaultIdentityId,
  }
}

function buildIdentities(projectId: string): {
  list: ProjectIdentityBindingItem[]
  defaultIdentityId?: string
} {
  const binding = projectIdentityBindings[projectId]
  if (!binding || binding.identityIds.length === 0) {
    return { list: [], defaultIdentityId: undefined }
  }
  const { identityIds, defaultIdentityId } = binding
  const list: ProjectIdentityBindingItem[] = []
  for (const identityId of identityIds) {
    const identity = getIdentityById(identityId)
    if (!identity) continue
    list.push({
      identityId: identity.id,
      name: identity.name,
      type: IDENTITY_TYPE_LABELS[identity.type] ?? identity.type,
      platformLabels: toPlatformLabels(identity.platformAdaptations),
      isDefault: identity.id === defaultIdentityId,
    })
  }
  return {
    list,
    defaultIdentityId: defaultIdentityId || undefined,
  }
}

function buildSummary(projectId: string): ProjectDetailSummary | null {
  const p = getProjectById(projectId)
  if (!p) return null
  const base = { ...p }
  const periodByProject: Record<string, { start: string; end: string }> = {
    p1: { start: '2025-02-01', end: '2025-04-30' },
    p2: { start: '2025-01-15', end: '2025-06-30' },
    p3: { start: '2025-02-20', end: '2025-05-31' },
    p4: { start: '2024-12-01', end: '2025-03-31' },
    p5: { start: '2025-03-01', end: '2025-03-31' },
  }
  const period = periodByProject[projectId]
  const { list: identityList, defaultIdentityId } = buildIdentities(projectId)
  const defaultIdentity = defaultIdentityId ? getIdentityById(defaultIdentityId) : null
  const identityPlatformSummary =
    identityList.length > 0
      ? [...new Set(identityList.flatMap((i) => (i.platformLabels ? i.platformLabels.split('、') : [])))].join('、') || '—'
      : undefined
  return {
    ...base,
    startDate: period?.start,
    endDate: period?.end,
    channelCount: p.channel ? 1 : 0,
    taskSummary: p.taskProgress ?? '—',
    identityCount: identityList.length,
    defaultIdentityName: defaultIdentity?.name,
    identityPlatformSummary: identityList.length > 0 ? identityPlatformSummary : undefined,
  }
}

export function getProjectDetail(projectId: string): ProjectDetailData | null {
  const summary = buildSummary(projectId)
  if (!summary) return null

  const { list: identityList } = buildIdentities(projectId)
  const identityNameAt = (index: number) => identityList[index]?.name

  return {
    summary,
    overview: {
      recentTasks: [
        { id: 't1', taskName: '社媒发布-0328', status: '运行中', updatedAt: '2025-03-08 10:30', identityName: identityNameAt(0) },
        { id: 't2', taskName: '内容审核-批次3', status: '待审核', updatedAt: '2025-03-08 08:15', identityName: identityNameAt(1) },
        { id: 't3', taskName: '数据拉取-日更', status: '已完成', updatedAt: '2025-03-08 09:00', identityName: identityNameAt(0) },
      ],
      alerts: [
        { id: 'a1', level: 'warning', message: '任务「社媒发布-0328」已超时，请处理' },
        { id: 'a2', level: 'info', message: '终端「X 账号-主」将于 2 小时后刷新 Token' },
      ],
    },
    goals: {
      goalDescription: summary.goalSummary || summary.description,
      phaseGoals: [
        { id: 'pg1', name: '启动期', dateRange: '2025-02-01 ～ 2025-02-28', description: '渠道接入与内容试跑', status: '已完成' },
        { id: 'pg2', name: '放量期', dateRange: '2025-03-01 ～ 2025-04-15', description: '全渠道内容发布与效果追踪', status: '进行中' },
        { id: 'pg3', name: '收尾期', dateRange: '2025-04-16 ～ 2025-04-30', description: '数据汇总与复盘', status: '未开始' },
      ],
      kpiDefinitions: [
        { id: 'k1', name: '曝光量', target: '50w', current: '32w', unit: '次' },
        { id: 'k2', name: '互动率', target: '5%', current: '4.2%', unit: '%' },
        { id: 'k3', name: '任务完成率', target: '99%', current: '98%', unit: '%' },
      ],
    },
    channels: {
      list: [
        { id: 'ch1', name: '社媒综合', type: '社媒', status: '正常', boundAt: '2025-02-01' },
        { id: 'ch2', name: 'API 接入', type: 'API', status: '正常', boundAt: '2025-02-05' },
      ],
    },
    agentTeam: {
      teamName: summary.agentTeamName || '未绑定',
      teamStatus: '启用',
      teamDescription: '负责内容撰写、审核与发布流程的 Agent 组合',
      roles: [
        { id: 'r1', roleName: '撰写', agentName: '内容撰写 Agent', model: 'GPT-4', status: '启用' },
        { id: 'r2', roleName: '审核', agentName: '审核 Agent', model: 'GPT-4', status: '启用' },
      ],
    },
    identities: buildIdentities(projectId),
    terminals: {
      list: [
        { id: 'term1', name: 'FB 主账号', type: '社媒', status: '正常', assignedAt: '2025-02-01', primaryIdentityId: identityList[0]?.identityId, identityName: identityList[0]?.name },
        { id: 'term2', name: 'X 主账号', type: '社媒', status: '正常', assignedAt: '2025-02-01', primaryIdentityId: identityList[1]?.identityId, identityName: identityList[1]?.name },
        { id: 'term3', name: 'Chrome 自动化-1', type: 'Web', status: '正常', assignedAt: '2025-02-10' },
        { id: 'term4', name: '数据接口-日更', type: 'API', status: '正常', assignedAt: '2025-02-05' },
      ],
    },
    workflowTasks: (() => {
      const createdTasks = getCreatedTasksForProject(projectId)
      const isP5 = projectId === 'p5'
      const workflows = isP5
        ? [{ id: 'wt-facebook', name: 'Facebook 社媒闭环', version: 'v1.0', status: '启用', lastRunAt: '2025-03-08 11:00' }]
        : [
            { id: 'w1', name: '社媒发布流程', version: 'v1.2', status: '启用', lastRunAt: '2025-03-08 10:00' },
            { id: 'w2', name: '内容审核流程', version: 'v1.0', status: '启用', lastRunAt: '2025-03-08 08:15' },
          ]
      const baseTasks: TaskItem[] = isP5
        ? []
        : ([
            { id: 'rt1', taskName: '社媒发布-0328', workflowName: '社媒发布流程', status: '运行中', assigneeName: '张三', updatedAt: '2025-03-08 10:30', identityId: identityList[0]?.identityId, identityName: identityList[0]?.name, workflowTemplateId: 'wt1', workflowInstanceId: 'wi1', currentNodeKey: 'step2' },
            { id: 'rt2', taskName: '内容审核-批次3', workflowName: '内容审核流程', status: '待审核', assigneeName: '张三', updatedAt: '2025-03-08 08:15', identityId: identityList[1]?.identityId, identityName: identityList[1]?.name, workflowTemplateId: 'wt2', workflowInstanceId: 'wi2', currentNodeKey: 'step3' },
            { id: 'rt3', taskName: '数据拉取-日更', workflowName: '数据同步流程', status: '已完成', assigneeName: '系统', updatedAt: '2025-03-08 09:00', identityId: identityList[0]?.identityId, identityName: identityList[0]?.name, workflowTemplateId: 'wt3', workflowInstanceId: 'wi3', currentNodeKey: 'step2' },
          ] as TaskItem[])
      const running = createdTasks.filter((t) => t.status === '运行中').length + (isP5 ? 0 : 2)
      const review = createdTasks.filter((t) => t.status === '待审核').length + (isP5 ? 0 : 1)
      const done = createdTasks.filter((t) => t.status === '已完成').length + (isP5 ? 0 : 1)
      return {
        workflows,
        recentTasks: baseTasks.concat(createdTasks),
        taskSummary: { running, review, failed: 0, done },
      }
    })(),
    results: {
      feeds: ([
        { id: 'f1', source: '社媒平台回流', count: '1,234 条', updatedAt: '2025-03-08 10:00', identityId: identityList[0]?.identityId, identityName: identityList[0]?.name },
        { id: 'f2', source: 'API 数据同步', count: '28 条', updatedAt: '2025-03-08 09:30', identityId: identityList[0]?.identityId, identityName: identityList[0]?.name },
      ] as ResultFeedItem[]).concat(getDynamicResultFeeds(projectId)),
      kpiAchievements: [
        { id: 'ka1', name: '曝光量', target: '50w', current: '32w', rate: '64%' },
        { id: 'ka2', name: '互动率', target: '5%', current: '4.2%', rate: '84%' },
      ],
    },
    settings: {
      members: [
        { id: 'm1', name: '张三', role: '负责人', scope: '全部' },
        { id: 'm2', name: '李四', role: '成员', scope: '任务与流程' },
      ],
    },
    projectGoals: getGoalsByProjectId(projectId),
    projectDeliverables: getDeliverablesByProjectId(projectId),
    projectResourceConfigs: getResourceConfigsByProjectId(projectId),
    projectSOP: getSOPByProjectId(projectId),
  }
}

/**
 * 获取任务详情（含身份摘要）。从当前项目聚合数据中查找，支持静态任务与 createTask 创建的任务。
 */
export function getTaskDetail(projectId: string, taskId: string): TaskDetailView | null {
  const data = getProjectDetail(projectId)
  if (!data) return null
  const task = data.workflowTasks.recentTasks.find((t) => t.id === taskId)
  if (!task) return null
  const view: TaskDetailView = { ...task }
  if (task.identityId) {
    const identity = getIdentityById(task.identityId) as Identity | null
    if (identity) {
      const summary = identity.corePositioning ?? ''
      view.identitySummary = {
        name: identity.name,
        type: IDENTITY_TYPE_LABELS[identity.type] ?? identity.type ?? '—',
        corePositioningSummary: summary.length > CORE_POSITIONING_MAX_LEN ? summary.slice(0, CORE_POSITIONING_MAX_LEN) + '…' : summary || '—',
      }
    }
  }
  return view
}
