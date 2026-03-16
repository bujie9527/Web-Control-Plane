import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/Card/Card'
import { Dialog } from '@/components/Dialog/Dialog'
import { EmptyState } from '@/components/EmptyState/EmptyState'
import { ListPageToolbar, listPageStyles } from '@/components/ListPageToolbar/ListPageToolbar'
import { PageContainer } from '@/components/PageContainer/PageContainer'
import { StatusTag } from '@/components/StatusTag/StatusTag'
import { Table } from '@/components/Table/Table'
import { useAuth } from '@/core/auth/AuthContext'
import {
  createTerminal,
  getTerminalList,
  sendTelegramByTerminal,
  testTerminalById,
  type TerminalWithIdentity,
} from '@/modules/tenant/services/terminalService'
import styles from './TelegramTerminalPage.module.css'

type Notice = { type: 'success' | 'error'; text: string } | null
type ActionType = 'text' | 'photo' | 'poll'

export function TelegramTerminalPage() {
  const { user } = useAuth()
  const tenantId = user?.tenant?.tenantId ?? ''

  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [keyword, setKeyword] = useState('')
  const [terminals, setTerminals] = useState<TerminalWithIdentity[]>([])

  const [createOpen, setCreateOpen] = useState(false)
  const [createError, setCreateError] = useState('')
  const [createForm, setCreateForm] = useState({
    name: '',
    botToken: '',
    defaultChatId: '',
    notes: '',
  })

  const [sendOpen, setSendOpen] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendTerminalId, setSendTerminalId] = useState('')
  const [actionType, setActionType] = useState<ActionType>('text')
  const [sendForm, setSendForm] = useState({
    chatId: '',
    text: '【测试】Telegram 发送链路已打通',
    photoUrl: '',
    caption: '',
    question: '你最关注哪个话题？',
    optionsRaw: '实时战报\n赛事预告',
  })

  const showNotice = (next: Notice) => {
    setNotice(next)
    if (!next) return
    window.setTimeout(() => setNotice(null), 2500)
  }

  const load = useCallback(async () => {
    if (!tenantId) return
    setLoading(true)
    try {
      const result = await getTerminalList({
        tenantId,
        page: 1,
        pageSize: 200,
        keyword: keyword.trim() || undefined,
      })
      const filtered = result.items.filter((t) => t.type === 'telegram_bot' || t.name.toLowerCase().includes('telegram'))
      setTerminals(filtered)
      if (!sendTerminalId && filtered.length > 0) setSendTerminalId(filtered[0].id)
    } catch (e) {
      showNotice({ type: 'error', text: e instanceof Error ? e.message : '加载失败' })
    } finally {
      setLoading(false)
    }
  }, [keyword, sendTerminalId, tenantId])

  useEffect(() => {
    void load()
  }, [load])

  const selectedTerminal = useMemo(
    () => terminals.find((t) => t.id === sendTerminalId) ?? null,
    [sendTerminalId, terminals]
  )

  const columns = [
    { key: 'name', title: '终端名称', width: '170px' },
    {
      key: 'chat',
      title: '默认 Chat',
      width: '140px',
      render: (_: unknown, r: TerminalWithIdentity) => {
        try {
          const cfg = r.configJson ? (JSON.parse(r.configJson) as Record<string, unknown>) : {}
          return String(cfg.defaultChatId ?? '—')
        } catch {
          return '—'
        }
      },
    },
    {
      key: 'token',
      title: 'Token',
      width: '120px',
      render: (_: unknown, r: TerminalWithIdentity) => {
        try {
          const c = r.credentialsJson ? (JSON.parse(r.credentialsJson) as Record<string, unknown>) : {}
          const raw = String(c.botToken ?? c.token ?? '')
          if (!raw) return '未配置'
          return `${raw.slice(0, 4)}***${raw.slice(-4)}`
        } catch {
          return '未配置'
        }
      },
    },
    {
      key: 'status',
      title: '状态',
      width: '90px',
      render: (_: unknown, r: TerminalWithIdentity) => (
        <StatusTag status={r.status === 'active' ? 'success' : 'neutral'}>
          {r.status === 'active' ? '启用中' : r.status}
        </StatusTag>
      ),
    },
    {
      key: 'actions',
      title: '操作',
      width: '180px',
      render: (_: unknown, r: TerminalWithIdentity) => (
        <span className={styles.actions}>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={async () => {
              try {
                await testTerminalById(r.id)
                showNotice({ type: 'success', text: '测试连接成功' })
                await load()
              } catch (e) {
                showNotice({ type: 'error', text: e instanceof Error ? e.message : '测试失败' })
              }
            }}
          >
            测试连接
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => {
              setSendTerminalId(r.id)
              setSendOpen(true)
            }}
          >
            发送消息
          </button>
        </span>
      ),
    },
  ]

  async function submitCreate() {
    setCreateError('')
    if (!tenantId) return setCreateError('缺少租户上下文')
    if (!createForm.name.trim()) return setCreateError('请输入终端名称')
    if (!createForm.botToken.trim()) return setCreateError('请输入 Bot Token')
    try {
      await createTerminal(tenantId, {
        name: createForm.name.trim(),
        type: 'telegram_bot',
        typeCategory: 'api',
        credentialsJson: JSON.stringify({ botToken: createForm.botToken.trim() }),
        configJson: JSON.stringify({ defaultChatId: createForm.defaultChatId.trim() }),
        notes: createForm.notes.trim() || undefined,
      })
      showNotice({ type: 'success', text: 'Telegram Bot 终端创建成功' })
      setCreateOpen(false)
      setCreateForm({ name: '', botToken: '', defaultChatId: '', notes: '' })
      await load()
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : '创建失败')
    }
  }

  async function submitSend() {
    setSendError('')
    if (!sendTerminalId) return setSendError('请选择终端')
    try {
      if (actionType === 'text') {
        if (!sendForm.text.trim()) return setSendError('文本内容不能为空')
        await sendTelegramByTerminal(sendTerminalId, {
          actionType: 'text',
          chatId: sendForm.chatId.trim() || undefined,
          text: sendForm.text.trim(),
        })
      } else if (actionType === 'photo') {
        if (!sendForm.photoUrl.trim()) return setSendError('图片 URL 不能为空')
        await sendTelegramByTerminal(sendTerminalId, {
          actionType: 'photo',
          chatId: sendForm.chatId.trim() || undefined,
          photoUrl: sendForm.photoUrl.trim(),
          caption: sendForm.caption.trim() || undefined,
        })
      } else {
        const options = sendForm.optionsRaw
          .split('\n')
          .map((v) => v.trim())
          .filter(Boolean)
        if (!sendForm.question.trim() || options.length < 2) {
          return setSendError('投票问题不能为空，且选项至少 2 个')
        }
        await sendTelegramByTerminal(sendTerminalId, {
          actionType: 'poll',
          chatId: sendForm.chatId.trim() || undefined,
          question: sendForm.question.trim(),
          options,
        })
      }
      showNotice({ type: 'success', text: 'Telegram 发送成功' })
      setSendOpen(false)
      await load()
    } catch (e) {
      setSendError(e instanceof Error ? e.message : '发送失败')
    }
  }

  return (
    <PageContainer title="Telegram Bot 管理" description="创建 Telegram Bot 终端，并执行消息/图片/投票发送。">
      {notice && <p className={[styles.notice, notice.type === 'success' ? styles.success : styles.error].join(' ')}>{notice.text}</p>}

      <Card title="Telegram Bot 终端列表">
        <ListPageToolbar
          primaryAction={
            <button type="button" className={listPageStyles.primaryBtn} onClick={() => setCreateOpen(true)}>
              新建 Telegram Bot
            </button>
          }
        >
          <input
            type="text"
            className={listPageStyles.search}
            placeholder="按终端名称搜索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="button" className={listPageStyles.queryBtn} onClick={() => void load()}>
            查询
          </button>
          <button
            type="button"
            className={listPageStyles.linkBtn}
            onClick={() => {
              if (terminals.length > 0) setSendTerminalId(terminals[0].id)
              setSendOpen(true)
            }}
          >
            打开发送面板
          </button>
        </ListPageToolbar>

        {terminals.length === 0 && !loading ? (
          <EmptyState
            title="暂无 Telegram Bot 终端"
            description="先新建一个 Bot 终端，再执行发送测试。"
            action={
              <button type="button" className={listPageStyles.primaryBtn} onClick={() => setCreateOpen(true)}>
                新建 Telegram Bot
              </button>
            }
          />
        ) : (
          <Table columns={columns} dataSource={terminals} rowKey="id" loading={loading} />
        )}
      </Card>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="新建 Telegram Bot 终端"
        width={560}
        footer={
          <div className={styles.footer}>
            <button type="button" className={styles.ghostBtn} onClick={() => setCreateOpen(false)}>
              取消
            </button>
            <button type="button" className={styles.primaryBtn} onClick={() => void submitCreate()}>
              提交
            </button>
          </div>
        }
      >
        {createError && <p className={[styles.notice, styles.error].join(' ')}>{createError}</p>}
        <div className={styles.formGrid}>
          <span className={styles.label}>终端名称*</span>
          <input className={styles.input} value={createForm.name} onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))} />
          <span className={styles.label}>Bot Token*</span>
          <input className={styles.input} type="password" value={createForm.botToken} onChange={(e) => setCreateForm((p) => ({ ...p, botToken: e.target.value }))} placeholder="从 @BotFather 获取" />
          <span className={styles.label}>默认 Chat ID</span>
          <input className={styles.input} value={createForm.defaultChatId} onChange={(e) => setCreateForm((p) => ({ ...p, defaultChatId: e.target.value }))} placeholder="频道或群组 chat_id" />
          <span className={styles.label}>备注</span>
          <textarea className={styles.textarea} value={createForm.notes} onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))} />
        </div>
      </Dialog>

      <Dialog
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        title="Telegram 发送面板"
        width={680}
        footer={
          <div className={styles.footer}>
            <button type="button" className={styles.ghostBtn} onClick={() => setSendOpen(false)}>
              关闭
            </button>
            <button type="button" className={styles.primaryBtn} onClick={() => void submitSend()}>
              发送
            </button>
          </div>
        }
      >
        {sendError && <p className={[styles.notice, styles.error].join(' ')}>{sendError}</p>}
        <div className={styles.formGrid}>
          <span className={styles.label}>终端*</span>
          <select className={styles.select} value={sendTerminalId} onChange={(e) => setSendTerminalId(e.target.value)}>
            <option value="">请选择</option>
            {terminals.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <span className={styles.label}>发送类型</span>
          <select className={styles.select} value={actionType} onChange={(e) => setActionType(e.target.value as ActionType)}>
            <option value="text">文本消息</option>
            <option value="photo">图片消息</option>
            <option value="poll">投票</option>
          </select>
          <span className={styles.label}>chatId（可覆盖默认）</span>
          <input
            className={styles.input}
            value={sendForm.chatId}
            onChange={(e) => setSendForm((p) => ({ ...p, chatId: e.target.value }))}
            placeholder={selectedTerminal ? '留空则使用终端默认 chatId' : ''}
          />

          {actionType === 'text' && (
            <>
              <span className={styles.label}>文本内容</span>
              <textarea className={styles.textareaLarge} value={sendForm.text} onChange={(e) => setSendForm((p) => ({ ...p, text: e.target.value }))} />
            </>
          )}
          {actionType === 'photo' && (
            <>
              <span className={styles.label}>图片 URL</span>
              <input className={styles.input} value={sendForm.photoUrl} onChange={(e) => setSendForm((p) => ({ ...p, photoUrl: e.target.value }))} />
              <span className={styles.label}>图片说明</span>
              <textarea className={styles.textarea} value={sendForm.caption} onChange={(e) => setSendForm((p) => ({ ...p, caption: e.target.value }))} />
            </>
          )}
          {actionType === 'poll' && (
            <>
              <span className={styles.label}>投票问题</span>
              <input className={styles.input} value={sendForm.question} onChange={(e) => setSendForm((p) => ({ ...p, question: e.target.value }))} />
              <span className={styles.label}>投票选项（每行一个）</span>
              <textarea className={styles.textareaLarge} value={sendForm.optionsRaw} onChange={(e) => setSendForm((p) => ({ ...p, optionsRaw: e.target.value }))} />
            </>
          )}
        </div>
      </Dialog>
    </PageContainer>
  )
}
