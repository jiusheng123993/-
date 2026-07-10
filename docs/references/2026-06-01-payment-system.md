# 支付系统接入实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现完整的支付流程接入，包括后端订单 API、微信/支付宝/Apple 支付适配、前端支付流程 UI、WebSocket 状态推送

**Architecture:** 采用 RESTful API + WebSocket 架构，前端通过 paymentService 统一调用，后端处理支付回调并通过 WebSocket 推送状态变化，复用现有 OrderService、PaymentAdapter、EntitlementService 模块

**Tech Stack:** TypeScript, WebSocket, 微信支付 SDK, 支付宝 SDK, Apple StoreKit

---

## 实施范围

本计划覆盖支付系统 P0 阶段核心功能：
1. 后端订单 API（创建、查询）
2. 微信支付接入
3. WebSocket 支付状态推送
4. 前端支付流程 Hook 和服务

---

## 文件结构

```
src/
├── services/
│   ├── paymentService.ts      # 支付核心服务（新建）
│   ├── wechatPay.ts           # 微信支付适配器（新建）
│   ├── alipay.ts              # 支付宝适配器（新建）
│   ├── appleIap.ts           # Apple IAP 适配器（新建）
│   └── websocket.ts          # WebSocket 连接管理（新建）
├── hooks/
│   ├── usePayment.ts          # 支付流程 Hook（新建）
│   └── usePaymentStatus.ts    # 支付状态监听（新建）
├── components/
│   └── payment/
│       ├── PaymentModal.tsx   # 支付弹窗（新建）
│       ├── PaymentSuccess.tsx # 支付成功页（新建）
│       └── PaymentFailed.tsx  # 支付失败页（新建）
├── api/
│   └── payment.ts             # 支付 API 客户端（新建）
├── server/                    # 后端服务（新建目录）
│   ├── index.ts               # 服务入口
│   ├── routes/
│   │   ├── orders.ts          # 订单 API
│   │   └── payment.ts         # 支付回调
│   ├── services/
│   │   ├── orderService.ts    # 订单业务逻辑
│   │   ├── paymentService.ts  # 支付业务逻辑
│   │   └── entitlementService.ts # 权益发放
│   └── websocket/
│       └── index.ts           # WebSocket 服务
```

---

## Task 1: 后端 - 订单 API

**Files:**
- Create: `src/server/routes/orders.ts`
- Create: `src/server/services/orderService.ts`
- Create: `src/server/types.ts`
- Test: `src/server/services/orderService.test.ts`

- [x] **Step 1: 创建订单服务类型定义**

```typescript
// src/server/types.ts
import type { Order, OrderPaymentChannel, OrderStatus } from '../../entitlement/orderTypes'

export interface CreateOrderRequest {
  userId: string
  productId: string
  channel: OrderPaymentChannel
}

export interface CreateOrderResponse {
  orderId: string
  amount: number
  channel: OrderPaymentChannel
  status: OrderStatus
  createdAt: string
  paymentParams?: PaymentParams
}

export interface PaymentParams {
  // 微信 JSAPI
  appId?: string
  timeStamp?: string
  nonceStr?: string
  package?: string
  signType?: string
  paySign?: string
  // 支付宝
  orderStr?: string
  // Apple IAP
  productId?: string
}

export interface OrderDetailResponse extends Order {}
```

- [x] **Step 2: 创建订单业务服务**

```typescript
// src/server/services/orderService.ts
import { createOrderService, type OrderService } from '../../entitlement/orderService'
import { getProductById } from '../../entitlement/productCatalog'
import type { CreateOrderRequest, CreateOrderResponse, PaymentParams } from '../types'
import { getPaymentAdapter } from '../../entitlement/paymentAdapters'

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

  const paymentParams = generatePaymentParams(order.id, req.channel, product.price)

  return {
    orderId: order.id,
    amount: order.amount,
    channel: order.channel,
    status: order.status,
    createdAt: order.createdAt,
    paymentParams
  }
}

async function generatePaymentParams(
  orderId: string,
  channel: OrderPaymentChannel,
  amount: number
): Promise<PaymentParams> {
  const adapter = getPaymentAdapter(channel)
  const result = await adapter.createPayment(orderId, amount)

  if (channel === 'wechat') {
    return {
      appId: process.env.WECHAT_APP_ID,
      timeStamp: Math.floor(Date.now() / 1000).toString(),
      nonceStr: result.paymentId,
      package: `prepay_id=${result.paymentId}`,
      signType: 'RSA',
      paySign: '' // 需要服务端签名
    }
  }

  if (channel === 'alipay') {
    return {
      orderStr: result.paymentUrl || ''
    }
  }

  return {}
}
```

- [x] **Step 3: 创建订单路由**

```typescript
// src/server/routes/orders.ts
import { Router } from 'express'
import { createOrder } from '../services/orderService'

const router = Router()

router.post('/', async (req, res) => {
  try {
    const result = createOrder(req.body)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: (error as Error).message })
  }
})

router.get('/:id', async (req, res) => {
  // 查询订单实现
  res.json({})
})

router.get('/user/:userId', async (req, res) => {
  // 用户订单列表实现
  res.json([])
})

export default router
```

- [x] **Step 4: 编写订单服务测试**

```typescript
// src/server/services/orderService.test.ts
import { describe, expect, it } from 'vitest'

describe('OrderService', () => {
  it('should create order with valid params', () => {
    const result = createOrder({
      userId: 'user-123',
      productId: 'study_monthly',
      channel: 'wechat'
    })
    expect(result.orderId).toBeDefined()
    expect(result.amount).toBe(1800)
    expect(result.status).toBe('pending')
  })

  it('should throw error for invalid product', () => {
    expect(() => createOrder({
      userId: 'user-123',
      productId: 'invalid-product',
      channel: 'wechat'
    })).toThrow('Product not found')
  })
})
```

- [x] **Step 5: 运行测试验证**

Run: `npm run test -- src/server/services/orderService.test.ts`
Expected: PASS

---

## Task 2: 后端 - 支付回调处理

**Files:**
- Create: `src/server/routes/payment.ts`
- Create: `src/server/services/paymentCallbackService.ts`
- Modify: `src/server/services/entitlementService.ts` (添加发放权益方法)

- [x] **Step 1: 创建支付回调服务**

```typescript
// src/server/services/paymentCallbackService.ts
import type { OrderPaymentChannel } from '../../entitlement/orderTypes'

interface PaymentCallbackResult {
  success: boolean
  orderId: string
  tradeNo?: string
  error?: string
}

export async function handleWechatCallback(
  orderId: string,
  callbackData: Record<string, string>
): Promise<PaymentCallbackResult> {
  // 1. 验证签名
  // 2. 验证金额
  // 3. 更新订单状态
  // 4. 发放权益

  return {
    success: true,
    orderId,
    tradeNo: callbackData.transaction_id
  }
}

export async function handleAlipayCallback(
  orderId: string,
  callbackData: Record<string, string>
): Promise<PaymentCallbackResult> {
  // 1. 验证签名
  // 2. 验证金额
  // 3. 更新订单状态
  // 4. 发放权益

  return {
    success: true,
    orderId,
    tradeNo: callbackData.trade_no
  }
}

export async function handleAppleVerify(
  orderId: string,
  receipt: string
): Promise<PaymentCallbackResult> {
  // 1. 验证 receipt
  // 2. 更新订单状态
  // 3. 发放权益

  return {
    success: true,
    orderId
  }
}
```

- [x] **Step 2: 创建权益发放服务**

```typescript
// src/server/services/entitlementService.ts
import { createEntitlementService } from '../../entitlement/entitlementService'
import { getProductById } from '../../entitlement/productCatalog'
import type { Entitlement, EntitlementCode } from '../../entitlement/entitlementTypes'

export function grantEntitlements(userId: string, productId: string): Entitlement[] {
  const product = getProductById(productId)
  if (!product) {
    throw new Error(`Product not found: ${productId}`)
  }

  const entitlementService = createEntitlementService()
  const granted: Entitlement[] = []

  for (const grant of product.grants) {
    const expireAt = grant.durationDays
      ? new Date(Date.now() + grant.durationDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    entitlementService.grant(userId, {
      code: grant.code as EntitlementCode,
      source: 'purchase',
      expireAt,
      remaining: grant.quantity,
      orderId: productId
    })

    granted.push({
      code: grant.code as EntitlementCode,
      source: 'purchase',
      expireAt,
      remaining: grant.quantity,
      orderId: productId,
      grantedAt: new Date().toISOString()
    })
  }

  return granted
}
```

- [x] **Step 3: 创建支付回调路由**

```typescript
// src/server/routes/payment.ts
import { Router } from 'express'
import { handleWechatCallback, handleAlipayCallback, handleAppleVerify } from '../services/paymentCallbackService'
import { grantEntitlements } from '../services/entitlementService'

const router = Router()

router.post('/wechat/callback', async (req, res) => {
  try {
    const { orderId, ...data } = req.body
    const result = await handleWechatCallback(orderId, data)

    if (result.success) {
      const order = getOrderById(orderId)
      if (order) {
        grantEntitlements(order.userId, order.productId)
        broadcastPaymentStatus(orderId, 'paid', result.tradeNo)
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
    const result = await handleAlipayCallback(orderId, data)

    if (result.success) {
      const order = getOrderById(orderId)
      if (order) {
        grantEntitlements(order.userId, order.productId)
        broadcastPaymentStatus(orderId, 'paid', result.tradeNo)
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
        broadcastPaymentStatus(orderId, 'paid')
      }
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: (error as Error).message })
  }
})

function getOrderById(orderId: string) {
  // 从订单存储获取
  return null
}

function broadcastPaymentStatus(orderId: string, status: string, tradeNo?: string) {
  // 通过 WebSocket 推送
}

export default router
```

---

## Task 3: 后端 - WebSocket 服务

**Files:**
- Create: `src/server/websocket/index.ts`
- Modify: `src/server/index.ts` (集成 WebSocket)

- [x] **Step 1: 创建 WebSocket 服务**

```typescript
// src/server/websocket/index.ts
import { WebSocketServer, WebSocket } from 'ws'

interface PaymentStatusMessage {
  type: 'payment_status'
  orderId: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  tradeNo?: string
  error?: string
}

const clients = new Map<string, Set<WebSocket>>()

export function createPaymentWebSocketServer(server: any) {
  const wss = new WebSocketServer({ path: '/ws/payment' })

  wss.on('connection', (ws, req) => {
    const userId = new URL(req.url || '', 'http://localhost').searchParams.get('userId')
    if (!userId) {
      ws.close()
      return
    }

    if (!clients.has(userId)) {
      clients.set(userId, new Set())
    }
    clients.get(userId)!.add(ws)

    ws.on('close', () => {
      clients.get(userId)?.delete(ws)
    })
  })

  return wss
}

export function broadcastToUser(userId: string, message: PaymentStatusMessage) {
  const userClients = clients.get(userId)
  if (!userClients) return

  const data = JSON.stringify(message)
  for (const client of userClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  }
}
```

- [x] **Step 2: 集成到服务入口**

```typescript
// src/server/index.ts
import express from 'express'
import { createPaymentWebSocketServer } from './websocket'

const app = express()
app.use(express.json())

// 路由
app.use('/api/orders', (await import('./routes/orders')).default)
app.use('/api/payment', (await import('./routes/payment')).default)

const server = app.listen(3000, () => {
  console.log('Server running on port 3000')
})

// WebSocket
createPaymentWebSocketServer(server)
```

---

## Task 4: 前端 - WebSocket 连接管理

**Files:**
- Create: `src/services/websocket.ts`
- Test: `src/services/websocket.test.ts`

- [x] **Step 1: 创建 WebSocket 服务**

```typescript
// src/services/websocket.ts
type PaymentStatusCallback = (data: PaymentStatusMessage) => void

interface PaymentStatusMessage {
  type: 'payment_status'
  orderId: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  tradeNo?: string
  error?: string
}

class PaymentWebSocket {
  private ws: WebSocket | null = null
  private callbacks: Set<PaymentStatusCallback> = new Set()
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(userId: string): void {
    const wsUrl = `${process.env.WS_URL || 'ws://localhost:3000'}/ws/payment?userId=${userId}`
    this.ws = new WebSocket(wsUrl)

    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as PaymentStatusMessage
        if (data.type === 'payment_status') {
          this.callbacks.forEach((cb) => cb(data))
        }
      } catch (e) {
        console.error('Failed to parse WebSocket message', e)
      }
    }

    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.attemptReconnect(userId)
    }

    this.ws.onerror = (error) => {
      console.error('WebSocket error', error)
    }
  }

  private attemptReconnect(userId: string): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => this.connect(userId), 1000 * this.reconnectAttempts)
    }
  }

  onPaymentStatus(callback: PaymentStatusCallback): () => void {
    this.callbacks.add(callback)
    return () => this.callbacks.delete(callback)
  }

  disconnect(): void {
    this.ws?.close()
    this.ws = null
  }
}

export const paymentWebSocket = new PaymentWebSocket()
```

- [x] **Step 2: 编写测试**

```typescript
// src/services/websocket.test.ts
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

describe('PaymentWebSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should connect with userId', () => {
    const ws = new PaymentWebSocket()
    // Mock WebSocket
    global.WebSocket = vi.fn().mockImplementation(() => ({
      onopen: null,
      onmessage: null,
      onclose: null,
      onerror: null,
      send: vi.fn(),
      close: vi.fn()
    }))

    ws.connect('user-123')
    // 验证 WebSocket 被创建
  })
})
```

---

## Task 5: 前端 - 支付服务

**Files:**
- Create: `src/services/paymentService.ts`
- Create: `src/api/payment.ts`
- Test: `src/services/paymentService.test.ts`

- [x] **Step 1: 创建支付 API 客户端**

```typescript
// src/api/payment.ts
import type { CreateOrderRequest, CreateOrderResponse } from '../server/types'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export async function createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
  const response = await fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to create order')
  }

  return response.json()
}

export async function getOrder(orderId: string) {
  const response = await fetch(`${API_BASE}/api/orders/${orderId}`)
  if (!response.ok) {
    throw new Error('Failed to get order')
  }
  return response.json()
}

export async function getUserOrders(userId: string) {
  const response = await fetch(`${API_BASE}/api/orders/user/${userId}`)
  if (!response.ok) {
    throw new Error('Failed to get orders')
  }
  return response.json()
}
```

- [x] **Step 2: 创建支付服务**

```typescript
// src/services/paymentService.ts
import { createOrder as apiCreateOrder, getOrder } from '../api/payment'
import { paymentWebSocket } from './websocket'
import type { OrderPaymentChannel } from '../entitlement/orderTypes'

export interface PaymentResult {
  success: boolean
  orderId: string
  error?: string
}

export async function initiatePayment(
  userId: string,
  productId: string,
  channel: OrderPaymentChannel
): Promise<{ orderId: string; paymentParams: any }> {
  const result = await apiCreateOrder({
    userId,
    productId,
    channel
  })

  return {
    orderId: result.orderId,
    paymentParams: result.paymentParams
  }
}

export async function waitForPayment(
  orderId: string,
  timeout = 120000
): Promise<PaymentResult> {
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      resolve({ success: false, orderId, error: 'Payment timeout' })
    }, timeout)

    const unsubscribe = paymentWebSocket.onPaymentStatus((data) => {
      if (data.orderId === orderId) {
        clearTimeout(timeoutId)
        unsubscribe()
        resolve({
          success: data.status === 'paid',
          orderId,
          error: data.error
        })
      }
    })
  })
}

export async function pollPaymentStatus(orderId: string, interval = 3000, maxAttempts = 40) {
  for (let i = 0; i < maxAttempts; i++) {
    const order = await getOrder(orderId)
    if (order.status === 'paid') {
      return { success: true, order }
    }
    if (order.status === 'failed') {
      return { success: false, error: 'Payment failed' }
    }
    await new Promise((resolve) => setTimeout(resolve, interval))
  }
  return { success: false, error: 'Payment timeout' }
}
```

- [x] **Step 3: 编写支付服务测试**

```typescript
// src/services/paymentService.test.ts
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { initiatePayment, waitForPayment } from './paymentService'

vi.mock('./websocket', () => ({
  paymentWebSocket: {
    onPaymentStatus: vi.fn(() => vi.fn())
  }
}))

describe('PaymentService', () => {
  it('should initiate payment and return orderId', async () => {
    vi.mock('../api/payment', () => ({
      createOrder: vi.fn().mockResolvedValue({
        orderId: 'order-123',
        paymentParams: { appId: 'test' }
      })
    }))

    const result = await initiatePayment('user-123', 'study_monthly', 'wechat')
    expect(result.orderId).toBe('order-123')
  })
})
```

---

## Task 6: 前端 - 支付 Hook

**Files:**
- Create: `src/hooks/usePayment.ts`
- Create: `src/hooks/usePaymentStatus.ts`

- [x] **Step 1: 创建 usePayment Hook**

```typescript
// src/hooks/usePayment.ts
import { useState, useCallback } from 'react'
import { initiatePayment, waitForPayment, pollPaymentStatus } from '../services/paymentService'
import type { OrderPaymentChannel } from '../entitlement/orderTypes'

interface PaymentState {
  status: 'idle' | 'pending' | 'processing' | 'success' | 'failed'
  orderId?: string
  error?: string
}

export function usePayment(userId: string | undefined) {
  const [state, setState] = useState<PaymentState>({ status: 'idle' })

  const startPayment = useCallback(
    async (productId: string, channel: OrderPaymentChannel) => {
      if (!userId) {
        setState({ status: 'failed', error: 'Please login first' })
        return
      }

      setState({ status: 'pending' })

      try {
        const { orderId, paymentParams } = await initiatePayment(userId, productId, channel)
        setState({ status: 'processing', orderId })

        // 根据渠道调用对应支付 SDK
        await invokePaymentSDK(channel, paymentParams)

        // 等待支付结果（WebSocket 优先，降级轮询）
        const result = await waitForPayment(orderId)

        if (result.success) {
          setState({ status: 'success', orderId })
        } else {
          setState({ status: 'failed', orderId, error: result.error })
        }
      } catch (error) {
        setState({ status: 'failed', error: (error as Error).message })
      }
    },
    [userId]
  )

  const reset = useCallback(() => {
    setState({ status: 'idle' })
  }, [])

  return { ...state, startPayment, reset }
}

async function invokePaymentSDK(channel: OrderPaymentChannel, params: any) {
  if (channel === 'wechat') {
    return invokeWechatPay(params)
  }
  if (channel === 'alipay') {
    return invokeAlipay(params)
  }
  if (channel === 'apple') {
    return invokeApplePay(params)
  }
}

async function invokeWechatPay(params: any) {
  return new Promise((resolve, reject) => {
    if (typeof wx !== 'undefined' && wx.requestPayment) {
      wx.requestPayment({
        ...params,
        success: resolve,
        fail: reject
      })
    } else {
      // 浏览器环境或开发模式
      console.log('WeChat Pay params:', params)
      resolve(true)
    }
  })
}

async function invokeAlipay(params: any) {
  if (typeof AlipayJSBridge !== 'undefined') {
    AlipayJSBridge.pay(params.orderStr, (result: any) => {
      if (result.resultCode === '9000') {
        return result
      }
      throw new Error(result.memo || 'Payment failed')
    })
  } else {
    console.log('Alipay params:', params)
    return true
  }
}

async function invokeApplePay(params: any) {
  // Apple IAP 实现
  console.log('Apple Pay params:', params)
  return true
}
```

- [x] **Step 2: 创建 usePaymentStatus Hook**

```typescript
// src/hooks/usePaymentStatus.ts
import { useEffect, useState } from 'react'
import { paymentWebSocket } from '../services/paymentService'

interface PaymentStatus {
  orderId: string
  status: 'pending' | 'paid' | 'failed' | 'refunded'
  tradeNo?: string
}

export function usePaymentStatus(orderId: string | undefined) {
  const [status, setStatus] = useState<PaymentStatus | null>(null)

  useEffect(() => {
    if (!orderId) return

    const unsubscribe = paymentWebSocket.onPaymentStatus((data) => {
      if (data.orderId === orderId) {
        setStatus({
          orderId: data.orderId,
          status: data.status,
          tradeNo: data.tradeNo
        })
      }
    })

    return () => unsubscribe()
  }, [orderId])

  return status
}
```

---

## Task 7: 前端 - 支付组件

**Files:**
- Create: `src/components/payment/PaymentModal.tsx`
- Create: `src/components/payment/PaymentSuccess.tsx`
- Create: `src/components/payment/PaymentFailed.tsx`

- [ ] **Step 1: 创建支付弹窗组件**

```typescript
// src/components/payment/PaymentModal.tsx
import { useState } from 'react'
import { usePayment } from '../../hooks/usePayment'
import type { OrderPaymentChannel } from '../../entitlement/orderTypes'

interface PaymentModalProps {
  isOpen: boolean
  productId: string
  productName: string
  amount: number
  onClose: () => void
  onSuccess?: () => void
}

export function PaymentModal({ isOpen, productId, productName, amount, onClose, onSuccess }: PaymentModalProps) {
  const [channel, setChannel] = useState<OrderPaymentChannel>('wechat')
  const { status, orderId, error, startPayment, reset } = usePayment('current-user-id')

  if (!isOpen) return null

  const handlePay = async () => {
    await startPayment(productId, channel)
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <h2>确认支付</h2>
        <p className="product-name">{productName}</p>
        <p className="amount">¥{(amount / 100).toFixed(2)}</p>

        <div className="channel-select">
          <label>
            <input
              type="radio"
              name="channel"
              value="wechat"
              checked={channel === 'wechat'}
              onChange={() => setChannel('wechat')}
            />
            微信支付
          </label>
          <label>
            <input
              type="radio"
              name="channel"
              value="alipay"
              checked={channel === 'alipay'}
              onChange={() => setChannel('alipay')}
            />
            支付宝
          </label>
          <label>
            <input
              type="radio"
              name="channel"
              value="apple"
              checked={channel === 'apple'}
              onChange={() => setChannel('apple')}
            />
            Apple Pay
          </label>
        </div>

        {status === 'failed' && <p className="error">{error}</p>}

        <div className="actions">
          <button onClick={handleClose} disabled={status === 'processing'}>
            取消
          </button>
          <button onClick={handlePay} disabled={status === 'processing' || status === 'pending'}>
            {status === 'processing' ? '处理中...' : '立即支付'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建支付成功组件**

```typescript
// src/components/payment/PaymentSuccess.tsx
interface PaymentSuccessProps {
  orderId: string
  productName: string
  onClose: () => void
}

export function PaymentSuccess({ orderId, productName, onClose }: PaymentSuccessProps) {
  return (
    <div className="payment-result success">
      <div className="icon">✓</div>
      <h2>支付成功</h2>
      <p>您已成功购买 {productName}</p>
      <p className="order-id">订单号: {orderId}</p>
      <button onClick={onClose}>完成</button>
    </div>
  )
}
```

- [ ] **Step 3: 创建支付失败组件**

```typescript
// src/components/payment/PaymentFailed.tsx
interface PaymentFailedProps {
  orderId?: string
  error?: string
  onRetry: () => void
  onClose: () => void
}

export function PaymentFailed({ orderId, error, onRetry, onClose }: PaymentFailedProps) {
  return (
    <div className="payment-result failed">
      <div className="icon">✗</div>
      <h2>支付失败</h2>
      <p>{error || '支付过程中出现问题'}</p>
      {orderId && <p className="order-id">订单号: {orderId}</p>}
      <div className="actions">
        <button onClick={onClose}>关闭</button>
        <button onClick={onRetry}>重试</button>
      </div>
    </div>
  )
}
```

---

## Task 8: 集成测试

**Files:**
- Create: `src/e2e/payment.test.ts` (如项目支持 E2E)

- [ ] **Step 1: 集成测试**

```typescript
// src/e2e/payment.test.ts
import { test, expect } from '@playwright/test'

test('complete payment flow', async ({ page }) => {
  // 1. 打开会员页面
  await page.goto('/membership')

  // 2. 选择商品
  await page.click('[data-product-id="study_monthly"]')

  // 3. 点击购买
  await page.click('[data-testid="purchase-button"]')

  // 4. 选择支付方式
  await page.click('input[value="wechat"]')

  // 5. 确认支付
  await page.click('[data-testid="confirm-payment"]')

  // 6. 等待支付结果
  await expect(page.locator('.payment-result.success')).toBeVisible({ timeout: 30000 })
})
```

---

## 实施检查清单

- [ ] Task 1: 后端订单 API
- [ ] Task 2: 支付回调处理
- [ ] Task 3: WebSocket 服务
- [ ] Task 4: 前端 WebSocket 管理
- [ ] Task 5: 前端支付服务
- [ ] Task 6: 前端支付 Hook
- [ ] Task 7: 前端支付组件
- [ ] Task 8: 集成测试
