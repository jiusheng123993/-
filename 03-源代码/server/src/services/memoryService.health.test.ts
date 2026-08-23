/**
 * memoryService 健康记忆/标签功能单测（F1/F4 审查修复回归）
 * 覆盖：
 *   1. recordHealthMemory：evidence 必须是数组（TEXT[] 列，B2 回归防坑）
 *   2. recordHealthMemory：tags/level 正确（health_heal + core）
 *   3. recordHealthMemory：当天幂等（key 含日期）
 *   4. getMemoriesByTags：有/无 tags 分支的 SQL 占位符正确
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPool } = vi.hoisted(() => {
  const pool = { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }) };
  return { mockPool: pool };
});

vi.mock('../db.js', () => ({ pool: mockPool }));

import { recordHealthMemory, getMemoriesByTags } from './memoryService.js';

describe('memoryService 健康记忆（F1/F4）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordHealthMemory', () => {
    it('evidence 必须是数组（TEXT[] 列；传字符串会 malformed array literal）', async () => {
      await recordHealthMemory({
        userId: 'u1',
        petId: 'p1',
        category: 'health',
        content: '2026-08-22 打卡异常：食欲差',
        importance: 8,
        evidence: 'checkin:abc',
      });
      const [sql, params] = mockPool.query.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain('INSERT INTO agent_memories');
      // evidence 参数（第 7 个）必须是数组
      expect(params[6]).toEqual(['checkin:abc']);
    });

    it('tags 正确（medical → health_heal）且 level=core（SQL 字面量）', async () => {
      await recordHealthMemory({
        userId: 'u1',
        petId: 'p1',
        category: 'medical',
        content: '2026-08-22 症状初筛：呕吐',
        importance: 9,
        evidence: 'symptom:xyz',
      });
      const [sql, params] = mockPool.query.mock.calls[0] as [string, unknown[]];
      expect(params[8]).toEqual(['health_heal']); // tags 参数（$9）
      expect(sql).toContain("'core'"); // level 为 SQL 字面量
      expect(sql).toContain('tags, level');
    });

    it('当天幂等：key 含当天日期（同类事件当天一条）', async () => {
      await recordHealthMemory({
        userId: 'u1',
        petId: 'p1',
        category: 'health',
        content: 'x',
      });
      const [sql, params] = mockPool.query.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain('ON CONFLICT (user_id, pet_id, key)');
      const today = new Date().toISOString().slice(0, 10);
      expect(params[3]).toBe(`health_health_${today}`);
    });
  });

  describe('getMemoriesByTags', () => {
    it('无 tags：不带 $4 占位符', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      await getMemoriesByTags({ userId: 'u1', petId: 'p1' });
      const [sql, params] = mockPool.query.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain("level = 'core'");
      expect(sql).not.toContain('tags &&');
      expect(params).toEqual(['u1', 'p1', 20]);
    });

    it('有 tags：带 $4 数组占位符且按标签筛选', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [
          { content: '第一次跳上窗台', importance: 8, tags: ['milestone'], created_at: '2026-08-01' },
        ],
        rowCount: 1,
      });
      const text = await getMemoriesByTags({ userId: 'u1', petId: 'p1', tags: ['milestone'] });
      const [sql, params] = mockPool.query.mock.calls[0] as [string, unknown[]];
      expect(sql).toContain('tags && $4::text[]');
      expect(params[3]).toEqual(['milestone']);
      expect(text).toContain('第一次跳上窗台');
      expect(text).toContain('[milestone]');
    });

    it('无核心记忆返回提示文本', async () => {
      mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
      const text = await getMemoriesByTags({ userId: 'u1', petId: 'p1', tags: ['farewell'] });
      expect(text).toContain('暂无核心记忆');
    });
  });
});
