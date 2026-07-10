import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  handleWechatCallback,
  handleAlipayCallback,
  handleAppleVerify
} from './paymentCallbackService'

describe('PaymentCallbackService', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.WECHAT_API_KEY = 'test-api-key'
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  describe('handleWechatCallback', () => {
    it('should accept callback in development mode (mock)', async () => {
      const result = await handleWechatCallback('order-1', {
        total_fee: '1800',
        transaction_id: 'tx-123',
        sign: 'invalid-sign'
      })

      expect(result.success).toBe(true)
      expect(result.orderId).toBe('order-1')
      expect(result.tradeNo).toBe('tx-123')
    })

    it('should reject callback with zero amount', async () => {
      const result = await handleWechatCallback('order-1', {
        total_fee: '0',
        transaction_id: 'tx-123',
        sign: 'any-sign'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid amount')
    })

    it('should accept valid callback with mock tradeNo fallback', async () => {
      const result = await handleWechatCallback('order-1', {
        total_fee: '1800'
      })

      expect(result.success).toBe(true)
      expect(result.tradeNo).toContain('mock-wechat-trade-order-1')
      expect(result.orderId).toBe('order-1')
    })
  })

  describe('handleAlipayCallback', () => {
    it('should accept callback in development mode (mock)', async () => {
      const result = await handleAlipayCallback('order-1', {
        trade_status: 'TRADE_SUCCESS',
        trade_no: 'ali-tx-123',
        sign: 'mock-sign',
        sign_type: 'RSA2'
      })

      expect(result.success).toBe(true)
      expect(result.tradeNo).toBe('ali-tx-123')
      expect(result.orderId).toBe('order-1')
    })

    it('should reject invalid trade status', async () => {
      const result = await handleAlipayCallback('order-1', {
        trade_status: 'TRADE_CLOSED',
        trade_no: 'ali-tx-123',
        sign: 'mock-sign',
        sign_type: 'RSA2'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Trade status: TRADE_CLOSED')
    })

    it('should accept callback without trade_status (mock fallback)', async () => {
      const result = await handleAlipayCallback('order-1', {
        trade_no: 'ali-tx-456',
        sign: 'mock-sign',
        sign_type: 'RSA2'
      })

      expect(result.success).toBe(true)
      expect(result.tradeNo).toBe('ali-tx-456')
    })
  })

  describe('handleAppleVerify', () => {
    it('should accept receipt in development mode (mock)', async () => {
      const result = await handleAppleVerify('order-1', 'mock-receipt-data')

      expect(result.success).toBe(true)
      expect(result.orderId).toBe('order-1')
      expect(result.tradeNo).toContain('mock-apple-trade-order-1')
    })
  })
})
