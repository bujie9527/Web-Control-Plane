import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { getTemplateById, updateTemplate } from '../../services/agentTemplateService'
import { getSkillList } from '../../services/skillService'
import type { AgentTemplateRoleType } from '../../schemas/agentTemplate'
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

export function AgentFactoryEdit() {
  const { id } = useParams<{ id: string }>()
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
  const [channelStyleProfilesText, setChannelStyleProfilesText] = useState('')
  const [skills, setSkills] = useState<Skill[]>([])
  const [skillsByCategory, setSkillsByCategory] = useState<Record<string, Skill[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    Promise.all([
      getTemplateById(id),
      getSkillList({ pageSize: 50, status: 'active' }),
    ]).then(([template, skillRes]) => {
      if (template) {
        setFormData({
          name: template.name,
          nameZh: template.nameZh ?? '',
          code: template.code,
          description: template.description ?? '',
          roleType: template.roleType,
          category: template.category ?? 'execution',
          domain: template.domain ?? '',
          sceneTags: template.sceneTags?.join(', ') ?? '',
        })
        setSelectedSkillIds(template.supportedSkillIds ?? [])
        setChannelStyleProfilesText(
          template.channelStyleProfiles ? JSON.stringify(template.channelStyleProfiles, null, 2) : ''
        )
      }
      setSkills(skillRes.items)
      const grouped: Record<string, Skill[]> = {}
      skillRes.items.forEach((s) => {
        if (!grouped[s.category]) grouped[s.category] = []
        grouped[s.category].push(s)
      })
      setSkillsByCategory(grouped)
      setLoading(false)
    })
  }, [id])

  const toggleSkill = (skillId: string) => {
    setSelectedSkillIds((prev) =>
      prev.includes(skillId) ? prev.filter((s) => s !== skillId) : [...prev, skillId]
    )
  }

  const handleSubmit = async () => {
    if (!id) return
    setError('')
    if (!formData.name.trim()) { setError('请输入模板名称'); return }
    setSaving(true)
    try {
      let channelStyleProfiles: Record<string, unknown> | undefined
      if (channelStyleProfilesText.trim()) {
        try {
          channelStyleProfiles = JSON.parse(channelStyleProfilesText) as Record<string, unknown>
        } catch {
          setError('渠道风格配置必须是合法 JSON')
          setSaving(false)
          return
        }
      }
      await updateTemplate(id, {
        name: formData.name.trim(),
        nameZh: formData.nameZh.trim() || undefined,
        description: formData.description.trim() || undefined,
        roleType: formData.roleType,
        category: formData.category || undefined,
        domain: formData.domain.trim() || undefined,
        sceneTags: formData.sceneTags.trim()
          ? formData.sceneTags.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        supportedSkillIds: selectedSkillIds.length > 0 ? selectedSkillIds : undefined,
        channelStyleProfiles,
      })
      navigate(ROUTES.SYSTEM.AGENT_FACTORY_DETAIL(id))
    } catch (e) {
      setError(e instanceof Error ? e.message : '更新失败')
    } finally {
      setSaving(false)
    }
  }

  if (!id) { navigate(ROUTES.SYSTEM.AGENT_FACTORY); return null }

  if (loading) {
    return (
      <PageContainer title="编辑模板">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer
      title="编辑 Agent 模板"
      description={`编码：${formData.code}（不可修改）`}
    >
      <Card title="基本信息">
        {error && <p className={styles.formError}>{error}</p>}
        <div className={styles.form}>
          <div className={styles.formRow}>
            <label>中文名称</label>
            <input
              type="text"
              value={formData.nameZh}
              onChange={(e) => setFormData((d) => ({ ...d, nameZh: e.target.value }))}
              placeholder="前台显示用中文名"
            />
          </div>
          <div className={styles.formRow}>
            <label>英文名称 <span className={styles.required}>*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
            />
          </div>
          <div className={styles.formRow}>
            <label>编码</label>
            <input type="text" value={formData.code} disabled />
            <span className={styles.formHint}>编码不可修改</span>
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
              rows={3}
            />
          </div>
          <div className={styles.formRow}>
            <label>渠道风格配置（JSON，可选）</label>
            <textarea
              value={channelStyleProfilesText}
              onChange={(e) => setChannelStyleProfilesText(e.target.value)}
              className={styles.jsonTextarea}
              placeholder='{"telegram_bot":{"styleInstruction":"300-500字，短段落"}}'
            />
            <span className={styles.formHint}>用于按渠道动态注入写作风格（如 telegram_bot / facebook_page）</span>
          </div>
        </div>
      </Card>

      <Card title="绑定 Skill" description="选择该 Agent 模板支持调用的 Skill">
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
            {saving ? '保存中...' : '保存'}
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => navigate(ROUTES.SYSTEM.AGENT_FACTORY_DETAIL(id))}>
            取消
          </button>
        </div>
      </Card>
    </PageContainer>
  )
}
