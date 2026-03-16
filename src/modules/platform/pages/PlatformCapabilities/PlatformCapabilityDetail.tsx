/**
 * 平台终端能力详情（只读 + 工作流对接说明）
 */
import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { ROUTES } from '@/core/constants/routes'
import type { PlatformCapability, PlatformCapabilityStatus } from '@/core/schemas/platformCapability'
import { getCapabilityByCode } from '../../services/platformCapabilityService'
import { CapabilityInfoTab } from './tabs/CapabilityInfoTab'
import { WorkflowIntegrationTab } from './tabs/WorkflowIntegrationTab'
import { CredentialConfigTab } from './tabs/CredentialConfigTab'
import styles from './PlatformCapabilities.module.css'

/** Facebook 公共主页 API 能力 code，该能力展示凭证配置 Tab */
const FACEBOOK_PAGE_API_CODE = 'facebook_page_api'

const CAPABILITY_STATUS_LABELS: Record<PlatformCapabilityStatus, string> = {
  active: '已启用',
  beta: '测试中',
  disabled: '已停用',
  coming_soon: '即将上线',
}

type TabKey = 'info' | 'workflow' | 'credential'

export function PlatformCapabilityDetail() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const [cap, setCap] = useState<PlatformCapability | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('info')

  useEffect(() => {
    if (!code) return
    let cancelled = false
    setLoading(true)
    setError(null)
    getCapabilityByCode(code)
      .then((data) => {
        if (!cancelled) setCap(data)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [code])

  if (loading) {
    return (
      <PageContainer title="能力详情" description="">
        <div className={styles.loading}>加载中…</div>
      </PageContainer>
    )
  }

  if (error || !cap) {
    return (
      <PageContainer title="能力详情" description="">
        <div className={styles.error}>{error ?? '能力不存在'}</div>
        <button type="button" onClick={() => navigate(ROUTES.SYSTEM.PLATFORM_CAPABILITIES)}>
          返回列表
        </button>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title={cap.nameZh}
      description={cap.description}
    >
      <div className={styles.backBar}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => navigate(ROUTES.SYSTEM.PLATFORM_CAPABILITIES)}
        >
          ← 返回
        </button>
        <span className={styles.breadcrumb}>终端能力注册 / {cap.nameZh}</span>
      </div>
      <div className={styles.summaryBar}>
        <StatusTag status={cap.status}>{CAPABILITY_STATUS_LABELS[cap.status] ?? cap.status}</StatusTag>
        <span className={styles.summaryMeta}>协议: {cap.protocolType} · 认证: {cap.authType}</span>
      </div>
      <div className={styles.tabs}>
        <button
          type="button"
          className={activeTab === 'info' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('info')}
        >
          能力信息
        </button>
        <button
          type="button"
          className={activeTab === 'workflow' ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab('workflow')}
        >
          工作流对接
        </button>
        {cap.code === FACEBOOK_PAGE_API_CODE && (
          <button
            type="button"
            className={activeTab === 'credential' ? styles.tabActive : styles.tab}
            onClick={() => setActiveTab('credential')}
          >
            凭证配置
          </button>
        )}
      </div>
      <div className={styles.tabContent}>
        {activeTab === 'info' && (
          <Card>
            <CapabilityInfoTab capability={cap} />
          </Card>
        )}
        {activeTab === 'workflow' && (
          <Card>
            <WorkflowIntegrationTab capability={cap} />
          </Card>
        )}
        {activeTab === 'credential' && cap.code === FACEBOOK_PAGE_API_CODE && (
          <Card>
            <CredentialConfigTab />
          </Card>
        )}
      </div>
    </PageContainer>
  )
}
