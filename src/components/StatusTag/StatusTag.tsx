import styles from './StatusTag.module.css'

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral'

interface StatusTagProps {
  type?: StatusType
  /** 状态值（用于映射样式，如 active→success, disabled→neutral） */
  status?: string
  children: React.ReactNode
}

const statusToType: Record<string, StatusType> = {
  active: 'success',
  enabled: 'success',
  success: 'success',
  completed: 'success',
  disabled: 'neutral',
  inactive: 'neutral',
  draft: 'warning',
  archived: 'neutral',
  failed: 'error',
  error: 'error',
}

export function StatusTag({ type, status, children }: StatusTagProps) {
  const resolvedType = type ?? (status ? statusToType[status] ?? 'neutral' : 'neutral')
  return <span className={`${styles.tag} ${styles[resolvedType]}`}>{children}</span>
}
