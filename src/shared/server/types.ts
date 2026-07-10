import type { Order, OrderPaymentChannel, OrderStatus } from '../entitlement/orderTypes'

export interface CreateOrderRequest {
  userId: string
  productId: string
  channel: OrderPaymentChannel
}

export interface CreateOrderResponse {
  orderId: string
  amount: number
  channel: OrderPaymentChannel
  status: OrderStatus
  createdAt: string
  paymentParams?: PaymentParams
}

export interface PaymentParams {
  appId?: string
  timeStamp?: string
  nonceStr?: string
  package?: string
  signType?: string
  paySign?: string
  orderStr?: string
  productId?: string
}

export type OrderDetailResponse = Order
