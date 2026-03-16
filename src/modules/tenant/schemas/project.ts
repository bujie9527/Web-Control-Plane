import type { ApiResponse, ListResult } from '@/core/types/api'

/**
 * 租户内项目类型，与 04-core-domain-model 一致
 * 列表展示扩展：channel, ownerName, agentTeamName, terminalCount, taskProgress
 */
export type ProjectStatus = 'draft' | 'running' | 'paused' | 'archived'

export interface Project {
  id: string
  tenantId: string
  name: string
  description?: string
  status: ProjectStatus
  ownerId: string
  /** 项目类型 code，来自 ProjectType，用于项目创建向导 */
  projectTypeCode?: string
  goalSummary?: string
  kpiSummary?: string
  /** 可用 Agent 范围（Project 层只负责范围与偏好） */
  allowedAgentTemplateIds?: string[]
  /** 推荐 Agent 组合 */
  preferredAgentTemplateIds?: string[]
  /** 默认流程规划助手 */
  defaultPlannerAgentTemplateId?: string
  /** 执行监督 Agent（预留） */
  defaultSupervisorAgentTemplateId?: string
  /** 项目绑定的流程模板 ID（创建时选择，用于后续创建实例） */
  selectedWorkflowTemplateId?: string
  createdAt: string
  updatedAt: string
  /** 列表展示：所属渠道 */
  channel?: string
  /** 列表展示：负责人姓名 */
  ownerName?: string
  /** 列表展示：绑定 Agent 团队名称 */
  agentTeamName?: string
  /** 列表展示：绑定终端数 */
  terminalCount?: number
  /** 列表展示：任务进度，如 "12/20" 或 "60%" */
  taskProgress?: string
}

export interface ProjectListParams {
  page?: number
  pageSize?: number
  keyword?: string
  status?: ProjectStatus
  channel?: string
}

export type { ApiResponse, ListResult }
