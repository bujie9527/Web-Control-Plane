/**
 * 任务中心 Mock：租户级任务聚合列表
 * 聚合各项目的任务，供任务中心页展示
 */
import type { TaskItem } from '../schemas/projectDetail'

export interface TaskCenterSummary {
  running: number
  review: number
  failed: number
  done: number
}

/** 租户任务列表（从各项目聚合的 TaskItem，增加 projectName 便于展示） */
export interface TaskCenterItem extends TaskItem {
  projectName?: string
}

const _tasks: TaskCenterItem[] = [
  {
    id: 'rt1',
    taskName: '社媒发布-0328',
    workflowName: '社媒发布流程',
    status: '运行中',
    assigneeName: '张三',
    updatedAt: '2025-03-08 10:30',
    identityName: '品牌主账号',
    projectName: '春季 campaign',
  },
  {
    id: 'rt2',
    taskName: '数据拉取-日更',
    workflowName: '数据同步流程',
    status: '运行中',
    assigneeName: '李四',
    updatedAt: '2025-03-08 09:00',
    identityName: '数据接口身份',
    projectName: '数据看板',
  },
  {
    id: 'r1',
    taskName: '内容审核-批次3',
    workflowName: '内容审核流程',
    status: '待审核',
    assigneeName: '张三',
    updatedAt: '2025-03-08 08:15',
    identityName: '品牌主账号',
    projectName: '内容运营',
  },
  {
    id: 'rt5',
    taskName: 'Facebook 闭环演示',
    workflowName: 'Facebook 社媒闭环',
    status: '运行中',
    assigneeName: '张三',
    updatedAt: '2025-03-08 11:00',
    identityName: '品牌主账号',
    projectName: 'Facebook 运营示例',
  },
  {
    id: 'rt-fail-1',
    taskName: '内容发布-批次2',
    workflowName: '社媒发布流程',
    status: '异常',
    assigneeName: '张三',
    updatedAt: '2025-03-07 16:00',
    identityName: '品牌主账号',
    projectName: '春季 campaign',
  },
  {
    id: 'rt-done-1',
    taskName: '内容审核-批次2',
    workflowName: '内容审核流程',
    status: '已完成',
    assigneeName: '李四',
    updatedAt: '2025-03-08 09:30',
    identityName: '品牌主账号',
    projectName: '内容运营',
  },
  {
    id: 'rt-done-2',
    taskName: '数据同步-昨日',
    workflowName: '数据同步流程',
    status: '已完成',
    assigneeName: '系统',
    updatedAt: '2025-03-08 08:00',
    identityName: '数据接口身份',
    projectName: '数据看板',
  },
]

export function getTaskCenterData(_tenantId: string): {
  summary: TaskCenterSummary
  runningTasks: TaskCenterItem[]
  reviewTasks: TaskCenterItem[]
  failedTasks: TaskCenterItem[]
  doneTasks: TaskCenterItem[]
} {
  const running = _tasks.filter((t) => t.status === '运行中')
  const review = _tasks.filter((t) => t.status === '待审核')
  const failed = _tasks.filter((t) => t.status === '异常')
  const done = _tasks.filter((t) => t.status === '已完成')
  return {
    summary: {
      running: running.length,
      review: review.length,
      failed: failed.length,
      done: done.length,
    },
    runningTasks: running,
    reviewTasks: review,
    failedTasks: failed,
    doneTasks: done,
  }
}
