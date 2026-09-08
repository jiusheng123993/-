/**
 * memoryService.getPetMomentsSummary 单测（回忆录"真实回忆"素材源 C）
 * 覆盖：
 *   1. 有时光线记录：按统一格式拼装（type 标注 + 发生日期）
 *   2. 无记录：返回空串（调用方据此判定"无记忆"）
 *   3. SQL 安全边界：只读 pet_moments、user/pet 归属过滤、limit 参数化、空描述过滤
 *   4. 查询失败：吞错返回空串（与记忆引擎"失败不阻断分镜"约定一致）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPool } = vi.hoisted(() => {
  const pool = { query: vi.fn().mockResolvedValue({ rows: [], rowCount: 0 }) };
  return { mockPool: pool };
});

vi.mock('../db.js', () => ({ pool: mockPool }));

import { getPetMomentsSummary } from './memoryService.js';

describe('memoryService.getPetMomentsSummary（时光线素材源）', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('有记录时按「[时光·type] 描述（日期）」格式拼装', async () => {
    mockPool.query.mockResolvedValueOnce({
      rows: [
        { type: 'memory', description: '到家的第一天，它缩在纸箱里只露出半张脸。', day: '2020-03-14' },
        { type: 'milestone', description: '第一次自己跳上窗台晒太阳。', day: '2020-04-02' },
      ],
      rowCount: 2,
    });
    const summary = await getPetMomentsSummary('u1', 'p1', 15);
    expect(summary).toContain('- [时光·memory] 到家的第一天，它缩在纸箱里只露出半张脸。（2020-03-14）');
    expect(summary).toContain('- [时光·milestone] 第一次自己跳上窗台晒太阳。（2020-04-02）');
    // 两行以换行拼接，供 memoirProcessor 直接并入 memorySummary
    expect(summary.split('\n').length).toBe(2);
  });

  it('无记录时返回空串', async () => {
    const summary = await getPetMomentsSummary('u1', 'p1', 15);
    expect(summary).toBe('');
  });

  it('SQL：只读 pet_moments、user/pet 归属过滤、limit 参数化、过滤空描述', async () => {
    await getPetMomentsSummary('user-a', 'pet-b', 12);
    const [sql, params] = mockPool.query.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain('FROM pet_moments');
    expect(sql).toContain('user_id = $1');
    expect(sql).toContain('pet_id = $2');
    expect(sql).toContain("content->>'description'");
    expect(sql).toContain("jsonb_typeof(content) = 'object'"); // 防 JSON 标量内容触发 ->> 报错
    expect(sql).toContain('NULLIF'); // 空描述（含纯空白）不进素材
    expect(sql).toContain('ORDER BY');
    expect(params).toEqual(['user-a', 'pet-b', 12]);
  });

  it('limit 越界收敛到 1-50（防误传大值全表拉取）', async () => {
    await getPetMomentsSummary('u1', 'p1', 999);
    const [, params] = mockPool.query.mock.calls[0] as [string, unknown[]];
    expect(params[2]).toBe(50);
    await getPetMomentsSummary('u1', 'p1', 0);
    const [, params2] = mockPool.query.mock.calls[1] as [string, unknown[]];
    expect(params2[2]).toBe(1);
  });

  it('查询失败时吞错返回空串（不阻断分镜生成）', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('db down'));
    const summary = await getPetMomentsSummary('u1', 'p1', 15);
    expect(summary).toBe('');
  });
});
