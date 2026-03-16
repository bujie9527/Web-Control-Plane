import { useCallback, useEffect, useState } from 'react'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { useAuth } from '@/core/auth/AuthContext'
import { listScheduledTasks, patchTaskStatus, runTaskNow, type ScheduledTaskItem } from '../services/scheduledTaskService'

const columns = [
  { key: 'name', title: '任务名称', width: '220px' },
  { key: 'targetType', title: '目标类型', width: '120px' },
  { key: 'status', title: '状态', width: '100px' },
  { key: 'nextRunAt', title: '下次执行', width: '170px' },
  { key: 'updatedAt', title: '更新时间', width: '170px' },
  {
    key: 'actions',
    title: '操作',
    width: '220px',
    render: (_: unknown, row: ScheduledTaskItem) => (
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => void runTaskNow(row.id)}>立即触发</button>
        <button
          type="button"
          onClick={() => void patchTaskStatus(row.id, row.status === 'active' ? 'paused' : 'active')}
        >
          {row.status === 'active' ? '暂停' : '启用'}
        </button>
      </div>
    ),
  },
]

export function ScheduledTaskPage() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? ''
  const [tasks, setTasks] = useState<ScheduledTaskItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    try {
      const data = await listScheduledTasks(tenantId)
      setTasks(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载定时任务失败')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <PageContainer
      title="定时任务"
      description="统一管理流程触发任务与执行状态。"
    >
      <div style={{ marginBottom: 12 }}>
        <button type="button" onClick={() => void load()}>刷新</button>
      </div>
      <Card title="任务列表" description="支持暂停/启用与手动触发">
        {error ? <p style={{ color: '#d4380d' }}>{error}</p> : null}
        <Table columns={columns} dataSource={tasks} rowKey="id" loading={loading} emptyText="暂无任务" />
      </Card>
    </PageContainer>
  )
}

