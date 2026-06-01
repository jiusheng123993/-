import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../services/orderService', () => ({
  createOrder: vi.fn(),
  getOrderById: vi.fn(),
  getOrdersByUser: vi.fn(),
  refundOrder: vi.fn(),
  orderService: {
    getOrderById: vi.fn(),
    markAsPaid: vi.fn()
  }
}))

interface MockReq {
  body?: Record<string, unknown>
  params?: Record<string, string>
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

const VALID_ORDER_ID = 'order-abc123-xyz789'

describe('Orders Router', () => {
  let createOrdersRouter: typeof import('./orders').createOrdersRouter
  let mockOrderModule: typeof import('../services/orderService')

  beforeEach(async () => {
    vi.clearAllMocks()
    mockOrderModule = await import('../services/orderService')
    const ordersMod = await import('./orders')
    createOrdersRouter = ordersMod.createOrdersRouter
  })

  function getRouterHandlers() {
    const router = createOrdersRouter()
    const stack = (router as unknown as { stack: Array<{ route?: { path: string; stack: Array<{ method: string; handle: (req: MockReq, res: MockRes, next: () => void) => void }> } }> }).stack
    const handlers: Array<{ method: string; path: string; handler: (req: MockReq, res: MockRes, next?: () => void) => void | Promise<void> }> = []
    for (const layer of stack) {
      if (layer.route) {
        for (const h of layer.route.stack) {
          handlers.push({ method: h.method, path: layer.route.path, handler: (req, res, next) => h.handle(req, res, next || (() => {})) })
        }
      }
    }
    return handlers
  }

  function findHandler(method: string, path: string) {
    const handlers = getRouterHandlers()
    const handler = handlers.find(h => h.method === method && h.path === path)
    if (!handler) throw new Error(`Handler not found: ${method} ${path}`)
    return handler.handler
  }

  describe('POST /', () => {
    it('应该成功创建订单', async () => {
      vi.mocked(mockOrderModule.createOrder).mockReturnValueOnce({
        orderId: 'order-1',
        amount: 1800,
        channel: 'wechat',
        status: 'pending',
        createdAt: new Date().toISOString(),
        paymentParams: {}
      })

      const handler = findHandler('post', '/')
      const req: MockReq = {
        body: { userId: 'user-1', productId: 'study_monthly', channel: 'wechat' }
      }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(200)
      expect((res.body as { orderId: string }).orderId).toBe('order-1')
    })

    it('应该在 userId 缺失时返回 400', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = { body: { productId: 'study_monthly', channel: 'wechat' } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
      expect((res.body as { error: string }).error).toContain('userId')
    })

    it('应该在 userId 含特殊字符时拒绝（防注入）', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = { body: { userId: '../etc/passwd', productId: 'study_monthly', channel: 'wechat' } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
    })

    it('应该在 productId 缺失时返回 400', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = { body: { userId: 'user-1', channel: 'wechat' } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
      expect((res.body as { error: string }).error).toContain('productId')
    })

    it('应该在 productId 过长时返回 400', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = { body: { userId: 'user-1', productId: 'x'.repeat(100), channel: 'wechat' } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
    })

    it('应该在 channel 非法时返回 400', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = { body: { userId: 'user-1', productId: 'study_monthly', channel: 'invalid' } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
      expect((res.body as { error: string }).error).toContain('channel')
    })

    it('应该在产品不存在时返回 404', async () => {
      vi.mocked(mockOrderModule.createOrder).mockImplementationOnce(() => {
        throw new Error('Product not found: xxx')
      })
      const handler = findHandler('post', '/')
      const req: MockReq = { body: { userId: 'user-1', productId: 'unknown', channel: 'wechat' } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(404)
      expect((res.body as { error: string }).error).toBe('Product not found')
    })
  })

  describe('POST /:id/refund', () => {
    it('应该成功退款已支付订单', async () => {
      vi.mocked(mockOrderModule.orderService.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'u1', productId: 'p1', amount: 100, channel: 'wechat', status: 'paid', createdAt: 'x'
      })
      vi.mocked(mockOrderModule.refundOrder).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'u1', productId: 'p1', amount: 100, channel: 'wechat', status: 'refunded', createdAt: 'x'
      })
      const handler = findHandler('post', '/:id/refund')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, body: {} }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(200)
      expect((res.body as { status: string }).status).toBe('refunded')
    })

    it('应该拒绝订单 ID 格式非法', async () => {
      const handler = findHandler('post', '/:id/refund')
      const req: MockReq = { params: { id: '<script>alert(1)</script>' }, body: {} }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
    })

    it('应该在订单不存在时返回 404', async () => {
      vi.mocked(mockOrderModule.orderService.getOrderById).mockReturnValueOnce(undefined)
      const handler = findHandler('post', '/:id/refund')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, body: {} }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(404)
    })

    it('应该拒绝退款 pending 订单', async () => {
      vi.mocked(mockOrderModule.orderService.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'u1', productId: 'p1', amount: 100, channel: 'wechat', status: 'pending', createdAt: 'x'
      })
      const handler = findHandler('post', '/:id/refund')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, body: {} }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
      expect((res.body as { error: string }).error).toContain('pending')
    })

    it('应该拒绝重复退款（refunded 订单）', async () => {
      vi.mocked(mockOrderModule.orderService.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'u1', productId: 'p1', amount: 100, channel: 'wechat', status: 'refunded', createdAt: 'x'
      })
      const handler = findHandler('post', '/:id/refund')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, body: {} }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
      expect((res.body as { error: string }).error).toContain('refunded')
    })
  })

  describe('GET /:id', () => {
    it('应该返回订单详情', async () => {
      vi.mocked(mockOrderModule.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'u1', productId: 'p1', amount: 100, channel: 'wechat', status: 'paid', createdAt: 'x'
      })
      const handler = findHandler('get', '/:id')
      const req: MockReq = { params: { id: VALID_ORDER_ID } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(200)
    })

    it('应该拒绝非法格式订单 ID', async () => {
      const handler = findHandler('get', '/:id')
      const req: MockReq = { params: { id: '../../etc/passwd' } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
    })
  })

  describe('GET /user/:userId', () => {
    it('应该返回用户订单列表', async () => {
      vi.mocked(mockOrderModule.getOrdersByUser).mockReturnValueOnce([])
      const handler = findHandler('get', '/user/:userId')
      const req: MockReq = { params: { userId: 'user-1' } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(200)
    })

    it('应该拒绝非法 userId（防注入）', async () => {
      const handler = findHandler('get', '/user/:userId')
      const req: MockReq = { params: { userId: 'user@evil.com<script>' } }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
    })
  })

  describe('Route registration', () => {
    it('应该注册全部预期路由', () => {
      const handlers = getRouterHandlers()
      const routes = handlers.map(h => `${h.method.toUpperCase()} ${h.path}`)

      expect(routes).toContain('POST /')
      expect(routes).toContain('GET /:id')
      expect(routes).toContain('GET /user/:userId')
      expect(routes).toContain('POST /:id/refund')
      expect(routes).toContain('POST /:id/pay')
    })

    it('应该返回 Express Router 实例', () => {
      const router = createOrdersRouter()
      expect(router).toBeDefined()
      expect(typeof router).toBe('function')
    })
  })
})
