/**
 * 管理端 Token 校验中间件（fail-closed：未配置 ADMIN_TOKEN 或令牌不匹配一律 403）
 * 供知识图谱审核、兑换码生成等管理接口复用；密钥只存在于 .env（ADMIN_TOKEN），不写入代码
 */
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = String(req.headers['x-admin-token'] || '').trim();
  if (!config.adminToken || token !== config.adminToken) {
    res.status(403).json({ success: false, message: '管理员令牌无效' });
    return;
  }
  next();
}
