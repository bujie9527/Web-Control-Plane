import React, { useEffect } from 'react'
import styles from './Dialog.module.css'

export interface DialogProps {
  open: boolean
  onClose: () => void
  title?: string
  width?: number | string
  footer?: React.ReactNode
  /** 确认按钮文案 */
  confirmText?: string
  /** 确认回调 */
  onConfirm?: () => void | Promise<void>
  /** 取消回调（与 onClose 二选一或同时使用） */
  onCancel?: () => void
  children: React.ReactNode
}

/**
 * 通用弹窗：居中、轻量，用于确认框、单表单项等；复杂表单用 Drawer
 */
export function Dialog({
  open,
  onClose,
  title,
  width = 400,
  footer,
  confirmText,
  onConfirm,
  onCancel,
  children,
}: DialogProps) {
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
  const handleCancel = onCancel ?? onClose
  const showDefaultFooter = footer == null && (confirmText != null || onConfirm != null)
  const resolvedFooter =
    footer ??
    (showDefaultFooter ? (
      <div className={styles.footer}>
        <button type="button" className={styles.cancelBtn} onClick={handleCancel}>
          取消
        </button>
        <button
          type="button"
          className={styles.confirmBtn}
          onClick={() => void Promise.resolve(onConfirm?.())}
        >
          {confirmText ?? '确认'}
        </button>
      </div>
    ) : null)

  return (
    <div className={styles.mask} onClick={onClose} aria-hidden>
      <div
        className={styles.dialog}
        style={{ width: w }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'dialog-title' : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {title != null && (
          <div className={styles.header}>
            <h2 id="dialog-title" className={styles.title}>
              {title}
            </h2>
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="关闭">
              ×
            </button>
          </div>
        )}
        <div className={styles.body}>{children}</div>
        {resolvedFooter != null && <div className={styles.footer}>{resolvedFooter}</div>}
      </div>
    </div>
  )
}
