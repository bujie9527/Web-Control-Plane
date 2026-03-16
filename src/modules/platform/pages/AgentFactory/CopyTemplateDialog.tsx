import { useState } from 'react'
import { Dialog } from '@/components/Dialog/Dialog'
import type { AgentTemplate, CloneAgentTemplatePayload } from '../../schemas/agentTemplate'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import styles from './AgentFactoryList.module.css'

export interface CopyTemplateDialogProps {
  open: boolean
  onClose: () => void
  source: AgentTemplate
  onConfirm: (payload: CloneAgentTemplatePayload) => Promise<void>
}

/** 推荐默认名称：基于模板创建 */
function defaultCopyName(source: AgentTemplate): string {
  return `基于 ${source.name} 创建`
}

function defaultCopyCode(source: AgentTemplate): string {
  return `${source.code}_COPY_${Date.now().toString().slice(-6)}`
}

export function CopyTemplateDialog({ open, onClose, source, onConfirm }: CopyTemplateDialogProps) {
  const [name, setName] = useState(() => defaultCopyName(source))
  const [code, setCode] = useState(() => defaultCopyCode(source))
  const [category, setCategory] = useState(source.category ?? '')
  const [domain, setDomain] = useState(source.domain ?? '')
  const [sceneTags, setSceneTags] = useState(
    source.sceneTags?.join(', ') ?? ''
  )
  const [inheritSkills, setInheritSkills] = useState(true)
  const [inheritModelConfig, setInheritModelConfig] = useState(true)
  const [inheritGuardrails, setInheritGuardrails] = useState(true)
  const [inheritReviewPolicy, setInheritReviewPolicy] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setName(defaultCopyName(source))
    setCode(defaultCopyCode(source))
    setCategory(source.category ?? '')
    setDomain(source.domain ?? '')
    setSceneTags(source.sceneTags?.join(', ') ?? '')
    setInheritSkills(true)
    setInheritModelConfig(true)
    setInheritGuardrails(true)
    setInheritReviewPolicy(true)
    setError('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const handleSubmit = async () => {
    setError('')
    const trimmedName = name.trim()
    const trimmedCode = code.trim().toUpperCase().replace(/\s+/g, '_')
    if (!trimmedName) {
      setError('请输入模板名称')
      return
    }
    if (!trimmedCode) {
      setError('请输入模板编码')
      return
    }
    setSaving(true)
    try {
      const payload: CloneAgentTemplatePayload = {
        name: trimmedName,
        code: trimmedCode,
        category: category.trim() || undefined,
        domain: domain.trim() || undefined,
        sceneTags: sceneTags
          .split(/[,\s]+/)
          .map((s) => s.trim())
          .filter(Boolean),
        inheritSkills,
        inheritModelConfig,
        inheritGuardrails,
        inheritReviewPolicy,
      }
      await onConfirm(payload)
      handleClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : '复制失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="基于模板创建"
      width={480}
      footer={
        <div className={styles.formActions}>
          <button
            type="button"
            className={listPageStyles.primaryBtn}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? '复制中...' : '复制'}
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={handleClose}>
            取消
          </button>
        </div>
      }
    >
      <div className={styles.form}>
        {error && <p className={styles.formError}>{error}</p>}
        <p className={styles.copyHint}>从「{source.name}」复制为新模板，请填写以下信息：</p>
        <div className={styles.formRow}>
          <label>模板名称 <span className={styles.required}>*</span></label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="请输入新模板名称"
          />
        </div>
        <div className={styles.formRow}>
          <label>模板编码 <span className={styles.required}>*</span></label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="如 MY_CUSTOM_CREATOR"
          />
        </div>
        <div className={styles.formRow}>
          <label>分类</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="如 content、review"
          />
        </div>
        <div className={styles.formRow}>
          <label>领域</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="如 social、facebook"
          />
        </div>
        <div className={styles.formRow}>
          <label>场景标签</label>
          <input
            type="text"
            value={sceneTags}
            onChange={(e) => setSceneTags(e.target.value)}
            placeholder="英文逗号分隔，如 content, creation"
          />
        </div>
        <div className={styles.inheritSection}>
          <div className={styles.inheritTitle}>可选继承（勾选则从源模板继承）：</div>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={inheritSkills}
              onChange={(e) => setInheritSkills(e.target.checked)}
            />
            <span>Skill 配置</span>
          </label>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={inheritModelConfig}
              onChange={(e) => setInheritModelConfig(e.target.checked)}
            />
            <span>模型配置</span>
          </label>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={inheritGuardrails}
              onChange={(e) => setInheritGuardrails(e.target.checked)}
            />
            <span>Guardrails</span>
          </label>
          <label className={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={inheritReviewPolicy}
              onChange={(e) => setInheritReviewPolicy(e.target.checked)}
            />
            <span>审核策略</span>
          </label>
        </div>
      </div>
    </Dialog>
  )
}
