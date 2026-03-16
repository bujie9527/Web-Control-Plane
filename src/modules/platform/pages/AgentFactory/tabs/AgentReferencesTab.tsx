import { Link } from 'react-router-dom'
import { Card } from '@/components/Card/Card'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { getAgentTemplateReferences } from '@/modules/platform/services/agentTemplateService'
import { ROUTES } from '@/core/constants/routes'

type Refs = Awaited<ReturnType<typeof getAgentTemplateReferences>>

interface Props {
  refs: Refs | null
}

export function AgentReferencesTab({ refs }: Props) {
  if (!refs) {
    return (
      <Card title="引用关系" description="该 Agent 被流程模板节点与规划草案推荐引用情况">
        <p style={{ color: '#5f6368', fontSize: 14, margin: 0 }}>加载中...</p>
      </Card>
    )
  }

  const templateNodeCount = refs.workflowTemplateNodes.length
  const draftNodeCount = refs.workflowPlanningDraftNodes.length
  const total = templateNodeCount + draftNodeCount

  return (
    <Card
      title={`引用关系（共 ${total} 处）`}
      description="该 Agent 被流程模板节点与规划草案推荐引用情况"
    >
      {total === 0 ? (
        <EmptyState
          title="暂无引用"
          description="该 Agent 模板尚未被任何流程节点或草案引用"
        />
      ) : (
        <>
          {templateNodeCount > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 500, fontSize: 13, color: '#5f6368', marginBottom: 10 }}>
                流程模板节点（{templateNodeCount} 处）
              </div>
              {refs.workflowTemplateNodes.map((n) => (
                <div key={n.nodeId} style={{ padding: '8px 12px', border: '1px solid #e8eaed', borderRadius: 4, marginBottom: 6, fontSize: 14 }}>
                  <Link to={ROUTES.SYSTEM.WORKFLOW_TEMPLATES_DETAIL(n.templateId)} style={{ color: '#1a73e8', textDecoration: 'none' }}>
                    {n.templateName ?? n.templateId}
                  </Link>
                  <span style={{ color: '#5f6368', marginLeft: 8 }}>
                    › 节点：{n.nodeName}（{n.nodeKey}）
                  </span>
                </div>
              ))}
            </div>
          )}
          {draftNodeCount > 0 && (
            <div>
              <div style={{ fontWeight: 500, fontSize: 13, color: '#5f6368', marginBottom: 10 }}>
                规划草案节点推荐（{draftNodeCount} 处）
              </div>
              {refs.workflowPlanningDraftNodes.map((d, i) => (
                <div key={`${d.draftId}-${d.nodeKey}-${i}`} style={{ padding: '8px 12px', border: '1px solid #e8eaed', borderRadius: 4, marginBottom: 6, fontSize: 14 }}>
                  <Link to={ROUTES.SYSTEM.WORKFLOW_PLANNING_DETAIL(d.sessionId)} style={{ color: '#1a73e8', textDecoration: 'none' }}>
                    会话 {d.sessionId}
                  </Link>
                  <span style={{ color: '#5f6368', marginLeft: 8 }}>
                    › 草案 v{d.draftVersion} · {d.nodeName}（{d.nodeKey}）
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Card>
  )
}
