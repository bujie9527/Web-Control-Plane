import React, { useEffect, useState } from 'react'
import type { ProjectCreationFormState } from '../types'
import { getProjectTypes } from '../../../services/projectCreationReferenceService'
import type { ProjectType } from '../../../schemas/projectCreationReference'
import { getMembersByTenantId } from '../../../mock/tenantMemberMock'
import type { TenantMemberItem } from '../../../mock/tenantMemberMock'
import styles from '../ProjectCreationWizard.module.css'

interface Step1Props {
  form: ProjectCreationFormState
  onChange: (partial: Partial<ProjectCreationFormState>) => void
  tenantId: string
}

export function Step1BasicInfo({ form, onChange, tenantId }: Step1Props) {
  const [projectTypes, setProjectTypes] = useState<ProjectType[]>([])
  const [members, setMembers] = useState<TenantMemberItem[]>([])

  useEffect(() => {
    getProjectTypes().then(setProjectTypes)
  }, [])

  useEffect(() => {
    if (!tenantId) return
    setMembers(getMembersByTenantId(tenantId))
  }, [tenantId])

  const handleOwnerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    const member = members.find((m) => m.id === id)
    onChange({ ownerId: id, ownerName: member?.name ?? '' })
  }

  return (
    <>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>项目名称 *</label>
        <input
          type="text"
          className={styles.formInput}
          placeholder="请输入项目名称"
          value={form.name}
          onChange={(e) => onChange({ name: e.target.value })}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>项目类型 *</label>
        <select
          className={styles.formSelect}
          value={form.projectTypeCode}
          onChange={(e) => onChange({ projectTypeCode: e.target.value })}
        >
          <option value="">请选择项目类型</option>
          {projectTypes
            .filter((p) => p.status === 'active')
            .map((p) => (
              <option key={p.id} value={p.code}>
                {p.name}
                {p.description ? ` - ${p.description}` : ''}
              </option>
            ))}
        </select>
        <p className={styles.formHint}>项目类型影响步骤 2「目标与交付模式」的目标类型可选范围</p>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>项目描述</label>
        <textarea
          className={styles.formTextarea}
          placeholder="简要描述项目的业务背景与目标"
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>负责人</label>
        <select
          className={styles.formSelect}
          value={form.ownerId}
          onChange={handleOwnerChange}
        >
          <option value="">请选择负责人</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <p className={styles.formHint}>不选则提交时使用当前登录用户</p>
      </div>
    </>
  )
}
