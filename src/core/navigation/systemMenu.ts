import { ROUTES } from '@/core/constants/routes'
import type { MenuItem } from './types'

/** 系统管理员专属菜单（分组结构）；顶部提供返回平台工作台入口 */
export const systemMenuConfig: MenuItem[] = [
  { key: 'platform-home', path: ROUTES.PLATFORM.HOME, label: '← 平台工作台', icon: 'ArrowLeft' },
  { key: 'group-ai', path: '', label: 'AI 能力工厂', isGroupLabel: true },
  { key: 'agent-factory', path: ROUTES.SYSTEM.AGENT_FACTORY, label: 'Agent 模板管理', icon: 'Bot' },
  { key: 'skill-factory', path: ROUTES.SYSTEM.SKILL_FACTORY, label: 'Skill 模板管理', icon: 'Zap' },
  { key: 'llm-configs', path: ROUTES.SYSTEM.LLM_CONFIGS, label: 'LLM 模型配置', icon: 'Brain' },

  { key: 'group-workflow', path: '', label: '流程资产', isGroupLabel: true },
  { key: 'wf-templates', path: ROUTES.SYSTEM.WORKFLOW_TEMPLATES, label: '流程模板管理', icon: 'GitBranch' },
  { key: 'wf-planning', path: ROUTES.SYSTEM.WORKFLOW_PLANNING, label: '流程规划会话', icon: 'Route' },

  { key: 'group-terminal', path: '', label: '基础设施', isGroupLabel: true },
  { key: 'platform-caps', path: ROUTES.SYSTEM.PLATFORM_CAPABILITIES, label: '终端类型注册', icon: 'MonitorSmartphone' },
  { key: 'datasource-configs', path: ROUTES.SYSTEM.DATASOURCE_CONFIGS, label: '数据源配置中心', icon: 'Database' },
  { key: 'webhooks', path: ROUTES.SYSTEM.WEBHOOKS, label: 'Webhook 管理', icon: 'Webhook' },

  { key: 'group-monitor', path: '', label: '运行监控', isGroupLabel: true },
  { key: 'wf-runtime', path: ROUTES.SYSTEM.WORKFLOW_RUNTIME, label: '流程运行监控', icon: 'Activity' },
  { key: 'msg-pipeline', path: ROUTES.SYSTEM.MESSAGE_PIPELINE, label: '消息管线监控', icon: 'Radio' },
  { key: 'sched-tasks', path: ROUTES.SYSTEM.SCHEDULED_TASKS, label: '定时任务总览', icon: 'Clock' },
]
