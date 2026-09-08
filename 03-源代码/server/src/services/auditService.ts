/**
 * 审计日志服务 - 记录用户敏感操作日志
 * 所有装备、解锁、生成等敏感操作必须通过此服务记录
 */
import { pool } from '../db.js';
import { sanitizeLog } from '../utils/sanitize.js';
import type { Request } from 'express';

export interface AuditEntry {
  userId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
  ipAddress?: string;
}

/**
 * 审计动作白名单（2026-09 全项目审查 P1 修复）
 * 原枚举为情侣消消乐遗留（equip/try-on 等）且全仓零调用，资金动作审计完全缺失；
 * 现替换为本项目的资金/权益关键动作，并在支付回调/退款/会员激活/兑换码处落调用点。
 */
const VALID_ACTIONS = [
  'payment-paid',
  'payment-refunded',
  'membership-activated',
  'memoir-created',
  'redeem-used',
  'referral-reward',
  'login',
  'logout',
] as const;

type AuditAction = (typeof VALID_ACTIONS)[number];

const VALID_RESOURCE_TYPES = [
  'payment-order',
  'membership',
  'redeem-code',
  'memoir',
  'referral',
  'user',
  'token',
] as const;

type AuditResourceType = (typeof VALID_RESOURCE_TYPES)[number];

/**
 * 记录操作审计日志
 * 所有敏感操作（装备、解锁、生成等）必须调用此函数
 */
export async function recordAuditLog(entry: AuditEntry): Promise<void> {
  const safeAction = sanitizeLog(entry.action);
  const safeResourceType = sanitizeLog(entry.resourceType);
  const safeResourceId = entry.resourceId ? sanitizeLog(entry.resourceId) : null;
  const safeIp = entry.ipAddress ? sanitizeLog(entry.ipAddress) : null;

  try {
    await pool.query(
      `INSERT INTO audit_log (user_id, action, resource_type, resource_id, detail, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        entry.userId,
        safeAction,
        safeResourceType,
        safeResourceId,
        entry.detail ? JSON.stringify(entry.detail) : '{}',
        safeIp,
      ]
    );
  } catch (error) {
    console.error('[Audit] Failed to record audit log:', error instanceof Error ? error.message : 'Unknown error');
    // 审计日志失败不应影响主流程
  }
}

/**
 * 从请求中提取客户端 IP
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}
