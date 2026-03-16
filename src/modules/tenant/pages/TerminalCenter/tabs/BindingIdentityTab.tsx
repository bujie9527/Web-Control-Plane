import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import type { TerminalWithIdentity } from '../../../services/terminalService'
import styles from './TerminalDetailTabs.module.css'

interface BindingIdentityTabProps {
  terminal: TerminalWithIdentity
  onChangeIdentity?: () => void
}

export function BindingIdentityTab({ terminal, onChangeIdentity }: BindingIdentityTabProps) {
  const hasIdentity = !!(terminal.identityId ?? terminal.primaryIdentityId) || !!terminal.identityName
  return (
    <Card title="绑定身份" description="该终端执行任务时使用的身份">
      {hasIdentity ? (
        <div className={styles.identityBlock}>
          <dl className={styles.dl}>
            <dt>身份名称</dt>
            <dd>{terminal.identityName ?? '—'}</dd>
            <dt>身份 ID</dt>
            <dd>{terminal.identityId ?? terminal.primaryIdentityId ?? '—'}</dd>
          </dl>
          {onChangeIdentity && (
            <button type="button" className={listPageStyles.linkBtn} onClick={onChangeIdentity}>
              更换身份
            </button>
          )}
        </div>
      ) : (
        <EmptyState title="未绑定身份" description="绑定身份后，该终端将以该身份执行任务" action={onChangeIdentity ? <button type="button" className={listPageStyles.primaryBtn} onClick={onChangeIdentity}>更换身份</button> : undefined} />
      )}
    </Card>
  )
}
