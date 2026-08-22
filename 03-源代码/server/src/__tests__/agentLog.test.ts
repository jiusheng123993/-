/**
 * Agent 对话成本日志单测（AI 算账，2026-08-23）
 * 覆盖：正常写入参数、错误摘要截断、写入失败静默（不影响对话主流程）
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockPool } = vi.hoisted(() => {
  const pool = { query: vi.fn() };
  return { mockPool: pool };
});

vi.mock('../db.js', () => ({ pool: mockPool }));

import { recordConversationLog } from '../services/agentService.js';

beforeEach(() => {
  mockPool.query.mockReset();
});

describe('recordConversationLog - 对话成本日志', () => {
  it('正常写入：参数完整（工具链/意图/token/耗时/状态）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    await recordConversationLog({
      userId: 'user-1',
      petId: 'pet-1',
      intent: 'symptom',
      toolChain: ['check_symptom', 'search_hospital'],
      iterations: 3,
      promptTokens: 1200,
      completionTokens: 300,
      durationMs: 5000,
      status: 'ok',
    });

    const [sql, params] = mockPool.query.mock.calls[0];
    expect(sql).toContain('INSERT INTO agent_conversation_logs');
    expect(params[0]).toBe('user-1');
    expect(params[1]).toBe('pet-1');
    expect(params[2]).toBe('symptom');
    expect(params[3]).toEqual(['check_symptom', 'search_hospital']);
    expect(params[4]).toBe(3);
    expect(params[5]).toBe(1200);
    expect(params[6]).toBe(300);
    expect(params[7]).toBe(5000);
    expect(params[8]).toBe('ok');
    expect(params[9]).toBeNull();
  });

  it('无 petId / 无 intent / 无错误 → 对应列写 null', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    await recordConversationLog({
      userId: 'user-1',
      toolChain: [],
      iterations: 1,
      promptTokens: 0,
      completionTokens: 0,
      durationMs: 10,
      status: 'ok',
    });

    const [, params] = mockPool.query.mock.calls[0];
    expect(params[1]).toBeNull();
    expect(params[2]).toBeNull();
    expect(params[9]).toBeNull();
  });

  it('错误摘要截断到 500 字符（防日志膨胀）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 1 });

    await recordConversationLog({
      userId: 'user-1',
      toolChain: [],
      iterations: 1,
      promptTokens: 0,
      completionTokens: 0,
      durationMs: 1,
      status: 'error',
      error: 'x'.repeat(600),
    });

    const [, params] = mockPool.query.mock.calls[0];
    expect(params[9]).toHaveLength(500);
  });

  it('写入失败静默（不抛出，不阻塞对话主流程）', async () => {
    mockPool.query.mockRejectedValueOnce(new Error('db down'));

    await expect(
      recordConversationLog({
        userId: 'user-1',
        toolChain: [],
        iterations: 0,
        promptTokens: 0,
        completionTokens: 0,
        durationMs: 1,
        status: 'ok',
      })
    ).resolves.toBeUndefined();
  });
});
