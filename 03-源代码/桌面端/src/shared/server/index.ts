import express, { type Request, type Response, type NextFunction } from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { createOrdersRouter } from './routes/orders'
import { createPaymentRouter } from './routes/payment'
import { createSyncRouter } from './routes/sync'
import { createAuthRouter } from './auth/authRoutes'
import { createPetsRouter } from './routes/pets'
import { createCheckinsRouter } from './routes/checkins'
import { createFoodRouter } from './routes/food'
import { createSymptomsRouter } from './routes/symptoms'
import { createVaccinesRouter } from './routes/vaccines'
import { createTrendsRouter } from './routes/trends'
import { createMembershipRouter } from './routes/membership'
import { createQuotasRouter } from './routes/quotas'
import { createEmotionsRouter } from './routes/emotions'
import { rateLimit, authRateLimit } from './middleware/rateLimit'
import { requestLogger } from './middleware/requestLogger'
import {
  addClient,
  removeClient,
  subscribeToSpace,
  unsubscribeFromSpace,
  broadcastToSpace,
  updatePresence,
  getPresence,
  authenticateWebSocket,
  type RealtimeMessage,
  type RealtimeMessageType
} from './websocket'

/**
 * Express Server - 星寰海后端服务
 *
 * 职责：
 * - 提供 RESTful API（认证、订单、支付回调、云同步）
 * - 提供 WebSocket 实时推送（支付状态通知、关系空间实时同步、专注PK实时通信）
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

app.use(requestLogger())

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

app.use('/api/auth', authRateLimit(), createAuthRouter())
app.use('/api/orders', rateLimit(), createOrdersRouter())
app.use('/api/payment', rateLimit(), createPaymentRouter())
app.use('/api/sync', rateLimit(), createSyncRouter())
app.use('/api/pets', rateLimit(), createPetsRouter())
app.use('/api/pets/:petId/checkins', rateLimit(), createCheckinsRouter())
app.use('/api/food-queries', rateLimit(), createFoodRouter())
app.use('/api/pets/:petId/symptom-checks', rateLimit(), createSymptomsRouter())
app.use('/api/pets/:petId/vaccines', rateLimit(), createVaccinesRouter())
app.use('/api/pets/:petId/trends', rateLimit(), createTrendsRouter())
app.use('/api/membership', rateLimit(), createMembershipRouter())
app.use('/api/quotas', rateLimit(), createQuotasRouter())
app.use('/api/emotions', rateLimit(), createEmotionsRouter())

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
    const token = url.searchParams.get('token')

    const auth = authenticateWebSocket(token || '')
    if (!auth.valid || !auth.userId) {
      ws.close(1008, 'Authentication required')
      return
    }

    const userId = auth.userId
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

const VALID_MESSAGE_TYPES: Set<string> = new Set([
  'task_push', 'task_accept', 'task_reject', 'task_complete',
  'habit_check', 'focus_start', 'focus_end',
  'focus_pk_invite', 'focus_pk_accept', 'focus_pk_reject', 'focus_pk_complete',
  'ranking_update', 'member_join', 'member_leave',
  'space_update', 'anniversary_remind', 'goal_progress', 'presence_update'
])

const realtimeWss = new WebSocketServer({ server, path: '/ws/realtime' })

realtimeWss.on('connection', (ws, req) => {
  try {
    const url = new URL(req.url || '', `http://localhost:${PORT}`)
    const token = url.searchParams.get('token')
    const spaceIdsParam = url.searchParams.get('spaceIds')

    const auth = authenticateWebSocket(token || '')
    if (!auth.valid || !auth.userId) {
      ws.close(1008, 'Authentication required')
      return
    }

    const userId = auth.userId
    addClient(userId, ws as unknown as WebSocketLike)

    const spaceIds = spaceIdsParam
      ? spaceIdsParam.split(',').filter(id => /^[a-zA-Z0-9_-]{1,64}$/.test(id))
      : []

    spaceIds.forEach(spaceId => {
      subscribeToSpace(userId, ws as unknown as WebSocketLike, spaceId)
    })

    spaceIds.forEach(spaceId => {
      updatePresence(userId, spaceId, 'online')
    })

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as RealtimeMessage & { action?: string }

        if (msg.action === 'subscribe' && msg.spaceId) {
          subscribeToSpace(userId, ws as unknown as WebSocketLike, msg.spaceId)
          updatePresence(userId, msg.spaceId, 'online')
          return
        }

        if (msg.action === 'unsubscribe' && msg.spaceId) {
          unsubscribeFromSpace(userId, ws as unknown as WebSocketLike, msg.spaceId)
          return
        }

        if (msg.action === 'presence' && msg.spaceId) {
          const presences = getPresence(msg.spaceId)
          ws.send(JSON.stringify({
            type: 'presence_list',
            spaceId: msg.spaceId,
            presences
          }))
          return
        }

        if (!msg.type || !msg.spaceId || !msg.senderId) {
          ws.send(JSON.stringify({ error: 'Missing required fields: type, spaceId, senderId' }))
          return
        }

        if (!VALID_MESSAGE_TYPES.has(msg.type)) {
          ws.send(JSON.stringify({ error: `Invalid message type: ${msg.type}` }))
          return
        }

        const message: RealtimeMessage = {
          id: msg.id || `srv_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          type: msg.type as RealtimeMessageType,
          spaceId: msg.spaceId,
          senderId: msg.senderId,
          targetId: msg.targetId,
          payload: msg.payload || {},
          timestamp: msg.timestamp || new Date().toISOString()
        }

        if (message.targetId) {
          broadcastToSpace(message.spaceId, message)
        } else {
          broadcastToSpace(message.spaceId, message, message.senderId)
        }
      } catch (err) {
        console.error('[RealtimeWS] message error:', (err as Error).message)
        ws.send(JSON.stringify({ error: 'Invalid message format' }))
      }
    })

    ws.on('close', () => {
      spaceIds.forEach(spaceId => {
        updatePresence(userId, spaceId, 'offline')
        unsubscribeFromSpace(userId, ws as unknown as WebSocketLike, spaceId)
      })
      removeClient(userId, ws as unknown as WebSocketLike)
    })

    ws.on('error', (error) => {
      console.error('[RealtimeWS] error:', error.message)
      spaceIds.forEach(spaceId => {
        updatePresence(userId, spaceId, 'offline')
        unsubscribeFromSpace(userId, ws as unknown as WebSocketLike, spaceId)
      })
      removeClient(userId, ws as unknown as WebSocketLike)
    })
  } catch (err) {
    console.error('[RealtimeWS] connection error:', (err as Error).message)
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
  wss.close(() => console.log('[WebSocket payment] closed'))
  realtimeWss.close(() => console.log('[WebSocket realtime] closed'))
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
    console.log(`📡 WebSocket payment at ws://localhost:${PORT}/ws/payment`)
    console.log(`📡 WebSocket realtime at ws://localhost:${PORT}/ws/realtime`)
    console.log(`🔗 API endpoints:`)
    const routes: [string, string][] = [
      ['GET', '/health'],
      ['POST', '/api/auth/register'],
      ['POST', '/api/auth/login'],
      ['POST', '/api/auth/refresh'],
      ['POST', '/api/auth/logout'],
      ['GET', '/api/auth/session'],
      ['POST', '/api/auth/bind-device'],
      ['GET', '/api/auth/devices'],
      ['POST', '/api/orders'],
      ['GET', '/api/orders/:id'],
      ['GET', '/api/orders/user/:userId'],
      ['POST', '/api/orders/:id/refund'],
      ['POST', '/api/orders/:id/pay  (dev only)'],
      ['POST', '/api/payment/wechat/callback'],
      ['POST', '/api/payment/alipay/callback'],
      ['POST', '/api/payment/apple/verify'],
      ['POST', '/api/sync/push'],
      ['GET', '/api/sync/pull'],
      ['POST', '/api/sync/conflict'],
      ['GET', '/api/sync/status'],
      ['POST', '/api/pets'],
      ['GET', '/api/pets'],
      ['GET', '/api/pets/:petId'],
      ['PUT', '/api/pets/:petId'],
      ['DELETE', '/api/pets/:petId'],
      ['POST', '/api/pets/:petId/checkins'],
      ['GET', '/api/pets/:petId/checkins'],
      ['GET', '/api/pets/:petId/checkins/:date'],
      ['POST', '/api/food-queries'],
      ['GET', '/api/food-queries'],
      ['POST', '/api/pets/:petId/symptom-checks'],
      ['GET', '/api/pets/:petId/symptom-checks'],
      ['POST', '/api/pets/:petId/vaccines'],
      ['GET', '/api/pets/:petId/vaccines/upcoming'],
      ['GET', '/api/pets/:petId/vaccines'],
      ['PUT', '/api/pets/:petId/vaccines/:vaccineId'],
      ['GET', '/api/pets/:petId/trends'],
      ['GET', '/api/pets/:petId/trends/monthly-report'],
      ['GET', '/api/membership'],
      ['POST', '/api/membership/subscribe'],
      ['GET', '/api/quotas'],
      ['POST', '/api/quotas/:quotaType/use'],
      ['POST', '/api/emotions/trigger'],
      ['GET', '/api/emotions/triggers'],
      ['POST', '/api/emotions/grief-session'],
      ['POST', '/api/emotions/grief-session/:sessionId/message'],
    ]
    for (const [method, path] of routes) {
      console.log(`   - ${method.padEnd(6)} ${path}`)
    }
  })
}

export { app, server }
