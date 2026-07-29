import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { agentLoop, guardCheckInput, type AgentContext, type ChatMessage } from '../services/agentService.js';
import { loadConversationHistory, saveConversation } from '../services/memoryService.js';
import { pool } from '../db.js';

// 注册所有工具（副作用导入）
import '../services/agentTools.js';

const router = Router();

/**
 * POST /api/agent/chat
 * Agent 对话接口，使用 SSE（Server-Sent Events）流式返回
 *
 * 事件类型：
 * - thinking: Agent 正在思考
 * - tool_call: Agent 调用工具
 * - tool_result: 工具执行结果
 * - token: 逐字流式输出
 * - done: 对话完成
 * - error: 错误
 */
router.post('/chat', authMiddleware, async (req: Request, res: Response) => {
  const { message, history, petId } = req.body;

  // 参数校验
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    res.status(400).json({ success: false, message: 'message 不能为空' });
    return;
  }
  if (message.length > 2000) {
    res.status(400).json({ success: false, message: '消息过长，最多 2000 字' });
    return;
  }

  // 安全守卫
  const guardResult = await guardCheckInput(message);
  if (guardResult.blocked) {
    res.json({
      success: true,
      data: {
        reply: guardResult.reason || '抱歉，我无法处理这条消息。',
        blocked: true,
      },
    });
    return;
  }

  const userId = req.userId as string;

  // 如果指定了 petId，校验归属
  let validPetId: string | undefined;
  if (petId && typeof petId === 'string') {
    try {
      const { rows } = await pool.query(
        'SELECT id FROM pet_profiles WHERE id = $1 AND user_id = $2',
        [petId, userId]
      );
      if (rows.length > 0) {
        validPetId = petId;
      }
    } catch {
      // 校验失败，不阻塞
    }
  }

  // 如果没有指定 petId，自动获取用户的第一只宠物
  if (!validPetId) {
    try {
      const { rows } = await pool.query(
        'SELECT id, name, breed FROM pet_profiles WHERE user_id = $1 ORDER BY created_at LIMIT 1',
        [userId]
      );
      if (rows.length > 0) {
        validPetId = rows[0].id;
      }
    } catch {
      // 无宠物也可对话
    }
  }

  const context: AgentContext = { userId, petId: validPetId };

  // 加载持久化对话历史
  let historyMessages: ChatMessage[] = [];
  try {
    const persistentHistory = await loadConversationHistory(userId, validPetId || null, 20);
    historyMessages = persistentHistory.map((h) => ({
      role: h.role,
      content: h.content.substring(0, 1000),
    }));
  } catch {
    // 加载失败不阻塞
  }

  // 合并前端提供的历史消息（追加在后，去重）
  if (Array.isArray(history)) {
    const frontendHistory: ChatMessage[] = [];
    for (const h of history.slice(-10)) {
      if (h.role && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string') {
        frontendHistory.push({ role: h.role, content: h.content.substring(0, 1000) });
      }
    }
    for (const fh of frontendHistory) {
      const isDuplicate = historyMessages.some(
        (ph) => ph.role === fh.role && ph.content === fh.content,
      );
      if (!isDuplicate) {
        historyMessages.push(fh);
      }
    }
  }

  // 设置 SSE 响应头
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let closed = false;

  // 客户端断开连接时清理
  req.on('close', () => {
    closed = true;
  });

  // 发送 SSE 事件的辅助函数
  const emit = (event: string, data: unknown) => {
    if (closed) return;
    try {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    } catch {
      closed = true;
    }
  };

  try {
    for await (const event of agentLoop(message.trim(), historyMessages, context)) {
      if (closed) break;
      emit(event.type, event.data);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Agent 异常';
    emit('error', { message });
  } finally {
    if (!closed) {
      try {
        res.end();
      } catch {
        // 连接已关闭
      }
    }
  }
});

/**
 * GET /api/agent/history
 * 加载持久化对话历史
 */
router.get('/history', authMiddleware, async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const petId = (req.query.petId as string) || null;
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);

  try {
    const history = await loadConversationHistory(userId, petId, limit);
    res.json({ success: true, data: { history } });
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载历史记录失败';
    res.status(500).json({ success: false, message });
  }
});

/**
 * GET /api/agent/tools
 * 返回可用工具列表（供调试和前端展示）
 */
router.get('/tools', authMiddleware, (_req: Request, res: Response) => {
  const { TOOL_DEFINITIONS } = require('../services/toolRegistry.js');
  res.json({
    success: true,
    data: {
      tools: TOOL_DEFINITIONS.map((t: { name: string; description: string }) => ({
        name: t.name,
        description: t.description,
      })),
      count: TOOL_DEFINITIONS.length,
    },
  });
});

export default router;