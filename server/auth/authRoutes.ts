/**
 * 认证路由：登录、当前用户
 */
import { Router, type Request, type Response } from 'express'
import { dbGetUserByAccount, dbVerifyPassword } from './authDb'
import { signToken, requireAuth, type RequestWithUser, type JwtPayload } from './jwtMiddleware'

const router = Router()

function apiMeta() {
  return { requestId: '', timestamp: new Date().toISOString() }
}

/** POST /api/auth/login */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { account, password } = req.body as { account?: string; password?: string }
    if (!account?.trim() || !password) {
      res.status(400).json({
        code: 400,
        message: '请输入账号和密码',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    const user = await dbGetUserByAccount(account.trim())
    if (!user || !user.isActive) {
      res.status(401).json({
        code: 401,
        message: '账号或密码错误',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    const ok = await dbVerifyPassword(password, user.passwordHash)
    if (!ok) {
      res.status(401).json({
        code: 401,
        message: '账号或密码错误',
        data: null,
        meta: apiMeta(),
      })
      return
    }
    const token = signToken({
      userId: user.id,
      account: user.account,
      role: user.role,
      tenantId: user.tenantId ?? undefined,
    } as JwtPayload)
    res.json({
      code: 0,
      message: 'success',
      data: { token, user: { id: user.id, account: user.account, name: user.name, role: user.role, tenantId: user.tenantId } },
      meta: apiMeta(),
    })
  } catch (e) {
    res.status(500).json({
      code: 500,
      message: e instanceof Error ? e.message : '登录失败',
      data: null,
      meta: apiMeta(),
    })
  }
})

/** GET /api/auth/me（需认证） */
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  const user = (req as RequestWithUser).user
  if (!user) {
    res.status(401).json({ code: 401, message: '未登录', data: null, meta: apiMeta() })
    return
  }
  res.json({
    code: 0,
    message: 'success',
    data: { userId: user.userId, account: user.account, role: user.role, tenantId: user.tenantId },
    meta: apiMeta(),
  })
})

export default router
