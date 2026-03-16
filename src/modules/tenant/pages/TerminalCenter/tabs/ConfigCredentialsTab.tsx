import { Card } from '@/components/Card/Card'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import type { TerminalWithIdentity } from '../../../services/terminalService'
import styles from './TerminalDetailTabs.module.css'

interface ConfigCredentialsTabProps {
  terminal: TerminalWithIdentity
  onOpenReconfig?: () => void
}

export function ConfigCredentialsTab({ terminal, onOpenReconfig }: ConfigCredentialsTabProps) {
  const hasCredentials = !!terminal.credentialsJson
  const isFacebookPage = terminal.type === 'facebook_page'
  let credentialsPreview: { pageId?: string; tokenMasked?: string } = {}
  try {
    if (terminal.credentialsJson) credentialsPreview = JSON.parse(terminal.credentialsJson) as { pageId?: string; tokenMasked?: string }
  } catch {
    // ignore
  }
  let configPreview: Record<string, unknown> = {}
  try {
    if (terminal.configJson) configPreview = JSON.parse(terminal.configJson) as Record<string, unknown>
  } catch {
    // ignore
  }
  const configKeys = Object.keys(configPreview).filter((k) => k && !k.toLowerCase().includes('secret') && !k.toLowerCase().includes('password'))

  return (
    <>
      <Card title="凭证信息" description={isFacebookPage ? 'OAuth 授权，Token 仅服务端存储，此处仅展示脱敏信息' : '敏感信息已脱敏，仅支持重新配置'}>
        {hasCredentials ? (
          <div className={styles.credBlock}>
            {isFacebookPage ? (
              <dl className={styles.dl}>
                {credentialsPreview.pageId && (
                  <>
                    <dt>Page ID</dt>
                    <dd><code style={{ fontSize: 13 }}>{credentialsPreview.pageId}</code></dd>
                  </>
                )}
                {credentialsPreview.tokenMasked && (
                  <>
                    <dt>凭证（掩码）</dt>
                    <dd><span className={styles.masked} style={{ fontFamily: 'monospace', fontSize: 12 }}>{credentialsPreview.tokenMasked}</span></dd>
                  </>
                )}
              </dl>
            ) : (
              <p className={styles.masked}>••••••••</p>
            )}
            {!isFacebookPage && onOpenReconfig && (
              <button type="button" className={listPageStyles.linkBtn} onClick={onOpenReconfig}>
                重新配置凭证
              </button>
            )}
            {isFacebookPage && (
              <p className={styles.empty} style={{ marginTop: 8, fontSize: 13 }}>如需更换授权，请断开本终端后重新在「Facebook 主页」或「新建终端」中授权。</p>
            )}
          </div>
        ) : (
          <p className={styles.empty}>未配置凭证</p>
        )}
      </Card>
      <Card title="配置信息" description="非敏感配置项">
        {configKeys.length > 0 ? (
          <dl className={styles.dl}>
            {configKeys.map((k) => (
              <span key={k} style={{ display: 'contents' }}>
                <dt>{k}</dt>
                <dd>{String(configPreview[k] ?? '—')}</dd>
              </span>
            ))}
          </dl>
        ) : (
          <p className={styles.empty}>暂无配置或均为敏感项</p>
        )}
      </Card>
    </>
  )
}
