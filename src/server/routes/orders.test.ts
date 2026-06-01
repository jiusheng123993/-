import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

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
  headers?: Record<string, string>
  auth?: { userId: string; role: 'user' | 'admin' }
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
const userAuth = (userId = 'user-1') => ({ authorization: `Bearer dev-user:${userId}` })
const adminAuth = (adminId = 'admin-1') => ({ authorization: `Bearer dev-admin:${adminId}` })

describe('Orders Router', () => {
  let createOrdersRouter: typeof import('./orders').createOrdersRouter
  let mockOrderModule: typeof import('../services/orderService')
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(async () => {
    vi.clearAllMocks()
    process.env.NODE_ENV = 'test'
    mockOrderModule = await import('../services/orderService')
    const ordersMod = await import('./orders')
    createOrdersRouter = ordersMod.createOrdersRouter
  })

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv
  })

  function getRouterHandlers() {
    const router = createOrdersRouter()
    const stack = (router as unknown as { stack: Array<{ route?: { path: string; stack: Array<{ method: string; handle: (req: MockReq, res: MockRes, next: () => void) => void | Promise<void> }> } }> }).stack
    const handlers: Array<{ method: string; path: string; handlers: Array<(req: MockReq, res: MockRes, next: () => void) => void | Promise<void>> }> = []
    for (const layer of stack) {
      if (layer.route) {
        handlers.push({ method: layer.route.stack[0].method, path: layer.route.path, handlers: layer.route.stack.map(h => h.handle) })
      }
    }
    return handlers
  }

  function findHandler(method: string, path: string) {
    const handlers = getRouterHandlers()
    const route = handlers.find(h => h.method === method && h.path === path)
    if (!route) throw new Error(`Handler not found: ${method} ${path}`)
    return async (req: MockReq, res: MockRes) => {
      let index = 0
      const next = async () => {
        const handler = route.handlers[index]
        index += 1
        if (handler) await handler(req, res, next)
      }
      await next()
    }
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
        body: { userId: 'user-1', productId: 'study_monthly', channel: 'wechat' },
        headers: userAuth('user-1')
      }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(200)
      expect((res.body as { orderId: string }).orderId).toBe('order-1')
    })

    it('应该在缺少鉴权时返回 401', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = { body: { userId: 'user-1', productId: 'study_monthly', channel: 'wechat' }, headers: {} }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(401)
    })

    it('应该拒绝用户为他人创建订单', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = {
        body: { userId: 'user-2', productId: 'study_monthly', channel: 'wechat' },
        headers: userAuth('user-1')
      }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(403)
    })

    it('应该允许管理员为他人创建订单', async () => {
      vi.mocked(mockOrderModule.createOrder).mockReturnValueOnce({
        orderId: 'order-1', amount: 1800, channel: 'wechat', status: 'pending', createdAt: 'x', paymentParams: {}
      })
      const handler = findHandler('post', '/')
      const req: MockReq = {
        body: { userId: 'user-2', productId: 'study_monthly', channel: 'wechat' },
        headers: adminAuth()
      }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(200)
    })

    it('应该在 userId 缺失时返回 400', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = { body: { productId: 'study_monthly', channel: 'wechat' }, headers: userAuth('user-1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
      expect((res.body as { error: string }).error).toContain('userId')
    })

    it('应该在 userId 含特殊字符时拒绝（防注入）', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = { body: { userId: '../etc/passwd', productId: 'study_monthly', channel: 'wechat' }, headers: userAuth('user-1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
    })

    it('应该在 productId 缺失时返回 400', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = { body: { userId: 'user-1', channel: 'wechat' }, headers: userAuth('user-1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
      expect((res.body as { error: string }).error).toContain('productId')
    })

    it('应该在 productId 过长时返回 400', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = { body: { userId: 'user-1', productId: 'x'.repeat(100), channel: 'wechat' }, headers: userAuth('user-1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
    })

    it('应该在 channel 非法时返回 400', async () => {
      const handler = findHandler('post', '/')
      const req: MockReq = { body: { userId: 'user-1', productId: 'study_monthly', channel: 'invalid' }, headers: userAuth('user-1') }
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
      const req: MockReq = { body: { userId: 'user-1', productId: 'unknown', channel: 'wechat' }, headers: userAuth('user-1') }
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
      const req: MockReq = { params: { id: VALID_ORDER_ID }, body: {}, headers: userAuth('u1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(200)
      expect((res.body as { status: string }).status).toBe('refunded')
    })

    it('应该拒绝用户退款他人订单', async () => {
      vi.mocked(mockOrderModule.orderService.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'u2', productId: 'p1', amount: 100, channel: 'wechat', status: 'paid', createdAt: 'x'
      })
      const handler = findHandler('post', '/:id/refund')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, body: {}, headers: userAuth('u1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(403)
    })

    it('应该拒绝订单 ID 格式非法', async () => {
      const handler = findHandler('post', '/:id/refund')
      const req: MockReq = { params: { id: '<script>alert(1)</script>' }, body: {}, headers: userAuth('u1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
    })

    it('应该在订单不存在时返回 404', async () => {
      vi.mocked(mockOrderModule.orderService.getOrderById).mockReturnValueOnce(undefined)
      const handler = findHandler('post', '/:id/refund')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, body: {}, headers: userAuth('u1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(404)
    })

    it('应该拒绝退款 pending 订单', async () => {
      vi.mocked(mockOrderModule.orderService.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'u1', productId: 'p1', amount: 100, channel: 'wechat', status: 'pending', createdAt: 'x'
      })
      const handler = findHandler('post', '/:id/refund')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, body: {}, headers: userAuth('u1') }
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
      const req: MockReq = { params: { id: VALID_ORDER_ID }, body: {}, headers: userAuth('u1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
      expect((res.body as { error: string }).error).toContain('refunded')
    })
  })

  describe('GET /:id', () => {
    it('应该返回本人订单详情', async () => {
      vi.mocked(mockOrderModule.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'u1', productId: 'p1', amount: 100, channel: 'wechat', status: 'paid', createdAt: 'x'
      })
      const handler = findHandler('get', '/:id')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, headers: userAuth('u1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(200)
    })

    it('应该拒绝用户查询他人订单', async () => {
      vi.mocked(mockOrderModule.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'u2', productId: 'p1', amount: 100, channel: 'wechat', status: 'paid', createdAt: 'x'
      })
      const handler = findHandler('get', '/:id')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, headers: userAuth('u1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(403)
    })

    it('应该允许管理员查询任意订单', async () => {
      vi.mocked(mockOrderModule.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'u2', productId: 'p1', amount: 100, channel: 'wechat', status: 'paid', createdAt: 'x'
      })
      const handler = findHandler('get', '/:id')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, headers: adminAuth() }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(200)
    })

    it('应该拒绝非法格式订单 ID', async () => {
      const handler = findHandler('get', '/:id')
      const req: MockReq = { params: { id: '../../etc/passwd' }, headers: userAuth('u1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
    })
  })

  describe('GET /user/:userId', () => {
    it('应该返回本人订单列表', async () => {
      vi.mocked(mockOrderModule.getOrdersByUser).mockReturnValueOnce([])
      const handler = findHandler('get', '/user/:userId')
      const req: MockReq = { params: { userId: 'user-1' }, headers: userAuth('user-1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(200)
    })

    it('应该拒绝用户查询他人订单列表', async () => {
      const handler = findHandler('get', '/user/:userId')
      const req: MockReq = { params: { userId: 'user-2' }, headers: userAuth('user-1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(403)
    })

    it('应该拒绝非法 userId（防注入）', async () => {
      const handler = findHandler('get', '/user/:userId')
      const req: MockReq = { params: { userId: 'user@evil.com<script>' }, headers: userAuth('user-1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(400)
    })
  })

  describe('POST /:id/pay', () => {
    it('应该拒绝非管理员访问开发支付接口', async () => {
      vi.mocked(mockOrderModule.orderService.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'user-1', productId: 'p1', amount: 100, channel: 'wechat', status: 'pending', createdAt: 'x'
      })
      const handler = findHandler('post', '/:id/pay')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, body: {}, headers: userAuth('user-1') }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(403)
    })

    it('应该允许管理员在开发环境确认支付', async () => {
      vi.mocked(mockOrderModule.orderService.getOrderById).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'user-1', productId: 'p1', amount: 100, channel: 'wechat', status: 'pending', createdAt: 'x'
      }).mockReturnValueOnce({
        id: VALID_ORDER_ID, userId: 'user-1', productId: 'p1', amount: 100, channel: 'wechat', status: 'paid', createdAt: 'x'
      })
      const handler = findHandler('post', '/:id/pay')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, body: { channelTradeNo: 'mock-trade' }, headers: adminAuth() }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(200)
      expect(mockOrderModule.orderService.markAsPaid).toHaveBeenCalledWith(VALID_ORDER_ID, 'mock-trade', 'mock receipt')
    })

    it('应该在生产环境禁用开发支付接口', async () => {
      process.env.NODE_ENV = 'production'
      const handler = findHandler('post', '/:id/pay')
      const req: MockReq = { params: { id: VALID_ORDER_ID }, body: {}, headers: adminAuth() }
      const res = createMockRes()
      await handler(req, res)

      expect(res.statusCode).toBe(403)
      expect((res.body as { error: string }).error).toContain('disabled')
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

    it('应该把 /user/:userId 注册在 /:id 前面，避免真实 Express 路由误匹配', () => {
      const routes = getRouterHandlers().map(h => `${h.method.toUpperCase()} ${h.path}`)
      expect(routes.indexOf('GET /user/:userId')).toBeLessThan(routes.indexOf('GET /:id'))
    })

    it('应该返回 Express Router 实例', () => {
      const router = createOrdersRouter()
      expect(router).toBeDefined()
      expect(typeof router).toBe('function')
    })
  })
})
