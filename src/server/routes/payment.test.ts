import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/paymentCallbackService', () => ({
  handleWechatCallback: vi.fn(),
  handleAlipayCallback: vi.fn(),
  handleAppleVerify: vi.fn()
}))

vi.mock('../services/entitlementService', () => ({
  grantEntitlements: vi.fn()
}))

vi.mock('../services/orderService', () => ({
  getOrderById: vi.fn()
}))

vi.mock('../websocket', () => ({
  broadcastToUser: vi.fn()
}))

interface MockReq {
  body?: Record<string, unknown>
}

interface MockRes {
  statusCode: number
  body: unknown
  status: (code: number) => MockRes
  json: (body: unknown) => MockRes
}

function createMockRes(): MockRes {
  const res: MockRes = {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code
      return this
    },
    json(body: unknown) {
      this.body = body
      return this
    }
  }
  return res
}

describe('Payment Router', () => {
  let createPaymentRouter: typeof import('./payment').createPaymentRouter

  beforeEach(async () => {
    vi.clearAllMocks()
    const mod = await import('./payment')
    createPaymentRouter = mod.createPaymentRouter
  })

  function getRouterHandlers() {
    const router = createPaymentRouter()
    const stack = (router as unknown as { stack: Array<{ route?: { path: string; stack: Array<{ method: string; handle: (req: MockReq, res: MockRes) => void | Promise<void> }> } }> }).stack
    const handlers: Array<{ method: string; path: string; handler: (req: MockReq, res: MockRes) => void | Promise<void> }> = []
    for (const layer of stack) {
      if (layer.route) {
        for (const h of layer.route.stack) {
          handlers.push({ method: h.method, path: layer.route.path, handler: h.handle })
        }
      }
    }
    return handlers
  }

  describe('Route registration', () => {
    it('should register all callback routes', () => {
      const handlers = getRouterHandlers()
      const routes = handlers.map(h => `${h.method.toUpperCase()} ${h.path}`)

      expect(routes).toContain('POST /wechat/callback')
      expect(routes).toContain('POST /alipay/callback')
      expect(routes).toContain('POST /apple/verify')
    })

    it('should create router instance', () => {
      const router = createPaymentRouter()
      expect(router).toBeDefined()
      expect(typeof router).toBe('function')
    })
  })

  describe('POST /wechat/callback', () => {
    it('should handle wechat callback successfully', async () => {
      const { handleWechatCallback } = await import('../services/paymentCallbackService')
      const { getOrderById } = await import('../services/orderService')
      const { grantEntitlements } = await import('../services/entitlementService')
      const { broadcastToUser } = await import('../websocket')

      vi.mocked(handleWechatCallback).mockResolvedValueOnce({
        success: true,
        tradeNo: 'wx-trade-123'
      })
      vi.mocked(getOrderById).mockReturnValueOnce({
        userId: 'user-1',
        productId: 'study_monthly'
      } as never)

      const handlers = getRouterHandlers()
      const handler = handlers.find(h => h.method === 'post' && h.path === '/wechat/callback')!
      const req: MockReq = { body: { orderId: 'order-1', transaction_id: 'tx-123' } }
      const res = createMockRes()
      await handler.handler(req, res)

      expect(handleWechatCallback).toHaveBeenCalled()
      expect(grantEntitlements).toHaveBeenCalledWith('user-1', 'study_monthly')
      expect(broadcastToUser).toHaveBeenCalled()
      expect(res.statusCode).toBe(200)
    })

    it('should handle errors gracefully', async () => {
      const { handleWechatCallback } = await import('../services/paymentCallbackService')
      vi.mocked(handleWechatCallback).mockRejectedValueOnce(new Error('Invalid signature'))

      const handlers = getRouterHandlers()
      const handler = handlers.find(h => h.method === 'post' && h.path === '/wechat/callback')!
      const req: MockReq = { body: { orderId: 'order-1' } }
      const res = createMockRes()
      await handler.handler(req, res)

      expect(res.statusCode).toBe(500)
    })
  })

  describe('POST /alipay/callback', () => {
    it('should handle alipay callback successfully', async () => {
      const { handleAlipayCallback } = await import('../services/paymentCallbackService')
      const { getOrderById } = await import('../services/orderService')

      vi.mocked(handleAlipayCallback).mockResolvedValueOnce({
        success: true,
        tradeNo: 'ali-trade-123'
      })
      vi.mocked(getOrderById).mockReturnValueOnce({
        userId: 'user-1',
        productId: 'study_monthly'
      } as never)

      const handlers = getRouterHandlers()
      const handler = handlers.find(h => h.method === 'post' && h.path === '/alipay/callback')!
      const req: MockReq = { body: { orderId: 'order-1', trade_no: 'tx-123' } }
      const res = createMockRes()
      await handler.handler(req, res)

      expect(handleAlipayCallback).toHaveBeenCalled()
      expect(res.statusCode).toBe(200)
    })
  })

  describe('POST /apple/verify', () => {
    it('should handle apple verify successfully', async () => {
      const { handleAppleVerify } = await import('../services/paymentCallbackService')
      const { getOrderById } = await import('../services/orderService')

      vi.mocked(handleAppleVerify).mockResolvedValueOnce({ success: true })
      vi.mocked(getOrderById).mockReturnValueOnce({
        userId: 'user-1',
        productId: 'study_monthly'
      } as never)

      const handlers = getRouterHandlers()
      const handler = handlers.find(h => h.method === 'post' && h.path === '/apple/verify')!
      const req: MockReq = { body: { orderId: 'order-1', receipt: 'receipt-data' } }
      const res = createMockRes()
      await handler.handler(req, res)

      expect(handleAppleVerify).toHaveBeenCalledWith('order-1', 'receipt-data')
      expect(res.statusCode).toBe(200)
    })
  })
})
