import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'

export function TemplateCenter() {
  return (
    <PageContainer
      title="模板中心"
      description="平台级模板资产，供租户选用"
    >
      <Card title="Agent 模板" description="可复用的 Agent 配置模板">
        <EmptyState title="骨架占位" description="Agent 模板由系统管理员在「Agent 模板工厂」中管理" />
      </Card>
      <Card title="Skill 模板" description="可复用的 Skill 能力模板">
        <EmptyState title="骨架占位" description="Skill 模板将在后续完善" />
      </Card>
      <Card title="流程模板" description="工作流与流程模板">
        <EmptyState title="骨架占位" description="流程模板将在后续完善" />
      </Card>
      <Card title="菜单模板" description="租户菜单与权限模板">
        <EmptyState title="骨架占位" description="菜单模板将在后续完善" />
      </Card>
    </PageContainer>
  )
}
