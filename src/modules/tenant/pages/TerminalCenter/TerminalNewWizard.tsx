import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { Card } from '@/components/Card/Card'
import { listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { useAuth } from '@/core/auth/AuthContext'
import { getSystemTerminalTypeList } from '@/modules/platform/services/systemTerminalTypeService'
import type { SystemTerminalType } from '@/modules/platform/schemas/systemTerminalType'
import { TERMINAL_TYPE_CATEGORY_LABELS } from '@/core/labels/terminalTypeLabels'
import { getIdentityList } from '../../services/identityService'
import { getProjectList } from '../../services/projectService'
import { createTerminal, testConnection } from '../../services/terminalService'
import { FacebookOAuthStep } from './FacebookOAuthStep'
import type { Identity } from '../../schemas/identity'
import type { Project } from '../../schemas/project'
import { ROUTES } from '@/core/constants/routes'
import styles from './TerminalNewWizard.module.css'

type Step = 1 | 2 | 3 | 4

function parseSchemaFields(schemaJson: string | undefined): { key: string; type: string; title?: string; required?: boolean }[] {
  if (!schemaJson?.trim()) return []
  try {
    const schema = JSON.parse(schemaJson) as { type?: string; properties?: Record<string, { type?: string; title?: string }>; required?: string[] }
    const props = schema.properties ?? {}
    const required = new Set(schema.required ?? [])
    return Object.entries(props).map(([key, v]) => ({
      key,
      type: (v?.type === 'string' ? 'string' : (v as { type?: string })?.type) ?? 'string',
      title: (v as { title?: string })?.title ?? key,
      required: required.has(key),
    }))
  } catch {
    return []
  }
}

export function TerminalNewWizard() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? ''
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>(1)
  const [types, setTypes] = useState<SystemTerminalType[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)
  const [selectedType, setSelectedType] = useState<SystemTerminalType | null>(null)
  const [name, setName] = useState('')
  const [authValues, setAuthValues] = useState<Record<string, string>>({})
  const [configValues, setConfigValues] = useState<Record<string, string>>({})
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [identities, setIdentities] = useState<Identity[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedIdentityId, setSelectedIdentityId] = useState<string>('')
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getSystemTerminalTypeList({ status: 'active', pageSize: 100 })
      .then((res) => setTypes(res.items))
      .finally(() => setLoadingTypes(false))
  }, [])

  useEffect(() => {
    if (tenantId && step >= 4) {
      Promise.all([
        getIdentityList({ tenantId, pageSize: 100 }),
        getProjectList({ pageSize: 100 }),
      ]).then(([idRes, projRes]) => {
        setIdentities(idRes.items)
        setProjects(projRes.items)
      })
    }
  }, [tenantId, step])

  const isOAuthFacebook = selectedType?.authType === 'oauth_facebook'
  const authFields = useMemo(() => parseSchemaFields(selectedType?.authSchema), [selectedType?.authSchema])
  const configFields = useMemo(() => parseSchemaFields(selectedType?.configSchema), [selectedType?.configSchema])

  const handleSelectType = (t: SystemTerminalType) => {
    setSelectedType(t)
    setName(t.nameZh || t.name)
    setAuthValues({})
    setConfigValues({})
    setTestStatus('idle')
    setTestMessage('')
  }

  const handleNextFrom1 = () => {
    if (selectedType) setStep(2)
  }
  const handleNextFrom2 = () => setStep(3)
  const handleTest = async () => {
    if (!selectedType || !tenantId) return
    setTestStatus('testing')
    setTestMessage('')
    try {
      const res = await testConnection({
        tenantId,
        type: selectedType.code,
        credentialsJson: JSON.stringify(authValues),
        configJson: JSON.stringify(configValues),
      })
      setTestStatus(res.success ? 'success' : 'failed')
      setTestMessage(res.message ?? (res.success ? '测试连接成功' : '测试连接失败'))
    } catch (e) {
      setTestStatus('failed')
      setTestMessage(e instanceof Error ? e.message : '测试连接失败')
    }
  }
  const handleNextFrom3 = () => setStep(4)
  const handleSubmit = async () => {
    if (!selectedType || !tenantId || !name.trim()) {
      setError('请填写终端名称')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createTerminal(tenantId, {
        name: name.trim(),
        type: selectedType.code,
        typeCategory: selectedType.typeCategory,
        identityId: selectedIdentityId || undefined,
        credentialsJson: JSON.stringify(authValues),
        configJson: JSON.stringify(configValues),
        linkedProjectIds: selectedProjectIds.length ? selectedProjectIds : undefined,
      })
      navigate(ROUTES.TENANT.TERMINALS)
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const typesByCategory = useMemo(() => {
    const map: Record<string, SystemTerminalType[]> = { api: [], browser: [], mcp: [] }
    types.forEach((t) => {
      if (map[t.typeCategory]) map[t.typeCategory].push(t)
    })
    return map
  }, [types])

  return (
    <PageContainer title="新建终端" description="选择终端类型并填写凭证，完成测试后创建">
      {error && <p className={styles.errorText}>{error}</p>}

      <div className={styles.stepIndicator}>
        步骤 {step}/4：{step === 1 && '选择类型'}{step === 2 && '填写凭证与配置'}{step === 3 && '测试连接'}{step === 4 && '绑定与确认'}
      </div>

      {/* Step 1: 选择终端类型 */}
      {step === 1 && (
        <Card title="选择终端类型" description="选择一种终端类型以创建实例">
          {loadingTypes ? (
            <p className={styles.loading}>加载中...</p>
          ) : (
            <div className={styles.typeGrid}>
              {(['api', 'browser', 'mcp'] as const).map((cat) => (
                <div key={cat} className={styles.categoryBlock}>
                  <h4 className={styles.categoryTitle}>{TERMINAL_TYPE_CATEGORY_LABELS[cat]}</h4>
                  <div className={styles.cardRow}>
                    {typesByCategory[cat]?.map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        className={`${styles.typeCard} ${selectedType?.id === t.id ? styles.typeCardSelected : ''}`}
                        onClick={() => handleSelectType(t)}
                      >
                        <span className={styles.typeName}>{t.nameZh || t.name}</span>
                        {t.description && <span className={styles.typeDesc}>{t.description}</span>}
                        {t.capabilityTags?.length ? (
                          <div className={styles.tagRow}>
                            {t.capabilityTags.slice(0, 3).map((tag) => (
                              <span key={tag} className={styles.tag}>{tag}</span>
                            ))}
                          </div>
                        ) : null}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className={styles.footer}>
            <button type="button" className={listPageStyles.linkBtn} onClick={() => navigate(ROUTES.TENANT.TERMINALS)}>取消</button>
            <button type="button" className={listPageStyles.primaryBtn} disabled={!selectedType} onClick={handleNextFrom1}>下一步</button>
          </div>
        </Card>
      )}

      {/* Step 2: 填写凭证与配置（OAuth 类型为 FacebookOAuthStep） */}
      {step === 2 && selectedType && (
        isOAuthFacebook ? (
          <FacebookOAuthStep
            tenantId={tenantId}
            onSuccess={() => navigate(ROUTES.TENANT.TERMINALS + '?oauth_success=1')}
            onBack={() => setStep(1)}
          />
        ) : (
          <Card title="填写凭证与配置" description={`类型：${selectedType.nameZh || selectedType.name}`}>
            <div className={styles.formRow}>
              <label>终端名称 *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="如：FB 主账号" />
            </div>
            {authFields.length > 0 && (
              <>
                <h4 className={styles.sectionTitle}>认证信息</h4>
                {authFields.map((f) => (
                  <div key={f.key} className={styles.formRow}>
                    <label>{f.title}{f.required ? ' *' : ''}</label>
                    <input
                      type="password"
                      autoComplete="off"
                      value={authValues[f.key] ?? ''}
                      onChange={(e) => setAuthValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.title}
                    />
                  </div>
                ))}
              </>
            )}
            {configFields.length > 0 && (
              <>
                <h4 className={styles.sectionTitle}>配置信息</h4>
                {configFields.map((f) => (
                  <div key={f.key} className={styles.formRow}>
                    <label>{f.title}{f.required ? ' *' : ''}</label>
                    <input
                      type="text"
                      value={configValues[f.key] ?? ''}
                      onChange={(e) => setConfigValues((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.title}
                    />
                  </div>
                ))}
              </>
            )}
            <div className={styles.footer}>
              <button type="button" className={listPageStyles.linkBtn} onClick={() => setStep(1)}>上一步</button>
              <button type="button" className={listPageStyles.primaryBtn} onClick={handleNextFrom2}>下一步</button>
            </div>
          </Card>
        )
      )}

      {/* Step 3: 测试连接 */}
      {step === 3 && selectedType && (
        <Card title="测试连接" description="验证凭证与配置是否可用">
          <p className={styles.summary}>类型：{selectedType.nameZh || selectedType.name} · 终端名称：{name || '—'}</p>
          <div className={styles.testBlock}>
            <button type="button" className={listPageStyles.primaryBtn} disabled={testStatus === 'testing'} onClick={handleTest}>
              {testStatus === 'testing' ? '测试中...' : '测试连接'}
            </button>
            {testStatus === 'success' && <span className={styles.testSuccess}>{testMessage || '测试连接成功'}</span>}
            {testStatus === 'failed' && <span className={styles.testFailed}>{testMessage || '测试连接失败'}</span>}
          </div>
          <div className={styles.footer}>
            <button type="button" className={listPageStyles.linkBtn} onClick={() => setStep(2)}>上一步</button>
            <button type="button" className={listPageStyles.primaryBtn} onClick={handleNextFrom3}>下一步</button>
          </div>
        </Card>
      )}

      {/* Step 4: 绑定与确认 */}
      {step === 4 && selectedType && (
        <Card title="绑定与确认" description="可选：绑定身份与关联项目">
          <p className={styles.summary}>类型：{selectedType.nameZh || selectedType.name} · 终端名称：{name || '—'}</p>
          <div className={styles.formRow}>
            <label>绑定身份</label>
            <select value={selectedIdentityId} onChange={(e) => setSelectedIdentityId(e.target.value)}>
              <option value="">不绑定</option>
              {identities.map((i) => (
                <option key={i.id} value={i.id}>{i.name}</option>
              ))}
            </select>
          </div>
          <div className={styles.formRow}>
            <label>关联项目</label>
            <select
              multiple
              value={selectedProjectIds}
              onChange={(e) => {
                const opts = Array.from(e.target.selectedOptions, (o) => o.value)
                setSelectedProjectIds(opts)
              }}
              className={styles.multiSelect}
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <span className={styles.hint}>可多选</span>
          </div>
          <div className={styles.footer}>
            <button type="button" className={listPageStyles.linkBtn} onClick={() => setStep(3)}>上一步</button>
            <button type="button" className={listPageStyles.primaryBtn} disabled={submitting} onClick={handleSubmit}>
              {submitting ? '创建中...' : '确认创建'}
            </button>
          </div>
        </Card>
      )}
    </PageContainer>
  )
}
