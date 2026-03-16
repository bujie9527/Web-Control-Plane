import type { BreadcrumbItem } from '@/core/navigation/breadcrumb'
import styles from './TopBar.module.css'

interface TopBarProps {
  breadcrumb?: BreadcrumbItem[]
  tenantName?: string
  userName?: string
  onLogout: () => void
  onBreadcrumbNavigate?: (path: string) => void
}

export function TopBar({ breadcrumb = [], tenantName, userName, onLogout, onBreadcrumbNavigate }: TopBarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <nav className={styles.breadcrumbNav} aria-label="面包屑">
          {breadcrumb.length > 0 ? (
            breadcrumb.map((item, i) => (
              <span key={i} className={styles.breadcrumbWrap}>
                {i > 0 && <span className={styles.breadcrumbSep}>/</span>}
                {item.path != null && i < breadcrumb.length - 1 && onBreadcrumbNavigate ? (
                  <button
                    type="button"
                    className={styles.breadcrumbLink}
                    onClick={() => onBreadcrumbNavigate(item.path!)}
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className={styles.breadcrumbText}>{item.label}</span>
                )}
              </span>
            ))
          ) : (
            <span className={styles.breadcrumbText}>首页</span>
          )}
        </nav>
      </div>
      <div className={styles.right}>
        {tenantName && (
          <span className={styles.tenant} title="当前租户">
            {tenantName}
          </span>
        )}
        <span className={styles.user}>{userName ?? '用户'}</span>
        <button type="button" className={styles.logoutBtn} onClick={onLogout}>
          退出
        </button>
      </div>
    </header>
  )
}
