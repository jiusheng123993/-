import express from 'express';
import cors from 'cors';
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

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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

app.use(errorHandler);

app.listen(config.port, () => {
  console.log(`[Server] 星寰海后端服务已启动: http://localhost:${config.port}`);
  console.log(`[Server] 环境: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
