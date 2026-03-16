import styles from './EmptyState.module.css'

interface EmptyStateProps {
  title?: string
  description?: string
  /** 可选操作区（如新建按钮） */
  action?: React.ReactNode
}

/**
 * 基础空状态占位，避免空白页
 */
export function EmptyState({
  title = '暂无内容',
  description = '当前模块尚未开放或暂无数据',
  action,
}: EmptyStateProps) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.content}>
        <p className={styles.title}>{title}</p>
        <p className={styles.description}>{description}</p>
        {action != null && <div className={styles.action}>{action}</div>}
      </div>
    </div>
  )
}
