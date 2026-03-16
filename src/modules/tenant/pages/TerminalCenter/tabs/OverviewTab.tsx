import { useState } from 'react'
import { Card } from '@/components/Card/Card'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import {
  TERMINAL_TYPE_CATEGORY_LABELS,
  TERMINAL_STATUS_LABELS as STATUS_LABELS,
  TERMINAL_TEST_RESULT_LABELS as TEST_RESULT_LABELS,
} from '@/core/labels/terminalTypeLabels'
import type { TerminalWithIdentity } from '../../../services/terminalService'
import type { SystemTerminalType } from '@/modules/platform/schemas/systemTerminalType'
import { refreshTerminalToken, postToPage } from '../../../services/facebookTerminalService'
import styles from './TerminalDetailTabs.module.css'

interface OverviewTabProps {
  terminal: TerminalWithIdentity
  typeMeta: SystemTerminalType | null
}

function parseConfigJson(configJson: string | undefined): { pageCategory?: string; authorizedAt?: string; expiresAt?: string } {
  if (!configJson?.trim()) return {}
  try {
    return JSON.parse(configJson) as { pageCategory?: string; authorizedAt?: string; expiresAt?: string }
  } catch {
    return {}
  }
}

export function OverviewTab({ terminal, typeMeta }: OverviewTabProps) {
  const [refreshStatus, setRefreshStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle')
  const [refreshMessage, setRefreshMessage] = useState('')
  const [postStatus, setPostStatus] = useState<'idle' | 'loading' | 'ok' | 'fail'>('idle')
  const isFacebookPage = terminal.type === 'facebook_page'
  const config = parseConfigJson(terminal.configJson)
  const tokenExpiresAt = config.expiresAt
  const tokenStatus = !tokenExpiresAt ? 'active' : new Date(tokenExpiresAt) > new Date() ? 'active' : 'expired'

  const handleRefreshToken = async () => {
    if (terminal.type !== 'facebook_page') return
    setRefreshStatus('loading')
    setRefreshMessage('')
    try {
      const res = await refreshTerminalToken(terminal.id)
      setRefreshStatus(res.valid ? 'ok' : 'fail')
      setRefreshMessage(res.message)
    } catch (e) {
      setRefreshStatus('fail')
      setRefreshMessage(e instanceof Error ? e.message : '校验失败')
    }
  }

  const handleTestPost = async () => {
    if (terminal.type !== 'facebook_page') return
    setPostStatus('loading')
    try {
      await postToPage(terminal.id, { message: '【测试】来自 AI 工作中控的测试发帖。' })
      setPostStatus('ok')
    } catch {
      setPostStatus('fail')
    }
  }

  return (
    <>
      <Card title="连接状态" description="当前连接与最近测试结果">
        <dl className={styles.dl}>
          <dt>当前状态</dt>
          <dd><StatusTag type={terminal.status === 'active' ? 'success' : 'warning'}>{STATUS_LABELS[terminal.status] ?? terminal.status}</StatusTag></dd>
          <dt>最后测试时间</dt>
          <dd>{terminal.lastTestedAt ? new Date(terminal.lastTestedAt).toLocaleString() : '—'}</dd>
          <dt>测试结果</dt>
          <dd>{terminal.lastTestResult ? TEST_RESULT_LABELS[terminal.lastTestResult] ?? terminal.lastTestResult : '—'}</dd>
          {terminal.lastTestMessage && (
            <>
              <dt>结果说明</dt>
              <dd>{terminal.lastTestMessage}</dd>
            </>
          )}
        </dl>
      </Card>
      {isFacebookPage && (
        <Card title="Facebook 主页" description="授权与 Token 状态">
          <dl className={styles.dl}>
            <dt>Token 状态</dt>
            <dd>
              <StatusTag type={tokenStatus === 'active' ? 'success' : 'warning'}>
                {tokenStatus === 'active' ? '活跃' : '已过期或未设置'}
              </StatusTag>
            </dd>
            {config.authorizedAt && (
              <>
                <dt>授权时间</dt>
                <dd>{new Date(config.authorizedAt).toLocaleString('zh-CN')}</dd>
              </>
            )}
            {tokenExpiresAt && (
              <>
                <dt>Token 到期时间</dt>
                <dd>{new Date(tokenExpiresAt).toLocaleString('zh-CN')}</dd>
              </>
            )}
          </dl>
          <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
            <button
              type="button"
              className={listPageStyles.primaryBtn}
              onClick={handleRefreshToken}
              disabled={refreshStatus === 'loading'}
            >
              {refreshStatus === 'loading' ? '校验中…' : '刷新 Token'}
            </button>
            {refreshStatus === 'ok' && <span className={styles.testSuccess}>{refreshMessage || 'Token 有效'}</span>}
            {refreshStatus === 'fail' && <span className={styles.testFailed}>{refreshMessage}</span>}
          </div>
          <div style={{ marginTop: 16 }}>
            <button
              type="button"
              className={listPageStyles.linkBtn}
              onClick={handleTestPost}
              disabled={postStatus === 'loading'}
            >
              {postStatus === 'loading' ? '发帖中…' : postStatus === 'ok' ? '测试发帖成功' : '发测试帖'}
            </button>
            {postStatus === 'fail' && <span className={styles.testFailed} style={{ marginLeft: 8 }}>发帖失败</span>}
          </div>
        </Card>
      )}
      <Card title="基础信息" description="类型与创建信息">
        <dl className={styles.dl}>
          <dt>类型</dt>
          <dd>{typeMeta?.nameZh ?? typeMeta?.name ?? terminal.type ?? '—'}</dd>
          <dt>类别</dt>
          <dd>{terminal.typeCategory ? TERMINAL_TYPE_CATEGORY_LABELS[terminal.typeCategory] : '—'}</dd>
          <dt>创建时间</dt>
          <dd>{terminal.createdAt}</dd>
          <dt>更新时间</dt>
          <dd>{terminal.updatedAt}</dd>
        </dl>
      </Card>
      <Card title="能力标签" description="该终端类型支持的能力">
        {typeMeta?.capabilityTags?.length ? (
          <ul className={styles.tagList}>
            {typeMeta.capabilityTags.map((tag) => (
              <li key={tag} className={styles.tag}>{tag}</li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>暂无能力标签</p>
        )}
      </Card>
    </>
  )
}
