import { describe, it, expect, beforeEach } from 'vitest'
import {
  handleWechatCallback,
  handleAlipayCallback,
  handleAppleVerify
} from './paymentCallbackService'

describe('PaymentCallbackService', () => {
  beforeEach(() => {
    process.env.WECHAT_API_KEY = 'test-api-key'
  })

  describe('handleWechatCallback', () => {
    it('should reject callback with invalid signature', async () => {
      const result = await handleWechatCallback('order-1', {
        total_fee: '1800',
        transaction_id: 'tx-123',
        sign: 'invalid-sign'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid signature')
    })

    it('should reject callback with zero amount', async () => {
      const data: Record<string, string> = {
        total_fee: '0',
        transaction_id: 'tx-123'
      }
      const sortedKeys = Object.keys(data).sort()
      const signStr = sortedKeys.map(k => `${k}=${data[k]}`).join('&') + `&key=test-api-key`
      data.sign = signStr

      const result = await handleWechatCallback('order-1', data)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid amount')
    })

    it('should accept valid callback', async () => {
      const data: Record<string, string> = {
        total_fee: '1800',
        transaction_id: 'tx-123'
      }
      const sortedKeys = Object.keys(data).sort()
      const signStr = sortedKeys.map(k => `${k}=${data[k]}`).join('&') + `&key=test-api-key`
      data.sign = signStr

      const result = await handleWechatCallback('order-1', data)

      expect(result.success).toBe(true)
      expect(result.tradeNo).toBe('tx-123')
      expect(result.orderId).toBe('order-1')
    })
  })

  describe('handleAlipayCallback', () => {
    it('should reject callback when signature verification is not implemented', async () => {
      const result = await handleAlipayCallback('order-1', {
        trade_status: 'TRADE_SUCCESS',
        trade_no: 'ali-tx-123',
        sign: 'mock-sign',
        sign_type: 'RSA2'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid signature')
    })

    it('should reject invalid trade status', async () => {
      const result = await handleAlipayCallback('order-1', {
        trade_status: 'TRADE_CLOSED',
        trade_no: 'ali-tx-123',
        sign: 'mock-sign',
        sign_type: 'RSA2'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid signature')
    })
  })

  describe('handleAppleVerify', () => {
    it('should reject apple receipt when verification is not implemented', async () => {
      const result = await handleAppleVerify('order-1', 'mock-receipt-data')

      expect(result.success).toBe(false)
      expect(result.orderId).toBe('order-1')
      expect(result.error).toBe('Apple receipt verification not implemented')
    })
  })
})
