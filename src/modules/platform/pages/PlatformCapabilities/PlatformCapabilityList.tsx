/**
 * 平台终端能力注册列表（替代终端类型工厂）
 * 只读展示 + 启用/停用；新能力通过申请表单接入（P2-B）
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Drawer } from '@/components/Drawer/Drawer'
import { NewCapabilityRequestForm } from './NewCapabilityRequestForm'
import { Card } from '@/components/Card/Card'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { ROUTES } from '@/core/constants/routes'
import type { PlatformCapability, PlatformCapabilityStatus } from '@/core/schemas/platformCapability'
import { getCapabilities, enableCapability, disableCapability } from '../../services/platformCapabilityService'
import styles from './PlatformCapabilities.module.css'

const CAPABILITY_STATUS_LABELS: Record<PlatformCapabilityStatus, string> = {
  active: '已启用',
  beta: '测试中',
  disabled: '已停用',
  coming_soon: '即将上线',
}

export function PlatformCapabilityList() {
  const navigate = useNavigate()
  const [list, setList] = useState<PlatformCapability[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [requestDrawerOpen, setRequestDrawerOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    getCapabilities()
      .then((res) => {
        if (!cancelled) setList(res.items)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const handleToggleStatus = async (cap: PlatformCapability) => {
    if (updatingId) return
    setUpdatingId(cap.id)
    try {
      if (cap.status === 'active') {
        await disableCapability(cap.id)
      } else {
        await enableCapability(cap.id)
      }
      const res = await getCapabilities()
      setList(res.items)
    } catch (e) {
      setError(e instanceof Error ? e.message : '操作失败')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <PageContainer title="终端能力注册" description="平台已接入的终端能力，支持启用/停用">
        <div className={styles.loading}>加载中…</div>
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer title="终端能力注册" description="平台已接入的终端能力">
        <div className={styles.error}>{error}</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="终端能力注册"
      description="平台已接入的终端能力，支持启用/停用；新能力通过申请接入"
    >
      <div className={styles.toolbar}>
        <button type="button" className={styles.btnRequest} onClick={() => setRequestDrawerOpen(true)}>
          申请接入新终端能力
        </button>
      </div>
      <Drawer open={requestDrawerOpen} onClose={() => setRequestDrawerOpen(false)} title="申请接入新终端能力" width={520}>
        <NewCapabilityRequestForm
          onClose={() => setRequestDrawerOpen(false)}
          onSubmit={(_data) => {
            setRequestDrawerOpen(false)
          }}
        />
      </Drawer>
      <div className={styles.grid}>
        {list.map((cap) => (
          <Card key={cap.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{cap.nameZh}</h3>
              <StatusTag status={cap.status}>{CAPABILITY_STATUS_LABELS[cap.status] ?? cap.status}</StatusTag>
            </div>
            <p className={styles.cardDesc}>{cap.description}</p>
            <div className={styles.cardMeta}>
              <span className={styles.metaLabel}>协议</span>
              <span>{cap.protocolType}</span>
              <span className={styles.metaLabel}>认证</span>
              <span>{cap.authType === 'oauth2' ? 'OAuth2' : cap.authType}</span>
              {cap.connectedTerminalCount != null && (
                <>
                  <span className={styles.metaLabel}>已接入</span>
                  <span>{cap.connectedTerminalCount} 个终端</span>
                </>
              )}
            </div>
            {cap.supportedProjectTypeIds?.length > 0 && (
              <div className={styles.tags}>
                {cap.supportedProjectTypeIds.map((id) => (
                  <span key={id} className={styles.tag}>{id}</span>
                ))}
              </div>
            )}
            <div className={styles.cardActions}>
              <button
                type="button"
                className={styles.btnDetail}
                onClick={() => navigate(ROUTES.SYSTEM.PLATFORM_CAPABILITIES_DETAIL(cap.code))}
              >
                查看详情
              </button>
              {cap.isBuiltIn && (
                <button
                  type="button"
                  className={cap.status === 'active' ? styles.btnDisable : styles.btnEnable}
                  disabled={!!updatingId}
                  onClick={() => handleToggleStatus(cap)}
                >
                  {updatingId === cap.id ? '处理中…' : cap.status === 'active' ? '停用' : '启用'}
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
      {list.length === 0 && (
        <div className={styles.empty}>暂无终端能力，新能力需通过申请接入。</div>
      )}
    </PageContainer>
  )
}
