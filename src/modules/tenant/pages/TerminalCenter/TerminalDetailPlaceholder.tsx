import { useNavigate, useParams } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { ROUTES } from '@/core/constants/routes'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'

/** 占位：t-b5 将替换为终端详情工作台（5 Tab） */
export function TerminalDetailPlaceholder() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  return (
    <PageContainer title="终端详情" description={id ? `终端 ${id}` : '终端详情'}>
      <p style={{ margin: '16px 0', color: '#5f6368' }}>终端详情工作台开发中，请稍后使用。</p>
      <button type="button" className={listPageStyles.linkBtn} onClick={() => navigate(ROUTES.TENANT.TERMINALS)}>
        返回终端列表
      </button>
    </PageContainer>
  )
}
