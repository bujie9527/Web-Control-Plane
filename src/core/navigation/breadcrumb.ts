import type { MenuItem } from './types'

export interface BreadcrumbItem {
  label: string
  path?: string
}

/**
 * 根据当前路由与菜单配置生成 1～2 级面包屑，支持二级菜单（children）
 */
export function getBreadcrumb(currentPath: string, menuConfig: MenuItem[]): BreadcrumbItem[] {
  if (!menuConfig.length) return []

  const firstNav = menuConfig.find((i) => !i.isGroupLabel && i.path)
  const home = firstNav ?? menuConfig[0]
  if (!home?.path) return []
  if (currentPath === home.path) {
    return [{ label: home.label, path: home.path }]
  }

  // 收集所有可匹配项（含二级菜单子项），取路径最长者
  type Match = { label: string; path: string }
  const allMatches: Match[] = []
  for (const item of menuConfig) {
    if (item.isGroupLabel || !item.path) continue
    if (item.path === home.path) continue
    if (currentPath === item.path || currentPath.startsWith(item.path + '/')) {
      if (item.children?.length) {
        for (const child of item.children) {
          if (currentPath === child.path || currentPath.startsWith(child.path + '/')) {
            allMatches.push({ label: child.label, path: child.path })
          }
        }
        if (allMatches.length === 0) allMatches.push({ label: item.label, path: item.path })
      } else {
        allMatches.push({ label: item.label, path: item.path })
      }
    }
  }
  const current =
    allMatches.length > 0 ? allMatches.reduce((a, b) => (a.path.length >= b.path.length ? a : b)) : null
  if (current) {
    return [
      { label: home.label, path: home.path },
      { label: current.label, path: current.path },
    ]
  }

  return [{ label: home.label, path: home.path }]
}
