/**
 * 邀请路由纯函数测试
 * 覆盖：会员到期时间顺延逻辑（奖励发放核心计算）
 */
import { describe, it, expect } from 'vitest';
import { computeNewExpiresAt } from './invites.js';

describe('computeNewExpiresAt', () => {
  it('会员未到期时应在原到期时间上顺延', () => {
    const now = new Date('2026-08-06T00:00:00Z');
    const current = new Date('2026-08-20T00:00:00Z');
    const result = computeNewExpiresAt(current, now, 7);
    expect(result.toISOString()).toBe('2026-08-27T00:00:00.000Z');
  });

  it('会员已过期或不存在时从当前时间起算', () => {
    const now = new Date('2026-08-06T00:00:00Z');
    const result = computeNewExpiresAt(null, now, 7);
    expect(result.toISOString()).toBe('2026-08-13T00:00:00.000Z');
  });
});