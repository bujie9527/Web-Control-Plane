/**
 * Step5ResourcesConfirm
 * 项目创建向导第五步（最终步）：资源绑定 + 确认摘要
 *
 * 功能：
 * - 左侧：身份绑定（多选，可选），终端绑定（多选，可选）
 * - 右侧：全量创建摘要，供用户最终确认
 *   · 项目基础信息
 *   · 目标与交付
 *   · 流程模板（已选 / 未选）
 *   · 节点 Agent 配置（已选模板时展示）
 *   · 已绑定身份与终端
 * - 确认创建按钮触发 handleSubmit（由父组件传入）
 *
 * 注意：
 * - 身份和终端均为可选，不阻断创建
 * - 此步骤合并了原来的 Step5（资源）和 Step7（确认摘要）
 * - SOP 已移至项目详情工作台的概览 Tab，此处不展示
 */

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/Card/Card'
import type { ProjectCreationFormState } from '../types'
import type { Identity } from '@/modules/tenant/schemas/identity'
import type { Terminal } from '@/modules/tenant/schemas/terminal'
import { getIdentityList } from '@/modules/tenant/services/identityService'
import { getTerminalList } from '@/modules/tenant/services/terminalService'
import { getWorkflowTemplateById } from '@/modules/tenant/services/workflowTemplateFactoryService'
import { getSystemTerminalTypeList } from '@/modules/platform/services/systemTerminalTypeService'
import { listFacebookPages } from '@/modules/tenant/services/facebookAuthService'
import type { FacebookPageCredentialSummary } from '@/modules/tenant/schemas/facebookPageCredential'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Step5ResourcesConfirmProps {
  form: ProjectCreationFormState
  onChange: (partial: Partial<ProjectCreationFormState>) => void
  tenantId: string
  /** 提交创建，由父组件（ProjectCreationWizard）传入 */
  onSubmit: () => Promise<void>
  /** 提交中状态，由父组件控制 */
  submitting: boolean
}

// ─── 子组件 ───────────────────────────────────────────────────────────────────

/**
 * IdentityMultiSelector
 * 多选身份组件
 * - 加载并展示当前租户下所有 active Identity
 * - 支持全选 / 取消全选
 * - 选中 Identity ID 列表同步到 form.identityIds
 * - 可设置默认身份（form.defaultIdentityId）
 */
function IdentityMultiSelector({
  tenantId,
  selectedIds,
  defaultId,
  onChange,
}: {
  tenantId: string
  selectedIds: string[]
  defaultId: string
  onChange: (identityIds: string[], defaultIdentityId: string) => void
}) {
  const [identities, setIdentities] = useState<Identity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * loadIdentities
   * 调用 getIdentityList({ tenantId, status: 'active' })
   * 失败时设置 error，提供重试入口
   */
  const loadIdentities = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getIdentityList({ tenantId, pageSize: 50, status: 'active' })
      setIdentities(res.items ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载身份列表失败')
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => {
    loadIdentities()
  }, [loadIdentities])

  const toggleId = (id: string) => {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id]
    onChange(next, defaultId === id ? (next[0] ?? '') : defaultId)
  }

  const setDefault = (id: string) => {
    onChange(selectedIds, id)
  }

  if (loading) return <p style={{ color: '#999' }}>加载身份列表中…</p>
  if (error) {
    return (
      <div>
        <p style={{ color: '#cf1322' }}>{error}</p>
        <button type="button" onClick={loadIdentities}>重试</button>
      </div>
    )
  }
  return (
    <div>
      {identities.length === 0 ? (
        <p style={{ fontSize: 13, color: '#999' }}>暂无身份，可在身份库中创建</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {identities.map((i) => (
            <li key={i.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={selectedIds.includes(i.id)}
                onChange={() => toggleId(i.id)}
              />
              <span>{i.name}</span>
              {selectedIds.includes(i.id) && (
                <button
                  type="button"
                  style={{ fontSize: 12 }}
                  onClick={() => setDefault(i.id)}
                >
                  {defaultId === i.id ? '默认身份' : '设为默认'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * TerminalMultiSelector
 * 多选终端组件
 * - 从 /api/terminals 加载当前租户 active 终端
 * - 当 projectTypeCode 有值时，仅展示与该项目类型匹配的终端类型（按 SystemTerminalType.supportedProjectTypeIds 过滤）
 * - 选中 Terminal ID 列表同步到 form.terminalIds
 */
function TerminalMultiSelector({
  tenantId,
  projectTypeCode,
  selectedIds,
  onChange,
}: {
  tenantId: string
  /** 项目类型编码，有值时只显示支持该类型的终端 */
  projectTypeCode?: string
  selectedIds: string[]
  onChange: (terminalIds: string[]) => void
}) {
  const [terminals, setTerminals] = useState<Terminal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTerminals = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let allowedTypeCodes: string[] | undefined
      if (projectTypeCode) {
        const typeRes = await getSystemTerminalTypeList({ status: 'active', pageSize: 100 })
        allowedTypeCodes = typeRes.items
          .filter((t) => t.supportedProjectTypeIds?.includes(projectTypeCode))
          .map((t) => t.code)
      }
      const res = await getTerminalList({ tenantId, page: 1, pageSize: 50, status: 'active' })
      let items = res.items ?? []
      if (allowedTypeCodes !== undefined && allowedTypeCodes.length > 0) {
        items = items.filter((t) => t.type && allowedTypeCodes!.includes(t.type))
      }
      setTerminals(items)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载终端列表失败')
    } finally {
      setLoading(false)
    }
  }, [tenantId, projectTypeCode])

  useEffect(() => {
    loadTerminals()
  }, [loadTerminals])

  const toggleId = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id))
    } else {
      onChange([...selectedIds, id])
    }
  }

  if (loading) return <p style={{ color: '#999' }}>加载终端列表中…</p>
  if (error) {
    return (
      <div>
        <p style={{ color: '#cf1322' }}>{error}</p>
        <button type="button" onClick={loadTerminals}>重试</button>
      </div>
    )
  }
  return (
    <div>
      {terminals.length === 0 ? (
        <p style={{ fontSize: 13, color: '#999' }}>暂无终端</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {terminals.map((t) => (
            <li key={t.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                checked={selectedIds.includes(t.id)}
                onChange={() => toggleId(t.id)}
              />
              <span>{t.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/**
 * FacebookPageBindingSelector
 * 当项目类型为 Facebook 主页运营时：选择已授权主页并为每个绑定身份
 */
function FacebookPageBindingSelector({
  tenantId,
  bindings,
  onChange,
}: {
  tenantId: string
  bindings: Array<{ pageId: string; pageName: string; credentialId: string; identityId: string }>
  onChange: (bindings: Array<{ pageId: string; pageName: string; credentialId: string; identityId: string }>) => void
}) {
  const [pages, setPages] = useState<FacebookPageCredentialSummary[]>([])
  const [identities, setIdentities] = useState<Identity[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    setLoadError(null)
    Promise.all([listFacebookPages(), getIdentityList({ tenantId, pageSize: 50, status: 'active' })])
      .then(([pageList, identityRes]) => {
        setPages(pageList ?? [])
        setIdentities(identityRes.items ?? [])
      })
      .catch((e) => {
        setPages([])
        setIdentities([])
        setLoadError(e instanceof Error ? e.message : '加载失败，请重试')
      })
      .finally(() => setLoading(false))
  }, [tenantId])

  useEffect(() => {
    load()
  }, [load])

  const setBindingIdentity = (pageId: string, identityId: string) => {
    const page = pages.find((p) => p.pageId === pageId)
    if (!page) return
    const rest = bindings.filter((b) => b.pageId !== pageId)
    if (identityId) {
      onChange([...rest, { pageId: page.pageId, pageName: page.pageName, credentialId: page.id, identityId }])
    } else {
      onChange(rest)
    }
  }

  const togglePage = (page: FacebookPageCredentialSummary, checked: boolean) => {
    if (checked) {
      const identityId = identities[0]?.id ?? ''
      if (!identityId) return
      onChange([...bindings.filter((b) => b.pageId !== page.pageId), { pageId: page.pageId, pageName: page.pageName, credentialId: page.id, identityId }])
    } else {
      onChange(bindings.filter((b) => b.pageId !== page.pageId))
    }
  }

  if (loading) return <p style={{ color: '#999' }}>加载 Facebook 主页列表中…</p>
  if (loadError) {
    return (
      <div style={{ fontSize: 13 }}>
        <p style={{ color: '#c00', marginBottom: 8 }}>{loadError}</p>
        <button type="button" onClick={load} style={{ padding: '4px 12px' }}>重试</button>
      </div>
    )
  }
  if (pages.length === 0) {
    return (
      <p style={{ fontSize: 13, color: '#666' }}>
        暂无已授权主页，请先在
        <a href="/tenant/facebook-pages" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>Facebook 主页</a>
        完成授权后再选择绑定。
      </p>
    )
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {pages.map((p) => {
        const binding = bindings.find((b) => b.pageId === p.pageId)
        const selected = !!binding
        return (
          <li key={p.pageId} style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => togglePage(p, e.target.checked)}
            />
            <span style={{ minWidth: 140 }}>{p.pageName}</span>
            {selected && (
              <select
                value={binding?.identityId ?? ''}
                onChange={(e) => setBindingIdentity(p.pageId, e.target.value)}
                style={{ minWidth: 120 }}
              >
                <option value="">请选择身份</option>
                {identities.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            )}
          </li>
        )
      })}
    </ul>
  )
}

/**
 * CreationSummary
 * 右侧的创建摘要只读卡片
 * - 展示所有已填写的 form 信息
 * - 若某项未填写，显示 "—" 或 "（未配置）"
 * - 节点 Agent 配置只在 form.selectedWorkflowTemplateId 存在时展示
 *
 * @param templateName - 已选模板的名称（由父组件查询后传入）
 */
function CreationSummary({
  form,
  templateName,
}: {
  form: ProjectCreationFormState
  templateName?: string
}) {
  const items: { label: string; value: string }[] = [
    { label: '项目名称', value: form.name || '—' },
    { label: '项目类型', value: form.projectTypeCode || '—' },
    { label: '目标', value: form.goalName || form.goalTypeCode || '—' },
    { label: '交付', value: form.deliverableName || form.deliverableType || '—' },
    {
      label: '流程模板',
      value: form.selectedWorkflowTemplateId ? templateName ?? form.selectedWorkflowTemplateId : '未绑定',
    },
  ]

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
        {items.map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', gap: 8 }}>
            <span style={{ color: '#666', minWidth: 80 }}>{label}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
      {form.selectedWorkflowTemplateId && form.nodeAgentBindings && form.nodeAgentBindings.length > 0 && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <strong>节点 Agent 配置</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
            {form.nodeAgentBindings.map((b) => (
              <li key={b.templateNodeId}>
                节点 {b.templateNodeId} → Agent {b.selectedAgentTemplateId}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 13 }}>
        <span style={{ color: '#666' }}>已绑定身份</span>
        <span>{form.identityIds.length > 0 ? form.identityIds.length + ' 个' : '无'}</span>
      </div>
      <div style={{ marginTop: 4, fontSize: 13 }}>
        <span style={{ color: '#666' }}>已绑定终端</span>
        <span>{form.terminalIds.length > 0 ? form.terminalIds.length + ' 个' : '无'}</span>
      </div>
      {form.projectTypeCode === 'FACEBOOK_PAGE_OPERATION' && form.facebookPageBindings && form.facebookPageBindings.length > 0 && (
        <div style={{ marginTop: 4, fontSize: 13 }}>
          <span style={{ color: '#666' }}>Facebook 主页绑定</span>
          <span>{form.facebookPageBindings.length} 个主页</span>
        </div>
      )}
    </div>
  )
}

// ─── 主组件 ───────────────────────────────────────────────────────────────────

export function Step5ResourcesConfirm({
  form,
  onChange,
  tenantId,
  onSubmit,
  submitting,
}: Step5ResourcesConfirmProps) {
  /**
   * selectedTemplateName
   * 已选模板的名称，用于摘要展示
   * 在 form.selectedWorkflowTemplateId 变化时加载
   */
  const [selectedTemplateName, setSelectedTemplateName] = useState<string | undefined>()

  useEffect(() => {
    if (form.selectedWorkflowTemplateId) {
      getWorkflowTemplateById(form.selectedWorkflowTemplateId).then((t) =>
        setSelectedTemplateName(t?.name),
      )
    } else {
      setSelectedTemplateName(undefined)
    }
  }, [form.selectedWorkflowTemplateId])

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      {/* 左栏：资源绑定 */}
      <div style={{ flex: 1 }}>
        <Card title="身份绑定" description="选择本项目使用的身份档案（可选）">
          <IdentityMultiSelector
            tenantId={tenantId}
            selectedIds={form.identityIds}
            defaultId={form.defaultIdentityId}
            onChange={(identityIds, defaultIdentityId) =>
              onChange({ identityIds, defaultIdentityId })
            }
          />
        </Card>

        <Card title="终端绑定" description="选择本项目使用的终端账号（可选）">
          <TerminalMultiSelector
            tenantId={tenantId}
            projectTypeCode={form.projectTypeCode || undefined}
            selectedIds={form.terminalIds}
            onChange={(terminalIds) => onChange({ terminalIds })}
          />
        </Card>

        {form.projectTypeCode === 'FACEBOOK_PAGE_OPERATION' && (
          <Card title="Facebook 主页绑定" description="选择要绑定的已授权主页，并为每个主页指定运营身份（多主页差异化内容）">
            <FacebookPageBindingSelector
              tenantId={tenantId}
              bindings={form.facebookPageBindings ?? []}
              onChange={(facebookPageBindings) => onChange({ facebookPageBindings })}
            />
          </Card>
        )}
      </div>

      {/* 右栏：创建摘要 + 确认按钮 */}
      <div style={{ flex: 1 }}>
        <Card title="创建摘要" description="确认无误后点击创建">
          <CreationSummary form={form} templateName={selectedTemplateName} />

          {/* 确认创建按钮 */}
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting || !form.name}
          >
            {submitting ? '创建中…' : '确认创建项目'}
          </button>
        </Card>
      </div>
    </div>
  )
}
