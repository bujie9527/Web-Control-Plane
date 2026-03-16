/**
 * 模型配置中心（Phase 17.5）
 * 三区块：模型提供商、模型配置、Agent 模型绑定；全部中文展示
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { Dialog } from '@/components/Dialog/Dialog'
import {
  listProviders,
  changeProviderStatus,
  createProvider,
  updateProvider,
  testProviderConnection,
  deleteProvider,
} from '@/modules/tenant/services/llmProviderService'
import {
  listCredentials,
  createCredential,
  updateCredential,
  changeCredentialStatus,
  deleteCredential,
} from '@/modules/platform/services/llmCredentialService'
import { checkCredentialReferencesAsync } from '@/modules/platform/services/referenceCheckService'
import type { LLMCredential } from '@/modules/tenant/schemas/llmConfigCenter'
import {
  listModelConfigs,
  getModelConfigById,
  changeModelConfigStatus,
  createModelConfig,
  updateModelConfig,
  setDefaultModelConfig,
  deleteModelConfig,
} from '@/modules/tenant/services/llmModelConfigService'
import {
  listBindings,
  updateBinding,
  setPrimaryBindingForAgent,
  setFallbackBindingForAgent,
  deleteBinding,
} from '@/modules/tenant/services/llmBindingService'
import { getTemplateById } from '@/modules/platform/services/agentTemplateService'
import type { LLMProvider } from '@/modules/tenant/schemas/llmConfigCenter'
import type { LLMModelConfig } from '@/modules/tenant/schemas/llmExecutor'
import type { AgentLLMBinding } from '@/modules/tenant/schemas/llmConfigCenter'
import {
  PAGE_TITLE,
  SECTION_PROVIDERS,
  SECTION_MODEL_CONFIGS,
  SECTION_AGENT_BINDINGS,
  LLM_PROVIDER_TYPE_LABELS,
  LLM_PROVIDER_STATUS_LABELS,
  AGENT_CATEGORY_LABELS,
  FIELD_PROVIDER_NAME,
  FIELD_PROVIDER_TYPE,
  FIELD_BASE_URL,
  FIELD_STATUS,
  FIELD_MODEL_NAME,
  FIELD_MODEL_KEY,
  FIELD_DEFAULT_MODEL,
  FIELD_TEMPERATURE,
  FIELD_MAX_TOKENS,
  FIELD_AGENT_CATEGORIES,
  FIELD_AGENT_NAME,
  FIELD_PRIMARY_MODEL,
  FIELD_FALLBACK_MODEL,
  FIELD_BINDING_STATUS,
  FIELD_PROVIDER_NAME_ZH,
  FIELD_NOTES,
  FIELD_STRUCTURED_OUTPUT,
  STRUCTURED_OUTPUT_MODE_LABELS,
  SECTION_CREDENTIALS,
  FIELD_CREDENTIAL_NAME,
  FIELD_SECRET_MASKED,
  LLM_CREDENTIAL_STATUS_LABELS,
} from '@/core/labels/llmConfigCenterLabels'
import styles from './LLMConfigCenterPage.module.css'

type Notice = { type: 'success' | 'error'; text: string } | null

export function LLMConfigCenterPage() {
  const [providers, setProviders] = useState<LLMProvider[]>([])
  const [credentialsList, setCredentialsList] = useState<Array<Omit<LLMCredential, 'encryptedSecret'>>>([])
  const credentials = useMemo(
    () => credentialsList.map((c) => ({ id: c.id, nameZh: c.nameZh, providerType: c.providerType })),
    [credentialsList]
  )
  const [configs, setConfigs] = useState<LLMModelConfig[]>([])
  const [bindings, setBindings] = useState<AgentLLMBinding[]>([])
  const [agentNameMap, setAgentNameMap] = useState<Record<string, string>>({})
  const [agentCategoryMap, setAgentCategoryMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

  // Provider form
  const [providerDialogOpen, setProviderDialogOpen] = useState(false)
  const [providerEditing, setProviderEditing] = useState<LLMProvider | null>(null)
  const [providerSaving, setProviderSaving] = useState(false)
  const [providerForm, setProviderForm] = useState({
    id: '',
    name: '',
    nameZh: '',
    providerType: 'openai' as LLMProvider['providerType'],
    baseUrl: '',
    credentialId: '' as string,
    status: 'active' as LLMProvider['status'],
    notes: '',
  })
  const [providerError, setProviderError] = useState('')

  // Provider test dialog
  const [testDialogOpen, setTestDialogOpen] = useState(false)
  const [testTarget, setTestTarget] = useState<LLMProvider | null>(null)
  const [testResult, setTestResult] = useState<Notice>(null)
  const [testLoading, setTestLoading] = useState(false)
  const [testModelKey, setTestModelKey] = useState('')

  // ModelConfig form
  const [configDialogOpen, setConfigDialogOpen] = useState(false)
  const [configEditing, setConfigEditing] = useState<LLMModelConfig | null>(null)
  const [configSaving, setConfigSaving] = useState(false)
  const [configError, setConfigError] = useState('')
  const [configForm, setConfigForm] = useState({
    id: '',
    name: '',
    nameZh: '',
    providerId: '',
    modelKey: '',
    isEnabled: true,
    isDefault: false,
    temperature: 0.4,
    maxTokens: 2048,
    timeoutMs: 20000,
    retryCount: 1,
    structuredOutputMode: 'json' as LLMModelConfig['structuredOutputMode'],
    fallbackModelConfigId: '',
    supportedAgentCategories: [] as string[],
    notes: '',
  })

  // Binding dialog
  const [bindingDialogOpen, setBindingDialogOpen] = useState(false)
  const [bindingMode, setBindingMode] = useState<'primary' | 'fallback'>('primary')
  const [bindingAgentId, setBindingAgentId] = useState<string>('')
  const [bindingModelId, setBindingModelId] = useState<string>('')
  const [bindingEnabled, setBindingEnabled] = useState(true)
  const [bindingNotes, setBindingNotes] = useState('')
  const [bindingSaving, setBindingSaving] = useState(false)
  const [bindingError, setBindingError] = useState('')
  const [bindingExistingId, setBindingExistingId] = useState<string | null>(null)

  // Credential form
  const [credentialDialogOpen, setCredentialDialogOpen] = useState(false)
  const [credentialEditing, setCredentialEditing] = useState<Omit<LLMCredential, 'encryptedSecret'> | null>(null)
  const [credentialSaving, setCredentialSaving] = useState(false)
  const [credentialError, setCredentialError] = useState('')
  const [credentialForm, setCredentialForm] = useState({
    id: '',
    name: '',
    nameZh: '',
    providerType: 'openai' as LLMCredential['providerType'],
    secret: '', // 仅创建时使用，编辑不展示
    status: 'active' as LLMCredential['status'],
    notes: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [provs, creds, cfgs, bnds] = await Promise.all([
        listProviders(),
        listCredentials(),
        listModelConfigs(),
        listBindings(),
      ])
      setProviders(provs)
      setCredentialsList(creds)
      setConfigs(cfgs)
      setBindings(bnds)
    } catch (e) {
      setNotice({ type: 'error', text: e instanceof Error ? e.message : '加载失败' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const agentIds = [...new Set(bindings.map((b) => b.agentTemplateId))]
    Promise.all(agentIds.map((id) => getTemplateById(id)))
      .then((templates) => {
        const map: Record<string, string> = {}
        const cMap: Record<string, string> = {}
        agentIds.forEach((id, i) => {
          const t = templates[i]
          map[id] = t?.nameZh ?? t?.name ?? id
          cMap[id] = t?.category ?? ''
        })
        setAgentNameMap(map)
        setAgentCategoryMap(cMap)
      })
      .catch(() => {
        // Agent 名称加载失败时静默处理，表格中将显示 agentTemplateId 原始值
      })
  }, [bindings])

  const handleProviderStatus = async (id: string, current: LLMProvider['status']) => {
    const next = current === 'active' ? 'disabled' : 'active'
    try {
      await changeProviderStatus(id, next)
      setProviders(await listProviders())
    } catch (e) {
      setNotice({ type: 'error', text: e instanceof Error ? e.message : '状态更新失败' })
    }
  }

  const handleConfigStatus = async (id: string, current: boolean) => {
    if (current) {
      const boundCount = bindings.filter((b) => b.modelConfigId === id).length
      if (boundCount > 0) {
        const ok = window.confirm(`该模型已被 ${boundCount} 个 Agent 使用，停用后相关 Agent 将无法正常调用。是否确认停用？`)
        if (!ok) return
      }
    }
    try {
      await changeModelConfigStatus(id, !current)
      setConfigs(await listModelConfigs())
    } catch (e) {
      setNotice({ type: 'error', text: e instanceof Error ? e.message : '状态更新失败' })
    }
  }

  const handleBindingStatus = async (id: string, current: boolean) => {
    try {
      await updateBinding(id, { isEnabled: !current })
      setBindings(await listBindings())
    } catch (e) {
      setNotice({ type: 'error', text: e instanceof Error ? e.message : '状态更新失败' })
    }
  }

  const showNotice = (next: Notice) => {
    setNotice(next)
    if (!next) return
    window.setTimeout(() => setNotice(null), 2500)
  }

  const openCreateCredential = () => {
    setCredentialEditing(null)
    setCredentialError('')
    setCredentialForm({
      id: '',
      name: '',
      nameZh: '',
      providerType: 'openai',
      secret: '',
      status: 'active',
      notes: '',
    })
    setCredentialDialogOpen(true)
  }

  const openEditCredential = (c: Omit<LLMCredential, 'encryptedSecret'>) => {
    setCredentialEditing(c)
    setCredentialError('')
    setCredentialForm({
      id: c.id,
      name: c.name,
      nameZh: c.nameZh,
      providerType: c.providerType,
      secret: '', // 编辑不展示/修改密钥
      status: c.status,
      notes: c.notes ?? '',
    })
    setCredentialDialogOpen(true)
  }

  const submitCredential = async () => {
    setCredentialError('')
    if (!credentialForm.id.trim()) return setCredentialError('请输入凭证编码')
    if (!credentialForm.name.trim()) return setCredentialError('请输入凭证名称')
    if (!credentialForm.nameZh.trim()) return setCredentialError('请输入中文名称')
    if (!credentialEditing && !credentialForm.secret.trim()) return setCredentialError('新建时请输入 API 密钥')
    setCredentialSaving(true)
    try {
      if (credentialEditing) {
        const updated = await updateCredential(credentialEditing.id, {
          name: credentialForm.name.trim(),
          nameZh: credentialForm.nameZh.trim(),
          providerType: credentialForm.providerType,
          status: credentialForm.status,
          notes: credentialForm.notes.trim() || undefined,
        })
        if (!updated) throw new Error('更新失败')
        showNotice({ type: 'success', text: '已更新凭证' })
      } else {
        await createCredential({
          id: credentialForm.id.trim(),
          name: credentialForm.name.trim(),
          nameZh: credentialForm.nameZh.trim(),
          providerType: credentialForm.providerType,
          secret: credentialForm.secret.trim(),
          status: credentialForm.status,
          notes: credentialForm.notes.trim() || undefined,
        })
        showNotice({ type: 'success', text: '已新增凭证' })
      }
      load()
      setCredentialDialogOpen(false)
    } catch (e) {
      setCredentialError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setCredentialSaving(false)
    }
  }

  const handleCredentialStatus = async (id: string, current: LLMCredential['status']) => {
    const next = current === 'active' ? 'disabled' : 'active'
    try {
      await changeCredentialStatus(id, next)
      await load()
    } catch (e) {
      showNotice({ type: 'error', text: e instanceof Error ? e.message : '状态更新失败' })
    }
  }

  const handleCredentialDelete = async (id: string) => {
    try {
      const refs = await checkCredentialReferencesAsync(id)
      if (refs.inUse) {
        showNotice({ type: 'error', text: `该凭证仍被 ${refs.referenceCount} 个 ${refs.referenceTypes.join('、')} 使用，无法删除` })
        return
      }
    } catch {
      showNotice({ type: 'error', text: '引用检查失败，无法安全删除，请稍后重试' })
      return
    }
    const ok = window.confirm('确认删除该凭证吗？删除后无法恢复。')
    if (!ok) return
    try {
      await deleteCredential(id)
      await load()
      showNotice({ type: 'success', text: '已删除凭证' })
    } catch (e) {
      showNotice({ type: 'error', text: e instanceof Error ? e.message : '删除失败' })
    }
  }

  const handleProviderDelete = async (id: string, name: string) => {
    const boundConfigs = configs.filter((c) => c.providerId === id)
    if (boundConfigs.length > 0) {
      showNotice({ type: 'error', text: `该提供商仍被 ${boundConfigs.length} 个模型配置引用，无法删除` })
      return
    }
    const ok = window.confirm(`确认删除提供商「${name}」吗？删除后无法恢复。`)
    if (!ok) return
    try {
      const success = await deleteProvider(id)
      if (!success) {
        showNotice({ type: 'error', text: '删除失败：提供商可能不存在' })
        return
      }
      setProviders(await listProviders())
      showNotice({ type: 'success', text: '已删除该提供商' })
    } catch (e) {
      showNotice({ type: 'error', text: e instanceof Error ? e.message : '删除失败' })
    }
  }

  const handleModelConfigDelete = async (id: string, name: string) => {
    const boundBindings = bindings.filter((b) => b.modelConfigId === id)
    if (boundBindings.length > 0) {
      showNotice({ type: 'error', text: `该模型配置仍被 ${boundBindings.length} 个 Agent 绑定引用，无法删除` })
      return
    }
    const ok = window.confirm(`确认删除模型配置「${name}」吗？删除后无法恢复。`)
    if (!ok) return
    try {
      const success = await deleteModelConfig(id)
      if (!success) {
        showNotice({ type: 'error', text: '删除失败：模型配置可能不存在' })
        return
      }
      setConfigs(await listModelConfigs())
      showNotice({ type: 'success', text: '已删除该模型配置' })
    } catch (e) {
      showNotice({ type: 'error', text: e instanceof Error ? e.message : '删除失败' })
    }
  }

  const openCreateProvider = () => {
    setProviderEditing(null)
    setProviderError('')
    setProviderForm({
      id: '',
      name: '',
      nameZh: '',
      providerType: 'openai',
      baseUrl: '',
      credentialId: '',
      status: 'active',
      notes: '',
    })
    setProviderDialogOpen(true)
  }

  const openEditProvider = (p: LLMProvider) => {
    setProviderEditing(p)
    setProviderError('')
    setProviderForm({
      id: p.id,
      name: p.name,
      nameZh: p.nameZh,
      providerType: p.providerType,
      baseUrl: p.baseUrl ?? '',
      credentialId: p.credentialId ?? '',
      status: p.status,
      notes: p.notes ?? '',
    })
    setProviderDialogOpen(true)
  }

  const submitProvider = async () => {
    setProviderError('')
    if (!providerForm.id.trim()) return setProviderError('请输入提供商编码')
    if (!providerForm.name.trim()) return setProviderError('请输入提供商名称')
    if (!providerForm.nameZh.trim()) return setProviderError('请输入中文名称')
    if (!providerForm.credentialId.trim()) return setProviderError('请选择关联凭证')
    setProviderSaving(true)
    try {
      if (providerEditing) {
        const updated = await updateProvider(providerEditing.id, {
          name: providerForm.name.trim(),
          nameZh: providerForm.nameZh.trim(),
          providerType: providerForm.providerType,
          baseUrl: providerForm.baseUrl.trim() || undefined,
          credentialId: providerForm.credentialId.trim() || undefined,
          status: providerForm.status,
          notes: providerForm.notes.trim() || undefined,
        })
        if (!updated) throw new Error('更新失败')
        showNotice({ type: 'success', text: '已更新模型提供商' })
      } else {
        await createProvider({
          id: providerForm.id.trim(),
          name: providerForm.name.trim(),
          nameZh: providerForm.nameZh.trim(),
          providerType: providerForm.providerType,
          baseUrl: providerForm.baseUrl.trim() || undefined,
          credentialId: providerForm.credentialId.trim() || undefined,
          status: providerForm.status,
          notes: providerForm.notes.trim() || undefined,
        })
        showNotice({ type: 'success', text: '已新增模型提供商' })
      }
      setProviders(await listProviders())
      setProviderDialogOpen(false)
    } catch (e) {
      setProviderError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setProviderSaving(false)
    }
  }

  const openTestProvider = (p: LLMProvider) => {
    setTestTarget(p)
    setTestResult(null)
    setTestModelKey('')
    setTestDialogOpen(true)
  }

  const runTestProvider = async () => {
    if (!testTarget) return
    setTestLoading(true)
    try {
      const res = await testProviderConnection(testTarget.id, testModelKey)
      const modelLine = res.testModelKey
        ? `（测试模型：${res.testModelKey}${res.testModelSource === 'request' ? '，来源：手动输入' : '，来源：已启用模型配置'}）`
        : ''
      setTestResult({ type: res.ok ? 'success' : 'error', text: `${res.messageZh}${modelLine}` })
    } catch (e) {
      setTestResult({ type: 'error', text: e instanceof Error ? e.message : '测试连接失败' })
    } finally {
      setTestLoading(false)
    }
  }

  const openCreateConfig = () => {
    setConfigEditing(null)
    setConfigError('')
    const firstProvider = providers.find((p) => p.status === 'active') ?? providers[0]
    setConfigForm({
      id: '',
      name: '',
      nameZh: '',
      providerId: firstProvider?.id ?? '',
      modelKey: '',
      isEnabled: true,
      isDefault: false,
      temperature: 0.4,
      maxTokens: 2048,
      timeoutMs: 20000,
      retryCount: 1,
      structuredOutputMode: 'json',
      fallbackModelConfigId: '',
      supportedAgentCategories: [],
      notes: '',
    })
    setConfigDialogOpen(true)
  }

  const openEditConfig = (c: LLMModelConfig) => {
    setConfigEditing(c)
    setConfigError('')
    setConfigForm({
      id: c.id,
      name: c.name,
      nameZh: c.nameZh,
      providerId: c.providerId ?? '',
      modelKey: c.modelKey,
      isEnabled: c.isEnabled,
      isDefault: c.isDefault,
      temperature: c.temperature,
      maxTokens: c.maxTokens,
      timeoutMs: c.timeoutMs,
      retryCount: c.retryCount,
      structuredOutputMode: c.structuredOutputMode,
      fallbackModelConfigId: c.fallbackModelConfigId ?? '',
      supportedAgentCategories: c.supportedAgentCategories ?? [],
      notes: c.notes ?? '',
    })
    setConfigDialogOpen(true)
  }

  const submitConfig = async () => {
    setConfigError('')
    if (!configForm.id.trim()) return setConfigError('请输入模型编码')
    if (!configForm.name.trim()) return setConfigError('请输入模型名称')
    if (!configForm.nameZh.trim()) return setConfigError('请输入中文名称')
    if (!configForm.providerId.trim()) return setConfigError('请选择所属提供商')
    if (!configForm.modelKey.trim()) return setConfigError('请输入模型标识')
    setConfigSaving(true)
    try {
      if (configEditing) {
        const updated = await updateModelConfig(configEditing.id, {
          name: configForm.name.trim(),
          nameZh: configForm.nameZh.trim(),
          providerId: configForm.providerId.trim(),
          modelKey: configForm.modelKey.trim(),
          isEnabled: configForm.isEnabled,
          isDefault: configForm.isDefault,
          temperature: Number(configForm.temperature),
          maxTokens: Number(configForm.maxTokens),
          timeoutMs: Number(configForm.timeoutMs),
          retryCount: Number(configForm.retryCount),
          structuredOutputMode: configForm.structuredOutputMode,
          fallbackModelConfigId: configForm.fallbackModelConfigId.trim() || undefined,
          supportedAgentCategories: configForm.supportedAgentCategories,
          notes: configForm.notes.trim() || undefined,
        })
        if (!updated) throw new Error('更新失败')
        showNotice({ type: 'success', text: '已更新模型配置' })
      } else {
        await createModelConfig({
          id: configForm.id.trim(),
          name: configForm.name.trim(),
          nameZh: configForm.nameZh.trim(),
          providerId: configForm.providerId.trim(),
          modelKey: configForm.modelKey.trim(),
          isEnabled: configForm.isEnabled,
          isDefault: configForm.isDefault,
          temperature: Number(configForm.temperature),
          maxTokens: Number(configForm.maxTokens),
          timeoutMs: Number(configForm.timeoutMs),
          retryCount: Number(configForm.retryCount),
          structuredOutputMode: configForm.structuredOutputMode,
          fallbackModelConfigId: configForm.fallbackModelConfigId.trim() || undefined,
          supportedAgentCategories: configForm.supportedAgentCategories,
          notes: configForm.notes.trim() || undefined,
        })
        showNotice({ type: 'success', text: '已新增模型配置' })
      }

      // 如果勾选默认，则真正设为默认（会清理其他默认）
      if (configForm.isDefault) {
        const res = await setDefaultModelConfig(configForm.id.trim())
        if (!res) throw new Error('设为默认失败：请确认模型已启用')
        showNotice({ type: 'success', text: '已设置为默认模型' })
      }

      setConfigs(await listModelConfigs())
      setConfigDialogOpen(false)
    } catch (e) {
      setConfigError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setConfigSaving(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await setDefaultModelConfig(id)
      if (!res) {
        showNotice({ type: 'error', text: '设为默认失败：请确认模型已启用' })
        return
      }
      setConfigs(await listModelConfigs())
      showNotice({ type: 'success', text: '已设置为默认模型' })
    } catch (e) {
      showNotice({ type: 'error', text: e instanceof Error ? e.message : '设为默认失败' })
    }
  }

  const openBindingEditor = (agentId: string, mode: 'primary' | 'fallback') => {
    setBindingError('')
    setBindingMode(mode)
    setBindingAgentId(agentId)
    setBindingSaving(false)
    const existing = bindings.find((b) => b.agentTemplateId === agentId && b.bindingType === mode)
    setBindingExistingId(existing?.id ?? null)
    setBindingEnabled(existing?.isEnabled ?? true)
    setBindingNotes(existing?.notes ?? '')
    setBindingModelId(existing?.modelConfigId ?? '')
    setBindingDialogOpen(true)
  }

  const submitBinding = async () => {
    setBindingError('')
    if (!bindingAgentId) return setBindingError('缺少 Agent')
    if (!bindingModelId) return setBindingError('请选择绑定模型')
    setBindingSaving(true)
    try {
      const model = await getModelConfigById(bindingModelId)
      if (!model || !model.isEnabled) {
        setBindingError('当前绑定模型不可用，请重新选择')
        return
      }
      if (bindingMode === 'primary') {
        const b = await setPrimaryBindingForAgent(bindingAgentId, bindingModelId)
        if (bindingExistingId && b.id !== bindingExistingId) {
          // 如果创建了新 binding，旧的可能仍存在，允许后续清理
        }
        await updateBinding(b.id, { isEnabled: bindingEnabled, notes: bindingNotes.trim() || undefined })
        showNotice({ type: 'success', text: '已更新 Agent 主模型绑定' })
      } else {
        const b = await setFallbackBindingForAgent(bindingAgentId, bindingModelId)
        await updateBinding(b.id, { isEnabled: bindingEnabled, notes: bindingNotes.trim() || undefined })
        showNotice({ type: 'success', text: '已更新 Agent 备用模型绑定' })
      }
      setBindings(await listBindings())
      setBindingDialogOpen(false)
    } catch (e) {
      setBindingError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setBindingSaving(false)
    }
  }

  const clearBinding = async () => {
    if (!bindingExistingId) return
    const ok = window.confirm('确认清除该绑定吗？清除后该 Agent 将无法从绑定关系获取对应模型。')
    if (!ok) return
    try {
      await deleteBinding(bindingExistingId)
      setBindings(await listBindings())
      setBindingDialogOpen(false)
      showNotice({ type: 'success', text: '已清除绑定' })
    } catch (e) {
      showNotice({ type: 'error', text: e instanceof Error ? e.message : '清除绑定失败' })
    }
  }

  const enabledConfigs = configs.filter((c) => c.isEnabled)
  const enabledConfigsByCategory = (cat: string) =>
    enabledConfigs.filter((c) => (c.supportedAgentCategories ?? []).includes(cat))

  const agentIdsInBindings = [...new Set(bindings.map((b) => b.agentTemplateId))]
  const agentBindingRows = agentIdsInBindings.map((agentTemplateId) => {
    const primary = bindings.find((b) => b.agentTemplateId === agentTemplateId && b.bindingType === 'primary') ?? null
    const fallback = bindings.find((b) => b.agentTemplateId === agentTemplateId && b.bindingType === 'fallback') ?? null
    return {
      agentTemplateId,
      primary,
      fallback,
    }
  })

  const credentialColumns = [
    { key: 'nameZh', title: FIELD_CREDENTIAL_NAME, width: '140px', render: (_: unknown, r: Omit<LLMCredential, 'encryptedSecret'>) => r.nameZh || r.name },
    { key: 'providerType', title: FIELD_PROVIDER_TYPE, width: '100px', render: (_: unknown, r: Omit<LLMCredential, 'encryptedSecret'>) => LLM_PROVIDER_TYPE_LABELS[r.providerType] ?? r.providerType },
    { key: 'secretMasked', title: FIELD_SECRET_MASKED, width: '140px', render: (_: unknown, r: Omit<LLMCredential, 'encryptedSecret'>) => r.secretMasked || '—' },
    { key: 'status', title: FIELD_STATUS, width: '90px', render: (_: unknown, r: Omit<LLMCredential, 'encryptedSecret'>) => <StatusTag status={r.status === 'active' ? 'success' : 'neutral'}>{LLM_CREDENTIAL_STATUS_LABELS[r.status]}</StatusTag> },
    { key: 'notes', title: FIELD_NOTES, width: '160px', render: (_: unknown, r: Omit<LLMCredential, 'encryptedSecret'>) => r.notes ?? '—' },
    {
      key: 'actions',
      title: '操作',
      width: '160px',
      render: (_: unknown, r: Omit<LLMCredential, 'encryptedSecret'>) => (
        <span className={styles.actions}>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => handleCredentialStatus(r.id, r.status)}>
            {r.status === 'active' ? '停用' : '启用'}
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => openEditCredential(r)}>
            编辑
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => handleCredentialDelete(r.id)}>
            删除
          </button>
        </span>
      ),
    },
  ]

  const providerColumns = [
    { key: 'name', title: FIELD_PROVIDER_NAME, width: '120px', render: (_: unknown, r: LLMProvider) => r.name || '—' },
    { key: 'nameZh', title: FIELD_PROVIDER_NAME_ZH, width: '120px', render: (_: unknown, r: LLMProvider) => r.nameZh || '—' },
    { key: 'providerType', title: FIELD_PROVIDER_TYPE, width: '120px', render: (_: unknown, r: LLMProvider) => LLM_PROVIDER_TYPE_LABELS[r.providerType] ?? r.providerType },
    { key: 'baseUrl', title: FIELD_BASE_URL, width: '200px', render: (_: unknown, r: LLMProvider) => r.baseUrl || '—' },
    { key: 'status', title: FIELD_STATUS, width: '90px', render: (_: unknown, r: LLMProvider) => <StatusTag status={r.status === 'active' ? 'success' : 'neutral'}>{LLM_PROVIDER_STATUS_LABELS[r.status]}</StatusTag> },
    {
      key: 'credentialId',
      title: '关联凭证',
      width: '120px',
      render: (_: unknown, r: LLMProvider) => {
        const cid = r.credentialId
        if (!cid) return '—'
        const c = credentialsList.find((x) => x.id === cid)
        return c?.nameZh ?? cid
      },
    },
    { key: 'notes', title: FIELD_NOTES, width: '160px', render: (_: unknown, r: LLMProvider) => r.notes ?? '—' },
    {
      key: 'actions',
      title: '操作',
      width: '140px',
      render: (_: unknown, r: LLMProvider) => (
        <span className={styles.actions}>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => handleProviderStatus(r.id, r.status)}>
            {r.status === 'active' ? '停用' : '启用'}
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => openEditProvider(r)}>
            编辑
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => openTestProvider(r)}>
            测试连接
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => handleProviderDelete(r.id, r.nameZh || r.name)}>
            删除
          </button>
        </span>
      ),
    },
  ]

  const configColumns = [
    { key: 'nameZh', title: FIELD_MODEL_NAME, width: '160px', render: (_: unknown, r: LLMModelConfig) => r.nameZh || r.name },
    {
      key: 'provider',
      title: '提供商',
      width: '100px',
      render: (_: unknown, r: LLMModelConfig) => {
        const pid = r.providerId
        if (!pid) return '—'
        const p = providers.find((x) => x.id === pid)
        return p?.nameZh ?? p?.name ?? pid
      },
    },
    { key: 'modelKey', title: FIELD_MODEL_KEY, width: '140px', render: (_: unknown, r: LLMModelConfig) => r.modelKey },
    { key: 'structuredOutputMode', title: FIELD_STRUCTURED_OUTPUT, width: '120px', render: (_: unknown, r: LLMModelConfig) => STRUCTURED_OUTPUT_MODE_LABELS[r.structuredOutputMode] ?? r.structuredOutputMode ?? '—' },
    { key: 'isDefault', title: FIELD_DEFAULT_MODEL, width: '90px', render: (_: unknown, r: LLMModelConfig) => r.isDefault ? '默认' : '—' },
    { key: 'temperature', title: FIELD_TEMPERATURE, width: '70px', render: (_: unknown, r: LLMModelConfig) => String(r.temperature) },
    { key: 'maxTokens', title: FIELD_MAX_TOKENS, width: '100px', render: (_: unknown, r: LLMModelConfig) => String(r.maxTokens) },
    { key: 'isEnabled', title: FIELD_STATUS, width: '90px', render: (_: unknown, r: LLMModelConfig) => <StatusTag status={r.isEnabled ? 'success' : 'neutral'}>{r.isEnabled ? '启用中' : '已停用'}</StatusTag> },
    {
      key: 'categories',
      title: FIELD_AGENT_CATEGORIES,
      width: '120px',
      render: (_: unknown, r: LLMModelConfig) => (r.supportedAgentCategories?.length ? r.supportedAgentCategories.map((c) => AGENT_CATEGORY_LABELS[c] ?? c).join('、') : '—'),
    },
    {
      key: 'actions',
      title: '操作',
      width: '170px',
      render: (_: unknown, r: LLMModelConfig) => (
        <span className={styles.actions}>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => openEditConfig(r)}>
            编辑
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => handleConfigStatus(r.id, r.isEnabled)}>
            {r.isEnabled ? '停用' : '启用'}
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => handleSetDefault(r.id)}
            disabled={!r.isEnabled}
            title={!r.isEnabled ? '模型未启用，无法设为默认' : undefined}
          >
            设为默认
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => handleModelConfigDelete(r.id, r.nameZh || r.name)}>
            删除
          </button>
        </span>
      ),
    },
  ]

  const bindingColumns = [
    { key: 'agent', title: FIELD_AGENT_NAME, width: '200px', render: (_: unknown, r: { agentTemplateId: string }) => agentNameMap[r.agentTemplateId] ?? r.agentTemplateId },
    { key: 'agentCategory', title: 'Agent 分类', width: '90px', render: (_: unknown, r: { agentTemplateId: string }) => AGENT_CATEGORY_LABELS[agentCategoryMap[r.agentTemplateId] ?? ''] ?? (agentCategoryMap[r.agentTemplateId] ?? '—') },
    {
      key: 'primaryModel',
      title: FIELD_PRIMARY_MODEL,
      width: '180px',
      render: (_: unknown, r: { primary: AgentLLMBinding | null }) => {
        if (!r.primary) return '—'
        const cfg = configs.find((c) => c.id === r.primary!.modelConfigId)
        return cfg?.nameZh ?? cfg?.name ?? r.primary.modelConfigId
      },
    },
    {
      key: 'fallbackModel',
      title: FIELD_FALLBACK_MODEL,
      width: '180px',
      render: (_: unknown, r: { fallback: AgentLLMBinding | null }) => {
        if (!r.fallback) return '—'
        const cfg = configs.find((c) => c.id === r.fallback!.modelConfigId)
        return cfg?.nameZh ?? cfg?.name ?? r.fallback.modelConfigId
      },
    },
    {
      key: 'status',
      title: FIELD_BINDING_STATUS,
      width: '90px',
      render: (_: unknown, r: { primary: AgentLLMBinding | null }) => {
        if (!r.primary) return <StatusTag status="neutral">未配置</StatusTag>
        return <StatusTag status={r.primary.isEnabled ? 'success' : 'neutral'}>{r.primary.isEnabled ? '启用中' : '已停用'}</StatusTag>
      },
    },
    {
      key: 'actions',
      title: '操作',
      width: '220px',
      render: (_: unknown, r: { agentTemplateId: string; primary: AgentLLMBinding | null; fallback: AgentLLMBinding | null }) => (
        <span className={styles.actions}>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => openBindingEditor(r.agentTemplateId, 'primary')}>
            配置主模型
          </button>
          <button type="button" className={listPageStyles.linkBtn} onClick={() => openBindingEditor(r.agentTemplateId, 'fallback')}>
            配置备用模型
          </button>
          {r.primary && (
            <button type="button" className={listPageStyles.linkBtn} onClick={() => handleBindingStatus(r.primary!.id, r.primary!.isEnabled)}>
              {r.primary.isEnabled ? '停用' : '启用'}
            </button>
          )}
        </span>
      ),
    },
  ]

  return (
    <PageContainer title={PAGE_TITLE} description="管理模型提供商、模型配置与 Agent 模型绑定关系。">
      <div className={styles.sections}>
        {notice && (
          <p
            className={[
              styles.notice,
              notice.type === 'success' ? styles.noticeSuccess : styles.noticeError,
            ].join(' ')}
          >
            {notice.text}
          </p>
        )}

        <Card title={SECTION_CREDENTIALS} className={styles.card}>
          <p className={styles.sectionDesc}>管理 API 密钥凭证；前台仅展示掩码，完整密钥由服务端保管。</p>
          <Table dataSource={credentialsList} columns={credentialColumns} rowKey="id" loading={loading} />
          <div className={styles.toolbar}>
            <button type="button" className={styles.primaryBtn} onClick={openCreateCredential}>新增凭证</button>
          </div>
        </Card>

        <Card title={SECTION_PROVIDERS} className={styles.card}>
          <p className={styles.sectionDesc}>管理 OpenAI、OpenAI 兼容等提供商；可启用/停用、测试连接（真实调用）。完整开发环境请运行 npm run dev:full。</p>
          <Table dataSource={providers} columns={providerColumns} rowKey="id" loading={loading} />
          <div className={styles.toolbar}>
            <button type="button" className={styles.primaryBtn} onClick={openCreateProvider}>新增提供商</button>
          </div>
        </Card>

        <Card title={SECTION_MODEL_CONFIGS} className={styles.card}>
          <p className={styles.sectionDesc}>管理各模型配置：温度、最大长度、超时、重试、适用 Agent 分类。</p>
          <Table dataSource={configs} columns={configColumns} rowKey="id" loading={loading} />
          <div className={styles.toolbar}>
            <button type="button" className={styles.primaryBtn} onClick={openCreateConfig}>新增模型配置</button>
          </div>
        </Card>

        <Card title={SECTION_AGENT_BINDINGS} className={styles.card}>
          <p className={styles.sectionDesc}>查看与管理 Agent 模板与模型配置的绑定；主模型 / 备用模型。</p>
          <Table dataSource={agentBindingRows} columns={bindingColumns} rowKey="agentTemplateId" loading={loading} />
          <div className={styles.toolbar}>
            <span className={styles.hint}>提示：当前列表仅展示“已有绑定记录”的 Agent。后续可扩展为展示全部 AgentTemplate。</span>
          </div>
        </Card>
      </div>

      <Dialog
        open={credentialDialogOpen}
        onClose={() => setCredentialDialogOpen(false)}
        title={credentialEditing ? '编辑凭证' : '新增凭证'}
        width={520}
        footer={
          <div className={styles.footerActions}>
            <button type="button" className={styles.ghostBtn} onClick={() => setCredentialDialogOpen(false)} disabled={credentialSaving}>
              取消
            </button>
            <button type="button" className={styles.primaryBtn} onClick={submitCredential} disabled={credentialSaving}>
              {credentialSaving ? '提交中…' : '提交'}
            </button>
          </div>
        }
      >
        {credentialError && <p className={[styles.notice, styles.noticeError].join(' ')}>{credentialError}</p>}
        <div className={styles.formGrid}>
          <span className={styles.label}>凭证编码<span className={styles.required}>*</span></span>
          <input className={styles.input} value={credentialForm.id} onChange={(e) => setCredentialForm((p) => ({ ...p, id: e.target.value }))} disabled={!!credentialEditing} placeholder="例如 cred-openai-1" />
          <span className={styles.label}>凭证名称<span className={styles.required}>*</span></span>
          <input className={styles.input} value={credentialForm.name} onChange={(e) => setCredentialForm((p) => ({ ...p, name: e.target.value }))} placeholder="例如 OpenAI API Key" />
          <span className={styles.label}>中文名称<span className={styles.required}>*</span></span>
          <input className={styles.input} value={credentialForm.nameZh} onChange={(e) => setCredentialForm((p) => ({ ...p, nameZh: e.target.value }))} placeholder="例如 OpenAI 主密钥" />
          <span className={styles.label}>提供商类型<span className={styles.required}>*</span></span>
          <select className={styles.select} value={credentialForm.providerType} onChange={(e) => setCredentialForm((p) => ({ ...p, providerType: e.target.value as LLMCredential['providerType'] }))}>
            <option value="openai">OpenAI</option>
            <option value="azure_openai">Azure OpenAI</option>
            <option value="openai_compatible">OpenAI 兼容</option>
            <option value="custom">自定义</option>
          </select>
          {!credentialEditing && (
            <>
              <span className={styles.label}>API 密钥<span className={styles.required}>*</span></span>
              <input type="password" className={styles.input} value={credentialForm.secret} onChange={(e) => setCredentialForm((p) => ({ ...p, secret: e.target.value }))} placeholder="sk-..." />
            </>
          )}
          {credentialEditing && <span className={styles.label}>密钥</span>}
          {credentialEditing && <input className={styles.input} value={credentialEditing.secretMasked} readOnly placeholder="编辑时不修改密钥" />}
          <span className={styles.label}>状态</span>
          <select className={styles.select} value={credentialForm.status} onChange={(e) => setCredentialForm((p) => ({ ...p, status: e.target.value as LLMCredential['status'] }))}>
            <option value="active">启用中</option>
            <option value="disabled">已停用</option>
          </select>
          <span className={styles.label}>备注</span>
          <textarea className={styles.textarea} value={credentialForm.notes} onChange={(e) => setCredentialForm((p) => ({ ...p, notes: e.target.value }))} placeholder="可选" />
          <p className={styles.hint}>前台仅展示掩码密钥，完整密钥由服务端保管，不会返回给前端。</p>
        </div>
      </Dialog>

      <Dialog
        open={providerDialogOpen}
        onClose={() => setProviderDialogOpen(false)}
        title={providerEditing ? '编辑模型提供商' : '新增模型提供商'}
        width={560}
        footer={
          <div className={styles.footerActions}>
            <button type="button" className={styles.ghostBtn} onClick={() => setProviderDialogOpen(false)} disabled={providerSaving}>
              取消
            </button>
            <button type="button" className={styles.primaryBtn} onClick={submitProvider} disabled={providerSaving}>
              {providerSaving ? '提交中…' : '提交'}
            </button>
          </div>
        }
      >
        {providerError && <p className={[styles.notice, styles.noticeError].join(' ')}>{providerError}</p>}
        <div className={styles.formGrid}>
          <span className={styles.label}>提供商编码<span className={styles.required}>*</span></span>
          <input className={styles.input} value={providerForm.id} onChange={(e) => setProviderForm((p) => ({ ...p, id: e.target.value }))} disabled={!!providerEditing} placeholder="例如 provider-openai" />
          <span className={styles.label}>提供商名称<span className={styles.required}>*</span></span>
          <input className={styles.input} value={providerForm.name} onChange={(e) => setProviderForm((p) => ({ ...p, name: e.target.value }))} placeholder="例如 OpenAI" />
          <span className={styles.label}>中文名称<span className={styles.required}>*</span></span>
          <input className={styles.input} value={providerForm.nameZh} onChange={(e) => setProviderForm((p) => ({ ...p, nameZh: e.target.value }))} placeholder="例如 OpenAI" />
          <span className={styles.label}>提供商类型<span className={styles.required}>*</span></span>
          <select className={styles.select} value={providerForm.providerType} onChange={(e) => setProviderForm((p) => ({ ...p, providerType: e.target.value as LLMProvider['providerType'] }))}>
            <option value="openai">OpenAI</option>
            <option value="azure_openai">Azure OpenAI</option>
            <option value="openai_compatible">OpenAI 兼容</option>
            <option value="custom">自定义</option>
          </select>
          <span className={styles.label}>接口地址</span>
          <input className={styles.input} value={providerForm.baseUrl} onChange={(e) => setProviderForm((p) => ({ ...p, baseUrl: e.target.value }))} placeholder="例如 https://api.openai.com/v1" />
          <span className={styles.label}>关联凭证<span className={styles.required}>*</span></span>
          <select className={styles.select} value={providerForm.credentialId} onChange={(e) => setProviderForm((p) => ({ ...p, credentialId: e.target.value }))}>
            <option value="">请选择</option>
            {credentials.filter((c) => c.providerType === providerForm.providerType || (providerForm.providerType === 'openai_compatible' && c.providerType === 'openai')).map((c) => (
              <option key={c.id} value={c.id}>{c.nameZh}</option>
            ))}
          </select>
          <span className={styles.label}>状态</span>
          <select className={styles.select} value={providerForm.status} onChange={(e) => setProviderForm((p) => ({ ...p, status: e.target.value as LLMProvider['status'] }))}>
            <option value="active">启用中</option>
            <option value="disabled">已停用</option>
          </select>
          <span className={styles.label}>备注</span>
          <textarea className={styles.textarea} value={providerForm.notes} onChange={(e) => setProviderForm((p) => ({ ...p, notes: e.target.value }))} placeholder="可选" />
          <p className={styles.hint}>OpenAI 兼容提供商（如百炼 Coding Plan）请填写兼容 Base URL，例如 https://coding.dashscope.aliyuncs.com/v1。</p>
        </div>
      </Dialog>

      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        title={`测试连接：${testTarget?.nameZh ?? testTarget?.name ?? ''}`}
        width={520}
        footer={
          <div className={styles.footerActions}>
            <button type="button" className={styles.ghostBtn} onClick={() => setTestDialogOpen(false)} disabled={testLoading}>
              关闭
            </button>
            <button type="button" className={styles.primaryBtn} onClick={runTestProvider} disabled={testLoading}>
              {testLoading ? '测试中…' : '开始测试'}
            </button>
          </div>
        }
      >
        {testResult && (
          <p className={[
            styles.notice,
            testResult.type === 'success' ? styles.noticeSuccess : styles.noticeError,
          ].join(' ')}>
            {testResult.text}
          </p>
        )}
        <div className={styles.formGrid}>
          <span className={styles.label}>测试模型（可选）</span>
          <input
            className={styles.input}
            value={testModelKey}
            onChange={(e) => setTestModelKey(e.target.value)}
            placeholder="例如 qwen3.5-plus / kimi-k2.5"
          />
          <p className={styles.hint}>不填时将使用该提供商下“已启用模型配置”的第一条 modelKey；若未配置模型将提示先创建模型配置。</p>
        </div>
        {!testResult && <p className={styles.hint}>将检查：提供商是否启用、是否配置接口地址、是否关联可用凭证与模型。</p>}
      </Dialog>

      <Dialog
        open={configDialogOpen}
        onClose={() => setConfigDialogOpen(false)}
        title={configEditing ? '编辑模型配置' : '新增模型配置'}
        width={620}
        footer={
          <div className={styles.footerActions}>
            <button type="button" className={styles.ghostBtn} onClick={() => setConfigDialogOpen(false)} disabled={configSaving}>
              取消
            </button>
            <button type="button" className={styles.primaryBtn} onClick={submitConfig} disabled={configSaving}>
              {configSaving ? '提交中…' : '提交'}
            </button>
          </div>
        }
      >
        {configError && <p className={[styles.notice, styles.noticeError].join(' ')}>{configError}</p>}
        <div className={styles.formGrid}>
          <span className={styles.label}>模型编码<span className={styles.required}>*</span></span>
          <input className={styles.input} value={configForm.id} onChange={(e) => setConfigForm((p) => ({ ...p, id: e.target.value }))} disabled={!!configEditing} placeholder="例如 llm-openai-main" />
          <span className={styles.label}>模型名称<span className={styles.required}>*</span></span>
          <input className={styles.input} value={configForm.name} onChange={(e) => setConfigForm((p) => ({ ...p, name: e.target.value }))} placeholder="例如 OpenAI GPT-4o" />
          <span className={styles.label}>中文名称<span className={styles.required}>*</span></span>
          <input className={styles.input} value={configForm.nameZh} onChange={(e) => setConfigForm((p) => ({ ...p, nameZh: e.target.value }))} placeholder="例如 主规划模型" />
          <span className={styles.label}>所属提供商<span className={styles.required}>*</span></span>
          <select className={styles.select} value={configForm.providerId} onChange={(e) => setConfigForm((p) => ({ ...p, providerId: e.target.value }))}>
            <option value="">请选择</option>
            {providers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nameZh ?? p.name}（{LLM_PROVIDER_TYPE_LABELS[p.providerType] ?? p.providerType}）
              </option>
            ))}
          </select>
          <span className={styles.label}>模型标识<span className={styles.required}>*</span></span>
          <input className={styles.input} value={configForm.modelKey} onChange={(e) => setConfigForm((p) => ({ ...p, modelKey: e.target.value }))} placeholder="例如 gpt-4o-mini" />
          <span className={styles.label}>是否启用</span>
          <select className={styles.select} value={configForm.isEnabled ? 'yes' : 'no'} onChange={(e) => setConfigForm((p) => ({ ...p, isEnabled: e.target.value === 'yes' }))}>
            <option value="yes">启用中</option>
            <option value="no">已停用</option>
          </select>
          <span className={styles.label}>是否默认</span>
          <select className={styles.select} value={configForm.isDefault ? 'yes' : 'no'} onChange={(e) => setConfigForm((p) => ({ ...p, isDefault: e.target.value === 'yes' }))}>
            <option value="no">否</option>
            <option value="yes">是</option>
          </select>
          <span className={styles.label}>温度</span>
          <input className={styles.input} type="number" step="0.1" value={String(configForm.temperature)} onChange={(e) => setConfigForm((p) => ({ ...p, temperature: Number(e.target.value) }))} />
          <span className={styles.label}>最大输出长度</span>
          <input className={styles.input} type="number" value={String(configForm.maxTokens)} onChange={(e) => setConfigForm((p) => ({ ...p, maxTokens: Number(e.target.value) }))} />
          <span className={styles.label}>超时时间(ms)</span>
          <input className={styles.input} type="number" value={String(configForm.timeoutMs)} onChange={(e) => setConfigForm((p) => ({ ...p, timeoutMs: Number(e.target.value) }))} />
          <span className={styles.label}>重试次数</span>
          <input className={styles.input} type="number" value={String(configForm.retryCount)} onChange={(e) => setConfigForm((p) => ({ ...p, retryCount: Number(e.target.value) }))} />
          <span className={styles.label}>结构化输出模式</span>
          <select className={styles.select} value={configForm.structuredOutputMode} onChange={(e) => setConfigForm((p) => ({ ...p, structuredOutputMode: e.target.value as LLMModelConfig['structuredOutputMode'] }))}>
            <option value="json">JSON</option>
            <option value="json_schema">JSON Schema</option>
            <option value="markdown_json">Markdown + JSON</option>
            <option value="json_object">JSON 对象</option>
            <option value="none">无</option>
          </select>
          <span className={styles.label}>备用模型</span>
          <select className={styles.select} value={configForm.fallbackModelConfigId} onChange={(e) => setConfigForm((p) => ({ ...p, fallbackModelConfigId: e.target.value }))}>
            <option value="">无</option>
            {configs.filter((c) => c.id !== configForm.id).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameZh ?? c.name}（{c.modelKey}）
              </option>
            ))}
          </select>
          <span className={styles.label}>适用 Agent 分类</span>
          <select
            className={styles.select}
            multiple
            value={configForm.supportedAgentCategories}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions).map((o) => o.value)
              setConfigForm((p) => ({ ...p, supportedAgentCategories: selected }))
            }}
          >
            <option value="planning">规划</option>
            <option value="coordination">协调</option>
            <option value="execution">执行</option>
          </select>
          <span className={styles.label}>备注</span>
          <textarea className={styles.textarea} value={configForm.notes} onChange={(e) => setConfigForm((p) => ({ ...p, notes: e.target.value }))} />
          <p className={styles.hint}>提示：勾选“是否默认=是”提交后会自动取消其他默认项；仅启用中的模型才能设为默认。</p>
        </div>
      </Dialog>

      <Dialog
        open={bindingDialogOpen}
        onClose={() => setBindingDialogOpen(false)}
        title={`${bindingMode === 'primary' ? '配置主模型' : '配置备用模型'}：${agentNameMap[bindingAgentId] ?? bindingAgentId}`}
        width={620}
        footer={
          <div className={styles.footerActions}>
            {bindingExistingId && (
              <button type="button" className={styles.ghostBtn} onClick={clearBinding} disabled={bindingSaving}>
                清除绑定
              </button>
            )}
            <button type="button" className={styles.ghostBtn} onClick={() => setBindingDialogOpen(false)} disabled={bindingSaving}>
              取消
            </button>
            <button type="button" className={styles.primaryBtn} onClick={submitBinding} disabled={bindingSaving}>
              {bindingSaving ? '提交中…' : '提交'}
            </button>
          </div>
        }
      >
        {bindingError && <p className={[styles.notice, styles.noticeError].join(' ')}>{bindingError}</p>}
        <div className={styles.formGrid}>
          <span className={styles.label}>Agent（只读）</span>
          <input className={styles.input} value={agentNameMap[bindingAgentId] ?? bindingAgentId} readOnly />
          <span className={styles.label}>Agent 分类</span>
          <input className={styles.input} value={AGENT_CATEGORY_LABELS[agentCategoryMap[bindingAgentId] ?? ''] ?? (agentCategoryMap[bindingAgentId] ?? '—')} readOnly />
          <span className={styles.label}>绑定模型<span className={styles.required}>*</span></span>
          <select
            className={styles.select}
            value={bindingModelId}
            onChange={(e) => setBindingModelId(e.target.value)}
          >
            <option value="">请选择</option>
            {(agentCategoryMap[bindingAgentId]
              ? enabledConfigsByCategory(agentCategoryMap[bindingAgentId])
              : enabledConfigs
            ).map((c) => (
              <option key={c.id} value={c.id}>
                {c.nameZh ?? c.name}（{c.modelKey}）
              </option>
            ))}
          </select>
          <span className={styles.label}>是否启用</span>
          <select className={styles.select} value={bindingEnabled ? 'yes' : 'no'} onChange={(e) => setBindingEnabled(e.target.value === 'yes')}>
            <option value="yes">启用中</option>
            <option value="no">已停用</option>
          </select>
          <span className={styles.label}>备注</span>
          <textarea className={styles.textarea} value={bindingNotes} onChange={(e) => setBindingNotes(e.target.value)} />
          <p className={styles.hint}>下拉仅展示“已启用”的模型配置；会按 Agent 分类过滤（若该 Agent 分类已识别）。</p>
        </div>
      </Dialog>
    </PageContainer>
  )
}
