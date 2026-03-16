/**
 * 统一侧边栏菜单项类型，供 Platform / System / Tenant 三套菜单复用
 */
export interface MenuItem {
  key: string
  path: string
  label: string
  icon?: string
  badge?: number
  /** true = 不可点击的分组标题，不参与路由匹配 */
  isGroupLabel?: boolean
  children?: MenuItem[]
}
