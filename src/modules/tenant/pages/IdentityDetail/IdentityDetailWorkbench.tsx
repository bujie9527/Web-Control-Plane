import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { getIdentityDetail } from '../../services/identityService'
import type { Identity, IdentityStatus, IdentityType } from '../../schemas/identity'
import { ROUTES } from '@/core/constants/routes'
import styles from './IdentityDetailWorkbench.module.css'

const PLATFORM_LABELS: Record<string, string> = {
  wechat: '微信',
  x: 'X',
  tiktok: '抖音',
  douyin: '抖音',
  xiaohongshu: '小红书',
  weibo: '微博',
}

const statusMap: Record<IdentityStatus, 'success' | 'warning' | 'error' | 'neutral'> = {
  draft: 'neutral',
  active: 'success',
  archived: 'neutral',
}

const statusLabel: Record<IdentityStatus, string> = {
  draft: '草稿',
  active: '启用',
  archived: '已归档',
}

const typeLabel: Record<IdentityType, string> = {
  brand_official: '品牌官号',
  koc: 'KOC',
  expert: '专家',
  assistant: '助手',
  other: '其他',
}

function formatPlatforms(adaptations: Record<string, string>): string {
  const keys = Object.keys(adaptations || {}).filter(Boolean)
  return keys.map((k) => PLATFORM_LABELS[k] ?? k).join('、') || '—'
}

export function IdentityDetailWorkbench() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [data, setData] = useState<Identity | null | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    getIdentityDetail(id).then(setData)
  }, [id])

  if (!id) {
    navigate(ROUTES.TENANT.IDENTITIES)
    return null
  }

  if (data === undefined) {
    return (
      <PageContainer title="身份详情" description="加载中...">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }

  if (data === null) {
    return (
      <PageContainer title="身份详情" description="未找到该身份">
        <p className={styles.loading}>未找到该身份，请返回列表。</p>
        <Link to={ROUTES.TENANT.IDENTITIES} className={styles.backLink}>
          ← 返回身份列表
        </Link>
      </PageContainer>
    )
  }

  const platformsStr = formatPlatforms(data.platformAdaptations)

  return (
    <PageContainer
      title={data.name}
      description={data.corePositioning || '身份/人设详情，用于统一表达口径与项目、任务、终端绑定'}
    >
      <div className={styles.backBar}>
        <Link to={ROUTES.TENANT.IDENTITIES} className={styles.backLink}>
          ← 返回身份列表
        </Link>
      </div>

      <div className={styles.summary}>
        <StatusTag type={statusMap[data.status]}>{statusLabel[data.status]}</StatusTag>
        <span className={styles.summaryItem}>
          <span className={styles.summaryLabel}>类型</span> {typeLabel[data.type]}
        </span>
        <span className={styles.summaryItem}>
          <span className={styles.summaryLabel}>适用平台</span> {platformsStr}
        </span>
        <span className={styles.summaryItem}>
          <span className={styles.summaryLabel}>更新时间</span> {data.updatedAt}
        </span>
      </div>

      <div className={styles.content}>
        <Card title="基础信息" description="身份名称、类型与核心定位">
          <div className={styles.kvGrid}>
            <span className={styles.kvLabel}>身份名称</span>
            <span>{data.name}</span>
            <span className={styles.kvLabel}>身份类型</span>
            <span>{typeLabel[data.type]}</span>
            <span className={styles.kvLabel}>核心定位</span>
            <span>{data.corePositioning || '—'}</span>
            <span className={styles.kvLabel}>语气风格</span>
            <span>{data.toneStyle || '—'}</span>
            <span className={styles.kvLabel}>创建时间</span>
            <span>{data.createdAt}</span>
            <span className={styles.kvLabel}>更新时间</span>
            <span>{data.updatedAt}</span>
          </div>
        </Card>

        <Card title="表达规则" description="内容方向与边界，后续可配置">
          <p className={styles.textBlock}>{data.contentDirections || '—'}</p>
        </Card>

        <Card title="行为规则" description="行为边界，后续可配置">
          <p className={styles.textBlock}>{data.behaviorRules || '—'}</p>
        </Card>

        <Card title="平台适配" description="各平台差异化表达与行为">
          {Object.keys(data.platformAdaptations || {}).length === 0 ? (
            <p className={styles.placeholderHint}>暂无平台差异化配置</p>
          ) : (
            <ul className={styles.platformList}>
              {Object.entries(data.platformAdaptations || {}).map(([key, value]) => (
                <li key={key}>
                  <span className={styles.platformKey}>{PLATFORM_LABELS[key] ?? key}：</span>
                  {value}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="绑定项目" description="已绑定项目将在项目详情中配置">
          <p className={styles.placeholderHint}>绑定项目将在项目详情的身份配置中管理。</p>
          <EmptyState title="暂无绑定项目" description="在项目详情页可绑定本身份" />
        </Card>

        <Card title="绑定终端" description="终端绑定将在终端中心配置">
          <p className={styles.placeholderHint}>终端绑定将在终端中心配置。</p>
          <EmptyState title="暂无绑定终端" description="在终端中心可绑定本身份" />
        </Card>

        <Card title="最近任务" description="使用本身份的任务将在此展示">
          <p className={styles.placeholderHint}>使用本身份的任务将在此展示。</p>
          <EmptyState title="暂无最近任务" description="任务创建时选择本身份后可见" />
        </Card>
      </div>
    </PageContainer>
  )
}
