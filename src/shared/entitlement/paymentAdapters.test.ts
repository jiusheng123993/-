import { describe, expect, it } from 'vitest'
import { getPaymentAdapter, paymentAdapters } from './paymentAdapters'

describe('paymentAdapters', () => {
  it('exposes wechat, apple, and alipay adapters', () => {
    expect(paymentAdapters.wechat).toBeDefined()
    expect(paymentAdapters.apple).toBeDefined()
    expect(paymentAdapters.alipay).toBeDefined()
  })

  it('getPaymentAdapter returns matched adapter', () => {
    expect(getPaymentAdapter('wechat')).toBe(paymentAdapters.wechat)
    expect(getPaymentAdapter('apple')).toBe(paymentAdapters.apple)
    expect(getPaymentAdapter('alipay')).toBe(paymentAdapters.alipay)
  })

  it('getPaymentAdapter throws on unknown channel', () => {
    // @ts-expect-error intentionally invalid
    expect(() => getPaymentAdapter('unknown')).toThrow()
  })

  it('wechat createPayment returns mock payment result', async () => {
    const result = await paymentAdapters.wechat.createPayment('order-1', 1800)
    expect(result.paymentId).toContain('mock-wechat-order-1')
    expect(result.paymentUrl).toContain('/mock-payment')
    expect(result.qrCode).toContain('mock-qr-wechat-order-1')
  })

  it('alipay createPayment returns mock payment result', async () => {
    const result = await paymentAdapters.alipay.createPayment('order-2', 1800)
    expect(result.paymentId).toContain('mock-alipay-order-2')
    expect(result.paymentUrl).toContain('/mock-payment')
    expect(result.qrCode).toContain('mock-qr-alipay-order-2')
  })

  it('apple createPayment returns mock payment result', async () => {
    const result = await paymentAdapters.apple.createPayment('order-3', 1800)
    expect(result.paymentId).toContain('mock-apple-order-3')
    expect(result.paymentUrl).toContain('/mock-payment')
    expect(result.qrCode).toContain('mock-qr-apple-order-3')
  })

  it('verifyPayment returns success for all channels', async () => {
    const wechatResult = await paymentAdapters.wechat.verifyPayment('wx-1')
    expect(wechatResult.success).toBe(true)
    expect(wechatResult.tradeNo).toBeDefined()

    const appleResult = await paymentAdapters.apple.verifyPayment('apple-1')
    expect(appleResult.success).toBe(true)
    expect(appleResult.tradeNo).toBeDefined()

    const alipayResult = await paymentAdapters.alipay.verifyPayment('ali-1')
    expect(alipayResult.success).toBe(true)
    expect(alipayResult.tradeNo).toBeDefined()
  })
})
