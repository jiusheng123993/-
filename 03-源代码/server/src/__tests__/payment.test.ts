/**
 * 支付模块集成测试
 *
 * 覆盖：
 *   1. POST /api/payment/memoir/order    - 创建回忆录订单（会员配额内/超出/非会员/纪念Vlog）
 *   2. POST /api/payment/membership/order - 创建会员订阅订单
 *   3. POST /api/payment/wechat/notify    - 微信回调（mock 模式端到端）
 *   4. GET  /api/payment/orders/:orderId  - 查询订单（归属校验）
 *
 * Mock 策略：
 *   - 数据库：vi.mock('../db.js')
 *   - 配置：vi.mock('../config.js')，开启 mock 模式
 *   - 认证：vi.mock('../middleware/auth.js')，注入固定 userId
 *   - WebSocket：vi.mock('../services/websocketService.js')
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

const { mockPool } = vi.hoisted(() => {
  const pool = { query: vi.fn() };
  return { mockPool: pool };
});

vi.mock('../db.js', () => ({ pool: mockPool }));

vi.mock('../config.js', () => ({
  config: {
    jwtSecret: 'test-jwt-secret',
    port: 3000,
    databaseUrl: 'postgresql://localhost/test',
    ai: { apiKey: '', baseUrl: '', model: '' },
    bailian: { apiKey: '', baseUrl: '', visionModel: '', asrModel: '' },
    seedream: { apiKey: '' },
    seedance: { apiKey: '', model: '' },
    meshy: { apiKey: '', baseUrl: '' },
    moderate: { apiKey: '' },
    wechat: { appId: 'test-appid', secret: '' },
    wechatPay: {
      mock: true,
      mchId: 'test-mch',
      apiV3Key: '',
      privateKey: '',
      certSerialNo: '',
      platformCertSerialNo: '',
      platformCert: '',
      notifyUrl: '',
    },
    uploadDir: './uploads',
    publicBaseUrl: '',
  },
  // 2026-09-09 三档定价体系常量（config 真实导出，测试锁同一份值）
  MEMOIR_TIER_CONFIG: {
    light: { minPhotos: 1, maxPhotos: 3, minDuration: 5, maxDuration: 30, defaultDuration: 20 },
    standard: { minPhotos: 5, maxPhotos: 7, minDuration: 40, maxDuration: 50, defaultDuration: 45 },
    full: { minPhotos: 8, maxPhotos: 15, minDuration: 60, maxDuration: 90, defaultDuration: 75 },
  },
  MEMOIR_TIER_LABELS: { light: '轻纪念', standard: '标准回忆录', full: '完整回忆录' },
  MEMOIR_TIER_PRICES: {
    light: { member: 1890, free: 2590 },
    standard: { member: 4500, free: 5900 },
    full: { member: 7900, free: 9900 },
  },
}));

vi.mock('../middleware/auth.js', () => ({
  authMiddleware: (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    _req.userId = 'test-user-id';
    next();
  },
}));

const { mockSendToUser } = vi.hoisted(() => ({
  mockSendToUser: vi.fn(),
}));

vi.mock('../services/websocketService.js', () => ({
  sendToUser: mockSendToUser,
  broadcastToChannel: vi.fn(),
  initWebSocket: vi.fn(),
}));

import paymentRouter from '../routes/payment.js';

function createApp() {
  const app = express();
  // 与 index.ts 保持一致：通过 verify 钩子捕获微信回调接口的 rawBody
  // 微信回调依赖原始请求体验签，否则 mock 模式下 JSON.parse('') 失败
  app.use(express.json({
    limit: '10mb',
    verify: (req, _res, buf) => {
      const expressReq = req as unknown as { originalUrl?: string; rawBody?: string };
      if (expressReq.originalUrl?.endsWith('/api/payment/wechat/notify')) {
        expressReq.rawBody = buf.toString('utf8');
      }
    },
  }));
  app.use('/api/payment', paymentRouter);
  return app;
}

/** 生成指定数量的有效照片 URL
 * 2026-09 审查 SSRF 白名单修复后：source_photos 仅接受本站 /uploads/ 路径或本站域名 URL，
 * 测试夹具同步改为本站相对路径（与真实前端上传后的取值一致） */
function makePhotos(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `/uploads/pet-photos/test-user/pet-1/photo${i + 1}.jpg`);
}

const mockUserRow = {
  id: 'test-user-id',
  openid: 'test-openid-001',
  nickname: null,
  avatar_url: null,
  created_at: '2026-07-01T00:00:00.000Z',
  last_active: null,
};

const mockMembershipRow = {
  tier: 'member',
  status: 'active',
  expires_at: null,
};

/** Mock 订单行（pending 状态，回忆录类型） */
const mockPendingMemoirOrder = {
  id: 'order-001',
  user_id: 'test-user-id',
  plan: 'memoir_daily',
  amount: 990,
  status: 'pending',
  channel: 'wechat',
  product_type: 'memoir',
  product_metadata: {
    pet_id: 'pet-001',
    memoir_type: 'daily',
    source_photos: makePhotos(2),
    source_text: null,
    music_style: 'warm',
    duration: 15,
    style_preset: null,
    tier: 'free' as const,
  },
  transaction_id: null,
  paid_at: null,
  created_at: '2026-07-31T00:00:00.000Z',
  updated_at: '2026-07-31T00:00:00.000Z',
};

/** Mock 订单行（pending 状态，会员订阅） */
const mockPendingMembershipOrder = {
  id: 'order-002',
  user_id: 'test-user-id',
  plan: 'monthly',
  amount: 990,
  status: 'pending',
  channel: 'wechat',
  product_type: 'membership',
  product_metadata: null,
  transaction_id: null,
  paid_at: null,
  created_at: '2026-07-31T00:00:00.000Z',
  updated_at: '2026-07-31T00:00:00.000Z',
};

const mockMemoirRecord = {
  id: 'memoir-task-001',
  user_id: 'test-user-id',
  pet_id: 'pet-001',
  memoir_type: 'daily',
  status: 'pending',
  source_photos: makePhotos(2),
  source_text: null,
  narrative_structure: { music_style: 'warm', duration: 15, style_preset: null },
  video_url: null,
  preview_url: null,
  cost_credits: null,
  payment_id: null,
  error_message: null,
  created_at: '2026-07-31T00:00:00.000Z',
  completed_at: null,
};

beforeEach(() => {
  mockPool.query.mockReset();
  mockSendToUser.mockReset();
});

// ===== 1. POST /api/payment/memoir/order - 创建回忆录订单 =====
describe('POST /api/payment/memoir/order - 创建回忆录订单', () => {
  it('会员轻纪念档：创建支付订单（2026-09-09 免费配额已废除），返回会员价 18.9 元', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                     // no active task
      .mockResolvedValueOnce({ rows: [mockMembershipRow], rowCount: 1 })    // tier: member
      .mockResolvedValueOnce({ rows: [{ id: 'test-user-id', openid: 'test-openid-001' }], rowCount: 1 }) // user
      .mockResolvedValueOnce({ rows: [mockPendingMemoirOrder], rowCount: 1 }); // createMemoirOrder

    const res = await request(createApp())
      .post('/api/payment/memoir/order')
      .send({
        pet_id: 'pet-001',
        memoir_type: 'daily',
        source_photos: makePhotos(2),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.need_payment).toBe(true);
    expect(res.body.data.amount).toBe(1890);
    expect(res.body.data.payment).toBeDefined();
    expect(res.body.data.payment.prepay_id).toContain('mock_prepay_');
    expect(res.body.data.payment.paySign).toBe('mock_signature');
  });

  it('非会员轻纪念档：创建支付订单，返回非会员价 25.9 元', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                     // no active task
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                     // tier: free (无会员记录)
      .mockResolvedValueOnce({ rows: [{ id: 'test-user-id', openid: 'test-openid-001' }], rowCount: 1 }) // user
      .mockResolvedValueOnce({ rows: [mockPendingMemoirOrder], rowCount: 1 }); // createMemoirOrder

    const res = await request(createApp())
      .post('/api/payment/memoir/order')
      .send({
        pet_id: 'pet-001',
        memoir_type: 'daily',
        source_photos: makePhotos(2),
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.need_payment).toBe(true);
    expect(res.body.data.amount).toBe(2590);
    expect(res.body.data.payment).toBeDefined();
    expect(res.body.data.payment.prepay_id).toContain('mock_prepay_');
    expect(res.body.data.payment.paySign).toBe('mock_signature');
  });

  it('非会员标准回忆录档（tier=standard）：下单成功且 plan=memoir_standard、落库档位 standard（审查 P0 回归锁）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                     // no active task
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                     // tier: free
      .mockResolvedValueOnce({ rows: [{ id: 'test-user-id', openid: 'test-openid-001' }], rowCount: 1 }) // user
      .mockResolvedValueOnce({ rows: [mockPendingMemoirOrder], rowCount: 1 }); // createMemoirOrder

    const res = await request(createApp())
      .post('/api/payment/memoir/order')
      .send({
        pet_id: 'pet-001',
        memoir_type: 'daily',
        tier: 'standard',
        source_photos: makePhotos(5),
        selected_moment_ids: ['3f2b8a1e-1c2d-4e5f-8a9b-0c1d2e3f4a5b'],
      });

    expect(res.status).toBe(201);
    expect(res.body.data.need_payment).toBe(true);
    expect(res.body.data.amount).toBe(5900);
    // INSERT 参数（BaseRepository.insert 按 keys 顺序展开）：index 2=plan、7=product_metadata
    const insertCall = mockPool.query.mock.calls.find((c: unknown[][]) =>
      String(c[0]).includes('INSERT INTO payment_orders'),
    );
    expect(insertCall).toBeDefined();
    const values = insertCall![1] as unknown[];
    expect(values[2]).toBe('memoir_standard');            // plan 落库（迁移 035 CHECK 白名单内）
    expect(values[4]).toBe('pending');
    const meta = values[7] as Record<string, unknown>;
    expect(meta.tier).toBe('standard');                   // 档位透传（回调按此建任务）
    expect(meta.selected_moment_ids).toEqual(['3f2b8a1e-1c2d-4e5f-8a9b-0c1d2e3f4a5b']); // G2 勾选透传
  });

  it('非会员完整回忆录档：返回 99 元订单', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                     // no active task
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                     // tier: free
      .mockResolvedValueOnce({ rows: [{ id: 'test-user-id', openid: 'test-openid-001' }], rowCount: 1 }) // user
      .mockResolvedValueOnce({ rows: [mockPendingMemoirOrder], rowCount: 1 }); // createMemoirOrder

    const res = await request(createApp())
      .post('/api/payment/memoir/order')
      .send({
        pet_id: 'pet-001',
        memoir_type: 'memorial',
        source_photos: makePhotos(10),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.need_payment).toBe(true);
    expect(res.body.data.amount).toBe(9900);
  });

  it('会员完整回忆录档：返回会员价 79 元订单（原纪念Vlog 99 元档，2026-09-09 三档改价）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })   // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                     // no active task
      .mockResolvedValueOnce({ rows: [mockMembershipRow], rowCount: 1 })    // tier: member
      .mockResolvedValueOnce({ rows: [{ id: 'test-user-id', openid: 'test-openid-001' }], rowCount: 1 }) // user
      .mockResolvedValueOnce({ rows: [mockPendingMemoirOrder], rowCount: 1 }); // createMemoirOrder

    const res = await request(createApp())
      .post('/api/payment/memoir/order')
      .send({
        pet_id: 'pet-001',
        memoir_type: 'memorial',
        source_photos: makePhotos(10),
      });

    expect(res.status).toBe(201);
    expect(res.body.data.need_payment).toBe(true);
    expect(res.body.data.amount).toBe(7900);
  });

  it('宠物不属于当前用户返回 404', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // ownership fails

    const res = await request(createApp())
      .post('/api/payment/memoir/order')
      .send({
        pet_id: 'other-pet',
        memoir_type: 'daily',
        source_photos: makePhotos(2),
      });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('宠物不存在');
  });

  it('已有进行中任务返回 409', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })  // ownership OK
      .mockResolvedValueOnce({ rows: [mockMemoirRecord], rowCount: 1 });   // active task exists

    const res = await request(createApp())
      .post('/api/payment/memoir/order')
      .send({
        pet_id: 'pet-001',
        memoir_type: 'daily',
        source_photos: makePhotos(2),
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('CONCURRENT_TASK');
  });

  it('缺少 pet_id 返回 400', async () => {
    const res = await request(createApp())
      .post('/api/payment/memoir/order')
      .send({
        memoir_type: 'daily',
        source_photos: makePhotos(2),
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ===== 2. POST /api/payment/membership/order - 创建会员订阅订单 =====
describe('POST /api/payment/membership/order - 创建会员订阅订单', () => {
  it('创建月度订阅订单返回支付参数', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockUserRow], rowCount: 1 })                  // user
      .mockResolvedValueOnce({ rows: [mockPendingMembershipOrder], rowCount: 1 });   // createMembershipOrder

    const res = await request(createApp())
      .post('/api/payment/membership/order')
      .send({ plan: 'monthly' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(990);
    expect(res.body.data.plan).toBe('monthly');
    expect(res.body.data.payment).toBeDefined();
    expect(res.body.data.payment.prepay_id).toContain('mock_prepay_');
  });

  it('创建年度订阅订单返回 8800 分（88 元）', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [mockUserRow], rowCount: 1 })
      .mockResolvedValueOnce({ rows: [mockPendingMembershipOrder], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/payment/membership/order')
      .send({ plan: 'yearly' });

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(8800);
  });

  it('非法 plan 值返回 400', async () => {
    const res = await request(createApp())
      .post('/api/payment/membership/order')
      .send({ plan: 'weekly' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

// ===== 3. POST /api/payment/wechat/notify - 微信支付回调 =====
describe('POST /api/payment/wechat/notify - 微信支付回调', () => {
  /**
   * 构造 Mock 模式回调请求体
   * 由于 mock 模式下 verifyAndDecodeNotify 直接 JSON.parse rawBody，
   * 我们直接发送约定的 JSON 格式作为请求体
   */
  function buildMockNotifyBody(orderId: string, tradeState: 'SUCCESS' | 'FAILED' = 'SUCCESS', amount = 990) {
    return {
      out_trade_no: orderId,
      transaction_id: `mock_tx_${orderId}`,
      trade_state: tradeState,
      amount_total: amount,
    };
  }

  it('回忆录订单支付成功：标记 paid + 创建任务 + 通知用户', async () => {
    const orderId = 'order-memoir-success';
    // mock 订单 id 与动态 orderId 一致，路由用 order.id（非 notify body 的 out_trade_no）作为通知 key
    const mockOrder = { ...mockPendingMemoirOrder, id: orderId };
    mockPool.query
      // findById（paymentOrderRepository.findById）
      .mockResolvedValueOnce({ rows: [mockOrder], rowCount: 1 })
      // markPaidByCallback: UPDATE ... RETURNING id
      .mockResolvedValueOnce({ rows: [{ id: orderId }], rowCount: 1 })
      // 金额-档位复核（审查 P2-5 新增）：resolveUserTier 查会员 → 空 = free
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // createMemoirFromPayment 内部：
      .mockResolvedValueOnce({ rows: [{ ok: true }], rowCount: 1 })  // ownership OK
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })                    // no active task
      .mockResolvedValueOnce({ rows: [mockMemoirRecord], rowCount: 1 })    // insert
      // recordAuditLog 资金审计（2026-09-09 三档改造沿用）
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/payment/wechat/notify')
      .set('Wechatpay-Timestamp', String(Math.floor(Date.now() / 1000)))
      .set('Wechatpay-Nonce', 'test-nonce')
      .set('Wechatpay-Serial', 'test-serial')
      .set('Wechatpay-Signature', 'test-signature')
      .send(buildMockNotifyBody(orderId, 'SUCCESS', 990));

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('SUCCESS');

    // tier 兜底+透传断言（审查缺口12/15）：fixture metadata.tier='free' 是历史旧语义（会员身份），
    // resolveMemoirTier 应兜底为 light（daily→light）并写进任务 narrative_structure。
    // BaseRepository.insert 按 keys 顺序展开：narrative_structure 是第 7 个参数（index 6）。
    const memoirInsert = mockPool.query.mock.calls.find((c: unknown[][]) =>
      String(c[0]).includes('INSERT INTO pet_memoir_records'),
    );
    expect(memoirInsert).toBeDefined();
    const columns = String(memoirInsert![0]).match(/INSERT INTO pet_memoir_records \(([^)]+)\)/)![1].split(', ');
    const values = memoirInsert![1] as unknown[];
    const narrative = JSON.parse(String(values[columns.indexOf('narrative_structure')])) as Record<string, unknown>;
    expect(narrative.tier).toBe('light'); // 旧语义 'free' → 按 memoir_type=daily 回退 light
    expect(narrative.duration).toBe(15);  // 历史订单显式 duration 保留

    // 验证 WebSocket 通知用户
    expect(mockSendToUser).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({
        type: 'payment_success',
        data: expect.objectContaining({
          product_type: 'memoir',
          order_id: orderId,
        }),
      }),
    );
  });

  it('会员订阅订单支付成功：标记 paid + 激活会员 + 通知用户', async () => {
    const orderId = 'order-membership-success';
    mockPool.query
      // findById
      .mockResolvedValueOnce({ rows: [mockPendingMembershipOrder], rowCount: 1 })
      // markPaidByCallback
      .mockResolvedValueOnce({ rows: [{ id: orderId }], rowCount: 1 })
      // 续费顺延查询（2026-09 审查修复新增：findTierAndStatus 查当前会员，无 → 从现在起算）
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // activateMembership: findByUser (无现有会员)
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // createMembership: insert
      .mockResolvedValueOnce({ rows: [{ id: 'membership-001' }], rowCount: 1 })
      // recordAuditLog 资金审计写入（2026-09 审查修复新增）
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/payment/wechat/notify')
      .set('Wechatpay-Timestamp', String(Math.floor(Date.now() / 1000)))
      .set('Wechatpay-Nonce', 'test-nonce')
      .set('Wechatpay-Serial', 'test-serial')
      .set('Wechatpay-Signature', 'test-signature')
      .send(buildMockNotifyBody(orderId, 'SUCCESS', 990));

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('SUCCESS');

    // 验证通知用户
    expect(mockSendToUser).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({
        type: 'payment_success',
        data: expect.objectContaining({
          product_type: 'membership',
          plan: 'monthly',
        }),
      }),
    );
  });

  it('会员未到期续费：从原到期时间顺延，不吞剩余时长（2026-09 审查 P1 回归锁）', async () => {
    const orderId = 'order-membership-renew';
    // 用户当前会员剩余 15 天（未到期）
    const futureExpiry = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

    mockPool.query
      // findById
      .mockResolvedValueOnce({ rows: [mockPendingMembershipOrder], rowCount: 1 })
      // markPaidByCallback
      .mockResolvedValueOnce({ rows: [{ id: orderId }], rowCount: 1 })
      // 续费顺延查询：findTierAndStatus 返回未到期会员
      .mockResolvedValueOnce({
        rows: [{ tier: 'member', status: 'active', expires_at: futureExpiry.toISOString() }],
        rowCount: 1,
      })
      // activateMembership: findByUser（有现有会员 → 走 renewMembership）
      .mockResolvedValueOnce({ rows: [{ id: 'membership-001' }], rowCount: 1 })
      // renewMembership UPDATE
      .mockResolvedValueOnce({ rows: [{ id: 'membership-001' }], rowCount: 1 })
      // recordAuditLog 资金审计写入
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/payment/wechat/notify')
      .set('Wechatpay-Timestamp', String(Math.floor(Date.now() / 1000)))
      .set('Wechatpay-Nonce', 'test-nonce')
      .set('Wechatpay-Serial', 'test-serial')
      .set('Wechatpay-Signature', 'test-signature')
      .send(buildMockNotifyBody(orderId, 'SUCCESS', 990));

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('SUCCESS');

    // 顺延断言：renewMembership 收到的 expiresAt 应 ≈ 原到期时间 + 30 天（而非 now + 30 天）
    const updateCall = mockPool.query.mock.calls.find((c) => String(c[0]).includes('UPDATE memberships'));
    expect(updateCall).toBeDefined();
    const params = updateCall![1] as unknown[];
    const gotExpiry = new Date(String(params[2])).getTime();
    const expectedExpiry = futureExpiry.getTime() + 30 * 24 * 60 * 60 * 1000;
    // 允许 2 分钟时钟/执行误差
    expect(Math.abs(gotExpiry - expectedExpiry)).toBeLessThan(2 * 60 * 1000);
  });

  it('重复回调：订单已 paid，幂等返回 SUCCESS 不重复处理', async () => {
    const orderId = 'order-duplicate';
    const paidOrder = { ...mockPendingMemoirOrder, id: orderId, status: 'paid', transaction_id: 'mock_tx_old' };

    mockPool.query
      // findById - 返回已 paid 的订单
      .mockResolvedValueOnce({ rows: [paidOrder], rowCount: 1 })
      // markPaidByCallback - 返回 rowCount=0（CAS 失败，状态不是 pending）
      .mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp())
      .post('/api/payment/wechat/notify')
      .set('Wechatpay-Timestamp', String(Math.floor(Date.now() / 1000)))
      .set('Wechatpay-Nonce', 'test-nonce')
      .set('Wechatpay-Serial', 'test-serial')
      .set('Wechatpay-Signature', 'test-signature')
      .send(buildMockNotifyBody(orderId, 'SUCCESS', 990));

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('SUCCESS');

    // 不应调用业务逻辑（通知用户）
    expect(mockSendToUser).not.toHaveBeenCalled();
  });

  it('订单不存在：返回 SUCCESS 让微信停止重试', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 }); // findById: empty

    const res = await request(createApp())
      .post('/api/payment/wechat/notify')
      .set('Wechatpay-Timestamp', String(Math.floor(Date.now() / 1000)))
      .set('Wechatpay-Nonce', 'test-nonce')
      .set('Wechatpay-Serial', 'test-serial')
      .set('Wechatpay-Signature', 'test-signature')
      .send(buildMockNotifyBody('nonexistent-order', 'SUCCESS', 990));

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('SUCCESS');
    expect(mockSendToUser).not.toHaveBeenCalled();
  });

  it('业务执行失败：自动退款 + 通知用户退款', async () => {
    const orderId = 'order-business-fail';
    // mock 订单 id 与动态 orderId 一致，路由用 order.id 作为退款通知 key
    const mockOrder = { ...mockPendingMemoirOrder, id: orderId };
    mockPool.query
      // findById - 返回订单
      .mockResolvedValueOnce({ rows: [mockOrder], rowCount: 1 })
      // markPaidByCallback - 成功
      .mockResolvedValueOnce({ rows: [{ id: orderId }], rowCount: 1 })
      // 金额-档位复核：resolveUserTier 查会员 → 空 = free（amount 990 ∈ 旧价白名单，放行进入业务）
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // createMemoirFromPayment 内部：归属校验失败（模拟业务失败）
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      // refund 后的 markRefunded
      .mockResolvedValueOnce({ rows: [{ id: orderId }], rowCount: 1 });

    const res = await request(createApp())
      .post('/api/payment/wechat/notify')
      .set('Wechatpay-Timestamp', String(Math.floor(Date.now() / 1000)))
      .set('Wechatpay-Nonce', 'test-nonce')
      .set('Wechatpay-Serial', 'test-serial')
      .set('Wechatpay-Signature', 'test-signature')
      .send(buildMockNotifyBody(orderId, 'SUCCESS', 990));

    expect(res.status).toBe(200);
    expect(res.body.code).toBe('SUCCESS');

    // 验证退款通知
    expect(mockSendToUser).toHaveBeenCalledWith(
      'test-user-id',
      expect.objectContaining({
        type: 'payment_refunded',
        data: expect.objectContaining({
          order_id: orderId,
          product_type: 'memoir',
        }),
      }),
    );
  });
});

// ===== 4. GET /api/payment/orders/:orderId - 查询订单 =====
describe('GET /api/payment/orders/:orderId - 查询订单', () => {
  it('查询自己的订单返回 200', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [mockPendingMemoirOrder], rowCount: 1 });

    const res = await request(createApp()).get('/api/payment/orders/order-001');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.order_id).toBe('order-001');
    expect(res.body.data.product_type).toBe('memoir');
    expect(res.body.data.status).toBe('pending');
  });

  it('查询他人订单返回 404（归属校验失败）', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });

    const res = await request(createApp()).get('/api/payment/orders/other-user-order');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('订单不存在');
  });
});
