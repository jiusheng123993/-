import { Router } from 'express'
import { handleWechatCallback, handleAlipayCallback, handleAppleVerify } from '../services/paymentCallbackService'
import { grantEntitlements } from '../services/entitlementService'
import { getOrderById } from '../services/orderService'
import { broadcastToUser } from '../websocket'
import { orderRepo, paymentRepo } from '../db/orderRepository'

/**
 * Payment Router - 支付回调路由
 *
 * 职责：
 * - POST /api/payment/wechat/callback - 微信支付回调
 * - POST /api/payment/alipay/callback - 支付宝回调
 * - POST /api/payment/apple/verify - Apple IAP 验证
 *
 * 安全措施：
 * - 签名验证（微信、支付宝）
 * - 状态校验（交易状态检查）
 * - 幂等处理（重复回调不重复发放权益）
 */
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

          try {
            await orderRepo.updateStatus(orderId, 'paid', {
              channelTradeNo: result.tradeNo,
              receipt: JSON.stringify(data)
            })
            await paymentRepo.create({
              orderId,
              channel: 'wechat',
              tradeNo: result.tradeNo,
              amount: order.amount,
              rawCallback: data as Record<string, unknown>
            })
          } catch (dbError) {
            console.error(`[payment] Failed to persist wechat callback for order ${orderId}:`, dbError)
          }
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

          try {
            await orderRepo.updateStatus(orderId, 'paid', {
              channelTradeNo: result.tradeNo,
              receipt: JSON.stringify(data)
            })
            await paymentRepo.create({
              orderId,
              channel: 'alipay',
              tradeNo: result.tradeNo,
              amount: order.amount,
              rawCallback: data as Record<string, unknown>
            })
          } catch (dbError) {
            console.error(`[payment] Failed to persist alipay callback for order ${orderId}:`, dbError)
          }
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

          try {
            await orderRepo.updateStatus(orderId, 'paid', {
              channelTradeNo: result.tradeNo,
              receipt
            })
            await paymentRepo.create({
              orderId,
              channel: 'apple',
              tradeNo: result.tradeNo,
              amount: order.amount,
              rawCallback: { receipt }
            })
          } catch (dbError) {
            console.error(`[payment] Failed to persist apple verify for order ${orderId}:`, dbError)
          }
        }
      }

      res.json(result)
    } catch (error) {
      res.status(500).json({ error: (error as Error).message })
    }
  })

  return router
}
