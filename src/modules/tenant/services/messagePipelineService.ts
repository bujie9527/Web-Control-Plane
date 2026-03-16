import type { ApiResponse } from '@/core/types/api'

export interface IncomingMessageItem {
  id: string
  senderName?: string | null
  contentText?: string | null
  status: string
  routeTarget?: string | null
  createdAt: string
}

export interface ConversationItem {
  id: string
  title?: string | null
  externalChatId: string
  channelType: string
  updatedAt: string
}

export interface OutgoingMessageItem {
  id: string
  contentText?: string | null
  sourceType: string
  status: string
  createdAt: string
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  const json = (await res.json()) as ApiResponse<T>
  if (!res.ok || json.code !== 0) throw new Error(json.message || '请求失败')
  return json.data as T
}

export async function listIncomingMessages(tenantId: string): Promise<IncomingMessageItem[]> {
  return request<IncomingMessageItem[]>(`/api/messages/incoming?tenantId=${encodeURIComponent(tenantId)}`)
}

export async function listConversations(tenantId: string): Promise<ConversationItem[]> {
  return request<ConversationItem[]>(`/api/messages/conversations?tenantId=${encodeURIComponent(tenantId)}`)
}

export async function listOutgoingMessages(tenantId: string): Promise<OutgoingMessageItem[]> {
  return request<OutgoingMessageItem[]>(`/api/messages/outgoing?tenantId=${encodeURIComponent(tenantId)}`)
}

export async function processPendingMessages(tenantId: string): Promise<{ total: number }> {
  return request<{ total: number }>('/api/messages/process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tenantId }),
  })
}

