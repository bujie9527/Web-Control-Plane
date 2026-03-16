/**
 * 项目详情工作台所需类型，与 Project 对齐并扩展各 Tab 数据
 */
import type { Project } from './project'
import type {
  ProjectGoal,
  ProjectDeliverable,
  ProjectResourceConfig,
  ProjectSOP,
} from './projectDomain'

export interface ProjectDetailSummary extends Project {
  startDate?: string
  endDate?: string
  channelCount?: number
  taskSummary?: string
  /** 已绑定身份数量 */
  identityCount?: number
  /** 默认身份名称 */
  defaultIdentityName?: string
  /** 适用平台摘要，如「微信、X、抖音」 */
  identityPlatformSummary?: string
}

export interface RecentTaskItem {
  id: string
  taskName: string
  status: string
  updatedAt: string
  /** 展示用：使用身份名称 */
  identityName?: string
}

export interface AlertTodoItem {
  id: string
  level: 'info' | 'warning' | 'error'
  message: string
}

export interface PhaseGoalItem {
  id: string
  name: string
  dateRange: string
  description: string
  status: string
}

export interface KpiDefinitionItem {
  id: string
  name: string
  target: string
  current: string
  unit: string
}

export interface ChannelItem {
  id: string
  name: string
  type: string
  status: string
  boundAt: string
}

export interface AgentRoleItem {
  id: string
  roleName: string
  agentName: string
  model: string
  status: string
}

export interface TerminalItem {
  id: string
  name: string
  type: string
  status: string
  assignedAt: string
  /** 预留：绑定的主身份 ID */
  primaryIdentityId?: string
  /** 展示用：绑定身份名称 */
  identityName?: string
}

export interface WorkflowItem {
  id: string
  name: string
  version: string
  status: string
  lastRunAt: string
}

export interface TaskItem {
  id: string
  taskName: string
  workflowName: string
  status: string
  assigneeName: string
  updatedAt: string
  /** 本任务使用的身份 ID */
  identityId?: string
  /** 展示用：使用身份名称 */
  identityName?: string
  /** 关联的流程模板 ID */
  workflowTemplateId?: string
  /** 关联的流程实例 ID */
  workflowInstanceId?: string
  /** 关联的流程实例节点 ID */
  workflowNodeId?: string
  /** 当前节点 key */
  currentNodeKey?: string
}

/** 任务详情视图：含身份摘要（名称、类型、核心定位摘要） */
export interface TaskDetailView extends TaskItem {
  identitySummary?: {
    name: string
    type: string
    corePositioningSummary: string
  }
}

export interface ResultFeedItem {
  id: string
  source: string
  count: string
  updatedAt: string
  /** 该条回流关联的身份 ID（可选） */
  identityId?: string
  /** 展示用：身份名称 */
  identityName?: string
}

export interface KpiAchievementItem {
  id: string
  name: string
  target: string
  current: string
  rate: string
}

export interface ProjectMemberItem {
  id: string
  name: string
  role: string
  scope: string
}

/** 项目绑定的身份项（用于身份配置 Tab 与概览） */
export interface ProjectIdentityBindingItem {
  identityId: string
  name: string
  type: string
  platformLabels?: string
  isDefault: boolean
}

export interface ProjectDetailData {
  summary: ProjectDetailSummary
  overview: {
    recentTasks: RecentTaskItem[]
    alerts: AlertTodoItem[]
  }
  goals: {
    goalDescription?: string
    phaseGoals: PhaseGoalItem[]
    kpiDefinitions: KpiDefinitionItem[]
  }
  channels: {
    list: ChannelItem[]
  }
  agentTeam: {
    teamName: string
    teamStatus: string
    teamDescription?: string
    roles: AgentRoleItem[]
  }
  identities: {
    list: ProjectIdentityBindingItem[]
    defaultIdentityId?: string
  }
  terminals: {
    list: TerminalItem[]
  }
  workflowTasks: {
    workflows: WorkflowItem[]
    recentTasks: TaskItem[]
    taskSummary: { running: number; review: number; failed: number; done: number }
  }
  results: {
    feeds: ResultFeedItem[]
    kpiAchievements: KpiAchievementItem[]
  }
  settings: {
    members: ProjectMemberItem[]
  }
  /** 项目领域子对象：目标（显式建模） */
  projectGoals?: ProjectGoal[]
  /** 项目领域子对象：交付标的 */
  projectDeliverables?: ProjectDeliverable[]
  /** 项目领域子对象：资源配置 */
  projectResourceConfigs?: ProjectResourceConfig[]
  /** 项目领域子对象：SOP，每项目至多一条 */
  projectSOP?: ProjectSOP | null
}
