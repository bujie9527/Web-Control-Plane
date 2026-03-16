import { EmptyState } from '@/components/EmptyState/EmptyState'
import { PageContainer } from '@/components/PageContainer/PageContainer'

interface RoutePlaceholderPageProps {
  title: string
  description: string
}

export function RoutePlaceholderPage({ title, description }: RoutePlaceholderPageProps) {
  return (
    <PageContainer title={title} description={description}>
      <EmptyState title={`${title} 开发中`} description="该页面已完成路由接入，后续将在对应阶段实现完整功能。" />
    </PageContainer>
  )
}
