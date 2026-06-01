import express from 'express'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'
import { createOrdersRouter } from './routes/orders'
import { createPaymentRouter } from './routes/payment'
import { addClient, removeClient } from './websocket'

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())

app.use('/api/orders', createOrdersRouter())
app.use('/api/payment', createPaymentRouter())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const server = createServer(app)

const wss = new WebSocketServer({ server, path: '/ws/payment' })

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://localhost:${PORT}`)
  const userId = url.searchParams.get('userId')

  if (!userId) {
    ws.close(1008, 'userId is required')
    return
  }

  addClient(userId, ws as unknown as WebSocketLike)

  ws.on('close', () => {
    removeClient(userId, ws as unknown as WebSocketLike)
  })

  ws.on('error', (error) => {
    console.error('WebSocket error:', error)
    removeClient(userId, ws as unknown as WebSocketLike)
  })
})

interface WebSocketLike {
  readyState: number
  send(data: string): void
  close(code?: number, reason?: string): void
}

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📡 WebSocket available at ws://localhost:${PORT}/ws/payment`)
  console.log(`🔗 API endpoints:`)
  console.log(`   - POST /api/orders`)
  console.log(`   - GET  /api/orders/:id`)
  console.log(`   - GET  /api/orders/user/:userId`)
  console.log(`   - POST /api/payment/wechat/callback`)
  console.log(`   - POST /api/payment/alipay/callback`)
  console.log(`   - POST /api/payment/apple/verify`)
})

export { app, server }
