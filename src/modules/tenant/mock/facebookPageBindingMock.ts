/**
 * 项目与 Facebook 主页绑定 Mock
 */
import type { FacebookPageBinding } from '../schemas/facebookPageBinding'

const now = new Date().toISOString()

const _bindings: FacebookPageBinding[] = [
  {
    id: 'fpb-1',
    projectId: 'proj-demo-1',
    pageId: '123456789',
    pageName: '演示主页 A',
    credentialId: 'fpc-1',
    identityId: 'id-demo-1',
    status: 'active',
    createdAt: now,
    updatedAt: now,
  },
]

function nowIso(): string {
  return new Date().toISOString()
}

export function listFacebookPageBindingsByProject(projectId: string): FacebookPageBinding[] {
  return _bindings.filter((b) => b.projectId === projectId)
}

export function getFacebookPageBindingById(id: string): FacebookPageBinding | null {
  return _bindings.find((b) => b.id === id) ?? null
}

export function addFacebookPageBinding(payload: {
  projectId: string
  pageId: string
  pageName: string
  credentialId: string
  identityId: string
}): FacebookPageBinding {
  const id = `fpb-${Date.now()}`
  const t = nowIso()
  const binding: FacebookPageBinding = {
    id,
    ...payload,
    status: 'active',
    createdAt: t,
    updatedAt: t,
  }
  _bindings.push(binding)
  return binding
}

export function removeFacebookPageBinding(id: string): boolean {
  const i = _bindings.findIndex((b) => b.id === id)
  if (i < 0) return false
  _bindings.splice(i, 1)
  return true
}

export function updateFacebookPageBindingIdentity(id: string, identityId: string): FacebookPageBinding | null {
  const i = _bindings.findIndex((x) => x.id === id)
  if (i < 0) return null
  const updated = { ..._bindings[i], identityId, updatedAt: nowIso() }
  _bindings[i] = updated
  return updated
}
