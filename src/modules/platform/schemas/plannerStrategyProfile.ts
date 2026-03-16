/**
 * 规划助手策略配置（Phase 15.5）
 * 定义垂直 Planner 的差异化策略
 */
export type PlannerDomain = 'general' | 'social' | 'website' | 'ai_employee'

/** 风险偏好配置 */
export interface PlannerRiskProfile {
  emphasizeReview: boolean
  emphasizePublishTracking: boolean
  emphasizeApprovalGates: boolean
  emphasizeSeoStructure: boolean
  emphasizeHumanIntervention: boolean
}

/** 规划策略配置 */
export interface PlannerStrategyProfile {
  id: string
  name: string
  nameZh: string
  plannerDomain: PlannerDomain
  systemPromptTemplate: string
  instructionTemplate?: string
  preferredAgentTemplateIds: string[]
  preferredSkillIds: string[]
  preferredDeliverableModes: string[]
  riskProfile: PlannerRiskProfile
  changeSummary?: string[]
  capabilityNotes?: string
  notes?: string
}
