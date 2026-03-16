import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { ROUTES } from '@/core/constants/routes'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'

/** 占位：t-b4 将替换为四步新建终端向导 */
export function TerminalNewPlaceholder() {
  const navigate = useNavigate()
  return (
    <PageContainer title="新建终端" description="选择终端类型并填写凭证">
      <p style={{ margin: '16px 0', color: '#5f6368' }}>新建终端向导开发中，请稍后使用。</p>
      <button type="button" className={listPageStyles.linkBtn} onClick={() => navigate(ROUTES.TENANT.TERMINALS)}>
        返回终端列表
      </button>
    </PageContainer>
  )
}
