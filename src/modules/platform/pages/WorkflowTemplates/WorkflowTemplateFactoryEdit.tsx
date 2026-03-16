import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { ROUTES } from '@/core/constants/routes'
import {
  getWorkflowTemplateById,
  updateWorkflowTemplate,
} from '@/modules/tenant/services/workflowTemplateFactoryService'
import type { WorkflowTemplate } from '@/modules/tenant/schemas/workflowExecution'
import styles from './WorkflowTemplateFactory.module.css'
import { WorkflowTemplateFactoryForm } from './WorkflowTemplateFactoryForm'
import { WorkflowNodeBuilder } from './WorkflowNodeBuilder'

export function WorkflowTemplateFactoryEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<WorkflowTemplate | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getWorkflowTemplateById(id).then((d) => setDetail(d))
  }, [id])

  if (!id) {
    navigate(ROUTES.SYSTEM.WORKFLOW_TEMPLATES)
    return null
  }
  if (detail === undefined) {
    return (
      <PageContainer title="编辑流程模板" description="加载中...">
        <p className={styles.loading}>加载中...</p>
      </PageContainer>
    )
  }
  if (detail === null) {
    return (
      <PageContainer title="编辑流程模板" description="未找到模板">
        <p>未找到该模板，请检查链接或返回列表。</p>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="编辑流程模板" description={`编码：${detail.code}`}>
      <WorkflowTemplateFactoryForm
        mode="edit"
        initial={detail}
        saving={saving}
        error={error}
        onCancel={() => navigate(ROUTES.SYSTEM.WORKFLOW_TEMPLATES_DETAIL(id))}
        onSubmit={async (payload) => {
          setSaving(true)
          setError('')
          try {
            await updateWorkflowTemplate(id, payload)
            navigate(ROUTES.SYSTEM.WORKFLOW_TEMPLATES_DETAIL(id))
          } catch (e) {
            setError(e instanceof Error ? e.message : '保存失败')
          } finally {
            setSaving(false)
          }
        }}
      />
      <WorkflowNodeBuilder templateId={detail.id} />
    </PageContainer>
  )
}
