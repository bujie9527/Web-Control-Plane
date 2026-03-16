import { useCallback, useEffect, useState } from 'react'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { useAuth } from '@/core/auth/AuthContext'
import {
  listConversations,
  listIncomingMessages,
  listOutgoingMessages,
  processPendingMessages,
  type ConversationItem,
  type IncomingMessageItem,
  type OutgoingMessageItem,
} from '../services/messagePipelineService'

const incomingColumns = [
  { key: 'senderName', title: '发送者', width: '140px' },
  { key: 'contentText', title: '内容', width: '320px' },
  { key: 'routeTarget', title: '路由目标', width: '120px' },
  { key: 'status', title: '状态', width: '100px' },
  { key: 'createdAt', title: '接收时间', width: '170px' },
]

const conversationColumns = [
  { key: 'title', title: '会话标题', width: '220px' },
  { key: 'externalChatId', title: '外部会话ID', width: '180px' },
  { key: 'channelType', title: '渠道', width: '100px' },
  { key: 'updatedAt', title: '最近活跃', width: '170px' },
]

const outgoingColumns = [
  { key: 'contentText', title: '回复内容', width: '320px' },
  { key: 'sourceType', title: '来源', width: '120px' },
  { key: 'status', title: '发送状态', width: '100px' },
  { key: 'createdAt', title: '发送时间', width: '170px' },
]

export function MessageCenterPage() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? ''
  const [incoming, setIncoming] = useState<IncomingMessageItem[]>([])
  const [conversations, setConversations] = useState<ConversationItem[]>([])
  const [outgoing, setOutgoing] = useState<OutgoingMessageItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    setError(null)
    try {
      const [incomingData, conversationsData, outgoingData] = await Promise.all([
        listIncomingMessages(tenantId),
        listConversations(tenantId),
        listOutgoingMessages(tenantId),
      ])
      setIncoming(incomingData)
      setConversations(conversationsData)
      setOutgoing(outgoingData)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载消息中心失败')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    void load()
  }, [load])

  const handleProcess = async () => {
    if (!tenantId) return
    setProcessing(true)
    try {
      await processPendingMessages(tenantId)
      await load()
    } finally {
      setProcessing(false)
    }
  }

  return (
    <PageContainer
      title="消息中心"
      description="统一查看接入消息、会话上下文与回复发送记录。"
    >
      <div style={{ marginBottom: 12 }}>
        <button type="button" onClick={handleProcess} disabled={processing || loading}>
          {processing ? '处理中...' : '处理待处理消息'}
        </button>
      </div>
      {error ? <p style={{ color: '#d4380d' }}>{error}</p> : null}
      <Card title="接入消息 Inbox" description="Webhook 入库后的原始消息">
        <Table columns={incomingColumns} dataSource={incoming} rowKey="id" loading={loading} emptyText="暂无消息" />
      </Card>
      <Card title="会话列表" description="按渠道和会话聚合">
        <Table columns={conversationColumns} dataSource={conversations} rowKey="id" loading={loading} emptyText="暂无会话" />
      </Card>
      <Card title="响应消息 Outbox" description="系统回复和发布记录">
        <Table columns={outgoingColumns} dataSource={outgoing} rowKey="id" loading={loading} emptyText="暂无回复记录" />
      </Card>
    </PageContainer>
  )
}

