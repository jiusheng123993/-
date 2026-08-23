/**
 * 记忆闸门召回单测（设计方案 6.3）
 * 验证 recallHealthMemories 的 SQL 闸门：health/medical 分类 + active + importance≥5 + 近90天 + 关键词 ILIKE
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPool } = vi.hoisted(() => {
  const pool = { query: vi.fn() };
  return { mockPool: pool };
});

vi.mock('../db.js', () => ({ pool: mockPool }));

import { recallHealthMemories } from '../services/memoryService.js';

beforeEach(() => {
  mockPool.query.mockReset();
});

describe('recallHealthMemories - 记忆闸门', () => {
  it('只查询 health/medical + active + importance≥5 + 近90天，关键词转 ILIKE ANY', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { content: '上次呕吐，3天后恢复', importance: 7, category: 'medical', created_at: '2026-07-01T00:00:00Z' },
        { content: '近3天食欲下降', importance: 6, category: 'health', created_at: '2026-08-01T00:00:00Z' },
      ],
      rowCount: 2,
    });

    const rows = await recallHealthMemories('user-1', 'pet-1', ['呕吐', '腹泻'], 5);

    expect(rows).toHaveLength(2);
    const [sql, params] = mockPool.query.mock.calls[0];
    // 闸门条件齐全
    expect(sql).toContain("category IN ('health', 'medical')");
    expect(sql).toContain("status = 'active'");
    expect(sql).toContain('importance >= 5');
    expect(sql).toContain("INTERVAL '90 days'");
    expect(sql).toContain('content ILIKE ANY');
    // 关键词模糊化 + 数量与 limit 正确
    expect(params[2]).toEqual(['%呕吐%', '%腹泻%']);
    expect(params[3]).toBe(5);
  });

  it('关键词为空 → 直接返回空数组，不发起查询', async () => {
    const rows = await recallHealthMemories('user-1', 'pet-1', []);
    expect(rows).toEqual([]);
    expect(mockPool.query).not.toHaveBeenCalled();
  });

  it('查询异常 → 降级返回空数组（不阻塞主流程）', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('db down'));
    const rows = await recallHealthMemories('user-1', 'pet-1', ['呕吐']);
    expect(rows).toEqual([]);
  });

  it('ILIKE 通配符转义：%/_ 不参与宽匹配（审查项修复）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
    await recallHealthMemories('user-1', 'pet-1', ['100%', 'a_b']);
    const [, params] = mockPool.query.mock.calls[0];
    // 用户可控关键词含 %/_ 时转义为 \% \_（PostgreSQL LIKE 默认转义符为反斜杠）
    expect(params[2]).toEqual(['%100\\%%', '%a\\_b%']);
  });
});
