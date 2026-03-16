import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'

export function ResourceQuota() {
  return (
    <PageContainer
      title="资源与配额"
      description="平台级资源策略与租户配额"
    >
      <Card title="模型资源" description="可用模型与额度">
        <EmptyState title="骨架占位" description="模型资源配置将在后续完善" />
      </Card>
      <Card title="调用额度" description="API 与推理调用配额">
        <EmptyState title="骨架占位" description="调用额度配置将在后续完善" />
      </Card>
      <Card title="存储额度" description="存储空间与套餐">
        <EmptyState title="骨架占位" description="存储额度将在后续完善" />
      </Card>
      <Card title="套餐配置" description="租户套餐与配额策略">
        <EmptyState title="骨架占位" description="套餐策略将在后续完善" />
      </Card>
    </PageContainer>
  )
}
