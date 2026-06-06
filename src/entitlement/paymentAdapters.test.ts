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

  it('wechat createPayment throws PaymentNotImplementedError', async () => {
    await expect(paymentAdapters.wechat.createPayment('order-1', 1800)).rejects.toThrow('PaymentAdapter[wechat].createPayment')
  })

  it('alipay createPayment throws PaymentNotImplementedError', async () => {
    await expect(paymentAdapters.alipay.createPayment('order-2', 1800)).rejects.toThrow('PaymentAdapter[alipay].createPayment')
  })

  it('apple createPayment throws PaymentNotImplementedError', async () => {
    await expect(paymentAdapters.apple.createPayment('order-3', 1800)).rejects.toThrow('PaymentAdapter[apple].createPayment')
  })

  it('verifyPayment throws PaymentNotImplementedError for all channels', async () => {
    await expect(paymentAdapters.wechat.verifyPayment('wx-1')).rejects.toThrow('PaymentAdapter[wechat].verifyPayment')
    await expect(paymentAdapters.apple.verifyPayment('apple-1')).rejects.toThrow('PaymentAdapter[apple].verifyPayment')
    await expect(paymentAdapters.alipay.verifyPayment('ali-1')).rejects.toThrow('PaymentAdapter[alipay].verifyPayment')
  })
})
