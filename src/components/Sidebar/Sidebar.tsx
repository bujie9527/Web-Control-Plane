import type { MenuItem } from '@/core/navigation/types'
import styles from './Sidebar.module.css'

interface SidebarProps {
  menuConfig: MenuItem[]
  collapsed: boolean
  onToggleCollapse: () => void
  currentPath: string
  onNavigate: (path: string) => void
  title: string
}

export function Sidebar({
  menuConfig,
  collapsed,
  onToggleCollapse,
  currentPath,
  onNavigate,
  title,
}: SidebarProps) {
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.brand}>
        <span className={styles.brandText}>{collapsed ? 'AWCC' : title}</span>
      </div>
      <button
        type="button"
        className={styles.collapseBtn}
        onClick={onToggleCollapse}
        aria-label={collapsed ? '展开菜单' : '收起菜单'}
      >
        {collapsed ? '→' : '←'}
      </button>
      <nav className={styles.nav}>
        {menuConfig.map((item) => {
          if (item.isGroupLabel) {
            return (
              <div key={item.key} className={styles.menuGroupLabel} title={item.label}>
                {!collapsed && item.label}
              </div>
            )
          }
          if (item.children?.length) {
            const parentActive =
              currentPath === item.path || currentPath.startsWith(item.path + '/')
            return (
              <div key={item.key} className={styles.menuGroup}>
                <button
                  type="button"
                  className={`${styles.menuItem} ${parentActive ? styles.active : ''}`}
                  onClick={() => onNavigate(item.path)}
                >
                  <span className={styles.menuLabel}>{item.label}</span>
                </button>
                {!collapsed &&
                  item.children.map((child) => {
                    const matchesChild =
                      currentPath === child.path || currentPath.startsWith(child.path + '/')
                    const hasLongerMatch = item.children!.some(
                      (c) =>
                        c.path.length > child.path.length &&
                        (currentPath === c.path || currentPath.startsWith(c.path + '/'))
                    )
                    const childActive = matchesChild && !hasLongerMatch
                    return (
                      <button
                        key={child.key}
                        type="button"
                        className={`${styles.menuItem} ${styles.menuItemChild} ${childActive ? styles.active : ''}`}
                        onClick={() => onNavigate(child.path)}
                      >
                        <span className={styles.menuLabel}>{child.label}</span>
                      </button>
                    )
                  })}
              </div>
            )
          }
          const isActive =
            currentPath === item.path || currentPath.startsWith(item.path + '/')
          return (
            <button
              key={item.key}
              type="button"
              className={`${styles.menuItem} ${isActive ? styles.active : ''}`}
              onClick={() => onNavigate(item.path)}
            >
              <span className={styles.menuLabel}>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
