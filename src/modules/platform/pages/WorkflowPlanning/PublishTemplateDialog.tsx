/**
 * 发布流程模板弹窗
 * Phase 12：Draft → Validator → 选择发布范围 → 输入模板名称 → 发布
 */
import { useState } from 'react'
import { Dialog } from '@/components/Dialog/Dialog'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { PUBLISH_SCOPE_TYPE_OPTIONS } from '@/core/labels/planningDisplayLabels'
import styles from '@/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactory.module.css'

export interface PublishTemplateDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (params: {
    templateName: string
    templateDescription: string
    scopeType: 'system' | 'tenant'
    tenantId?: string
  }) => Promise<void>
  allowSystemPublish: boolean
  defaultTenantId?: string
  loading?: boolean
}

export function PublishTemplateDialog({
  open,
  onClose,
  onConfirm,
  allowSystemPublish,
  defaultTenantId,
  loading = false,
}: PublishTemplateDialogProps) {
  const [templateName, setTemplateName] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [scopeType, setScopeType] = useState<'system' | 'tenant'>(
    defaultTenantId ? 'tenant' : 'system'
  )
  const [error, setError] = useState('')

  const scopeOptions = allowSystemPublish
    ? PUBLISH_SCOPE_TYPE_OPTIONS
    : PUBLISH_SCOPE_TYPE_OPTIONS.filter((o) => o.value === 'tenant')

  const handleSubmit = async () => {
    setError('')
    if (!templateName.trim()) {
      setError('请输入模板名称')
      return
    }
    if (scopeType === 'tenant' && !defaultTenantId) {
      setError('租户模板需要当前租户上下文')
      return
    }
    try {
      await onConfirm({
        templateName: templateName.trim(),
        templateDescription: templateDescription.trim(),
        scopeType,
        tenantId: scopeType === 'tenant' ? defaultTenantId : undefined,
      })
      setTemplateName('')
      setTemplateDescription('')
      setScopeType(defaultTenantId ? 'tenant' : 'system')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '发布失败')
    }
  }

  const handleClose = () => {
    setError('')
    setTemplateName('')
    setTemplateDescription('')
    onClose()
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="发布流程模板"
      width={420}
      footer={
        <div className={styles.formActions}>
          <button
            type="button"
            className={listPageStyles.primaryBtn}
            onClick={handleSubmit}
            disabled={loading || !templateName.trim()}
          >
            {loading ? '发布中...' : '确认发布'}
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={handleClose}>
            取消
          </button>
        </div>
      }
    >
      <div className={styles.form}>
        {error && <p className={styles.formError}>{error}</p>}
        <div className={styles.formRow}>
          <label>模板名称 <span className={styles.required}>*</span></label>
          <input
            type="text"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            placeholder="例如：社媒日更发布流程"
            disabled={loading}
          />
        </div>
        <div className={styles.formRow}>
          <label>发布范围</label>
          <select
            value={scopeType}
            onChange={(e) => setScopeType(e.target.value as 'system' | 'tenant')}
            disabled={loading || scopeOptions.length === 1}
          >
            {scopeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.formRow}>
          <label>模板说明</label>
          <textarea
            value={templateDescription}
            onChange={(e) => setTemplateDescription(e.target.value)}
            placeholder="可选，描述模板用途与适用场景"
            rows={3}
            disabled={loading}
          />
        </div>
      </div>
    </Dialog>
  )
}
