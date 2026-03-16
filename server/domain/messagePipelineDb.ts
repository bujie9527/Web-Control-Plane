import { prisma } from './prismaClient'
import { executeSkillsForNode } from './skillExecutionEngine'

const now = (): string => new Date().toISOString().slice(0, 19).replace('T', ' ')

function parseJsonObject(value?: string | null): Record<string, unknown> | undefined {
  if (!value) return undefined
  try {
    return JSON.parse(value) as Record<string, unknown>
  } catch {
    return undefined
  }
}

function routeByText(text: string): 'interaction' | 'community' | 'config' | 'none' {
  if (!text.trim()) return 'none'
  if (text.startsWith('/config') || text.includes('帮我配置')) return 'config'
  if (text.includes('欢迎') || text.includes('投票') || text.includes('置顶') || text.includes('删帖')) return 'community'
  return 'interaction'
}

export async function dbUpsertConversation(payload: {
  tenantId: string
  terminalId?: string
  channelType: string
  externalChatId: string
  title?: string
}) {
  const ts = now()
  const existing = await prisma.conversation.findFirst({
    where: {
      tenantId: payload.tenantId,
      channelType: payload.channelType,
      externalChatId: payload.externalChatId,
    },
  })
  if (existing) {
    return prisma.conversation.update({
      where: { id: existing.id },
      data: {
        terminalId: payload.terminalId ?? existing.terminalId,
        title: payload.title ?? existing.title,
        latestMessageAt: ts,
        updatedAt: ts,
      },
    })
  }
  return prisma.conversation.create({
    data: {
      tenantId: payload.tenantId,
      terminalId: payload.terminalId ?? null,
      channelType: payload.channelType,
      externalChatId: payload.externalChatId,
      title: payload.title ?? null,
      latestMessageAt: ts,
      unreadCount: 0,
      createdAt: ts,
      updatedAt: ts,
    },
  })
}

export async function dbCreateIncomingMessage(payload: {
  tenantId: string
  terminalId?: string
  conversationId?: string
  channelType: string
  externalMessageId?: string
  senderExternalId?: string
  senderName?: string
  messageType: string
  contentText?: string
  payloadJson?: Record<string, unknown>
}) {
  const ts = now()
  return prisma.incomingMessage.create({
    data: {
      tenantId: payload.tenantId,
      terminalId: payload.terminalId ?? null,
      conversationId: payload.conversationId ?? null,
      channelType: payload.channelType,
      externalMessageId: payload.externalMessageId ?? null,
      senderExternalId: payload.senderExternalId ?? null,
      senderName: payload.senderName ?? null,
      messageType: payload.messageType,
      contentText: payload.contentText ?? null,
      payloadJson: payload.payloadJson ? JSON.stringify(payload.payloadJson) : null,
      status: 'pending',
      createdAt: ts,
      updatedAt: ts,
    },
  })
}

export async function dbListIncomingMessages(tenantId: string, limit = 50) {
  const rows = await prisma.incomingMessage.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return rows.map((row) => ({
    ...row,
    payloadJson: parseJsonObject(row.payloadJson),
  }))
}

export async function dbListConversations(tenantId: string, limit = 50) {
  return prisma.conversation.findMany({
    where: { tenantId },
    orderBy: { updatedAt: 'desc' },
    take: limit,
  })
}

export async function dbCreateOutgoingMessage(payload: {
  tenantId: string
  terminalId?: string
  conversationId?: string
  channelType: string
  targetExternalChatId?: string
  contentText?: string
  payloadJson?: Record<string, unknown>
  sourceType: string
  sourceRefId?: string
  status?: string
  externalMessageId?: string
  errorMessage?: string
}) {
  const ts = now()
  return prisma.outgoingMessage.create({
    data: {
      tenantId: payload.tenantId,
      terminalId: payload.terminalId ?? null,
      conversationId: payload.conversationId ?? null,
      channelType: payload.channelType,
      targetExternalChatId: payload.targetExternalChatId ?? null,
      contentText: payload.contentText ?? null,
      payloadJson: payload.payloadJson ? JSON.stringify(payload.payloadJson) : null,
      sourceType: payload.sourceType,
      sourceRefId: payload.sourceRefId ?? null,
      status: payload.status ?? 'pending',
      externalMessageId: payload.externalMessageId ?? null,
      errorMessage: payload.errorMessage ?? null,
      sentAt: payload.status === 'sent' ? ts : null,
      createdAt: ts,
      updatedAt: ts,
    },
  })
}

export async function dbListOutgoingMessages(tenantId: string, limit = 50) {
  const rows = await prisma.outgoingMessage.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
  return rows.map((row) => ({
    ...row,
    payloadJson: parseJsonObject(row.payloadJson),
  }))
}

async function dispatchIncomingMessage(messageId: string) {
  const msg = await prisma.incomingMessage.findUnique({ where: { id: messageId } })
  if (!msg) return null
  const text = (msg.contentText ?? '').trim()
  const routeTarget = routeByText(text)

  let replyText = ''
  if (routeTarget === 'none') {
    replyText = '收到消息。'
  } else {
    const fakeSkillId = routeTarget === 'interaction'
      ? 'skill-content-write'
      : routeTarget === 'community'
        ? 'skill-content-review'
        : 'skill-summarize-changes'
    const exec = await executeSkillsForNode({
      skillIds: [fakeSkillId],
      runtime: {
        instanceId: `msg-${msg.id}`,
        nodeId: msg.id,
        nodeName: '消息处理',
        executionType: 'agent_task',
        runtimeInput: { userText: text },
        runtimeContext: { tenantId: msg.tenantId, routeTarget },
      },
    })
    replyText = exec.success
      ? `已由${routeTarget}处理：${text.slice(0, 120)}`
      : `处理失败，已记录：${exec.errorMessageZh ?? '未知错误'}`
  }

  const ts = now()
  await prisma.incomingMessage.update({
    where: { id: msg.id },
    data: {
      routeTarget,
      status: 'processed',
      processedAt: ts,
      updatedAt: ts,
    },
  })

  const out = await dbCreateOutgoingMessage({
    tenantId: msg.tenantId,
    terminalId: msg.terminalId ?? undefined,
    conversationId: msg.conversationId ?? undefined,
    channelType: msg.channelType,
    targetExternalChatId: undefined,
    contentText: replyText,
    sourceType: routeTarget,
    sourceRefId: msg.id,
    status: 'sent',
  })
  return out
}

export async function dbProcessPendingIncomingMessages(tenantId: string, limit = 20) {
  const pending = await prisma.incomingMessage.findMany({
    where: { tenantId, status: 'pending' },
    orderBy: { createdAt: 'asc' },
    take: limit,
  })
  const results = []
  for (const item of pending) {
    const processed = await dispatchIncomingMessage(item.id)
    results.push({ messageId: item.id, processed })
  }
  return { total: pending.length, results }
}

