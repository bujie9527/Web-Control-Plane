import { useCallback, useEffect, useState } from 'react'
import type { ProjectCreationFormState } from '../types'
import { getIdentityList } from '../../../services/identityService'
import { getTerminalList } from '../../../services/terminalService'
import type { Identity } from '../../../schemas/identity'
import styles from '../ProjectCreationWizard.module.css'

interface Step4Props {
  form: ProjectCreationFormState
  onChange: (partial: Partial<ProjectCreationFormState>) => void
  tenantId: string
}

export function Step4Resources({ form, onChange, tenantId }: Step4Props) {
  const [identities, setIdentities] = useState<Identity[]>([])
  const [terminals, setTerminals] = useState<{ id: string; name: string; type: string }[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadIdentities = useCallback(async () => {
    if (!tenantId) return
    try {
      const res = await getIdentityList({ tenantId, pageSize: 50, status: 'active' })
      setIdentities(res.items)
    } catch (e) {
      setLoadError((prev) => prev ?? (e instanceof Error ? e.message : '加载身份列表失败，请稍后重试'))
    }
  }, [tenantId])

  const loadTerminals = useCallback(async () => {
    if (!tenantId) return
    try {
      const res = await getTerminalList({ tenantId, page: 1, pageSize: 50 })
      setTerminals(res.items.map((t) => ({ id: t.id, name: t.name, type: t.type })))
    } catch (e) {
      setLoadError((prev) => prev ?? (e instanceof Error ? e.message : '加载终端列表失败，请稍后重试'))
    }
  }, [tenantId])

  const retryLoad = useCallback(() => {
    setLoadError(null)
    void loadIdentities()
    void loadTerminals()
  }, [loadIdentities, loadTerminals])

  useEffect(() => {
    loadIdentities()
  }, [loadIdentities])

  useEffect(() => {
    loadTerminals()
  }, [loadTerminals])

  const toggleIdentity = (id: string) => {
    const next = form.identityIds.includes(id)
      ? form.identityIds.filter((x) => x !== id)
      : [...form.identityIds, id]
    const defaultId =
      form.defaultIdentityId && !next.includes(form.defaultIdentityId)
        ? next[0] ?? ''
        : form.defaultIdentityId
    onChange({ identityIds: next, defaultIdentityId: defaultId })
  }

  const setDefaultIdentity = (id: string) => {
    onChange({ defaultIdentityId: id })
  }

  const toggleTerminal = (id: string) => {
    const next = form.terminalIds.includes(id)
      ? form.terminalIds.filter((x) => x !== id)
      : [...form.terminalIds, id]
    onChange({ terminalIds: next })
  }

  return (
    <>
      {loadError && (
        <p className={styles.formHint} style={{ color: 'var(--color-error, #c5221f)', marginBottom: 12 }}>
          {loadError}
          <button type="button" onClick={retryLoad} style={{ marginLeft: 12, cursor: 'pointer', textDecoration: 'underline' }}>
            重试
          </button>
        </p>
      )}
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>绑定身份</label>
        <div className={styles.checkboxGroup} style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          {identities.map((i) => (
            <label key={i.id} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={form.identityIds.includes(i.id)}
                onChange={() => toggleIdentity(i.id)}
              />
              {i.name}
              {i.corePositioning ? (
                <span style={{ color: '#5f6368', fontSize: 12, marginLeft: 8 }}>
                  — {i.corePositioning.slice(0, 40)}
                  {i.corePositioning.length > 40 ? '…' : ''}
                </span>
              ) : null}
              {form.identityIds.includes(i.id) && (
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  style={{ marginLeft: 12, padding: '2px 8px', fontSize: 12 }}
                  onClick={(e) => {
                    e.preventDefault()
                    setDefaultIdentity(i.id)
                  }}
                >
                  {form.defaultIdentityId === i.id ? '✓ 默认' : '设为默认'}
                </button>
              )}
            </label>
          ))}
        </div>
        {identities.length === 0 && (
          <p className={styles.formHint}>暂无可用身份，请先在身份库中创建</p>
        )}
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>绑定终端</label>
        <div className={styles.checkboxGroup}>
          {terminals.map((t) => (
            <label key={t.id} className={styles.checkboxItem}>
              <input
                type="checkbox"
                checked={form.terminalIds.includes(t.id)}
                onChange={() => toggleTerminal(t.id)}
              />
              {t.name}
              <span style={{ color: '#5f6368', fontSize: 12 }}>（{t.type}）</span>
            </label>
          ))}
        </div>
      </div>
    </>
  )
}
