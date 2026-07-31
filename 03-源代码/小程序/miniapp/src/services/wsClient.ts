/**
 * WebSocket 客户端 - 实时推送
 *
 * 能力：
 *   1. JWT 认证连接（连接时携带 token，服务端从 URL 查询参数校验）
 *   2. 心跳保活（30s 发送 ping）
 *   3. 指数退避重连（1s 起、翻倍、上限 30s），主动断开不重连
 *   4. 幂等连接（已连接/连接中跳过）
 *   5. 类型安全事件订阅（on/off），按 data.event ?? data.type 分发业务事件
 *
 * 服务端协议（websocketService.ts）：
 *   - 连接：GET /ws?token={jwt}
 *   - 客户端 → 服务端：{ type: 'subscribe' | 'unsubscribe' | 'ping', channel? }
 *   - 服务端 → 客户端：{ type: 'message' | 'pong' | 'subscribed' | 'error', channel?, data? }
 *   - 业务事件：data.event ?? data.type 作为事件名，data 为事件负载
 */
import Taro from '@tarojs/taro'
import { CONFIG } from '../config'

/** 业务事件负载类型映射（新增后端推送事件时在此扩展） */
export interface WsEventMap {
  /** 回忆录视频生成状态（memoirProcessor.ts） */
  memoir_status: {
    type: 'memoir_completed' | 'memoir_failed'
    taskId: string
    previewUrl?: string
    reason?: string
  }
  /** 年度回忆视频生成状态（yearlyReviewService.ts） */
  yearly_review_status: {
    type: 'yearly_video_ready' | 'yearly_video_failed'
    reviewId: string
    videoUrl?: string
    reason?: string
  }
  /** 支付成功（payment.ts） */
  payment_success: { product_type: string; order_id: string; [key: string]: unknown }
  /** 支付退款（payment.ts） */
  payment_refunded: { product_type: string; order_id: string; [key: string]: unknown }
}

/** 事件处理器类型 */
export type WsEventHandler<K extends keyof WsEventMap> = (data: WsEventMap[K]) => void

/** 心跳间隔（ms） */
export const HEARTBEAT_INTERVAL = 30_000
/** 重连基础延迟（ms） */
export const RECONNECT_BASE_DELAY = 1_000
/** 重连最大延迟（ms） */
export const RECONNECT_MAX_DELAY = 30_000

class WsClient {
  private socket: Taro.SocketTask | null = null
  private token = ''
  private shouldReconnect = true
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private isOpen = false
  private isConnecting = false
  private handlers = new Map<string, Set<(data: unknown) => void>>()

  /** 是否已建立连接 */
  get connected(): boolean {
    return this.isOpen
  }

  /** 是否正在连接中 */
  get connecting(): boolean {
    return this.isConnecting
  }

  /**
   * 建立 WebSocket 连接（幂等：已连接/连接中则跳过）
   * @param token - JWT 认证令牌
   */
  connect(token: string): void {
    if (this.isOpen || this.isConnecting) return
    if (!token) return
    this.token = token
    this.shouldReconnect = true
    this.reconnectAttempts = 0
    this.open()
  }

  /** 主动断开连接（不再自动重连） */
  disconnect(): void {
    this.shouldReconnect = false
    this.clearTimers()
    if (this.socket) {
      try {
        this.socket.close({ code: 1000, reason: 'manual disconnect' })
      } catch {
        // 忽略关闭异常
      }
    }
    this.socket = null
    this.isOpen = false
    this.isConnecting = false
  }

  /**
   * 订阅业务事件
   * @param event - 事件名（data.event ?? data.type）
   * @param handler - 事件处理器
   * @returns 退订函数
   */
  on<K extends keyof WsEventMap>(event: K, handler: WsEventHandler<K>): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set())
    this.handlers.get(event)!.add(handler as (data: unknown) => void)
    return () => this.off(event, handler)
  }

  /** 退订业务事件 */
  off<K extends keyof WsEventMap>(event: K, handler: WsEventHandler<K>): void {
    this.handlers.get(event)?.delete(handler as (data: unknown) => void)
  }

  /** 建立底层连接（Taro connectSocket 返回 Promise<SocketTask>） */
  private open(): void {
    this.isConnecting = true
    Taro.connectSocket({ url: this.buildWsUrl(this.token) })
      .then((task) => {
        if (!task) return
        this.socket = task

        task.onOpen(() => {
          this.isOpen = true
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.startHeartbeat()
        })

        task.onMessage((res) => {
          this.handleMessage(res.data)
        })

        task.onClose(() => {
          this.handleClosed()
        })

        task.onError(() => {
          this.handleClosed()
        })
      })
      .catch(() => {
        // 连接建立失败：按断开处理（走指数退避重连）
        this.isConnecting = false
        this.handleClosed()
      })
  }

  /** 根据 API_BASE_URL 推导 WS 地址并拼接 token */
  private buildWsUrl(token: string): string {
    const base = CONFIG.API_BASE_URL.replace(/\/$/, '')
    const wsBase = base.startsWith('https')
      ? base.replace('https', 'wss')
      : base.replace('http', 'ws')
    return `${wsBase}/ws?token=${encodeURIComponent(token)}`
  }

  /** 解析并分发服务端消息 */
  private handleMessage(raw: string | ArrayBuffer): void {
    let text = ''
    if (typeof raw === 'string') {
      text = raw
    } else if (raw instanceof ArrayBuffer) {
      // 二进制帧兜底解码（服务端使用文本帧，此处防御性处理）
      const bytes = new Uint8Array(raw)
      text = String.fromCharCode(...bytes)
    }
    if (!text) return

    let parsed: { type?: string; data?: unknown }
    try {
      parsed = JSON.parse(text)
    } catch {
      return
    }
    if (parsed.type === 'pong') return
    if (parsed.type !== 'message' || parsed.data == null) return

    // 业务事件名：优先 data.event（memoir/yearly），其次 data.type（payment）
    const payload = parsed.data as { event?: string; type?: string; data?: unknown }
    const eventName = payload?.event ?? payload?.type
    if (!eventName) return

    const handlers = this.handlers.get(eventName)
    if (!handlers) return
    handlers.forEach((handler) => {
      try {
        // 向事件处理器传递业务负载（payload.data，即 { type, taskId, ... }）
        handler(payload.data)
      } catch (err) {
        console.warn('[wsClient] 事件处理失败:', err)
      }
    })
  }

  /** 连接关闭/异常统一处理：按指数退避调度重连 */
  private handleClosed(): void {
    this.isOpen = false
    this.isConnecting = false
    this.clearTimers()

    if (!this.shouldReconnect || !this.token) return

    const delay = Math.min(
      RECONNECT_BASE_DELAY * 2 ** this.reconnectAttempts,
      RECONNECT_MAX_DELAY,
    )
    this.reconnectAttempts += 1
    this.reconnectTimer = setTimeout(() => {
      if (this.shouldReconnect && this.token) this.open()
    }, delay)
  }

  /** 启动心跳定时器（30s 发送 ping） */
  private startHeartbeat(): void {
    this.stopHeartbeat()
    this.heartbeatTimer = setInterval(() => {
      if (this.isOpen && this.socket) {
        try {
          this.socket.send({ data: JSON.stringify({ type: 'ping' }) })
        } catch {
          // 忽略发送异常，由 onClose/onError 触发重连
        }
      }
    }, HEARTBEAT_INTERVAL)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private clearTimers(): void {
    this.stopHeartbeat()
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }
}

/** 全局单例（供页面/服务直接复用） */
export const wsClient = new WsClient()
export default wsClient
