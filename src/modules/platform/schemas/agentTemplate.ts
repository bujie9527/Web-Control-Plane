/**
 * Agent Template 类型，平台级模板资产对象
 * 与 .cursor/rules/15-agent-template-factory 一致
 */

import type { ApiResponse, ListResult } from '@/core/types/api'

/** 模板状态 */
export type AgentTemplateStatus = 'draft' | 'active' | 'inactive' | 'archived'

/** 角色类型 */
export type AgentTemplateRoleType =
  | 'creator'
  | 'reviewer'
  | 'publisher'
  | 'recorder'
  | 'coordinator'
  | 'supervisor'
  | 'planner'
  | 'other'

/** 执行者类型 */
export type ExecutorType = 'human' | 'agent' | 'system' | 'api'

/** 终端类型（占位，可扩展） */
export type TerminalType = 'facebook' | 'x' | 'tiktok' | 'wechat' | 'api' | 'other'

/** 平台分类（与 category 同时生效，用于按平台筛选展示） */
export type AgentPlatformType = 'general' | 'facebook' | 'x' | 'tiktok' | 'instagram' | 'wechat'

/** 执行模式 */
export type ExecutionMode = 'manual' | 'semi_auto' | 'full_auto'

/** Agent 模板 */
export interface AgentTemplate {
  /** 身份信息 */
  id: string
  name: string
  /** 中文展示名称，前台优先使用 */
  nameZh?: string
  code: string
  description?: string
  roleType: AgentTemplateRoleType

  /** 分类：planning | execution | coordination */
  category?: string
  domain?: string
  sceneTags?: string[]
  /** 平台分类（与 category 同时生效）：general | facebook | x | tiktok | instagram | wechat */
  platformType?: AgentPlatformType

  /** 来源 */
  archetypeCode?: string
  parentTemplateId?: string
  sourceTemplateId?: string
  sourceVersion?: string
  /** 来源版本号（Phase 15.5，用于派生关系） */
  sourceVersionNumber?: number

  /** 规划类 Agent 专用（Phase 15.5） */
  plannerDomain?: 'general' | 'social' | 'website' | 'ai_employee'
  plannerTier?: 'base' | 'domain'
  plannerStrategyProfileId?: string
  changeSummary?: string[]
  capabilityNotes?: string

  /** 生命周期 */
  status: AgentTemplateStatus
  version: string
  isLatest: boolean
  isSystemPreset: boolean
  isCloneable: boolean

  /** 适用范围 */
  supportedProjectTypeIds?: string[]
  supportedGoalTypeIds?: string[]

  /** 能力授权 */
  supportedSkillIds?: string[]
  defaultExecutorType: ExecutorType
  allowedExecutorTypes?: ExecutorType[]
  allowedTerminalTypes?: TerminalType[]

  /** 模型配置 */
  defaultModelKey?: string
  fallbackModelKeys?: string[]
  temperature?: number
  maxTokens?: number

  /** Prompt */
  systemPromptTemplate?: string
  instructionTemplate?: string
  outputFormat?: string
  /** 渠道风格映射（如 telegram_bot / wordpress / facebook_page） */
  channelStyleProfiles?: Record<string, unknown>

  /** Guardrails */
  requireGoalContext: boolean
  requireIdentityContext: boolean
  requireSOPContext: boolean
  requireStructuredOutput: boolean
  disallowDirectTerminalAction: boolean

  /** 审核策略 */
  requireHumanReview: boolean
  requireNodeReview: boolean
  autoApproveWhenConfidenceGte?: number

  /** 执行模式 */
  manual: boolean
  semi_auto: boolean
  full_auto: boolean

  /** 审计 */
  createdAt: string
  updatedAt: string
}

/** 列表查询参数 */
export interface AgentTemplateListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: AgentTemplateStatus
  category?: string
  domain?: string
  roleType?: AgentTemplateRoleType
  isSystemPreset?: boolean
  platformType?: AgentPlatformType
}

/** 创建模板请求 */
export interface CreateAgentTemplatePayload {
  name: string
  code: string
  description?: string
  roleType: AgentTemplateRoleType
  category?: string
  domain?: string
  sceneTags?: string[]
  platformType?: AgentPlatformType
  archetypeCode?: string
  parentTemplateId?: string
  supportedProjectTypeIds?: string[]
  supportedGoalTypeIds?: string[]
  supportedSkillIds?: string[]
  defaultExecutorType: ExecutorType
  allowedExecutorTypes?: ExecutorType[]
  allowedTerminalTypes?: TerminalType[]
  defaultModelKey?: string
  fallbackModelKeys?: string[]
  temperature?: number
  maxTokens?: number
  systemPromptTemplate?: string
  instructionTemplate?: string
  outputFormat?: string
  channelStyleProfiles?: Record<string, unknown>
  requireGoalContext?: boolean
  requireIdentityContext?: boolean
  requireSOPContext?: boolean
  requireStructuredOutput?: boolean
  disallowDirectTerminalAction?: boolean
  requireHumanReview?: boolean
  requireNodeReview?: boolean
  autoApproveWhenConfidenceGte?: number
  manual?: boolean
  semi_auto?: boolean
  full_auto?: boolean
}

/**
 * 复制模板请求（第三阶段）
 * 必填：name, code, category, domain, sceneTags
 * 可选继承：Skill、模型配置、Guardrails、ReviewPolicy
 */
export interface CloneAgentTemplatePayload {
  name: string
  code: string
  category?: string
  domain?: string
  sceneTags?: string[]
  /** 是否继承 Skill 配置 */
  inheritSkills?: boolean
  /** 是否继承模型配置 */
  inheritModelConfig?: boolean
  /** 是否继承 Guardrails */
  inheritGuardrails?: boolean
  /** 是否继承 ReviewPolicy */
  inheritReviewPolicy?: boolean
}

export type { ApiResponse, ListResult }
