/**
 * WebSocket 服务 - 自建实时推送
 * 按 TECH_DESIGN 7.3.0 节实现 JWT 身份验证和频道权限验证
 * 替代原 Supabase Realtime 方案
 */
import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { pool } from '../db.js';

/** 扩展 WebSocket 类型，增加 userId 和订阅频道 */
interface AuthedWebSocket extends WebSocket {
  userId?: string;
  channels?: Set<string>;
  isAlive?: boolean;
}

/** WebSocket 消息类型 */
interface WsMessage {
  type: 'subscribe' | 'unsubscribe' | 'ping' | 'message';
  channel?: string;
  data?: unknown;
}

/** 频道权限验证结果 */
type AuthResult = { allowed: boolean; reason?: string };

/**
 * 验证用户是否有权订阅指定频道
 * 频道格式：{type}:{id}:{subType}
 * - family:{familyId}:feeds   → 用户须为家庭成员
 * - user:{userId}:notifications → 用户须为本人
 * - pet:{petId}:updates        → 用户须为宠物主人
 */
async function canSubscribe(userId: string, channel: string): Promise<AuthResult> {
  const parts = channel.split(':');
  if (parts.length < 2) {
    return { allowed: false, reason: '频道格式错误' };
  }

  const [type, id] = parts;

  switch (type) {
    case 'family': {
      // 验证用户是否为该家庭成员（通过宠物归属关系）
      const result = await pool.query(
        `SELECT 1 FROM pet_family_members m
         JOIN pet_profiles p ON p.id = m.pet_id
         WHERE m.family_id = $1 AND p.user_id = $2 LIMIT 1`,
        [id, userId],
      );
      return result.rows.length > 0
        ? { allowed: true }
        : { allowed: false, reason: '非家庭成员' };
    }

    case 'user': {
      // 用户频道只能订阅自己的
      return id === userId
        ? { allowed: true }
        : { allowed: false, reason: '非本人频道' };
    }

    case 'pet': {
      // 验证用户是否为宠物主人
      const result = await pool.query(
        'SELECT 1 FROM pet_profiles WHERE id = $1 AND user_id = $2',
        [id, userId],
      );
      return result.rows.length > 0
        ? { allowed: true }
        : { allowed: false, reason: '非宠物主人' };
    }

    default:
      return { allowed: false, reason: '未知频道类型' };
  }
}

/** 单用户最大并发连接数 */
const MAX_CONNECTIONS_PER_USER = 3;

/** 用户连接计数（用于限制并发连接） */
const userConnections = new Map<string, number>();

/** WebSocket 服务实例 */
let wss: WebSocketServer | null = null;

/**
 * 初始化 WebSocket 服务
 * @param server - HTTP 服务器实例
 */
export function initWebSocket(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws: AuthedWebSocket, req) => {
    // 1. 从 URL 查询参数提取 token
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, '缺少认证token');
      return;
    }

    // 2. 验证 JWT
    try {
      const payload = jwt.verify(token, config.jwtSecret) as { userId: string };
      ws.userId = payload.userId;
      ws.channels = new Set();
      ws.isAlive = true;
    } catch {
      ws.close(4003, 'token无效或已过期');
      return;
    }

    // 3. 限制单用户并发连接数
    const currentCount = userConnections.get(ws.userId!) ?? 0;
    if (currentCount >= MAX_CONNECTIONS_PER_USER) {
      ws.close(4009, '连接数超限');
      return;
    }
    userConnections.set(ws.userId!, currentCount + 1);

    // 4. 心跳检测
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // 5. 处理消息
    ws.on('message', async (data: Buffer) => {
      let msg: WsMessage;
      try {
        msg = JSON.parse(data.toString());
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: '消息格式错误' }));
        return;
      }

      switch (msg.type) {
        case 'subscribe': {
          if (!msg.channel) return;
          const authResult = await canSubscribe(ws.userId!, msg.channel);
          if (!authResult.allowed) {
            ws.send(JSON.stringify({
              type: 'error',
              code: '403',
              message: authResult.reason || '无权订阅此频道',
            }));
            return;
          }
          ws.channels!.add(msg.channel);
          ws.send(JSON.stringify({ type: 'subscribed', channel: msg.channel }));
          break;
        }

        case 'unsubscribe': {
          if (!msg.channel) return;
          ws.channels!.delete(msg.channel);
          ws.send(JSON.stringify({ type: 'unsubscribed', channel: msg.channel }));
          break;
        }

        case 'ping': {
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
        }
      }
    });

    // 6. 连接关闭时清理
    ws.on('close', () => {
      if (ws.userId) {
        const count = userConnections.get(ws.userId) ?? 0;
        if (count <= 1) {
          userConnections.delete(ws.userId);
        } else {
          userConnections.set(ws.userId, count - 1);
        }
      }
    });
  });

  // 7. 心跳定时器（60秒检测一次，超时自动断开）
  const heartbeatInterval = setInterval(() => {
    if (!wss) return;
    wss.clients.forEach((client) => {
      const ws = client as AuthedWebSocket;
      if (ws.isAlive === false) {
        ws.terminate();
        return;
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 60 * 1000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });

  console.log('[WebSocket] 服务已启动，路径: /ws');
}

/**
 * 向指定频道广播消息
 * @param channel - 频道名称
 * @param message - 消息内容
 */
export function broadcastToChannel(channel: string, message: unknown): void {
  if (!wss) return;

  wss.clients.forEach((client) => {
    const ws = client as AuthedWebSocket;
    if (ws.readyState === WebSocket.OPEN && ws.channels?.has(channel)) {
      ws.send(JSON.stringify({ type: 'message', channel, data: message }));
    }
  });
}

/**
 * 向指定用户推送消息（遍历该用户所有连接）
 * @param userId - 用户 ID
 * @param message - 消息内容
 */
export function sendToUser(userId: string, message: unknown): void {
  if (!wss) return;

  wss.clients.forEach((client) => {
    const ws = client as AuthedWebSocket;
    if (ws.readyState === WebSocket.OPEN && ws.userId === userId) {
      ws.send(JSON.stringify({ type: 'message', data: message }));
    }
  });
}
