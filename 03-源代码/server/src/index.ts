import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { errorHandler } from './middleware/error.js';
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
import agentRoutes from './routes/agentRouter.js';
import { cleanStaleTasks } from './services/taskQueue.js';
import { runMemoryDecay } from './services/memoryService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/uploads', express.static(path.resolve(__dirname, '..', config.uploadDir)));

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: '星寰海服务运行中', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/pets', petRoutes);
app.use('/api/pets', checkinRoutes);
app.use('/api/pets', symptomsRoutes);
app.use('/api/pets', vaccinesRoutes);
app.use('/api/pets', trendsRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/families', familiesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/avatar', avatarRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/wardrobe', wardrobeRoutes);
app.use('/api/timeline', timelineRoutes);
app.use('/api/naming', namingRoutes);
app.use('/api/agent', agentRoutes);

app.use(errorHandler);

app.listen(config.port, () => {
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
});

export default app;
