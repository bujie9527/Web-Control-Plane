import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import type { TerminalLogItem } from '../../../mock/terminalMock'
import styles from './TerminalDetailTabs.module.css'

interface ExecutionLogTabProps {
  logs: TerminalLogItem[]
  loading?: boolean
}

export function ExecutionLogTab({ logs, loading }: ExecutionLogTabProps) {
  if (loading) {
    return (
      <Card title="执行日志" description="最近执行记录">
        <p className={styles.loading}>加载中...</p>
      </Card>
    )
  }
  if (!logs.length) {
    return (
      <Card title="执行日志" description="最近执行记录">
        <EmptyState title="暂无执行日志" description="终端执行任务后会产生日志记录" />
      </Card>
    )
  }
  return (
    <Card title="执行日志" description="最近执行记录">
      <ul className={styles.logList}>
        {logs.map((log) => (
          <li key={log.id} className={styles.logItem}>
            <span className={styles.logAction}>{log.action}</span>
            <span className={styles.logTerminal}>{log.terminal}</span>
            <span className={styles.logResult}>{log.result}</span>
            <span className={styles.logTime}>{log.time}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
