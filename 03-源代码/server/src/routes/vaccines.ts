/**
 * 疫苗和驱虫管理路由 - 疫苗/驱虫计划的 CRUD
 * 管理疫苗记录、标记完成、设置提醒
 */
import { Router, type Request, type Response, type NextFunction } from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createVaccineSchema, vaccineReminderSchema } from '../schemas/index.js';
import { PetRepository } from '../repositories/petRepository.js';
import { VaccineRepository } from '../repositories/vaccineRepository.js';
import { postVaccineCompletedFeed } from '../services/autoFeedService.js';

const router = Router();

const petRepository = new PetRepository();
const vaccineRepository = new VaccineRepository();

async function checkPetOwnership(req: Request, res: Response, next: NextFunction) {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;
    const isOwner = await petRepository.isOwner(petId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }
    next();
  } catch (err) {
    console.error('[Vaccines Post Error]', err);
    res.status(500).json({ success: false, message: '添加疫苗记录失败' });
  }
}

// 注意：本路由已挂载在 app.use('/api/pets', ...) 下，这里使用相对路径，
// 避免拼出 /api/pets/api/pets/... 导致 404
router.get('/:petId/vaccines', authMiddleware, async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const isOwner = await petRepository.isOwner(petId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此宠物' });
      return;
    }

    const rows = await vaccineRepository.findByPetAndUser(petId, userId);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Vaccines Get Error]', err);
    res.status(500).json({ success: false, message: '获取疫苗计划失败' });
  }
});

router.post('/:petId/vaccines', authMiddleware, checkPetOwnership, validate({ body: createVaccineSchema }), async (req: Request, res: Response) => {
  try {
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const { type, category, date, next_date, status, hospital, doctor, notes, reminder_enabled } = req.body;

    const validStatuses = ['completed', 'pending', 'overdue'];
    const recordStatus = validStatuses.includes(status) ? status : 'pending';

    const id = crypto.randomUUID();
    const row = await vaccineRepository.insert({
      id,
      pet_id: petId,
      user_id: userId,
      type,
      category,
      date,
      next_date,
      status: recordStatus,
      hospital: hospital || null,
      doctor: doctor || null,
      notes: notes || null,
      reminder_enabled: reminder_enabled !== undefined ? reminder_enabled : true,
    });

    // 疫苗完成 → 自动发家庭动态
    if (recordStatus === 'completed') {
      void postVaccineCompletedFeed(userId, petId, category || type);
    }

    res.json({ success: true, data: row });
  } catch (err) {
    console.error('[Vaccines Post Error]', err);
    res.status(500).json({ success: false, message: '添加疫苗记录失败' });
  }
});

router.put('/:petId/vaccines/:vaccineId/complete', authMiddleware, async (req: Request, res: Response) => {
  try {
    const vaccineId = req.params.vaccineId as string;
    const userId = req.userId!;

    const isOwner = await vaccineRepository.isOwner(vaccineId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此记录' });
      return;
    }

    const row = await vaccineRepository.markCompleted(vaccineId, userId);

    if (!row) {
      res.status(404).json({ success: false, message: '记录不存在' });
      return;
    }

    res.json({ success: true, data: row });
  } catch (err) {
    console.error('[Vaccines Complete Error]', err);
    res.status(500).json({ success: false, message: '标记完成失败' });
  }
});

router.put('/:petId/vaccines/:vaccineId/reminder', authMiddleware, validate({ body: vaccineReminderSchema }), async (req: Request, res: Response) => {
  try {
    const vaccineId = req.params.vaccineId as string;
    const userId = req.userId!;

    const isOwner = await vaccineRepository.isOwner(vaccineId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此记录' });
      return;
    }

    const { reminder_enabled } = req.body;

    const row = await vaccineRepository.updateReminder(vaccineId, userId, reminder_enabled);

    if (!row) {
      res.status(404).json({ success: false, message: '记录不存在' });
      return;
    }

    res.json({ success: true, data: row });
  } catch (err) {
    console.error('[Vaccines Reminder Error]', err);
    res.status(500).json({ success: false, message: '设置提醒失败' });
  }
});

export default router;
