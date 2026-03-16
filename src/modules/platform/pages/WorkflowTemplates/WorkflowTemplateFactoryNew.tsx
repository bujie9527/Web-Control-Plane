/**
 * 流程设计入口页（原「新建流程模板」）
 * 不再使用抽象直填表单，统一跳转到流程规划发起向导
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/core/constants/routes'

export function WorkflowTemplateFactoryNew() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(ROUTES.SYSTEM.WORKFLOW_PLANNING_NEW, { replace: true })
  }, [navigate])
  return null
}
