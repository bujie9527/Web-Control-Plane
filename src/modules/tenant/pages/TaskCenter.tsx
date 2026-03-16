import { useCallback, useEffect, useState } from 'react'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { useAuth } from '@/core/auth/AuthContext'
import { getTaskCenterData } from '../services/taskCenterService'
import type { TaskCenterItem } from '../mock/taskCenterMock'
import styles from './SkeletonPages.module.css'

const taskColumns = [
  { key: 'name', title: '任务名称', width: '160px', render: (_: unknown, r: TaskCenterItem) => r.taskName },
  { key: 'project', title: '所属项目', width: '140px', render: (_: unknown, r: TaskCenterItem) => r.projectName ?? '—' },
  { key: 'assignee', title: '负责人', width: '90px', render: (_: unknown, r: TaskCenterItem) => r.assigneeName },
  {
    key: 'identityName',
    title: '使用身份',
    width: '120px',
    render: (_: unknown, r: TaskCenterItem) => r.identityName ?? '—',
  },
  { key: 'updatedAt', title: '更新时间', width: '140px' },
]

export function TaskCenter() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? 't1'

  const [summary, setSummary] = useState({ running: 0, review: 0, failed: 0, done: 0 })
  const [runningTasks, setRunningTasks] = useState<TaskCenterItem[]>([])
  const [reviewTasks, setReviewTasks] = useState<TaskCenterItem[]>([])
  const [failedTasks, setFailedTasks] = useState<TaskCenterItem[]>([])
  const [doneTasks, setDoneTasks] = useState<TaskCenterItem[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const data = await getTaskCenterData(tenantId)
      setSummary(data.summary)
      setRunningTasks(data.runningTasks)
      setReviewTasks(data.reviewTasks)
      setFailedTasks(data.failedTasks)
      setDoneTasks(data.doneTasks)
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <PageContainer
      title="任务执行"
      description="任务中心与运行中、待审核、异常、已完成任务"
    >
      <Card title="任务中心总览" description="各状态任务数量">
        {loading ? (
          <p className={styles.placeholder}>加载中...</p>
        ) : (
          <div className={styles.kvList}>
            <span>运行中：{summary.running}</span>
            <span>待审核：{summary.review}</span>
            <span>异常：{summary.failed}</span>
            <span>已完成：{summary.done}</span>
          </div>
        )}
      </Card>

      <Card title="运行中任务" description="当前正在执行的任务">
        {runningTasks.length === 0 && !loading ? (
          <EmptyState title="暂无运行中任务" description="创建任务并启动后，会在此处展示" />
        ) : (
          <Table
            columns={taskColumns}
            dataSource={runningTasks}
            rowKey="id"
            loading={loading}
            emptyText="暂无运行中任务"
          />
        )}
      </Card>

      <Card title="待审核任务" description="等待审核的任务">
        {reviewTasks.length === 0 && !loading ? (
          <EmptyState title="暂无待审核任务" description="任务进入审核节点后，会在此处展示" />
        ) : (
          <Table
            columns={taskColumns}
            dataSource={reviewTasks}
            rowKey="id"
            loading={loading}
            emptyText="暂无待审核任务"
          />
        )}
      </Card>

      <Card title="异常任务" description="执行失败或需人工处理的任务">
        {failedTasks.length === 0 && !loading ? (
          <EmptyState title="暂无异常任务" description="执行失败的任务会在此处展示" />
        ) : (
          <Table
            columns={taskColumns}
            dataSource={failedTasks}
            rowKey="id"
            loading={loading}
            emptyText="暂无异常任务"
          />
        )}
      </Card>

      <Card title="已完成任务" description="已正常完成的任务">
        {doneTasks.length === 0 && !loading ? (
          <EmptyState title="暂无已完成任务" description="完成的任务会在此处展示" />
        ) : (
          <Table
            columns={taskColumns}
            dataSource={doneTasks}
            rowKey="id"
            loading={loading}
            emptyText="暂无已完成任务"
          />
        )}
      </Card>
    </PageContainer>
  )
}
