import { createOrderService } from '../../entitlement/orderService'
import { getProductById } from '../../entitlement/productCatalog'
import { getPaymentAdapter } from '../../entitlement/paymentAdapters'
import type { OrderPaymentChannel } from '../../entitlement/orderTypes'
import type { CreateOrderRequest, CreateOrderResponse, PaymentParams } from '../types'

export function createOrder(req: CreateOrderRequest): CreateOrderResponse {
  const product = getProductById(req.productId)
  if (!product) {
    throw new Error(`Product not found: ${req.productId}`)
  }

  const orderService = createOrderService()
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
  const adapter = getPaymentAdapter(channel)
  const result = adapter.createPayment(orderId, _amount)

  if (channel === 'wechat') {
    return {
      appId: 'YOUR_APP_ID',
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: result.paymentId,
      package: `prepay_id=${result.paymentId}`,
      signType: 'RSA',
      paySign: ''
    }
  }

  if (channel === 'alipay') {
    return {
      orderStr: result.paymentUrl || ''
    }
  }

  return {}
}

export function getOrderById(orderId: string) {
  const orderService = createOrderService()
  return orderService.getOrderById(orderId)
}

export function getOrdersByUser(userId: string) {
  const orderService = createOrderService()
  return orderService.getOrdersByUser(userId)
}
