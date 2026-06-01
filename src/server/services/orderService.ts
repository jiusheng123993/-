import { createOrderService } from '../../entitlement/orderService'
import { getProductById } from '../../entitlement/productCatalog'
import type { OrderPaymentChannel } from '../../entitlement/orderTypes'
import type { CreateOrderRequest, CreateOrderResponse, PaymentParams } from '../types'

export const orderService = createOrderService()

export function createOrder(req: CreateOrderRequest): CreateOrderResponse {
  const product = getProductById(req.productId)
  if (!product) {
    throw new Error(`Product not found: ${req.productId}`)
  }

  const order = orderService.createOrder({
    userId: req.userId,
    productId: req.productId,
    amount: product.price,
    channel: req.channel
  })

  const paymentParams = generatePaymentParamsSync(order.id, req.channel, product.price)

  return {
    orderId: order.id,
    amount: order.amount,
    channel: order.channel,
    status: order.status,
    createdAt: order.createdAt,
    paymentParams
  }
}

function generatePaymentParamsSync(
  orderId: string,
  channel: OrderPaymentChannel,
  _amount: number
): PaymentParams {
  if (channel === 'wechat') {
    return {
      appId: 'YOUR_APP_ID',
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: orderId,
      package: `prepay_id=${orderId}`,
      signType: 'RSA',
      paySign: ''
    }
  }

  if (channel === 'alipay') {
    return {
      orderStr: `https://qr.alipay.com/${orderId}`
    }
  }

  return {}
}

export function getOrderById(orderId: string) {
  return orderService.getOrderById(orderId)
}

export function getOrdersByUser(userId: string) {
  return orderService.getOrdersByUser(userId)
}

export function refundOrder(orderId: string) {
  return orderService.markAsRefunded(orderId)
}
