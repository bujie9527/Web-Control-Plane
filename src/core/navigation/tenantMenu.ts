import { ROUTES } from '@/core/constants/routes'
import type { MenuItem } from './types'

/**
 * 租户后台菜单：流程中心合并为二级，身份库独立一级
 */
export const tenantMenuConfig: MenuItem[] = [
  { key: 'tenant-home', path: ROUTES.TENANT.HOME, label: '工作台', icon: 'LayoutDashboard' },

  { key: 'group-biz', path: '', label: '业务运营', isGroupLabel: true },
  { key: 'projects', path: ROUTES.TENANT.PROJECTS, label: '项目中心', icon: 'FolderKanban' },
  { key: 'messages', path: ROUTES.TENANT.MESSAGES, label: '消息中心', icon: 'MessageSquare', badge: 3 },

  { key: 'group-flow', path: '', label: '流程与任务', isGroupLabel: true },
  { key: 'wf-templates', path: ROUTES.TENANT.WORKFLOW_TEMPLATES, label: '流程模板', icon: 'GitBranch' },
  { key: 'wf-planning', path: ROUTES.TENANT.WORKFLOW_PLANNING, label: '流程规划', icon: 'Route' },
  { key: 'wf-runtime', path: ROUTES.TENANT.WORKFLOW_RUNTIME, label: '运行监控', icon: 'Activity' },
  { key: 'tasks', path: ROUTES.TENANT.TASKS, label: '任务执行', icon: 'ListChecks' },
  { key: 'scheduled-tasks', path: ROUTES.TENANT.SCHEDULED_TASKS, label: '定时任务', icon: 'Clock' },

  { key: 'group-assets', path: '', label: '能力资产', isGroupLabel: true },
  { key: 'agents', path: ROUTES.TENANT.AGENTS, label: 'Agent 库', icon: 'Bot' },
  { key: 'identities', path: ROUTES.TENANT.IDENTITIES, label: '身份库', icon: 'UserCircle' },
  { key: 'skills', path: ROUTES.TENANT.SKILLS, label: 'Skills 库', icon: 'Zap' },

  { key: 'group-infra', path: '', label: '终端与数据', isGroupLabel: true },
  {
    key: 'terminals',
    path: ROUTES.TENANT.TERMINALS,
    label: '终端管理',
    icon: 'Monitor',
    children: [
      { key: 'terminals-list', path: ROUTES.TENANT.TERMINALS, label: '终端列表' },
      { key: 'telegram-bots', path: ROUTES.TENANT.TERMINALS_TELEGRAM, label: 'Telegram Bot' },
      { key: 'facebook-pages', path: ROUTES.TENANT.FACEBOOK_PAGES, label: 'Facebook 主页' },
    ],
  },
  { key: 'datasources', path: ROUTES.TENANT.DATASOURCES, label: '数据源', icon: 'Database' },

  { key: 'group-analytics', path: '', label: '分析与设置', isGroupLabel: true },
  { key: 'analytics', path: ROUTES.TENANT.ANALYTICS, label: '数据分析', icon: 'BarChart3' },
  { key: 'settings', path: ROUTES.TENANT.SETTINGS, label: '系统设置', icon: 'Settings' },
]
