import { ROUTES } from '@/core/constants/routes'
import type { MenuItem } from './types'

/**
 * 租户后台菜单：流程中心合并为二级，身份库独立一级
 */
export const tenantMenuConfig: MenuItem[] = [
  { key: 'tenant-home', path: ROUTES.TENANT.HOME, label: '工作台' },
  { key: 'projects', path: ROUTES.TENANT.PROJECTS, label: '项目中心' },
  {
    key: 'flow-center',
    path: ROUTES.TENANT.WORKFLOW_TEMPLATES,
    label: '流程中心',
    children: [
      { key: 'wf-templates', path: ROUTES.TENANT.WORKFLOW_TEMPLATES, label: '流程模板' },
      { key: 'wf-planning', path: ROUTES.TENANT.WORKFLOW_PLANNING, label: '流程规划' },
      { key: 'wf-runtime', path: ROUTES.TENANT.WORKFLOW_RUNTIME, label: '运行监控' },
    ],
  },
  { key: 'tasks', path: ROUTES.TENANT.TASKS, label: '任务执行' },
  { key: 'agents', path: ROUTES.TENANT.AGENTS, label: 'Agent 库' },
  { key: 'identities', path: ROUTES.TENANT.IDENTITIES, label: '身份库' },
  { key: 'skills', path: ROUTES.TENANT.SKILLS, label: 'Skills 库' },
  {
    key: 'terminals',
    path: ROUTES.TENANT.TERMINALS,
    label: '终端中心',
    children: [
      { key: 'terminals-list', path: ROUTES.TENANT.TERMINALS, label: '终端列表' },
      { key: 'facebook-pages', path: ROUTES.TENANT.FACEBOOK_PAGES, label: 'Facebook 主页' },
    ],
  },
  { key: 'analytics', path: ROUTES.TENANT.ANALYTICS, label: '数据分析' },
  { key: 'settings', path: ROUTES.TENANT.SETTINGS, label: '系统设置' },
]
