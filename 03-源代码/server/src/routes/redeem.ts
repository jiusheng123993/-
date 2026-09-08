/**
 * 兑换码路由（2026-08-23）
 * 用户：POST /api/redeem —— 登录态兑换码 → 发/续会员（active 顺延，否则从今天起算）
 * 管理：POST/GET /api/admin/redeem-codes —— 生成/查询兑换码（ADMIN_TOKEN）
 */
import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { validate } from '../middleware/validate.js';
import { redeemSchema, adminRedeemGenerateSchema } from '../schemas/index.js';
import { RedeemCodeRepository } from '../repositories/redeemCodeRepository.js';
import { recordAuditLog } from '../services/auditService.js';
import { pool } from '../db.js';

const router = Router();
const redeemRepository = new RedeemCodeRepository();

/** 生成兑换码：XHH-XXXX-XXXX-XXXX（大写字母数字，去掉易混淆字符 I/O/0/1） */
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const rand = Array.from(crypto.randomBytes(12))
    .map((b) => chars[b % chars.length])
    .join('');
  return `XHH-${rand.slice(0, 4)}-${rand.slice(4, 8)}-${rand.slice(8, 12)}`;
}

/**
 * 用户兑换（登录态）：校验码 → CAS 标记已用 → 发/续会员
 * 复用邀请奖励的会员逻辑：会员 active 则顺延 expires_at，否则从今天起算
 */
router.post('/redeem', authMiddleware, validate({ body: redeemSchema }), async (req: Request, res: Response) => {
  try {
    // 兑换码统一转大写比较/存储
    const code = String(req.body.code).trim().toUpperCase();
    const row = await redeemRepository.findByCode(code);
    if (!row || row.status !== 'unused') {
      res.status(404).json({ success: false, message: '兑换码不存在或已被使用' });
      return;
    }

    // CAS 标记使用（并发下仅第一个成功，防重复领取）
    const claimed = await redeemRepository.markUsed(row.id, req.userId!);
    if (!claimed) {
      res.status(409).json({ success: false, message: '兑换码已被使用' });
      return;
    }

    // 发/续会员
    const now = new Date();
    const membership = await pool.query(
      `SELECT id, expires_at, status FROM memberships WHERE user_id = $1`,
      [req.userId],
    );
    const current = membership.rows.length > 0 && membership.rows[0].status === 'active'
      ? (membership.rows[0].expires_at ? new Date(membership.rows[0].expires_at) : null)
      : null;
    const base = current && current.getTime() > now.getTime() ? current : now;
    const expiresAt = new Date(base.getTime() + row.days * 24 * 60 * 60 * 1000);

    if (membership.rows.length > 0) {
      await pool.query(
        `UPDATE memberships SET tier = 'member', status = 'active', expires_at = $1, updated_at = now() WHERE user_id = $2`,
        [expiresAt.toISOString(), req.userId],
      );
    } else {
      await pool.query(
        `INSERT INTO memberships (user_id, tier, status, expires_at, started_at)
         VALUES ($1, 'member', 'active', $2, now())`,
        [req.userId, expiresAt.toISOString()],
      );
    }

    // 资金审计（2026-09 审查 P1 修复：兑换码是付费权益发放动作，此前零审计）
    // 注意 id/days 来自 DB 行（可能为 bigint/数值类型），审计字段统一转字符串
    await recordAuditLog({
      userId: req.userId!,
      action: 'redeem-used',
      resourceType: 'redeem-code',
      resourceId: String(row.id),
      detail: { code_prefix: code.slice(0, 8), days: String(row.days), expires_at: expiresAt.toISOString() },
    });

    res.json({
      success: true,
      data: {
        message: `兑换成功！会员已${current ? '延长' : '开通'}至 ${expiresAt.toLocaleDateString('zh-CN')}`,
        days: row.days,
        expiresAt: expiresAt.toISOString(),
      },
    });
  } catch (err) {
    console.error('[Redeem] 兑换失败:', err);
    res.status(500).json({ success: false, message: '兑换失败' });
  }
});

/** 管理端：批量生成兑换码 */
router.post('/admin/redeem-codes', adminAuth, validate({ body: adminRedeemGenerateSchema }), async (req: Request, res: Response) => {
  try {
    const count = Math.min(Math.max(Number(req.body.count) || 1, 1), 100);
    const days = Math.min(Math.max(Number(req.body.days) || 1, 1), 36500);
    const codes: string[] = [];
    const seen = new Set<string>();
    while (codes.length < count) {
      const c = generateCode();
      if (!seen.has(c)) {
        seen.add(c);
        codes.push(c);
      }
    }
    await redeemRepository.batchInsert(codes, days, req.body.note);
    res.json({ success: true, data: { codes, count, days } });
  } catch (err) {
    console.error('[Redeem] 生成兑换码失败:', err);
    res.status(500).json({ success: false, message: '生成兑换码失败' });
  }
});

/** 管理端：兑换码列表（可按状态过滤） */
router.get('/admin/redeem-codes', adminAuth, async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string | undefined;
    const rows = await redeemRepository.list(status);
    res.json({ success: true, data: { list: rows } });
  } catch (err) {
    res.status(500).json({ success: false, message: '查询兑换码失败' });
  }
});

export default router;
