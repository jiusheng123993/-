import { createOrder as apiCreateOrder, getOrder } from '../api/payment'
import { paymentWebSocket } from './websocket'
import type { DevAuthSession } from '../auth/devAuthSession'
import type { OrderPaymentChannel } from '../entitlement/orderTypes'
import type { PaymentParams, OrderDetailResponse } from '../server/types'

export interface PaymentResult {
  success: boolean
  orderId: string
  error?: string
}

export async function initiatePayment(
  authSession: DevAuthSession,
  productId: string,
  channel: OrderPaymentChannel
): Promise<{ orderId: string; paymentParams: PaymentParams }> {
  const result = await apiCreateOrder({
    userId: authSession.userId,
    productId,
    channel
  }, authSession)

  return {
    orderId: result.orderId,
    paymentParams: result.paymentParams || {}
  }
}

export async function waitForPayment(
  orderId: string,
  timeout = 120000
): Promise<PaymentResult> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({ success: false, orderId, error: 'Payment timeout' })
    }, timeout)

    const unsubscribe = paymentWebSocket.onPaymentStatus((data) => {
      if (data.orderId === orderId) {
        clearTimeout(timeoutId)
        unsubscribe()
        resolve({
          success: data.status === 'paid',
          orderId,
          error: data.error
        })
      }
    })
  })
}

export async function pollPaymentStatus(
  orderId: string,
  authSession: DevAuthSession,
  interval = 3000,
  maxAttempts = 40
): Promise<{ success: boolean; order?: OrderDetailResponse; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const order = await getOrder(orderId, authSession)
      if (order.status === 'paid') {
        return { success: true, order }
      }
      if (order.status === 'failed') {
        return { success: false, error: 'Payment failed' }
      }
    } catch {
      void 0
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
  return { success: false, error: 'Payment timeout' }
}
