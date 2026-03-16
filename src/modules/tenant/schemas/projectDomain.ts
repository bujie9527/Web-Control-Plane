/**
 * 项目领域子对象：Goal / Deliverable / ResourceConfig / SOP
 * 与 10-project-domain-model、09/10 rules 一致
 */

/** 目标类型 */
export type ProjectGoalType = 'growth' | 'brand' | 'conversion' | 'other'

/** 项目目标 */
export interface ProjectGoal {
  id: string
  projectId: string
  goalType: ProjectGoalType
  goalName: string
  goalDescription: string
  successCriteria?: string
  kpiDefinition?: string
  isLocked: boolean
  createdAt: string
  updatedAt: string
  /** 目标类型 code，来自 GoalType */
  goalTypeCode?: string
  /** 主目标指标 code，来自 GoalMetricOption */
  primaryMetricCode?: string
  /** 辅助指标 code 列表 */
  secondaryMetricCodes?: string[]
}

/** 交付类型 */
export type ProjectDeliverableType = 'content' | 'leads' | 'data' | 'other'

/** 项目交付标的 */
export interface ProjectDeliverable {
  id: string
  projectId: string
  deliverableType: ProjectDeliverableType
  deliverableName: string
  description?: string
  frequency?: string
  targetValue?: string
  unit?: string
  createdAt: string
  updatedAt: string
}

/** 资源配置类型：与架构文档一致 */
export type ProjectResourceType = 'identity' | 'terminal' | 'server' | 'api' | 'agentTeam'

/** 项目资源配置 */
export interface ProjectResourceConfig {
  id: string
  projectId: string
  resourceType: ProjectResourceType
  resourceId: string
  resourceName: string
  resourceSummary?: string
  status: string
  createdAt: string
  updatedAt: string
}

/** SOP 状态 */
export type ProjectSOPStatus = 'draft' | 'active' | 'archived'

/** 项目 SOP：sopParsed 为后续 Workflow 解析占位 */
export interface ProjectSOP {
  id: string
  projectId: string
  sopRaw: string
  /** 结构化解析结果，当前阶段占位 */
  sopParsed?: Record<string, unknown> | null
  status: ProjectSOPStatus
  version: string
  createdAt: string
  updatedAt: string
}
