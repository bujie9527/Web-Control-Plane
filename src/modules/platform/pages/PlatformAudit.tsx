import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'

export function PlatformAudit() {
  return (
    <PageContainer
      title="平台审计"
      description="平台全局操作、安全与事件日志"
    >
      <Card title="操作日志" description="预留：创建租户、更新状态、配额变更、项目与成员操作等">
        <EmptyState title="操作日志" description="平台级关键操作将在此记录，后续对接 core/auditService 与审计存储。" />
      </Card>
      <Card title="安全日志" description="预留：登录、登出、权限变更">
        <EmptyState title="安全日志" description="登录与权限相关日志将在后续完善。" />
      </Card>
      <Card title="事件日志" description="预留：系统与业务事件（与 core/constants/events 对齐）">
        <EmptyState title="事件日志" description="系统与业务事件将在此展示，后续对接事件总线或审计存储。" />
      </Card>
    </PageContainer>
  )
}
