import type { TenantDashboardData } from '../schemas/tenantDashboard'

export function getTenantDashboard(): TenantDashboardData {
  return {
    metricCards: [
      { key: 'runningProjects', value: 5, label: '进行中项目' },
      { key: 'todoCount', value: 12, label: '待办任务' },
      { key: 'pendingReview', value: 3, label: '待审核' },
      { key: 'weekDone', value: 28, label: '本周完成' },
    ],
    todoItems: [
      { id: '1', title: '审核任务：社媒内容发布审核', link: '/tenant/tasks', type: 'review' },
      { id: '2', title: '处理异常任务：FB 账号登录超时', link: '/tenant/tasks', type: 'exception' },
      { id: '3', title: '配置项目「春季 campaign」的 Agent 团队', link: '/tenant/projects', type: 'config' },
    ],
    alerts: [
      { id: '1', level: 'warning', message: '任务「社媒发布-0328」已超时，请处理' },
      { id: '2', level: 'info', message: '终端「X 账号-主」将于 2 小时后刷新 Token' },
    ],
    recentTasks: [
      { id: '1', taskName: '社媒发布-0328', projectName: '春季 campaign', status: '运行中', updatedAt: '2025-03-08 10:30', identityName: '品牌主账号' },
      { id: '2', taskName: '数据拉取-日更', projectName: '数据看板', status: '已完成', updatedAt: '2025-03-08 09:00', identityName: '数据接口身份' },
      { id: '3', taskName: '内容审核-批次3', projectName: '内容运营', status: '待审核', updatedAt: '2025-03-08 08:15', identityName: '品牌主账号' },
      { id: '4', taskName: '自动化巡检', projectName: '系统运维', status: '已完成', updatedAt: '2025-03-07 18:00' },
    ],
    quickEntries: [
      { key: 'newProject', label: '新建项目', path: '/tenant/projects' },
      { key: 'tasks', label: '任务中心', path: '/tenant/tasks' },
      { key: 'workflows', label: '流程中心', path: '/tenant/workflows' },
      { key: 'agents', label: 'Agent 中心', path: '/tenant/agents' },
      { key: 'skills', label: 'Skills 能力库', path: '/tenant/skills' },
      { key: 'terminals', label: '终端中心', path: '/tenant/terminals' },
    ],
  }
}
