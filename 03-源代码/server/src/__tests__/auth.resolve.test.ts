/**
 * 轻量身份解析中间件单测（2026-08-23 限流修复）
 * resolveUserId 不拒绝请求：有效 token 设 userId；缺失/无效 token 仅留空并放行
 */
import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';

vi.mock('../config.js', () => ({
  config: { jwtSecret: 'test-jwt-secret-123456789012345678901234' },
}));

import { resolveUserId } from '../middleware/auth.js';
import type { Request, Response, NextFunction } from 'express';

function makeReq(auth?: string): Request {
  return { headers: auth ? { authorization: auth } : {} } as unknown as Request;
}

function makeRes(): Response {
  return { status: vi.fn().mockReturnThis(), json: vi.fn() } as unknown as Response;
}

describe('resolveUserId - 限流身份解析（不拒绝请求）', () => {
  it('有效 token → 设置 req.userId 并放行', () => {
    const token = jwt.sign({ userId: 'user-1' }, 'test-jwt-secret-123456789012345678901234');
    const req = makeReq(`Bearer ${token}`);
    const next = vi.fn() as unknown as NextFunction;

    resolveUserId(req, makeRes(), next);

    expect(req.userId).toBe('user-1');
    expect(next).toHaveBeenCalled();
  });

  it('无 token → 不设置 userId，放行（不 401）', () => {
    const req = makeReq();
    const next = vi.fn() as unknown as NextFunction;

    resolveUserId(req, makeRes(), next);

    expect(req.userId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('无效 token → 不设置 userId，放行（不 401）', () => {
    const req = makeReq('Bearer invalid.token.here');
    const next = vi.fn() as unknown as NextFunction;
    const res = makeRes();

    resolveUserId(req, res, next);

    expect(req.userId).toBeUndefined();
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
