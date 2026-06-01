import { useState, useCallback } from 'react'
import { initiatePayment, waitForPayment } from '../services/paymentService'
import type { OrderPaymentChannel } from '../entitlement/orderTypes'
import type { PaymentParams } from '../server/types'

declare const wx: {
  requestPayment(params: {
    timeStamp: string
    nonceStr: string
    package: string
    signType: string
    paySign: string
    success?: () => void
    fail?: (err: unknown) => void
  }): void
} | undefined

declare const AlipayJSBridge: {
  pay(orderStr: string, callback: (result: { resultCode: string; memo?: string }) => void): void
} | undefined

interface PaymentState {
  status: 'idle' | 'pending' | 'processing' | 'success' | 'failed'
  orderId?: string
  error?: string
}

export function usePayment(userId: string | undefined) {
  const [state, setState] = useState<PaymentState>({ status: 'idle' })

  const startPayment = useCallback(
    async (productId: string, channel: OrderPaymentChannel) => {
      if (!userId) {
        setState({ status: 'failed', error: 'Please login first' })
        return
      }

      setState({ status: 'pending' })

      try {
        const { orderId, paymentParams } = await initiatePayment(userId, productId, channel)
        setState({ status: 'processing', orderId })

        await invokePaymentSDK(channel, paymentParams)

        const result = await waitForPayment(orderId)

        if (result.success) {
          setState({ status: 'success', orderId })
        } else {
          setState({ status: 'failed', orderId, error: result.error })
        }
      } catch (error) {
        setState({ status: 'failed', error: (error as Error).message })
      }
    },
    [userId]
  )

  const reset = useCallback(() => {
    setState({ status: 'idle' })
  }, [])

  return { ...state, startPayment, reset }
}

async function invokePaymentSDK(channel: OrderPaymentChannel, params: PaymentParams) {
  if (channel === 'wechat') {
    return invokeWechatPay(params)
  }
  if (channel === 'alipay') {
    return invokeAlipay(params)
  }
  if (channel === 'apple') {
    return invokeApplePay(params)
  }
}

async function invokeWechatPay(params: PaymentParams) {
  return new Promise<boolean>((resolve, reject) => {
    if (typeof wx !== 'undefined' && wx.requestPayment) {
      wx.requestPayment({
        timeStamp: params.timeStamp || '',
        nonceStr: params.nonceStr || '',
        package: params.package || '',
        signType: params.signType || 'RSA',
        paySign: params.paySign || '',
        success: () => resolve(true),
        fail: reject
      })
    } else {
      console.log('[Payment] WeChat Pay params (dev mode):', params)
      resolve(true)
    }
  })
}

async function invokeAlipay(params: PaymentParams) {
  return new Promise<boolean>((resolve, reject) => {
    if (typeof AlipayJSBridge !== 'undefined' && params.orderStr) {
      AlipayJSBridge.pay(params.orderStr, (result: { resultCode: string; memo?: string }) => {
        if (result.resultCode === '9000') {
          resolve(true)
        } else {
          reject(new Error(result.memo || 'Payment failed'))
        }
      })
    } else {
      console.log('[Payment] Alipay params (dev mode):', params)
      resolve(true)
    }
  })
}

async function invokeApplePay(_params: PaymentParams) {
  console.log('[Payment] Apple Pay (dev mode)')
  return true
}
