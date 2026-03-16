import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { createTemplate } from '../../services/agentTemplateService'
import { getSkillList } from '../../services/skillService'
import type { AgentTemplateRoleType, CreateAgentTemplatePayload } from '../../schemas/agentTemplate'
import type { Skill } from '../../schemas/skill'
import { AGENT_ROLE_TYPE_LABELS, AGENT_CATEGORY_LABELS } from '@/core/labels/agentTemplateLabels'
import { SKILL_CATEGORY_LABELS } from '@/core/labels/skillLabels'
import { ROUTES } from '@/core/constants/routes'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import styles from './AgentFactoryList.module.css'

const DOMAIN_OPTIONS = [
  { value: '', label: '不限' },
  { value: 'social', label: '社交媒体' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'content', label: '内容' },
  { value: 'compliance', label: '合规' },
  { value: 'distribution', label: '分发' },
  { value: 'recording', label: '记录' },
  { value: 'research', label: '研究' },
  { value: 'supervision', label: '监督' },
  { value: 'workflow', label: '流程规划' },
  { value: 'website', label: '建站' },
  { value: 'ai_employee', label: 'AI 员工' },
]

const CATEGORY_OPTIONS = [
  { value: 'planning', label: AGENT_CATEGORY_LABELS['planning'] },
  { value: 'execution', label: AGENT_CATEGORY_LABELS['execution'] },
  { value: 'coordination', label: AGENT_CATEGORY_LABELS['coordination'] },
]

export function AgentFactoryNew() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: '',
    nameZh: '',
    code: '',
    description: '',
    roleType: 'creator' as AgentTemplateRoleType,
    category: 'execution',
    domain: '',
    sceneTags: '',
  })
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [skillsByCategory, setSkillsByCategory] = useState<Record<string, Skill[]>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSkillList({ pageSize: 50, status: 'active' }).then((res) => {
      setSkills(res.items)
      const grouped: Record<string, Skill[]> = {}
      res.items.forEach((s) => {
        if (!grouped[s.category]) grouped[s.category] = []
        grouped[s.category].push(s)
      })
      setSkillsByCategory(grouped)
    })
  }, [])

  const toggleSkill = (id: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    setError('')
    if (!formData.name.trim()) { setError('请输入模板名称'); return }
    if (!formData.code.trim()) { setError('请输入模板编码'); return }
    setSaving(true)
    try {
      const payload: CreateAgentTemplatePayload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase().replace(/\s+/g, '_'),
        description: formData.description.trim() || undefined,
        roleType: formData.roleType,
        category: formData.category || undefined,
        domain: formData.domain.trim() || undefined,
        sceneTags: formData.sceneTags.trim()
          ? formData.sceneTags.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        supportedSkillIds: selectedSkillIds.length > 0 ? selectedSkillIds : undefined,
        defaultExecutorType: 'agent',
      }
      const created = await createTemplate(payload)
      navigate(ROUTES.SYSTEM.AGENT_FACTORY_DETAIL(created.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer title="新建 Agent 模板" description="创建新的平台级 Agent 模板">
      <Card title="基本信息">
        {error && <p className={styles.formError}>{error}</p>}
        <div className={styles.form}>
          <div className={styles.formRow}>
            <label>中文名称</label>
            <input
              type="text"
              value={formData.nameZh}
              onChange={(e) => setFormData((d) => ({ ...d, nameZh: e.target.value }))}
              placeholder="如：Facebook 内容生成 Agent"
            />
          </div>
          <div className={styles.formRow}>
            <label>英文名称 <span className={styles.required}>*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
              placeholder="如：Facebook Content Creator Agent"
            />
          </div>
          <div className={styles.formRow}>
            <label>编码 <span className={styles.required}>*</span></label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData((d) => ({ ...d, code: e.target.value }))}
              placeholder="如 FB_CONTENT_CREATOR（自动大写）"
            />
          </div>
          <div className={styles.formRow}>
            <label>角色类型</label>
            <select
              value={formData.roleType}
              onChange={(e) => setFormData((d) => ({ ...d, roleType: e.target.value as AgentTemplateRoleType }))}
            >
              {Object.entries(AGENT_ROLE_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <label>分类</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData((d) => ({ ...d, category: e.target.value }))}
            >
              {CATEGORY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <label>垂直领域</label>
            <select
              value={formData.domain}
              onChange={(e) => setFormData((d) => ({ ...d, domain: e.target.value }))}
            >
              {DOMAIN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <label>场景标签（多个用逗号分隔）</label>
            <input
              type="text"
              value={formData.sceneTags}
              onChange={(e) => setFormData((d) => ({ ...d, sceneTags: e.target.value }))}
              placeholder="如：content, social, review"
            />
          </div>
          <div className={styles.formRow}>
            <label>能力说明</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((d) => ({ ...d, description: e.target.value }))}
              placeholder="描述该 Agent 的能力范围与适用场景"
              rows={3}
            />
          </div>
        </div>
      </Card>

      <Card title="绑定 Skill（可选）" description="选择该 Agent 模板支持调用的 Skill">
        {skills.length === 0 ? (
          <p className={styles.formHint}>加载中...</p>
        ) : (
          Object.entries(skillsByCategory).map(([cat, catSkills]) => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 500, color: '#5f6368', fontSize: 13, marginBottom: 8 }}>
                {SKILL_CATEGORY_LABELS[cat] ?? cat}
              </div>
              {catSkills.map((s) => (
                <label key={s.id} className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={selectedSkillIds.includes(s.id)}
                    onChange={() => toggleSkill(s.id)}
                  />
                  <span>
                    <strong>{s.nameZh ?? s.name}</strong>
                    {s.description && (
                      <span style={{ color: '#5f6368', marginLeft: 6, fontSize: 12 }}>— {s.description}</span>
                    )}
                  </span>
                </label>
              ))}
            </div>
          ))
        )}
        {selectedSkillIds.length > 0 && (
          <p className={styles.formHint}>已选 {selectedSkillIds.length} 个 Skill</p>
        )}
      </Card>

      <Card>
        <div className={styles.formActions}>
          <button type="button" className={listPageStyles.primaryBtn} onClick={handleSubmit} disabled={saving}>
            {saving ? '保存中...' : '保存并创建'}
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => navigate(ROUTES.SYSTEM.AGENT_FACTORY)}>
            取消
          </button>
        </div>
      </Card>
    </PageContainer>
  )
}
