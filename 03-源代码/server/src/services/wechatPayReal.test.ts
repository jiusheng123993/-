/**
 * 微信支付真实模式单元测试
 *
 * 覆盖：
 *   1. createJsapiPayment 真实模式 - 请求构造（Authorization 签名头）+ paySign 计算
 *   2. verifyAndDecodeNotify 真实模式 - 验签（有效/无效签名、序列号不匹配、时间戳防重放）+ AES-256-GCM 解密
 *   3. queryOrder 真实模式 - GET 请求构造与响应映射
 *   4. refund 真实模式 - 退款请求构造与响应映射
 *
 * 策略：
 *   - vi.mock('../config.js') 关闭 Mock 模式（mock: false），注入测试商户/平台配置
 *   - 生成测试 RSA 密钥对模拟商户私钥与微信平台证书公钥
 *   - vi.stubGlobal('fetch', ...) 拦截微信 API 请求
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'crypto';

// ===== 测试密钥与常量（vi.hoisted 内提前生成，供 vi.mock factory 使用） =====
const { merchantKeys, platformKeys, API_V3_KEY } = vi.hoisted(() => {
  const nodeCrypto = require('crypto');
  const merchant = nodeCrypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  const platform = nodeCrypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
  // 固定 32 字节 APIv3 密钥
  const apiV3Key = '0123456789abcdef0123456789abcdef';
  return {
    merchantKeys: {
      privateKey: merchant.privateKey.export({ type: 'pkcs8', format: 'pem' }),
      publicKey: merchant.publicKey.export({ type: 'spki', format: 'pem' }),
    },
    platformKeys: {
      privateKey: platform.privateKey.export({ type: 'pkcs8', format: 'pem' }),
      publicKey: platform.publicKey.export({ type: 'spki', format: 'pem' }),
    },
    API_V3_KEY: apiV3Key,
  };
});

vi.mock('../config.js', () => ({
  config: {
    jwtSecret: 'test',
    port: 3000,
    databaseUrl: 'postgresql://localhost/test',
    ai: { apiKey: '', baseUrl: '', model: '' },
    bailian: { apiKey: '', baseUrl: '', visionModel: '', asrModel: '' },
    seedream: { apiKey: '' },
    seedance: { apiKey: '', model: '' },
    meshy: { apiKey: '', baseUrl: '' },
    moderate: { apiKey: '' },
    wechat: { appId: 'wx-test-appid', secret: '' },
    wechatPay: {
      mock: false,
      mchId: '1900000001',
      apiV3Key: API_V3_KEY,
      privateKey: merchantKeys.privateKey,
      certSerialNo: 'merchant-cert-serial',
      platformCertSerialNo: 'platform-cert-serial',
      platformCert: platformKeys.publicKey,
      notifyUrl: 'https://api.example.com/api/payment/wechat/notify',
    },
    uploadDir: './uploads',
    publicBaseUrl: '',
  },
}));

const { mockFetch } = vi.hoisted(() => ({ mockFetch: vi.fn() }));

import {
  createJsapiPayment,
  verifyAndDecodeNotify,
  queryOrder,
  refund,
} from './wechatPayService.js';

/** 构造微信回调 resource 加密内容（AES-256-GCM，ciphertext = 密文 + 16 字节认证标签） */
function encryptResource(plain: object): { ciphertext: string; associatedData: string; nonce: string } {
  const nonce = crypto.randomBytes(12).toString('base64');
  const associatedData = 'transaction';
  const cipher = crypto.createCipheriv('aes-256-gcm', API_V3_KEY, nonce);
  cipher.setAAD(Buffer.from(associatedData, 'utf8'));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(plain), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    ciphertext: Buffer.concat([encrypted, authTag]).toString('base64'),
    associatedData,
    nonce,
  };
}

/** 用平台私钥对回调内容签名（模拟微信支付平台） */
function signNotify(timestamp: string, nonce: string, rawBody: string): string {
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${timestamp}\n${nonce}\n${rawBody}\n`);
  return sign.sign(platformKeys.privateKey, 'base64');
}

/** 构造完整微信回调通知请求体 */
function buildNotifyBody(plain: object): string {
  const { ciphertext, associatedData, nonce } = encryptResource(plain);
  return JSON.stringify({
    id: 'evt-test-001',
    create_time: '2026-07-31T12:00:00+08:00',
    resource_type: 'encrypt-resource',
    event_type: 'TRANSACTION.SUCCESS',
    resource: {
      original_type: 'transaction',
      algorithm: 'AEAD_AES_256_GCM',
      ciphertext,
      associated_data: associatedData,
      nonce,
    },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ===== 1. createJsapiPayment 真实模式 =====
describe('createJsapiPayment - 真实模式', () => {
  it('构造 JSAPI 下单请求并返回可调起支付的参数', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ prepay_id: 'wx_prepay_test_001' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const result = await createJsapiPayment('order-real-1', 990, '测试商品', 'openid-real-1');

    // 1. 请求 URL / method
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi');
    expect(init.method).toBe('POST');

    // 2. Authorization 头格式
    const authorization = (init.headers as Record<string, string>).Authorization;
    expect(authorization).toContain('WECHATPAY2-SHA256-RSA2048');
    expect(authorization).toContain('mchid="1900000001"');
    expect(authorization).toContain('serial_no="merchant-cert-serial"');
    expect(authorization).toContain('nonce_str=');
    expect(authorization).toContain('timestamp=');
    expect(authorization).toContain('signature=');

    // 3. 请求体字段
    const body = JSON.parse(init.body as string);
    expect(body.appid).toBe('wx-test-appid');
    expect(body.mchid).toBe('1900000001');
    expect(body.out_trade_no).toBe('order-real-1');
    expect(body.notify_url).toBe('https://api.example.com/api/payment/wechat/notify');
    expect(body.amount).toEqual({ total: 990, currency: 'CNY' });
    expect(body.payer).toEqual({ openid: 'openid-real-1' });

    // 4. 返回的调起参数
    expect(result.prepay_id).toBe('wx_prepay_test_001');
    expect(result.appId).toBe('wx-test-appid');
    expect(result.package).toBe('prepay_id=wx_prepay_test_001');
    expect(result.signType).toBe('RSA');
    expect(result.orderId).toBe('order-real-1');
    expect(result.paySign).toBeTruthy();

    // 5. paySign 正确性：用商户公钥验签（签名串 appId\ntimeStamp\nnonceStr\npackage\n）
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(`${result.appId}\n${result.timeStamp}\n${result.nonceStr}\n${result.package}\n`);
    expect(verify.verify(merchantKeys.publicKey, result.paySign, 'base64')).toBe(true);
  });

  it('微信返回非 2xx 时抛出含 code/message 的错误', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ code: 'PARAM_ERROR', message: '参数错误' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(createJsapiPayment('order-real-1', 990, '测试', 'openid')).rejects.toThrow(
      '微信支付请求失败: PARAM_ERROR 参数错误',
    );
  });

  it('响应缺少 prepay_id 时抛错', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

    await expect(createJsapiPayment('order-real-1', 990, '测试', 'openid')).rejects.toThrow(
      '响应缺少 prepay_id',
    );
  });
});

// ===== 2. verifyAndDecodeNotify 真实模式 =====
describe('verifyAndDecodeNotify - 真实模式', () => {
  it('有效签名 + 加密回调：验签通过并正确解密', async () => {
    const plain = {
      out_trade_no: 'order-real-1',
      transaction_id: 'tx-real-001',
      trade_state: 'SUCCESS',
      amount: { total: 990, payer_total: 990 },
      payer: { openid: 'openid-real-1' },
    };
    const rawBody = buildNotifyBody(plain);
    const timestamp = String(Math.floor(Date.now() / 1000));
    const nonce = 'notify-nonce-001';
    const signature = signNotify(timestamp, nonce, rawBody);

    const result = await verifyAndDecodeNotify(
      timestamp,
      nonce,
      'platform-cert-serial',
      signature,
      rawBody,
    );

    expect(result.out_trade_no).toBe('order-real-1');
    expect(result.transaction_id).toBe('tx-real-001');
    expect(result.trade_state).toBe('SUCCESS');
    expect(result.amount_total).toBe(990);
    expect(result.payer_openid).toBe('openid-real-1');
  });

  it('签名无效：验签失败抛错', async () => {
    const rawBody = buildNotifyBody({ out_trade_no: 'order-real-1', transaction_id: 'tx-1', trade_state: 'SUCCESS' });
    const timestamp = String(Math.floor(Date.now() / 1000));

    await expect(
      verifyAndDecodeNotify(timestamp, 'nonce-1', 'platform-cert-serial', 'bad-signature', rawBody),
    ).rejects.toThrow('回调签名验证失败');
  });

  it('证书序列号不匹配：拒绝', async () => {
    const rawBody = buildNotifyBody({ out_trade_no: 'order-real-1', transaction_id: 'tx-1', trade_state: 'SUCCESS' });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = signNotify(timestamp, 'nonce-1', rawBody);

    await expect(
      verifyAndDecodeNotify(timestamp, 'nonce-1', 'wrong-serial', signature, rawBody),
    ).rejects.toThrow('回调证书序列号不匹配');
  });

  it('时间戳超出 ±300s（防重放）：拒绝', async () => {
    const rawBody = buildNotifyBody({ out_trade_no: 'order-real-1', transaction_id: 'tx-1', trade_state: 'SUCCESS' });
    const oldTimestamp = String(Math.floor(Date.now() / 1000) - 600);
    const signature = signNotify(oldTimestamp, 'nonce-1', rawBody);

    await expect(
      verifyAndDecodeNotify(oldTimestamp, 'nonce-1', 'platform-cert-serial', signature, rawBody),
    ).rejects.toThrow('时间戳超出有效范围');
  });

  it('缺少 resource 加密内容：拒绝', async () => {
    const rawBody = JSON.stringify({ id: 'evt-1', resource: {} });
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = signNotify(timestamp, 'nonce-1', rawBody);

    await expect(
      verifyAndDecodeNotify(timestamp, 'nonce-1', 'platform-cert-serial', signature, rawBody),
    ).rejects.toThrow('缺少 resource 加密内容');
  });
});

// ===== 3. queryOrder 真实模式 =====
describe('queryOrder - 真实模式', () => {
  it('GET 查询订单并映射响应字段', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          appid: 'wx-test-appid',
          mchid: '1900000001',
          out_trade_no: 'order-real-1',
          transaction_id: 'tx-real-001',
          trade_state: 'SUCCESS',
          amount: { total: 990, payer_total: 990 },
        }),
        { status: 200 },
      ),
    );

    const result = await queryOrder('order-real-1');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/order-real-1?mchid=1900000001',
    );
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>).Authorization).toContain('WECHATPAY2-SHA256-RSA2048');

    expect(result.trade_state).toBe('SUCCESS');
    expect(result.transaction_id).toBe('tx-real-001');
    expect(result.amount_total).toBe(990);
  });

  it('非 2xx 响应抛出业务错误', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 'ORDER_NOT_EXIST', message: '订单不存在' }), { status: 404 }),
    );

    await expect(queryOrder('order-real-1')).rejects.toThrow('ORDER_NOT_EXIST 订单不存在');
  });
});

// ===== 4. refund 真实模式 =====
describe('refund - 真实模式', () => {
  it('POST 退款请求并映射响应字段', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          refund_id: 'refund-real-001',
          status: 'PROCESSING',
          out_refund_no: 'Rorder-real-1',
          out_trade_no: 'order-real-1',
        }),
        { status: 200 },
      ),
    );

    const result = await refund('order-real-1', 990, '业务失败退款');

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.mch.weixin.qq.com/v3/refund/domestic/refunds');
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body as string);
    expect(body.out_refund_no).toBe('Rorder-real-1');
    expect(body.out_trade_no).toBe('order-real-1');
    expect(body.reason).toBe('业务失败退款');
    expect(body.amount).toEqual({ total: 990, currency: 'CNY', refund: 990 });

    expect(result.refund_id).toBe('refund-real-001');
    expect(result.status).toBe('PROCESSING');
  });

  it('响应缺少 refund_id 时抛错', async () => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }));

    await expect(refund('order-real-1', 990, '业务失败退款')).rejects.toThrow('缺少 refund_id');
  });

  it('退款金额必须大于 0', async () => {
    await expect(refund('order-real-1', 0, '退款')).rejects.toThrow('退款金额必须大于 0');
  });
});
