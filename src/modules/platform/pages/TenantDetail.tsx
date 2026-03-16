import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { getTenantDetail } from '../services/tenantService'
import type { TenantDetail as TenantDetailType, TenantStatus } from '../schemas/tenant'
import { ROUTES } from '@/core/constants/routes'
import styles from './TenantDetail.module.css'

const statusMap: Record<TenantStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  active: 'success',
  suspended: 'warning',
  expired: 'error',
}

export function TenantDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<TenantDetailType | null>(null)

  useEffect(() => {
    if (!id) return
    getTenantDetail(id).then(setDetail)
  }, [id])

  if (!id) {
    navigate(ROUTES.PLATFORM.TENANTS)
    return null
  }

  if (!detail) {
    return (
      <PageContainer title="租户详情">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }

  const statusLabel = detail.status === 'active' ? '正常' : detail.status === 'suspended' ? '已暂停' : '已过期'

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  const sections = [
    { id: 'section-basic', label: '基本信息' },
    { id: 'section-quota', label: '套餐与配额' },
    { id: 'section-members', label: '成员概览' },
    { id: 'section-projects', label: '项目概览' },
    { id: 'section-audit', label: '操作日志' },
  ]

  return (
    <PageContainer
      title={detail.name}
      description={`租户编码：${detail.code}，平台视角下的基本信息与配额`}
    >
      <nav className={styles.pageNav} aria-label="页内导航">
        {sections.map((s) => (
          <button key={s.id} type="button" className={styles.navLink} onClick={() => scrollTo(s.id)}>
            {s.label}
          </button>
        ))}
      </nav>
      <div className={styles.summary}>
        <span><StatusTag type={statusMap[detail.status]}>{statusLabel}</StatusTag></span>
        <span>套餐：{detail.plan}</span>
        <span>成员数：{detail.memberCount}</span>
        <span>项目数：{detail.projectCount}</span>
        <span>创建时间：{detail.createdAt.slice(0, 10)}</span>
        <button type="button" className={styles.backBtn} onClick={() => navigate(ROUTES.PLATFORM.TENANTS)}>
          返回列表
        </button>
      </div>

      <div id="section-basic">
        <Card title="基本信息">
        <dl className={styles.dl}>
          <dt>租户名称</dt><dd>{detail.name}</dd>
          <dt>租户编码</dt><dd>{detail.code}</dd>
          <dt>状态</dt><dd><StatusTag type={statusMap[detail.status]}>{statusLabel}</StatusTag></dd>
          <dt>套餐</dt><dd>{detail.plan}</dd>
          <dt>更新时间</dt><dd>{detail.updatedAt.slice(0, 16)}</dd>
        </dl>
      </Card>
      </div>

      <div id="section-quota">
      <Card title="套餐与配额" description="当前配额使用情况">
        {detail.quotaDetail && detail.quotaDetail.length > 0 ? (
          <ul className={styles.quotaList}>
            {detail.quotaDetail.map((q) => (
              <li key={q.key}><strong>{q.key}</strong>：{q.value}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyHint}>暂无配额明细</p>
        )}
      </Card>
      </div>

      <div id="section-members">
      <Card title="成员概览" description="仅展示数量与部分成员，非租户内成员管理">
        <p>共 {detail.memberCount} 名成员</p>
        {detail.recentMembers && detail.recentMembers.length > 0 && (
          <ul className={styles.miniList}>
            {detail.recentMembers.map((m) => (
              <li key={m.id}>{m.name}</li>
            ))}
          </ul>
        )}
      </Card>
      </div>

      <div id="section-projects">
      <Card title="项目概览" description="仅展示数量与部分项目，非租户内项目管理">
        <p>共 {detail.projectCount} 个项目</p>
        {detail.recentProjects && detail.recentProjects.length > 0 && (
          <ul className={styles.miniList}>
            {detail.recentProjects.map((p) => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        )}
      </Card>
      </div>

      <div id="section-audit">
      <Card title="操作日志" description="近期操作记录占位">
        {detail.recentAudit && detail.recentAudit.length > 0 ? (
          <ul className={styles.auditList}>
            {detail.recentAudit.map((a) => (
              <li key={a.id}>
                <span>{a.action}</span>
                <span>{a.result}</span>
                <span>{a.createdAt.slice(0, 16)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyHint}>暂无操作记录</p>
        )}
      </Card>
      </div>
    </PageContainer>
  )
}
