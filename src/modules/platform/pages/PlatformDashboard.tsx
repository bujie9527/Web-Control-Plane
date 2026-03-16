import { useEffect, useState } from 'react'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { getDashboardStats } from '../services/platformDashboardService'
import type { PlatformDashboardStats } from '../services/platformDashboardService'
import styles from './PlatformDashboard.module.css'

export function PlatformDashboard() {
  const [stats, setStats] = useState<PlatformDashboardStats | null>(null)

  useEffect(() => {
    getDashboardStats().then(setStats)
  }, [])

  return (
    <PageContainer
      title="平台工作台"
      description="平台总览与运营管理入口"
    >
      {!stats ? (
        <p className={styles.loading}>加载中...</p>
      ) : (
        <>
          <div className={styles.metrics}>
            <Card>
              <div className={styles.metric}>
                <span className={styles.metricValue}>{stats.totalTenants}</span>
                <span className={styles.metricLabel}>租户总数</span>
              </div>
            </Card>
            <Card>
              <div className={styles.metric}>
                <span className={styles.metricValue}>{stats.activeTenants}</span>
                <span className={styles.metricLabel}>活跃租户</span>
              </div>
            </Card>
            <Card>
              <div className={styles.metric}>
                <span className={styles.metricDesc}>{stats.resourceSummary}</span>
                <span className={styles.metricLabel}>资源消耗概览</span>
              </div>
            </Card>
          </div>
          <Card title="平台预警" description="需关注的预警信息">
            {stats.alerts.length === 0 ? (
              <p className={styles.emptyHint}>暂无预警</p>
            ) : (
              <ul className={styles.alertList}>
                {stats.alerts.map((a) => (
                  <li key={a.id}>
                    <StatusTag type={a.level === 'warning' ? 'warning' : 'info'}>{a.message}</StatusTag>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title="最近动态" description="平台运营动态">
            <ul className={styles.activityList}>
              {stats.recentActivities.map((a) => (
                <li key={a.id}>
                  <span className={styles.activityMsg}>{a.message}</span>
                  <span className={styles.activityTime}>{a.time}</span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </PageContainer>
  )
}
