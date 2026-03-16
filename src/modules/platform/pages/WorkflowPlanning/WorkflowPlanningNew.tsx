import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { createPlanningSession } from '@/modules/tenant/services/workflowPlanningSessionService'
import {
  PLANNING_SOURCE_TYPE_LABELS,
  PLANNER_EXECUTION_BACKEND_LABELS,
  PLANNING_PROJECT_TYPE_OPTIONS,
  PLANNING_GOAL_TYPE_OPTIONS,
  PLANNING_DELIVERABLE_OPTIONS,
} from '@/core/labels/planningDisplayLabels'
import styles from '@/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactory.module.css'

interface WorkflowPlanningNewProps {
  scopeType: 'system' | 'tenant'
  tenantId?: string
  createdBy: string
  listRoute: string
  detailRoute: (id: string) => string
}

export function WorkflowPlanningNew({
  scopeType,
  tenantId,
  createdBy,
  listRoute,
  detailRoute,
}: WorkflowPlanningNewProps) {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [projectTypeId, setProjectTypeId] = useState('pt-account-operation')
  const [goalTypeId, setGoalTypeId] = useState('gt-account-followers')
  const [deliverableMode, setDeliverableMode] = useState('social_content')
  const [sourceType, setSourceType] = useState<'sop_input' | 'goal_input' | 'manual'>('sop_input')
  const [sourceText, setSourceText] = useState('')
  const [plannerExecutionBackend, setPlannerExecutionBackend] = useState<'llm' | 'mock'>('llm')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('请输入规划标题')
      return
    }
    setSaving(true)
    setError('')
    try {
      const session = await createPlanningSession({
        scopeType,
        tenantId,
        title: title.trim(),
        description: description.trim() || undefined,
        projectTypeId,
        goalTypeId,
        deliverableMode,
        sourceType,
        sourceText: sourceText.trim() || undefined,
        plannerExecutionBackend,
        status: 'draft',
        createdBy,
      })
      navigate(detailRoute(session.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer
      title="新建流程规划"
      description="创建流程规划会话，基于 SOP 或目标与助手共创流程草案"
    >
      <form onSubmit={handleSubmit}>
        {error && <p className={styles.formError}>{error}</p>}
        <Card title="规划信息" description="填写规划标题、项目类型、目标与交付模式">
          <div className={styles.formRow}>
            <label>规划标题</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：社媒日更流程规划"
            />
          </div>
          <div className={styles.formRow}>
            <label>规划说明</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="可选，描述本次规划的目标与范围"
            />
          </div>
          <div className={styles.formRow}>
            <label>项目类型</label>
            <select value={projectTypeId} onChange={(e) => setProjectTypeId(e.target.value)}>
              {PLANNING_PROJECT_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <label>目标类型</label>
            <select value={goalTypeId} onChange={(e) => setGoalTypeId(e.target.value)}>
              {PLANNING_GOAL_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <label>交付模式</label>
            <select value={deliverableMode} onChange={(e) => setDeliverableMode(e.target.value)}>
              {PLANNING_DELIVERABLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card title="来源与执行" description="选择来源类型、输入 SOP 或目标原文，选择流程规划助手">
          <div className={styles.formRow}>
            <label>来源类型</label>
            <select value={sourceType} onChange={(e) => setSourceType(e.target.value as typeof sourceType)}>
              <option value="sop_input">{PLANNING_SOURCE_TYPE_LABELS.sop_input}</option>
              <option value="goal_input">{PLANNING_SOURCE_TYPE_LABELS.goal_input}</option>
              <option value="manual">{PLANNING_SOURCE_TYPE_LABELS.manual}</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label>SOP 原文或目标描述</label>
            <textarea
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              placeholder="输入您的 SOP 步骤或目标描述，助手将据此生成流程草案"
              rows={6}
            />
          </div>
          <div className={styles.formRow}>
            <label>流程规划助手</label>
            <select disabled>
              <option value="">默认助手（当前阶段）</option>
            </select>
          </div>
          <div className={styles.formRow}>
            <label>执行后端</label>
            <select
              value={plannerExecutionBackend}
              onChange={(e) => setPlannerExecutionBackend(e.target.value as 'llm' | 'mock')}
            >
              <option value="llm">{PLANNER_EXECUTION_BACKEND_LABELS.llm}</option>
              <option value="mock">Mock 模拟（仅调试用）</option>
            </select>
            {plannerExecutionBackend === 'llm' && (
              <span className={styles.sectionHint} style={{ marginTop: 4, display: 'block' }}>
                请确保已运行 npm run dev:api 并在平台后台 → LLM 凭证中配置 OpenAI 密钥
              </span>
            )}
          </div>
        </Card>

        <Card title="提交">
          <div className={styles.formActions}>
            <button type="submit" className={listPageStyles.primaryBtn} disabled={saving}>
              {saving ? '创建中...' : '创建规划'}
            </button>
            <button
              type="button"
              className={listPageStyles.linkBtn}
              onClick={() => navigate(listRoute)}
            >
              取消
            </button>
          </div>
        </Card>
      </form>
    </PageContainer>
  )
}
