import React from 'react'
import styles from './PageContainer.module.css'

interface PageContainerProps {
  title?: string
  description?: string
  children: React.ReactNode
}

/**
 * 统一页面内容容器：标题区、说明区、内容区
 */
export function PageContainer({ title, description, children }: PageContainerProps) {
  return (
    <div className={styles.container}>
      {(title || description) && (
        <div className={styles.header}>
          {title && <h1 className={styles.title}>{title}</h1>}
          {description && <p className={styles.description}>{description}</p>}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </div>
  )
}
