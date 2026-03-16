/**
 * LLM 凭证服务（Phase 17.7b）
 * 支持：新增、编辑、停用、删除
 * 前台永远不返回完整密钥，只返回 secretMasked
 * 数据来源：服务端 /api/credentials
 */
import type { LLMCredential } from '@/modules/tenant/schemas/llmConfigCenter'

type ClientCredential = Omit<LLMCredential, 'encryptedSecret'>

interface ApiResponse<T> {
  code: number
  message: string
  data: T
  meta: {
    requestId: string
    timestamp: string
  }
}

export function listCredentials(): Promise<ClientCredential[]> {
  return fetch('/api/credentials')
    .then((res) => res.json() as Promise<ApiResponse<ClientCredential[]>>)
    .then((json) => {
      if (json.code !== 0) {
        throw new Error(json.message || '获取凭证列表失败')
      }
      return json.data
    })
}

export function getCredentialById(id: string): Promise<ClientCredential | null> {
  return listCredentials().then((list) => list.find((c) => c.id === id) ?? null)
}

export interface CreateCredentialInput {
  id: string
  name: string
  nameZh: string
  providerType: LLMCredential['providerType']
  secret: string
  status: LLMCredential['status']
  notes?: string
}

export function createCredential(payload: CreateCredentialInput): Promise<ClientCredential> {
  return fetch('/api/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json() as Promise<ApiResponse<ClientCredential | null>>)
    .then((json) => {
      if (json.code !== 0 || !json.data) {
        throw new Error(json.message || '创建凭证失败')
      }
      return json.data
    })
}

export function updateCredential(
  id: string,
  payload: Partial<Omit<LLMCredential, 'id' | 'createdAt'>>
): Promise<ClientCredential | null> {
  return fetch(`/api/credentials/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json() as Promise<ApiResponse<ClientCredential | null>>)
    .then((json) => {
      if (json.code !== 0) {
        throw new Error(json.message || '更新凭证失败')
      }
      return json.data
    })
}

export function changeCredentialStatus(
  id: string,
  status: LLMCredential['status']
): Promise<ClientCredential | null> {
  return updateCredential(id, { status })
}

export function deleteCredential(id: string): Promise<boolean> {
  return fetch(`/api/credentials/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
    .then((res) => res.json() as Promise<ApiResponse<boolean>>)
    .then((json) => {
      if (json.code !== 0) {
        throw new Error(json.message || '删除凭证失败')
      }
      return !!json.data
    })
}
