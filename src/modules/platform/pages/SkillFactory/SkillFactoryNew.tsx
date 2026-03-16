import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { createSkill } from '../../services/skillService'
import type { SkillExecutionType } from '../../schemas/skill'
import {
  SKILL_CATEGORY_LABELS,
  SKILL_EXECUTION_TYPE_LABELS,
} from '@/core/labels/skillLabels'
import { ROUTES } from '@/core/constants/routes'
import styles from './SkillFactory.module.css'

export function SkillFactoryNew() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [nameZh, setNameZh] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState('content')
  const [executionType, setExecutionType] = useState<SkillExecutionType>('llm')
  const [description, setDescription] = useState('')
  const [version, setVersion] = useState('1.0')
  const [steps, setSteps] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!name.trim() || !code.trim() || !category) {
      setError('请填写名称、编码和分类')
      return
    }
    setSaving(true)
    setError('')
    try {
      await createSkill({
        name: name.trim(),
        nameZh: nameZh.trim() || undefined,
        code: code.trim().toUpperCase().replace(/\s+/g, '_'),
        category,
        executionType,
        description: description.trim() || undefined,
        version: version.trim() || '1.0',
        status: 'active',
        openClawSpec: steps.trim()
          ? { steps: steps.split('\n').map((s) => s.trim()).filter(Boolean) }
          : undefined,
      })
      navigate(ROUTES.SYSTEM.SKILL_FACTORY)
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer
      title="新建 Skill"
      description="为平台新增一个可复用的能力 Skill"
    >
      <Card title="Skill 基础信息">
        {error && <p className={styles.errorText}>{error}</p>}

        <div className={styles.formRow}>
          <label>
            中文名称 <span style={{ color: '#d93025' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="如：内容创作"
            value={nameZh}
            onChange={(e) => setNameZh(e.target.value)}
          />
        </div>

        <div className={styles.formRow}>
          <label>
            英文名称 <span style={{ color: '#d93025' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="如：Content Write"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className={styles.formRow}>
          <label>
            编码 <span style={{ color: '#d93025' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="如：CONTENT_WRITE（自动大写）"
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>

        <div className={styles.formRow}>
          <label>
            业务分类 <span style={{ color: '#d93025' }}>*</span>
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(SKILL_CATEGORY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <label>执行类型</label>
          <select
            value={executionType}
            onChange={(e) => setExecutionType(e.target.value as SkillExecutionType)}
          >
            {Object.entries(SKILL_EXECUTION_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <label>版本</label>
          <input
            type="text"
            placeholder="1.0"
            value={version}
            onChange={(e) => setVersion(e.target.value)}
          />
        </div>

        <div className={styles.formRow}>
          <label>能力说明</label>
          <textarea
            placeholder="描述该 Skill 的用途与能力范围"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #dadce0', borderRadius: 4, resize: 'vertical' }}
          />
        </div>

        <div className={styles.formRow}>
          <label>执行步骤（每行一步，可选）</label>
          <textarea
            placeholder={'步骤一\n步骤二\n步骤三'}
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: '8px 12px', fontSize: 14, border: '1px solid #dadce0', borderRadius: 4, resize: 'vertical' }}
          />
        </div>

        <div className={styles.dialogActions} style={{ marginTop: 20 }}>
          <button
            type="button"
            className={listPageStyles.primaryBtn}
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? '保存中...' : '保存并创建'}
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => navigate(ROUTES.SYSTEM.SKILL_FACTORY)}
          >
            取消
          </button>
        </div>
      </Card>
    </PageContainer>
  )
}
