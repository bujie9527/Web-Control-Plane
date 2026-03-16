/**
 * Skill 类型（平台级能力资产）
 * 与 AgentTemplate/Skill 治理规则对齐，作为系统级可复用能力对象。
 */

import type { ApiResponse, ListResult } from '@/core/types/api'

/** Skill 状态 */
export type SkillStatus = 'active' | 'inactive'

/** 执行类型（与后端 executionType 枚举对齐） */
export type SkillExecutionType = 'llm' | 'external_api' | 'internal_api' | 'hybrid'

/** 平台级 Skill 定义 */
export interface Skill {
  /** 身份信息 */
  id: string
  /** 英文名称，用于内部标识 */
  name: string
  /** 中文展示名称，前台优先使用 */
  nameZh?: string
  /** 大写下划线编码 */
  code: string
  /** 业务分类（如 content/review/publish/research 等） */
  category: string
  /** 执行类型（LLM / 外部API / 内部API / 混合） */
  executionType: SkillExecutionType
  /** 能力说明（中文） */
  description?: string
  /** 版本号 */
  version: string
  /** 状态 */
  status: SkillStatus
  /** 是否为系统预置 Skill */
  isSystemPreset: boolean

  /**
   * OpenClaw 兼容结构占位
   * 当前阶段仅作为结构占位，不做完整解析
   */
  openClawSpec?: {
    steps?: string[]
    inputSchemaJson?: string
    outputSchemaJson?: string
  }
  inputSchemaJson?: string
  outputSchemaJson?: string
  executionConfigJson?: string
  promptTemplate?: string
  requiredContextFields?: string[]
  estimatedDurationMs?: number
  retryable?: boolean
  maxRetries?: number

  /**
   * 被哪些 AgentTemplate 使用（由服务层计算或在 mock 中维护）
   * 主要用于前台展示引用关系
   */
  boundAgentTemplateIds?: string[]

  /** 审计字段 */
  createdAt: string
  updatedAt: string
}

/** 列表查询参数 */
export interface SkillListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: SkillStatus
  category?: string
}

/** 新建 Skill 请求载荷 */
export interface CreateSkillPayload {
  name: string
  nameZh?: string
  code: string
  category: string
  executionType: SkillExecutionType
  description?: string
  version?: string
  status?: SkillStatus
  isSystemPreset?: boolean
  openClawSpec?: Skill['openClawSpec']
}

/** 更新 Skill 请求载荷 */
export interface UpdateSkillPayload {
  name?: string
  nameZh?: string
  description?: string
  category?: string
  executionType?: SkillExecutionType
  version?: string
  status?: SkillStatus
  openClawSpec?: Skill['openClawSpec']
  inputSchemaJson?: string
  outputSchemaJson?: string
  executionConfigJson?: string
  promptTemplate?: string
  requiredContextFields?: string[]
  estimatedDurationMs?: number
  retryable?: boolean
  maxRetries?: number
}

export type { ApiResponse, ListResult }

