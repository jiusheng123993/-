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
