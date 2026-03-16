/**
 * 项目目标 Mock，按 projectId 维度
 */
import type { ProjectGoal, ProjectGoalType } from '../schemas/projectDomain'

/** goalTypeCode 到 ProjectGoalType 的映射（兼容旧结构） */
const goalTypeCodeToEnum: Record<string, ProjectGoalType> = {
  ACCOUNT_FOLLOWERS: 'growth',
  ACCOUNT_ENGAGEMENT: 'growth',
  ACCOUNT_VIEWS: 'growth',
  ACCOUNT_POST_STABILITY: 'growth',
  PRIVATE_CONTACTS: 'conversion',
  DM_INQUIRIES: 'conversion',
  FORM_LEADS: 'conversion',
  INDEX_COUNT: 'other',
  KEYWORD_RANK: 'other',
  ORGANIC_TRAFFIC: 'other',
}

export interface CreateGoalPayload {
  goalTypeCode?: string
  goalName: string
  goalDescription: string
  successCriteria?: string
  kpiDefinition?: string
  primaryMetricCode?: string
  secondaryMetricCodes?: string[]
}

const projectGoalsByProject: Record<string, ProjectGoal[]> = {
  p1: [
    {
      id: 'pg1-p1',
      projectId: 'p1',
      goalType: 'brand' as ProjectGoalType,
      goalName: '品牌曝光与认知提升',
      goalDescription: '通过社媒内容与活动提升品牌在目标人群中的曝光与认知',
      successCriteria: '曝光量达 50w+，互动率 ≥5%',
      kpiDefinition: '曝光量、互动率、内容完播率',
      isLocked: true,
      createdAt: '2025-02-01',
      updatedAt: '2025-03-01',
    },
    {
      id: 'pg2-p1',
      projectId: 'p1',
      goalType: 'conversion' as ProjectGoalType,
      goalName: '私域引流',
      goalDescription: '将公域流量引导至私域，沉淀可运营用户',
      successCriteria: '月新增私域用户 500+',
      kpiDefinition: '引流转化率、私域新增数',
      isLocked: false,
      createdAt: '2025-02-15',
      updatedAt: '2025-03-08',
    },
  ],
  p2: [
    {
      id: 'pg1-p2',
      projectId: 'p2',
      goalType: 'other' as ProjectGoalType,
      goalName: '数据准时更新',
      goalDescription: '多源数据每日自动拉取并更新至看板',
      successCriteria: '每日 9:00 前完成更新，准时率 99%',
      kpiDefinition: '更新准时率、数据条数',
      isLocked: true,
      createdAt: '2025-01-15',
      updatedAt: '2025-02-01',
    },
  ],
  p3: [
    {
      id: 'pg1-p3',
      projectId: 'p3',
      goalType: 'growth' as ProjectGoalType,
      goalName: '内容产能与审核效率',
      goalDescription: '提升内容生产与审核的自动化程度与日处理量',
      successCriteria: '日审 100+ 条，人工抽检通过率 95%+',
      kpiDefinition: '日审核量、通过率',
      isLocked: false,
      createdAt: '2025-02-20',
      updatedAt: '2025-03-08',
    },
  ],
}

export function getGoalsByProjectId(projectId: string): ProjectGoal[] {
  return projectGoalsByProject[projectId] ?? []
}

export function createGoal(projectId: string, payload: CreateGoalPayload): ProjectGoal {
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
  const id = `pg-${projectId}-${Date.now()}`
  const goalType =
    payload.goalTypeCode && goalTypeCodeToEnum[payload.goalTypeCode]
      ? goalTypeCodeToEnum[payload.goalTypeCode]
      : ('growth' as ProjectGoalType)
  const goal: ProjectGoal = {
    id,
    projectId,
    goalType,
    goalName: payload.goalName,
    goalDescription: payload.goalDescription,
    successCriteria: payload.successCriteria,
    kpiDefinition: payload.kpiDefinition,
    isLocked: false,
    createdAt: now,
    updatedAt: now,
    goalTypeCode: payload.goalTypeCode,
    primaryMetricCode: payload.primaryMetricCode,
    secondaryMetricCodes: payload.secondaryMetricCodes ?? [],
  }
  if (!projectGoalsByProject[projectId]) projectGoalsByProject[projectId] = []
  projectGoalsByProject[projectId].push(goal)
  return goal
}
