/**
 * 项目子域类型定义 — ProjectIdentityBinding / ProjectDeliverable / ProjectResourceConfig
 * 批次 9：对应 Prisma 新增模型及后端聚合接口
 */

// ─── ProjectIdentityBinding ──────────────────────────────────────────────────

export interface ProjectIdentityBinding {
  id: string
  projectId: string
  identityId: string
  isDefault: boolean
  createdAt: string
}

/** 工作台聚合中带有身份基础信息的绑定条目 */
export interface ProjectIdentityBindingWithInfo extends ProjectIdentityBinding {
  identityName: string
  identityType?: string | null
  identityStatus: string
}

// ─── ProjectDeliverable ──────────────────────────────────────────────────────

export type ProjectDeliverableType =
  | 'content'
  | 'follower'
  | 'lead'
  | 'website_update'
  | 'other'

export type ProjectDeliverableFrequency = 'daily' | 'weekly' | 'monthly' | 'one_time'

export interface ProjectDeliverable {
  id: string
  projectId: string
  deliverableType: ProjectDeliverableType
  description: string
  frequency?: ProjectDeliverableFrequency | null
  target?: string | null
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type CreateProjectDeliverablePayload = Omit<ProjectDeliverable, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateProjectDeliverablePayload = Partial<Omit<ProjectDeliverable, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>

// ─── ProjectResourceConfig ───────────────────────────────────────────────────

export type ProjectResourceConfigType =
  | 'agent_scope'
  | 'preferred_agent'
  | 'budget'
  | 'other'

export interface ProjectResourceConfig {
  id: string
  projectId: string
  configType: ProjectResourceConfigType
  label: string
  value: string
  notes?: string | null
  createdAt: string
  updatedAt: string
}

export type CreateProjectResourceConfigPayload = Omit<ProjectResourceConfig, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateProjectResourceConfigPayload = Partial<Omit<ProjectResourceConfig, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>

// ─── ProjectWorkbenchData（来自 /api/projects/:id/workbench）────────────────

export interface WorkbenchProjectBase {
  id: string
  tenantId: string
  name: string
  description?: string | null
  status: string
  projectTypeCode?: string | null
  goalSummary?: string | null
  kpiSummary?: string | null
  allowedAgentTemplateIds: string[]
  preferredAgentTemplateIds: string[]
  selectedWorkflowTemplateId?: string | null
  createdAt: string
  updatedAt: string
}

export interface WorkbenchGoal {
  id: string
  goalName: string
  goalType: string
  goalTypeCode?: string | null
  primaryMetricCode?: string | null
  secondaryMetricCodes: string[]
  successCriteria?: string | null
  kpiDefinition?: string | null
  isLocked: boolean
  createdAt: string
}

export interface WorkbenchSOP {
  id: string
  sopRaw: string
  sopParsed?: string | null
  status: string
  version: string
  updatedAt: string
}

export interface WorkbenchRecentTask {
  id: string
  title: string
  status: string
  updatedAt: string
  workflowInstanceId?: string | null
}

export interface WorkbenchRecentInstance {
  id: string
  workflowTemplateId: string
  templateName?: string
  status: string
  nodeCount: number
  completedNodeCount: number
  createdAt: string
  updatedAt: string
}

export interface ProjectWorkbenchData {
  project: WorkbenchProjectBase
  goals: WorkbenchGoal[]
  sop?: WorkbenchSOP | null
  identityBindings: ProjectIdentityBindingWithInfo[]
  deliverables: Pick<ProjectDeliverable, 'id' | 'deliverableType' | 'description' | 'frequency' | 'target' | 'notes'>[]
  resourceConfigs: Pick<ProjectResourceConfig, 'id' | 'configType' | 'label' | 'value' | 'notes'>[]
  recentTasks: WorkbenchRecentTask[]
  recentInstances: WorkbenchRecentInstance[]
}
