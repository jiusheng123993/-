/**
 * 运营统计端点（R2 付费验证实验的数据链路，立项书 v0.2 判据支撑）
 *
 * 立项判据：验证期「注册 → 首单付费」转化率 ≥1%（口径见立项书 §九）。
 * 此前转化数据散在 users/payment_orders 两张表里没有可看的出口，R2 期运营
 * 无法判断实验是否达标。本端点提供只读聚合：
 *   GET /api/admin/stats?days=30   （adminAuth 保护，默认统计近 30 天）
 *
 * 全部为只读 COUNT 查询，无个人敏感字段输出（只输出计数与比率）。
 */
import { Router } from 'express';
import { pool } from '../db.js';
import { adminAuth } from '../middleware/adminAuth.js';

const router = Router();

/** 单条只读聚合的安全封装：失败返回 null，不阻塞其他指标 */
async function scalar(query: string, params: unknown[] = []): Promise<number | null> {
  try {
    const result = await pool.query(query, params);
    const row = result.rows[0] as Record<string, unknown> | undefined;
    if (!row) return null;
    const value = Object.values(row)[0];
    return value === null || value === undefined ? null : Number(value);
  } catch (err) {
    console.error('[AdminStats] 聚合查询失败:', err instanceof Error ? err.message : err);
    return null;
  }
}

router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    // 统计窗口天数（默认 30，上限 365，防全表扫描放大）
    const days = Math.min(Math.max(Number(req.query.days) || 30, 1), 365);

    // 1. 用户与转化漏斗（立项判据：注册 → 首单付费 ≥1%）
    const totalUsers = await scalar('SELECT COUNT(*)::int FROM users');
    const newUsersInWindow = await scalar(
      'SELECT COUNT(*)::int FROM users WHERE created_at >= NOW() - ($1 || \' days\')::INTERVAL',
      [String(days)],
    );
    const payingUsers = await scalar(
      "SELECT COUNT(DISTINCT user_id)::int FROM payment_orders WHERE status IN ('paid', 'refunded')",
    );
    const paidOrders = await scalar(
      "SELECT COUNT(*)::int FROM payment_orders WHERE status IN ('paid', 'refunded')",
    );
    // 首单付费用户：在 paid 订单用户中，注册时间与首单时间的口径由 SQL 直接算，简化=全部付费用户
    // 转化率（分母=总注册数，口径对齐立项书 §九「注册→首单」）
    const conversionRate =
      totalUsers && payingUsers !== null ? Number(((payingUsers / totalUsers) * 100).toFixed(2)) : null;

    // 2. 会员规模（R2 判据的中间指标）
    const activeMembers = await scalar(
      "SELECT COUNT(*)::int FROM memberships WHERE status = 'active' AND expires_at > NOW()",
    );

    // 3. 回忆录健康度（主验证付费点的履约质量）
    const memoirsTotal = await scalar('SELECT COUNT(*)::int FROM pet_memoir_records');
    const memoirsCompleted = await scalar(
      "SELECT COUNT(*)::int FROM pet_memoir_records WHERE status = 'completed'",
    );
    const memoirsFailed = await scalar(
      "SELECT COUNT(*)::int FROM pet_memoir_records WHERE status = 'failed'",
    );
    const memoirsAwaiting = await scalar(
      "SELECT COUNT(*)::int FROM pet_memoir_records WHERE status = 'pending' AND awaiting_confirmation = true",
    );
    const refundsCount = await scalar(
      "SELECT COUNT(*)::int FROM payment_orders WHERE status = 'refunded'",
    );

    res.json({
      success: true,
      data: {
        window_days: days,
        funnel: {
          total_users: totalUsers,
          new_users: newUsersInWindow,
          paying_users: payingUsers,
          paid_orders: paidOrders,
          conversion_rate_percent: conversionRate,
          target_percent: 1, // 立项书 v0.2 §九 R1 判据：注册→首单 ≥1%
        },
        membership: { active_members: activeMembers },
        memoir: {
          total: memoirsTotal,
          completed: memoirsCompleted,
          failed: memoirsFailed,
          awaiting_confirmation: memoirsAwaiting,
          refunded_orders: refundsCount,
          success_rate_percent:
            memoirsTotal && memoirsCompleted !== null
              ? Number(((memoirsCompleted / memoirsTotal) * 100).toFixed(1))
              : null,
        },
        generated_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('[AdminStats] 统计失败:', err instanceof Error ? err.message : err);
    res.status(500).json({ success: false, message: '统计失败' });
  }
});

export default router;
