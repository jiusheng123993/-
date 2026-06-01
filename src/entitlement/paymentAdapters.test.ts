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

  it('wechat createPayment returns qrCode', async () => {
    const result = await paymentAdapters.wechat.createPayment('order-1', 1800)
    expect(result.paymentId).toContain('wx-')
    expect(result.qrCode).toBeTruthy()
  })

  it('alipay createPayment returns paymentUrl', async () => {
    const result = await paymentAdapters.alipay.createPayment('order-2', 1800)
    expect(result.paymentId).toContain('ali-')
    expect(result.paymentUrl).toBeTruthy()
  })

  it('apple createPayment returns paymentId without qrCode', async () => {
    const result = await paymentAdapters.apple.createPayment('order-3', 1800)
    expect(result.paymentId).toContain('apple-')
    expect(result.qrCode).toBeUndefined()
  })

  it('verifyPayment returns success and tradeNo for stub implementations', async () => {
    const wx = await paymentAdapters.wechat.verifyPayment('wx-1')
    const apple = await paymentAdapters.apple.verifyPayment('apple-1')
    const ali = await paymentAdapters.alipay.verifyPayment('ali-1')
    expect(wx.success).toBe(true)
    expect(apple.success).toBe(true)
    expect(ali.success).toBe(true)
    expect(wx.tradeNo).toBe('wx-1')
  })
})
