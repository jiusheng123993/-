import { Router, type Request, type Response, type NextFunction } from 'express'
import { createOrder, getOrderById, getOrdersByUser, refundOrder, orderService } from '../services/orderService'
import { requireAuth, canAccessUserResource, isAdmin } from '../auth/authMiddleware'
import type { AuthenticatedRequest } from '../auth/authTypes'
import type { CreateOrderRequest } from '../types'

/**
 * Orders Router - 订单管理路由
 *
 * 职责：
 * - POST /api/orders - 创建新订单
 * - GET /api/orders/:id - 查询订单详情（订单所属用户或管理员）
 * - GET /api/orders/user/:userId - 查询用户订单列表（本人或管理员）
 * - POST /api/orders/:id/pay - [仅开发环境 + 管理员] 模拟支付确认
 * - POST /api/orders/:id/refund - 申请退款（订单所属用户或管理员，且仅已支付订单可退款）
 *
 * 安全措施：
 * - 所有接口参数强校验（类型 + 长度 + 白名单）
 * - requireAuth 注入统一身份上下文
 * - canAccessUserResource 防横向越权
 * - 退款仅允许已支付状态的订单（防止状态机被破坏）
 * - 模拟支付接口仅开发环境和管理员可用
 * - 错误信息脱敏（不向外暴露内部实现）
 */

const ORDER_ID_PATTERN = /^order-[a-z0-9-]{6,64}$/i
const USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/
const VALID_CHANNELS = ['wechat', 'alipay', 'apple'] as const
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production'
}

function safeError(res: Response, code: number, message: string): void {
  res.status(code).json({ error: message })
}

function asyncHandler(fn: (req: Request, res: Response) => void | Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res)).catch(next)
  }
}

function validateOrderId(orderId: string): boolean {
  return typeof orderId === 'string' && ORDER_ID_PATTERN.test(orderId)
}

function validateUserId(userId: string): boolean {
  return typeof userId === 'string' && USER_ID_PATTERN.test(userId)
}

export function createOrdersRouter(): Router {
  const router = Router()

  router.post('/', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    const { userId, productId, channel } = req.body as CreateOrderRequest
    if (!validateUserId(userId)) {
      safeError(res, 400, 'Invalid userId')
      return
    }
    if (!productId || typeof productId !== 'string' || productId.length > 64) {
      safeError(res, 400, 'Invalid productId')
      return
    }
    if (!channel || !VALID_CHANNELS.includes(channel)) {
      safeError(res, 400, `channel must be one of: ${VALID_CHANNELS.join(', ')}`)
      return
    }
    if (!canAccessUserResource(req.auth, userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
    try {
      const result = createOrder({ userId, productId, channel })
      res.json(result)
    } catch (error) {
      const msg = (error as Error).message
      if (msg.startsWith('Product not found')) {
        safeError(res, 404, 'Product not found')
      } else {
        safeError(res, 400, 'Failed to create order')
      }
    }
  }))

  router.get('/user/:userId', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    if (!validateUserId(req.params.userId)) {
      safeError(res, 400, 'Invalid userId format')
      return
    }
    if (!canAccessUserResource(req.auth, req.params.userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
    const orders = getOrdersByUser(req.params.userId)
    res.json(orders)
  }))

  router.get('/:id', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    if (!validateOrderId(req.params.id)) {
      safeError(res, 400, 'Invalid order id format')
      return
    }
    const order = getOrderById(req.params.id)
    if (!order) {
      safeError(res, 404, 'Order not found')
      return
    }
    if (!canAccessUserResource(req.auth, order.userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
    res.json(order)
  }))

  router.post('/:id/refund', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    if (!validateOrderId(req.params.id)) {
      safeError(res, 400, 'Invalid order id format')
      return
    }
    const order = orderService.getOrderById(req.params.id)
    if (!order) {
      safeError(res, 404, 'Order not found')
      return
    }
    if (!canAccessUserResource(req.auth, order.userId)) {
      safeError(res, 403, 'Forbidden')
      return
    }
    if (order.status !== 'paid') {
      safeError(res, 400, `Cannot refund order with status: ${order.status}`)
      return
    }
    try {
      const refundedOrder = refundOrder(req.params.id)
      res.json(refundedOrder)
    } catch {
      safeError(res, 500, 'Failed to refund order')
    }
  }))

  router.post('/:id/pay', requireAuth, asyncHandler((req: AuthenticatedRequest, res) => {
    if (isProduction()) {
      safeError(res, 403, 'This endpoint is disabled in production')
      return
    }
    if (!isAdmin(req.auth)) {
      safeError(res, 403, 'Forbidden')
      return
    }
    if (!validateOrderId(req.params.id)) {
      safeError(res, 400, 'Invalid order id format')
      return
    }
    const { channelTradeNo } = req.body
    const order = orderService.getOrderById(req.params.id)
    if (!order) {
      safeError(res, 404, 'Order not found')
      return
    }
    if (order.status !== 'pending') {
      safeError(res, 400, `Cannot pay order with status: ${order.status}`)
      return
    }
    try {
      orderService.markAsPaid(
        req.params.id,
        typeof channelTradeNo === 'string' && channelTradeNo.length <= 128
          ? channelTradeNo
          : 'mock-trade-no',
        'mock receipt'
      )
      res.json(orderService.getOrderById(req.params.id))
    } catch {
      safeError(res, 500, 'Failed to mark as paid')
    }
  }))

  return router
}
