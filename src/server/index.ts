import express, { type Request, type Response, type NextFunction } from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { createOrdersRouter } from './routes/orders'
import { createPaymentRouter } from './routes/payment'
import { createAuthRouter } from './auth/authRoutes'
import { addClient, removeClient } from './websocket'

/**
 * Express Server - 星寰海后端服务
 *
 * 职责：
 * - 提供 RESTful API（认证、订单、支付回调）
 * - 提供 WebSocket 实时推送（支付状态通知）
 * - 全局 CORS 跨域支持（白名单）
 * - 全局异常处理与请求体大小限制
 * - 404 兜底
 *
 * 端口：3000（可通过 PORT 环境变量覆盖）
 * 安全配置：
 * - CORS：通过 CORS_ORIGIN 环境变量配置（默认 *，生产应限定域名）
 * - Body 限制：100kb 防止 DoS
 * - 错误响应脱敏，不返回堆栈
 */
const app = express()
const PORT = process.env.PORT || 3000
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'
const BODY_LIMIT = '100kb'
const WS_USER_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/

app.use(express.json({ limit: BODY_LIMIT }))

/**
 * 全局 CORS 中间件
 */
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', CORS_ORIGIN)
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('X-Content-Type-Options', 'nosniff')
  res.header('X-Frame-Options', 'DENY')
  if (req.method === 'OPTIONS') {
    res.sendStatus(204)
    return
  }
  next()
})

app.use('/api/auth', createAuthRouter())
app.use('/api/orders', createOrdersRouter())
app.use('/api/payment', createPaymentRouter())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

/**
 * 404 兜底
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Not Found: ${req.method} ${req.path}` })
})

/**
 * 全局异常处理中间件（必须 4 参数）
 * 不向外暴露堆栈与内部细节
 */
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[GlobalErrorHandler]', err.message)
  if (res.headersSent) return
  res.status(500).json({ error: 'Internal server error' })
})

const server = createServer(app)

const wss = new WebSocketServer({ server, path: '/ws/payment' })

wss.on('connection', (ws, req) => {
  try {
    const url = new URL(req.url || '', `http://localhost:${PORT}`)
    const userId = url.searchParams.get('userId')

    if (!userId || !WS_USER_ID_PATTERN.test(userId)) {
      ws.close(1008, 'Invalid userId')
      return
    }

    addClient(userId, ws as unknown as WebSocketLike)

    ws.on('close', () => {
      removeClient(userId, ws as unknown as WebSocketLike)
    })

    ws.on('error', (error) => {
      console.error('[WebSocket] error:', error.message)
      removeClient(userId, ws as unknown as WebSocketLike)
    })
  } catch (err) {
    console.error('[WebSocket] connection error:', (err as Error).message)
    ws.close(1011, 'Connection error')
  }
})

interface WebSocketLike {
  readyState: number
  send(data: string): void
  close(code?: number, reason?: string): void
}

/**
 * 优雅关闭：捕获 SIGINT/SIGTERM，停止接收新连接后退出
 */
const gracefulShutdown = (signal: string) => {
  console.log(`\n[Server] received ${signal}, shutting down gracefully...`)
  wss.close(() => console.log('[WebSocket] closed'))
  server.close(() => {
    console.log('[Server] closed')
    process.exit(0)
  })
  setTimeout(() => {
    console.error('[Server] forced shutdown')
    process.exit(1)
  }, 10000)
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📡 WebSocket available at ws://localhost:${PORT}/ws/payment`)
    console.log(`🔗 API endpoints:`)
    console.log(`   - GET  /health`)
    console.log(`   - POST /api/auth/register`)
    console.log(`   - POST /api/auth/login`)
    console.log(`   - POST /api/auth/refresh`)
    console.log(`   - POST /api/auth/logout`)
    console.log(`   - GET  /api/auth/session`)
    console.log(`   - POST /api/auth/bind-device`)
    console.log(`   - GET  /api/auth/devices`)
    console.log(`   - POST /api/orders`)
    console.log(`   - GET  /api/orders/:id`)
    console.log(`   - GET  /api/orders/user/:userId`)
    console.log(`   - POST /api/orders/:id/refund`)
    console.log(`   - POST /api/orders/:id/pay  (dev only)`)
    console.log(`   - POST /api/payment/wechat/callback`)
    console.log(`   - POST /api/payment/alipay/callback`)
    console.log(`   - POST /api/payment/apple/verify`)
  })
}

export { app, server }
