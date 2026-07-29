import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../middleware/auth.js';
import { uploadPetPhoto } from '../services/photoUploadService.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const photoUploadLimiter = rateLimit({
  windowMs: 60000,
  max: 10,
  message: { success: false, message: '上传请求过于频繁，请稍后再试' },
});

// 上传取名参考照片
router.post('/photo/upload', authMiddleware, photoUploadLimiter, upload.single('photo'), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { petId } = req.body;

    if (!req.file) {
      res.status(400).json({ success: false, message: '请上传照片' });
      return;
    }

    if (!petId || typeof petId !== 'string') {
      res.status(400).json({ success: false, message: 'petId 参数不能为空' });
      return;
    }

    const result = await uploadPetPhoto({
      userId,
      petId,
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    if (!result.success) {
      res.status(400).json({ success: false, message: result.error });
      return;
    }

    res.json({ success: true, data: { url: result.url } });
  } catch (error) {
    console.error('[Naming photo/upload] Error:', error);
    res.status(500).json({ success: false, message: '照片上传失败，请稍后重试' });
  }
});

export default router;