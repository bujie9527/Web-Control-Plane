import React, { useEffect } from 'react'
import styles from './Drawer.module.css'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  width?: number | string
  children: React.ReactNode
}

export function Drawer({ open, onClose, title, width = 480, children }: DrawerProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const w = typeof width === 'number' ? `${width}px` : width

  return (
    <>
      <div className={styles.mask} onClick={onClose} aria-hidden />
      <div className={styles.drawer} style={{ width: w }} role="dialog" aria-modal="true">
        {title && (
          <div className={styles.header}>
            <h2 className={styles.title}>{title}</h2>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭">
              ×
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
      </div>
    </>
  )
}
