import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/core/auth/AuthContext'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { getTenantDashboardData } from '../services/tenantDashboardService'
import type { TenantDashboardData } from '../schemas/tenantDashboard'
import styles from './TenantDashboard.module.css'

const alertLevelMap = {
  info: 'info' as const,
  warning: 'warning' as const,
  error: 'error' as const,
}

export function TenantDashboard() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? ''
  const [data, setData] = useState<TenantDashboardData | null>(null)

  useEffect(() => {
    getTenantDashboardData(tenantId).then(setData)
  }, [tenantId])

  if (!data) {
    return (
      <PageContainer title="工作台" description="今日工作入口与核心指标">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }

  const recentColumns = [
    { key: 'taskName', title: '任务名称', width: '160px' },
    { key: 'projectName', title: '所属项目', width: '140px' },
    { key: 'status', title: '状态', width: '90px' },
    { key: 'identityName', title: '身份', width: '120px', render: (_: unknown, r: { identityName?: string }) => r.identityName ?? '—' },
    { key: 'updatedAt', title: '更新时间', width: '140px' },
  ]

  return (
    <PageContainer
      title="工作台"
      description="今日工作入口与核心指标"
    >
      <div className={styles.metrics}>
        {data.metricCards.map((m) => (
          <Card key={m.key}>
            <div className={styles.metric}>
              <span className={styles.metricValue}>{m.value}</span>
              <span className={styles.metricLabel}>{m.label}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className={styles.quickEntries}>
        {data.quickEntries.map((e) => (
          <Link key={e.key} to={e.path} className={styles.quickEntry}>
            {e.label}
          </Link>
        ))}
      </div>

      <div className={styles.grid2}>
        <Card title="我的待办" description="需要您处理的待办事项">
          {data.todoItems.length === 0 ? (
            <p className={styles.emptyHint}>暂无待办</p>
          ) : (
            <ul className={styles.todoList}>
              {data.todoItems.map((t) => (
                <li key={t.id}>
                  <span className={styles.todoTitle}>{t.title}</span>
                  {t.link && (
                    <Link to={t.link} className={styles.linkBtn}>
                      去处理
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="预警中心" description="任务与终端相关预警">
          {data.alerts.length === 0 ? (
            <p className={styles.emptyHint}>暂无预警</p>
          ) : (
            <ul className={styles.alertList}>
              {data.alerts.map((a) => (
                <li key={a.id}>
                  <StatusTag type={alertLevelMap[a.level]}>{a.message}</StatusTag>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="最近任务" description="最近更新或执行的任务">
        <div className={styles.recentTable}>
          <Table
            columns={recentColumns}
            dataSource={data.recentTasks}
            rowKey="id"
            emptyText="暂无最近任务"
          />
        </div>
      </Card>
    </PageContainer>
  )
}
