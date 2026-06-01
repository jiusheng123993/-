import { createOrder as apiCreateOrder, getOrder } from '../api/payment'
import { paymentWebSocket } from './websocket'
import type { OrderPaymentChannel } from '../entitlement/orderTypes'
import type { PaymentParams, OrderDetailResponse } from '../server/types'

export interface PaymentResult {
  success: boolean
  orderId: string
  error?: string
}

export async function initiatePayment(
  userId: string,
  productId: string,
  channel: OrderPaymentChannel
): Promise<{ orderId: string; paymentParams: PaymentParams }> {
  const result = await apiCreateOrder({
    userId,
    productId,
    channel
  })

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
  interval = 3000,
  maxAttempts = 40
): Promise<{ success: boolean; order?: OrderDetailResponse; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const order = await getOrder(orderId)
      if (order.status === 'paid') {
        return { success: true, order }
      }
      if (order.status === 'failed') {
        return { success: false, error: 'Payment failed' }
      }
    } catch {
      // Ignore errors during polling
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
  return { success: false, error: 'Payment timeout' }
}
