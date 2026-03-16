import { ROUTES } from '@/core/constants/routes'
import type { MenuItem } from './types'

/** 系统管理员专属菜单（分组结构）；顶部提供返回平台工作台入口 */
export const systemMenuConfig: MenuItem[] = [
  { key: 'platform-home', path: ROUTES.PLATFORM.HOME, label: '平台工作台' },
  { key: 'group-ai', path: '', label: 'AI 能力配置', isGroupLabel: true },
  { key: 'agent-factory', path: ROUTES.SYSTEM.AGENT_FACTORY, label: 'Agent 模板管理' },
  { key: 'skill-factory', path: ROUTES.SYSTEM.SKILL_FACTORY, label: 'Skills 管理' },
  { key: 'llm-configs', path: ROUTES.SYSTEM.LLM_CONFIGS, label: '模型配置中心' },

  { key: 'group-workflow', path: '', label: '流程资产', isGroupLabel: true },
  { key: 'wf-templates', path: ROUTES.SYSTEM.WORKFLOW_TEMPLATES, label: '流程模板管理' },
  { key: 'wf-planning', path: ROUTES.SYSTEM.WORKFLOW_PLANNING, label: '流程规划会话' },

  { key: 'group-terminal', path: '', label: '平台终端能力', isGroupLabel: true },
  { key: 'platform-caps', path: ROUTES.SYSTEM.PLATFORM_CAPABILITIES, label: '终端能力注册' },

  { key: 'group-monitor', path: '', label: '运行监控', isGroupLabel: true },
  { key: 'wf-runtime', path: ROUTES.SYSTEM.WORKFLOW_RUNTIME, label: '流程运行监控' },
]
