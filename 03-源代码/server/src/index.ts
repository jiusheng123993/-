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
import { authMiddleware } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import petRoutes from './routes/pets.js';
import checkinRoutes from './routes/checkins.js';
import foodRoutes from './routes/food.js';
import symptomsRoutes from './routes/symptoms.js';
import vaccinesRoutes from './routes/vaccines.js';
import trendsRoutes from './routes/trends.js';
import familiesRoutes from './routes/families.js';
import aiRoutes from './routes/ai.js';
import avatarRoutes from './routes/avatar.js';
import membershipRoutes from './routes/membership.js';
import wardrobeRoutes from './routes/wardrobe.js';
import timelineRoutes from './routes/timeline.js';
import namingRoutes from './routes/naming.js';
import memoirRoutes from './routes/memoir.js';
import feedsRoutes from './routes/feeds.js';
import weeklyReportRoutes from './routes/weeklyReports.js';
import shareCardsRoutes from './routes/shareCards.js';
import familyTreeRoutes from './routes/familyTree.js';
import yearlyReviewRoutes from './routes/yearlyReview.js';
import leaderboardRoutes from './routes/leaderboard.js';
import agentRoutes from './routes/agentRouter.js';
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

// CORS 跨域
app.use(cors());

// 请求体解析
app.use(express.json({ limit: '10mb' }));

// 请求日志（脱敏记录）
app.use(requestLogger);

// 全局限流（60次/分钟兜底）
app.use('/api/', globalLimiter);

// 静态文件
app.use('/uploads', express.static(path.resolve(__dirname, '..', config.uploadDir)));

// ===== 健康检查 =====
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: '星寰海服务运行中', timestamp: new Date().toISOString() });
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
app.use('/api/food', foodRoutes);
app.use('/api/families', familiesRoutes);
app.use('/api/families', feedsRoutes);
app.use('/api/families', weeklyReportRoutes);
app.use('/api/families', familyTreeRoutes);
app.use('/api/families', leaderboardRoutes);
app.use('/api/share-cards', shareCardsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/naming', namingRoutes);
app.use('/api/pets', memoirRoutes);
app.use('/api/pets', yearlyReviewRoutes);
app.use('/api/agent', agentRoutes);

// ===== 全局错误处理 =====
app.use(errorHandler);

// ===== 启动服务器 =====
const server = app.listen(config.port, () => {
  if (!config.jwtSecret || config.jwtSecret.length < 32) {
    console.error('[Server] 致命错误: JWT_SECRET 未配置或长度不足 32 字符，拒绝启动');
    process.exit(1);
  }
  console.log(`[Server] 星寰海后端服务已启动: http://localhost:${config.port}`);
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
