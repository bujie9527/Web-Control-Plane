import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/Card/Card'
import { Table } from '@/components/Table/Table'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { AgentTemplateSelector } from '@/components/AgentTemplateSelector'
import type { ProjectDetailData } from '../../../schemas/projectDetail'
import type { ProjectAgentConfig } from '../../../schemas/projectAgentConfig'
import {
  deleteProjectAgentConfig,
  getProjectAgentConfig,
  listProjectAgentConfigs,
  upsertProjectAgentConfig,
} from '../../../services/projectAgentConfigService'
import styles from '../tabs.module.css'

const roleColumns = [
  { key: 'roleName', title: '角色', width: '100px' },
  { key: 'agentName', title: 'Agent 名称', width: '160px' },
  { key: 'model', title: '模型', width: '100px' },
  { key: 'status', title: '状态', width: '90px', render: (_: unknown, r: { status: string }) => <StatusTag type="success">{r.status}</StatusTag> },
]

export function AgentTeamTab({ data, projectId }: { data: ProjectDetailData; projectId: string }) {
  const { agentTeam } = data
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')
  const [configs, setConfigs] = useState<ProjectAgentConfig[]>([])
  const [instructionOverride, setInstructionOverride] = useState('')
  const [temperatureOverride, setTemperatureOverride] = useState('')
  const [maxTokensOverride, setMaxTokensOverride] = useState('')
  const [modelConfigIdOverride, setModelConfigIdOverride] = useState('')
  const [channelStyleOverrideText, setChannelStyleOverrideText] = useState('')
  const [customParamsText, setCustomParamsText] = useState('')
  const [isEnabled, setIsEnabled] = useState(true)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const currentConfig = useMemo(
    () => configs.find((c) => c.agentTemplateId === selectedTemplateId) ?? null,
    [configs, selectedTemplateId]
  )

  const resetEditor = () => {
    setInstructionOverride('')
    setTemperatureOverride('')
    setMaxTokensOverride('')
    setModelConfigIdOverride('')
    setChannelStyleOverrideText('')
    setCustomParamsText('')
    setIsEnabled(true)
  }

  useEffect(() => {
    listProjectAgentConfigs(projectId)
      .then(setConfigs)
      .catch(() => {
        setNotice('项目级 Agent 配置加载失败，可稍后重试')
      })
  }, [projectId])

  useEffect(() => {
    if (!selectedTemplateId) {
      resetEditor()
      return
    }
    setLoadingConfig(true)
    setError('')
    getProjectAgentConfig(projectId, selectedTemplateId)
      .then((cfg) => {
        if (!cfg) {
          resetEditor()
          return
        }
        setInstructionOverride(cfg.instructionOverride ?? '')
        setTemperatureOverride(
          cfg.temperatureOverride != null ? String(cfg.temperatureOverride) : ''
        )
        setMaxTokensOverride(cfg.maxTokensOverride != null ? String(cfg.maxTokensOverride) : '')
        setModelConfigIdOverride(cfg.modelConfigIdOverride ?? '')
        setChannelStyleOverrideText(
          cfg.channelStyleOverride ? JSON.stringify(cfg.channelStyleOverride, null, 2) : ''
        )
        setCustomParamsText(cfg.customParams ? JSON.stringify(cfg.customParams, null, 2) : '')
        setIsEnabled(cfg.isEnabled)
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : '加载配置失败')
      })
      .finally(() => setLoadingConfig(false))
  }, [projectId, selectedTemplateId])

  const handleSaveConfig = async () => {
    if (!selectedTemplateId) {
      setError('请先选择 Agent 模板')
      return
    }
    setError('')
    let channelStyleOverride: Record<string, unknown> | undefined
    let customParams: Record<string, unknown> | undefined
    if (channelStyleOverrideText.trim()) {
      try {
        channelStyleOverride = JSON.parse(channelStyleOverrideText) as Record<string, unknown>
      } catch {
        setError('渠道风格覆盖必须是合法 JSON')
        return
      }
    }
    if (customParamsText.trim()) {
      try {
        customParams = JSON.parse(customParamsText) as Record<string, unknown>
      } catch {
        setError('自定义参数必须是合法 JSON')
        return
      }
    }
    setSaving(true)
    try {
      const saved = await upsertProjectAgentConfig(projectId, selectedTemplateId, {
        instructionOverride: instructionOverride.trim() || undefined,
        temperatureOverride: temperatureOverride.trim()
          ? Number(temperatureOverride)
          : undefined,
        maxTokensOverride: maxTokensOverride.trim() ? Number(maxTokensOverride) : undefined,
        modelConfigIdOverride: modelConfigIdOverride.trim() || undefined,
        channelStyleOverride,
        customParams,
        isEnabled,
      })
      setConfigs((prev) => {
        const idx = prev.findIndex((x) => x.agentTemplateId === saved.agentTemplateId)
        if (idx < 0) return [saved, ...prev]
        const next = prev.slice()
        next[idx] = saved
        return next
      })
      setNotice('项目级 Agent 调参已保存')
    } catch (e) {
      setError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfig = async () => {
    if (!selectedTemplateId) return
    setSaving(true)
    setError('')
    try {
      await deleteProjectAgentConfig(projectId, selectedTemplateId)
      setConfigs((prev) => prev.filter((x) => x.agentTemplateId !== selectedTemplateId))
      resetEditor()
      setNotice('已移除该 Agent 的项目级覆盖')
    } catch (e) {
      setError(e instanceof Error ? e.message : '删除失败')
    } finally {
      setSaving(false)
    }
  }

  const configColumns = [
    { key: 'agentTemplateId', title: 'Agent 模板 ID', width: '280px' },
    {
      key: 'isEnabled',
      title: '启用',
      width: '80px',
      render: (_: unknown, r: ProjectAgentConfig) => (
        <StatusTag type={r.isEnabled ? 'success' : 'warning'}>
          {r.isEnabled ? '启用' : '停用'}
        </StatusTag>
      ),
    },
    {
      key: 'updatedAt',
      title: '更新时间',
      width: '160px',
      render: (_: unknown, r: ProjectAgentConfig) => r.updatedAt,
    },
    {
      key: 'action',
      title: '操作',
      width: '100px',
      render: (_: unknown, r: ProjectAgentConfig) => (
        <button
          type="button"
          className={styles.placeholderBtn}
          onClick={() => setSelectedTemplateId(r.agentTemplateId)}
        >
          编辑
        </button>
      ),
    },
  ]

  return (
    <>
      <Card
        title="可用 Agent 范围"
        description="限定项目可使用的 Agent 模板范围，具体节点执行由流程模板配置"
      >
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>可用 Agent 范围</label>
          <AgentTemplateSelector
            value={selectedTemplateId}
            onChange={(t) => setSelectedTemplateId(t?.id ?? '')}
            placeholder="请选择 Agent 模板"
          />
        </div>
        <p className={styles.formHint}>
          项目层只定义可用范围与偏好，不直接决定节点执行。推荐 Agent 组合、默认流程规划助手可在流程选择后配置。
        </p>
      </Card>
      <Card
        title="推荐 Agent 组合"
        description="项目优先推荐的 Agent 模板组合，供流程节点参考"
      >
        <p className={styles.formHint}>（占位）推荐 Agent 组合配置将在流程与任务确定后生效。</p>
      </Card>
      <Card
        title="项目级 Agent 调参"
        description="按项目覆盖 Agent 指令、模型和参数（优先级高于模板默认值）"
      >
        {notice && <p className={styles.formHint}>{notice}</p>}
        {error && <p className={styles.formError}>{error}</p>}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>选择 Agent 模板</label>
          <AgentTemplateSelector
            value={selectedTemplateId}
            onChange={(t) => setSelectedTemplateId(t?.id ?? '')}
            placeholder="请选择需要调参的 Agent"
          />
        </div>
        {selectedTemplateId && (
          <>
            {loadingConfig ? (
              <p className={styles.formHint}>加载配置中...</p>
            ) : (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>指令覆盖</label>
                  <textarea
                    className={styles.formTextarea}
                    rows={3}
                    value={instructionOverride}
                    onChange={(e) => setInstructionOverride(e.target.value)}
                    placeholder="例如：重点关注 NBA 和英超，文风更轻松"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>温度覆盖（temperature）</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={temperatureOverride}
                    onChange={(e) => setTemperatureOverride(e.target.value)}
                    placeholder="如 0.7"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>最大 Tokens 覆盖</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={maxTokensOverride}
                    onChange={(e) => setMaxTokensOverride(e.target.value)}
                    placeholder="如 2048"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>模型配置覆盖（modelConfigId）</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={modelConfigIdOverride}
                    onChange={(e) => setModelConfigIdOverride(e.target.value)}
                    placeholder="如 llm-config-openai-gpt4o"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>渠道风格覆盖（JSON）</label>
                  <textarea
                    className={styles.formTextarea}
                    rows={5}
                    value={channelStyleOverrideText}
                    onChange={(e) => setChannelStyleOverrideText(e.target.value)}
                    placeholder='{"telegram_bot":{"styleInstruction":"300-500字，短段落"}}'
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>自定义参数（JSON）</label>
                  <textarea
                    className={styles.formTextarea}
                    rows={4}
                    value={customParamsText}
                    onChange={(e) => setCustomParamsText(e.target.value)}
                    placeholder='{"topicFocus":["nba","premier_league"]}'
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.checkboxRow}>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) => setIsEnabled(e.target.checked)}
                    />
                    <span>启用此项目级覆盖</span>
                  </label>
                </div>
                <div className={styles.formActions}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={handleSaveConfig}
                    disabled={saving}
                  >
                    {saving ? '保存中...' : '保存配置'}
                  </button>
                  {currentConfig && (
                    <button
                      type="button"
                      className={styles.placeholderBtn}
                      onClick={handleDeleteConfig}
                      disabled={saving}
                    >
                      删除覆盖
                    </button>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </Card>
      <Card
        title="已配置的项目级覆盖"
        description="按 Agent 模板查看当前项目已生效的覆盖配置"
      >
        <Table
          columns={configColumns}
          dataSource={configs}
          rowKey="id"
          emptyText="暂无项目级 Agent 覆盖配置"
        />
      </Card>
      <Card
        title="默认流程规划助手"
        description="项目级默认使用的流程规划 Agent，用于 SOP 解析与流程草案生成"
      >
        <p className={styles.formHint}>（占位）默认流程规划助手可在项目设置中指定。</p>
      </Card>
      <Card title="绑定 Agent Team" description="当前项目绑定的 AI 团队">
        <div className={styles.teamSummary}>
          <span className={styles.kvLabel}>团队名称</span>
          <span>{agentTeam.teamName}</span>
          <span className={styles.kvLabel}>状态</span>
          <StatusTag type="success">{agentTeam.teamStatus}</StatusTag>
          {agentTeam.teamDescription && (
            <>
              <span className={styles.kvLabel}>说明</span>
              <span>{agentTeam.teamDescription}</span>
            </>
          )}
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-empty-function -- 占位 */}
        <button type="button" className={styles.placeholderBtn} onClick={() => {}}>更换团队（占位）</button>
      </Card>
      <Card title="团队角色结构" description="角色与 Agent 对应关系">
        <Table
          columns={roleColumns}
          dataSource={agentTeam.roles}
          rowKey="id"
          emptyText="暂无角色配置"
        />
      </Card>
    </>
  )
}
