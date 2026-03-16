/**
 * JWT 校验中间件：解析 Authorization Bearer，注入 req.user
 */
import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

export interface JwtPayload {
  userId: string
  account: string
  role: string
  tenantId?: string
}

export interface RequestWithUser extends Request {
  user?: JwtPayload
}

/** 必须认证，失败返回 401 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ code: 401, message: '未登录或登录已过期', data: null })
    return
  }
  try {
    const token = auth.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    ;(req as RequestWithUser).user = decoded
    next()
  } catch {
    res.status(401).json({ code: 401, message: '登录已过期，请重新登录', data: null })
  }
}

/** 可选认证：有 token 则解析并注入 req.user */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    next()
    return
  }
  try {
    const token = auth.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    ;(req as RequestWithUser).user = decoded
  } catch {
    // 忽略无效 token
  }
  next()
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}
