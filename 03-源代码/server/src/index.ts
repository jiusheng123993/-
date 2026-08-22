/**
 * 应用入口 - Express 服务器主文件
 * 配置中间件、路由注册、服务器启动和后台任务调度
 * v2: 增加 helmet 安全头、请求日志、限流、WebSocket、功能开关
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { errorHandler } from './middleware/error.js';
import { requestLogger } from './middleware/requestLogger.js';
import { globalLimiter } from './middleware/rateLimit.js';
import { authMiddleware, resolveUserId } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import petRoutes from './routes/pets.js';
import checkinRoutes from './routes/checkins.js';
import foodRoutes from './routes/food.js';
import symptomsRoutes from './routes/symptoms.js';
import vaccinesRoutes from './routes/vaccines.js';
import trendsRoutes from './routes/trends.js';
import chronicRoutes from './routes/chronic.js';
import feedingRecordsRoutes from './routes/feedingRecords.js';
import suggestionRecordsRoutes from './routes/suggestionRecords.js';
import familiesRoutes from './routes/families.js';
import aiRoutes from './routes/ai.js';
import avatarRoutes from './routes/avatar.js';
import membershipRoutes from './routes/membership.js';
import paymentRoutes from './routes/payment.js';
import timelineRoutes from './routes/timeline.js';
import namingRoutes from './routes/naming.js';
import memoirRoutes from './routes/memoir.js';
import feedsRoutes from './routes/feeds.js';
import weeklyReportRoutes from './routes/weeklyReports.js';
import shareCardsRoutes from './routes/shareCards.js';
import familyTreeRoutes from './routes/familyTree.js';
import yearlyReviewRoutes from './routes/yearlyReview.js';
import leaderboardRoutes from './routes/leaderboard.js';
import familyPhotosRoutes from './routes/familyPhotos.js';
import agentRoutes from './routes/agentRouter.js';
import memoryRoutes from './routes/memory.js';
import feedbackRoutes from './routes/feedback.js';
import knowledgeRoutes from './routes/knowledge.js';
import analyticsRoutes from './routes/analytics.js';
import inviteRoutes from './routes/invites.js';
import { cleanStaleTasks } from './services/taskQueue.js';
import { runMemoryDecay } from './services/memoryService.js';
import { initWebSocket } from './services/websocketService.js';
import { startMemoirProcessor, stopMemoirProcessor } from './services/memoirProcessor.js';
import { getFeatureFlags } from './config/featureFlags.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Express 应用实例 */
const app = express();

// ===== 全局中间件 =====
// 安全头（HTTP 响应头安全加固）
app.use(helmet());

// CORS 跨域（配置 ALLOWED_ORIGINS 时启用来源白名单；未配置默认允许所有来源）
app.use(cors({
  origin: config.allowedOrigins.length > 0 ? config.allowedOrigins : true,
}));

// 请求体解析
// 微信回调接口需要 raw body 用于验签，通过 verify 钩子捕获原始请求体
// 其他接口正常解析为 JSON
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    const expressReq = req as unknown as { originalUrl?: string; rawBody?: string };
    if (expressReq.originalUrl?.endsWith('/api/payment/wechat/notify')) {
      expressReq.rawBody = buf.toString('utf8');
    }
  },
}));

// 请求日志（脱敏记录）
app.use(requestLogger);

// 信任第一跳代理（nginx）：修复 req.ip 恒为 127.0.0.1 导致全局限流 key 共享的问题（2026-08-23）
// nginx 已转发 X-Forwarded-For；trust proxy=1 表示仅信任直连 nginx 这一跳
app.set('trust proxy', 1);

// 轻量身份解析（不拒绝请求）：让全局限流 key 能按真实用户区分，避免所有用户共享一个桶
app.use('/api/', resolveUserId);

// 全局限流（60次/分钟兜底，按 IP+用户 维度）
app.use('/api/', globalLimiter);

// 静态文件
app.use('/uploads', express.static(path.resolve(__dirname, '..', config.uploadDir)));

// 知识图谱审核后台（Phase 3 轻量管理页，Token 登录见 routes/knowledge.ts）
app.use('/admin', express.static(path.resolve(__dirname, '..', 'public')));

// ===== 健康检查 =====
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: '星河宠记服务运行中', timestamp: new Date().toISOString() });
});

// ===== 功能开关接口（需登录） =====
app.get('/api/config/feature-flags', authMiddleware, (req, res) => {
  const flags = getFeatureFlags(req.userId);
  res.json({ success: true, data: flags });
});

// ===== 业务路由 =====
app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/pets', checkinRoutes);
app.use('/api/pets', symptomsRoutes);
app.use('/api/pets', vaccinesRoutes);
app.use('/api/pets', trendsRoutes);
app.use('/api/pets', chronicRoutes);
app.use('/api/pets', feedingRecordsRoutes);
app.use('/api/pets', suggestionRecordsRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/families', familiesRoutes);
app.use('/api/families', feedsRoutes);
app.use('/api/families', weeklyReportRoutes);
app.use('/api/families', familyTreeRoutes);
app.use('/api/families', leaderboardRoutes);
app.use('/api/families', familyPhotosRoutes);
app.use('/api/share-cards', shareCardsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/naming', namingRoutes);
app.use('/api/pets', memoirRoutes);
app.use('/api/pets', yearlyReviewRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/memory', memoryRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', knowledgeRoutes);
app.use('/api', inviteRoutes);

// ===== 全局错误处理 =====
app.use(errorHandler);

// ===== 启动服务器 =====
const server = app.listen(config.port, () => {
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    console.error('[Server] 致命错误: JWT_SECRET 未配置或长度不足 32 字符，拒绝启动');
    process.exit(1);
  }
  console.log(`[Server] 星河宠记后端服务已启动: http://localhost:${config.port}`);
  console.log(`[Server] 环境: ${process.env.NODE_ENV || 'development'}`);

  const runCleanup = async () => {
    try {
      const result = await cleanStaleTasks();
      console.log(`[Cleanup] 清理完成: 删除 ${result.tasks} 个失败任务, ${result.images} 条2D图片, ${result.models} 条3D模型`);
    } catch (error) {
      console.error('[Cleanup] 清理失败:', error);
    }
  };

  runCleanup();

  setInterval(runCleanup, 24 * 60 * 60 * 1000);

  // 记忆衰减（每天一次）
  runMemoryDecay().catch(() => {});
  setInterval(() => {
    runMemoryDecay().catch(() => {});
  }, 24 * 60 * 60 * 1000);

  // 启动回忆录任务处理器（异步轮询 pending 任务，调用视频生成服务）
  startMemoirProcessor();
});

// ===== 进程退出时清理后台任务 =====
process.on('SIGTERM', () => {
  console.log('[Server] 收到 SIGTERM，停止后台任务...');
  stopMemoirProcessor();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[Server] 收到 SIGINT，停止后台任务...');
  stopMemoirProcessor();
  process.exit(0);
});

// ===== 初始化 WebSocket 服务 =====
initWebSocket(server);

export default app;
