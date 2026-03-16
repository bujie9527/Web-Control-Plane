import React from 'react'
import styles from './ListPageToolbar.module.css'

export interface ListPageToolbarProps {
  /** 主操作区，如「新建」按钮 */
  primaryAction?: React.ReactNode
  /** 筛选区内容，如搜索框、下拉、查询按钮 */
  children?: React.ReactNode
}

/**
 * 列表页通用工具栏：主操作 + 筛选区，与 05 规范一致
 */
export function ListPageToolbar({ primaryAction, children }: ListPageToolbarProps) {
  return (
    <>
      {primaryAction && <div className={styles.actionBar}>{primaryAction}</div>}
      {children != null && (
        <div className={styles.toolbar}>
          <div className={styles.filters}>{children}</div>
        </div>
      )}
    </>
  )
}

/** 导出样式类名供列表页操作列、链接按钮等复用 */
export const listPageStyles = styles
