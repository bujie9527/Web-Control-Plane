import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { useAuth } from '@/core/auth/AuthContext'
import { ROUTES } from '@/core/constants/routes'
import { getTenantTemplateById, updateTenantTemplate, changeTenantTemplateStatus } from '../../services/tenantWorkflowTemplateService'
import type { WorkflowTemplate } from '../../schemas/workflowExecution'
import { WorkflowNodeBuilder } from '@/modules/platform/pages/WorkflowTemplates/WorkflowNodeBuilder'
import { WORKFLOW_STATUS_LABELS } from '@/modules/platform/pages/WorkflowTemplates/workflowTemplateLabels'
import styles from '@/modules/platform/pages/WorkflowTemplates/WorkflowTemplateFactory.module.css'

type TenantStatus = 'draft' | 'active' | 'archived'

export function TenantWorkflowTemplateEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? ''

  const [detail, setDetail] = useState<WorkflowTemplate | null | undefined>(undefined)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TenantStatus>('draft')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getTenantTemplateById(id).then((d) => {
      setDetail(d ?? null)
      if (d) {
        setName(d.name)
        setDescription(d.description ?? '')
        setStatus((d.status as TenantStatus) || 'draft')
      }
    })
  }, [id])

  if (!id) {
    navigate(ROUTES.TENANT.WORKFLOW_TEMPLATES)
    return null
  }

  if (detail === undefined) {
    return (
      <PageContainer title="编辑租户模板" description="加载中...">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }

  if (detail === null) {
    return (
      <PageContainer title="编辑租户模板" description="未找到模板">
        <Link to={ROUTES.TENANT.WORKFLOW_TEMPLATES} className={styles.backLink}>← 返回列表</Link>
      </PageContainer>
    )
  }

  if (detail.scopeType !== 'tenant' || detail.tenantId !== tenantId) {
    return (
      <PageContainer title="编辑租户模板" description="无权编辑此模板">
        <p className={styles.formError}>仅可编辑本租户的模板</p>
        <Link to={ROUTES.TENANT.WORKFLOW_TEMPLATES} className={styles.backLink}>← 返回列表</Link>
      </PageContainer>
    )
  }

  const saveBasicInfo = async () => {
    setSaving(true)
    setError('')
    try {
      await updateTenantTemplate(id, { name, description })
      setDetail((prev) => (prev ? { ...prev, name, description } : null))
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const changeStatus = async (nextStatus: TenantStatus) => {
    setSaving(true)
    setError('')
    try {
      const updated = await changeTenantTemplateStatus(id, nextStatus)
      if (updated) {
        setStatus(nextStatus)
        setDetail((prev) => (prev ? { ...prev, status: nextStatus } : null))
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '状态切换失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <PageContainer
      title="编辑租户模板"
      description={`编码：${detail.code} · 来源：${detail.sourceTemplateId ? `v${detail.sourceVersion ?? 1}` : '—'}`}
    >
      <div className={styles.headerBar}>
        <Link to={ROUTES.TENANT.WORKFLOW_TEMPLATES} className={styles.backLink}>← 返回模板列表</Link>
        <Link to={ROUTES.TENANT.WORKFLOW_TEMPLATES_DETAIL(id)} className={styles.backLink}>
          查看详情
        </Link>
      </div>

      {error && <p className={styles.formError}>{error}</p>}

      <Card title="基础信息" description="仅可修改名称和描述">
        <div className={styles.formRow}>
          <label>名称</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className={styles.formRow}>
          <label>描述</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className={styles.formRow}>
          <label>状态</label>
          <select value={status} onChange={(e) => changeStatus(e.target.value as TenantStatus)} disabled={saving}>
            <option value="draft">{WORKFLOW_STATUS_LABELS.draft}</option>
            <option value="active">{WORKFLOW_STATUS_LABELS.active}</option>
            <option value="archived">{WORKFLOW_STATUS_LABELS.archived}</option>
          </select>
          <span className={styles.sectionHint} style={{ marginLeft: 8 }}>
            仅 active 模板可在项目创建时选择
          </span>
        </div>
        <div className={styles.formActions}>
          <button type="button" className={listPageStyles.primaryBtn} onClick={saveBasicInfo} disabled={saving}>
            {saving ? '保存中...' : '保存基础信息'}
          </button>
        </div>
      </Card>

      <WorkflowNodeBuilder templateId={detail.id} tenantMode />
    </PageContainer>
  )
}
