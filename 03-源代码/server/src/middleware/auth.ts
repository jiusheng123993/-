/**
 * 认证中间件 - JWT token 验证
 * 验证接口请求中的 Bearer token，解析用户身份注入到请求对象
 */
import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

/** JWT token 解码后的负载结构 */
export interface JwtPayload {
  userId: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      tokenJti?: string;
    }
  }
}

/**
 * 认证中间件 - 验证 JWT token 的有效性
 * 所有需要登录的接口必须使用此中间件
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: '未登录，请先登录' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.userId = payload.userId;
    req.tokenJti = payload.jti;
    next();
  } catch {
    res.status(401).json({ success: false, message: '登录已过期，请重新登录' });
  }
}

/**
 * 轻量身份解析中间件（供限流 key 使用，不拒绝请求，2026-08-23）
 * 与 authMiddleware 相同的 JWT 解析，但 token 缺失/无效时**不拦截**，仅不设置 req.userId。
 * 用途：挂在全局限流（globalLimiter）之前，让限流 key 能按真实用户区分，
 *       修复"所有用户共享一个 ip:anonymous 桶导致集体 429"的生产问题。
 */
export function resolveUserId(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(authHeader.slice(7), config.jwtSecret) as JwtPayload;
      req.userId = payload.userId;
      req.tokenJti = payload.jti;
    } catch {
      // token 无效/过期：不拒绝请求，留空（限流 key 落到 anonymous 桶）
    }
  }
  next();
}
