/**
 * Agent Template 前台中文映射
 * 与 33-agent-library-baseline-rules 一致
 */
import type {
  AgentTemplateRoleType,
  AgentTemplateStatus,
  AgentPlatformType,
  ExecutorType,
} from '@/modules/platform/schemas/agentTemplate'

/** Agent 模板状态 */
export const AGENT_TEMPLATE_STATUS_LABELS: Record<AgentTemplateStatus, string> = {
  draft: '草稿',
  active: '已发布',
  inactive: '已停用',
  archived: '已归档',
}

/** Agent 角色类型 */
export const AGENT_ROLE_TYPE_LABELS: Record<AgentTemplateRoleType, string> = {
  creator: '创作者',
  reviewer: '审核者',
  publisher: '发布者',
  recorder: '记录者',
  coordinator: '协调者',
  supervisor: '执行监督助手',
  planner: '规划者',
  other: '其他',
}

/** Agent 分类（planning / execution / coordination） */
export const AGENT_CATEGORY_LABELS: Record<string, string> = {
  planning: '规划',
  execution: '执行',
  coordination: '协调',
  /** 兼容旧分类 */
  content: '内容',
  review: '审核',
  publish: '发布',
  analytics: '分析',
  domain: '领域',
}

/** Agent 平台分类（与 category 同时生效） */
export const AGENT_PLATFORM_TYPE_LABELS: Record<AgentPlatformType, string> = {
  general: '通用',
  facebook: 'Facebook 专用',
  x: 'X (Twitter) 专用',
  tiktok: 'TikTok 专用',
  instagram: 'Instagram 专用',
  wechat: '微信专用',
}

/** 默认执行器类型 */
export const EXECUTOR_TYPE_LABELS: Record<ExecutorType, string> = {
  human: '人工',
  agent: 'Agent',
  system: '系统',
  api: 'API',
}
