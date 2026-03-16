import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'

export function PlatformUsers() {
  return (
    <PageContainer
      title="平台用户"
      description="平台侧成员管理、角色与登录信息"
    >
      <Card title="平台管理员" description="拥有平台级管理权限的账号">
        <EmptyState title="骨架占位" description="平台管理员列表将在后续完善" />
      </Card>
      <Card title="平台角色" description="角色与权限配置">
        <EmptyState title="骨架占位" description="平台角色列表将在后续完善" />
      </Card>
      <Card title="登录记录" description="平台侧登录日志">
        <EmptyState title="骨架占位" description="登录记录将在后续完善" />
      </Card>
    </PageContainer>
  )
}
