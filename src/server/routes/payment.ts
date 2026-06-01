import { Router } from 'express'
import { handleWechatCallback, handleAlipayCallback, handleAppleVerify } from '../services/paymentCallbackService'
import { grantEntitlements } from '../services/entitlementService'
import { getOrderById } from '../services/orderService'
import { broadcastToUser } from '../websocket'

export function createPaymentRouter(): Router {
  const router = Router()

  router.post('/wechat/callback', async (req, res) => {
    try {
      const { orderId, ...data } = req.body
      const result = await handleWechatCallback(orderId, data as Record<string, string>)

      if (result.success) {
        const order = getOrderById(orderId)
        if (order) {
          grantEntitlements(order.userId, order.productId)
          broadcastToUser(order.userId, {
            type: 'payment_status',
            orderId,
            status: 'paid',
            tradeNo: result.tradeNo
          })
        }
      }

      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  router.post('/alipay/callback', async (req, res) => {
    try {
      const { orderId, ...data } = req.body
      const result = await handleAlipayCallback(orderId, data as Record<string, string>)

      if (result.success) {
        const order = getOrderById(orderId)
        if (order) {
          grantEntitlements(order.userId, order.productId)
          broadcastToUser(order.userId, {
            type: 'payment_status',
            orderId,
            status: 'paid',
            tradeNo: result.tradeNo
          })
        }
      }

      res.json({ success: true })
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  router.post('/apple/verify', async (req, res) => {
    try {
      const { orderId, receipt } = req.body
      const result = await handleAppleVerify(orderId, receipt)

      if (result.success) {
        const order = getOrderById(orderId)
        if (order) {
          grantEntitlements(order.userId, order.productId)
          broadcastToUser(order.userId, {
            type: 'payment_status',
            orderId,
            status: 'paid'
          })
        }
      }

      res.json(result)
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  return router
}
