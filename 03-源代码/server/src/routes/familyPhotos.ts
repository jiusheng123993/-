/**
 * 全家福合成路由 - 家庭全家福AI生成
 * 全部接口需登录鉴权 + 家庭归属校验
 */
import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { generateFamilyPhotoSchema, uploadFamilyPhotoSchema } from '../schemas/index.js';
import { FamilyRepository } from '../repositories/familyRepository.js';
import {
  generateFamilyPhoto,
  getFamilyPhotos,
  deleteFamilyPhoto,
  saveUploadedFamilyPhoto,
} from '../services/familyPhotoService.js';

const router = Router();
const familyRepository = new FamilyRepository();

/**
 * POST /api/families/:familyId/photos
 * 发起AI全家福生成
 */
router.post(
  '/:familyId/photos',
  authMiddleware,
  validate({ body: generateFamilyPhotoSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const familyId = req.params.familyId as string;
      const { style } = req.body as { style: string };

      // 家庭归属校验
      const isOwner = await familyRepository.isOwner(familyId, userId);
      if (!isOwner) {
        res.status(403).json({ success: false, message: '无权操作该家庭' });
        return;
      }

      const result = await generateFamilyPhoto({
        familyId,
        userId,
        style: style as 'pixar' | 'ghibli' | 'oil' | 'ink' | 'nordic' | 'cyberpunk',
      });

      if (!result.success) {
        res.status(400).json({ success: false, message: result.message });
        return;
      }

      res.json({
        success: true,
        data: {
          id: result.photoId,
          photoUrl: result.photoUrl,
        },
      });
    } catch (err) {
      console.error('[FamilyPhotos Create Error]', err);
      res.status(500).json({ success: false, message: '生成全家福失败' });
    }
  },
);

/**
 * GET /api/families/:familyId/photos
 * 获取全家福照片列表
 */
router.get(
  '/:familyId/photos',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const familyId = req.params.familyId as string;

      const isOwner = await familyRepository.isOwner(familyId, userId);
      if (!isOwner) {
        res.status(403).json({ success: false, message: '无权查看该家庭' });
        return;
      }

      const photos = await getFamilyPhotos(familyId, userId);
      res.json({ success: true, data: photos });
    } catch (err) {
      console.error('[FamilyPhotos List Error]', err);
      res.status(500).json({ success: false, message: '获取全家福列表失败' });
    }
  },
);

/**
 * DELETE /api/families/:familyId/photos/:photoId
 * 删除全家福照片
 */
router.delete(
  '/:familyId/photos/:photoId',
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const familyId = req.params.familyId as string;
      const photoId = req.params.photoId as string;

      const isOwner = await familyRepository.isOwner(familyId, userId);
      if (!isOwner) {
        res.status(403).json({ success: false, message: '无权操作该家庭' });
        return;
      }

      const deleted = await deleteFamilyPhoto(photoId, familyId, userId);
      if (!deleted) {
        res.status(404).json({ success: false, message: '照片不存在' });
        return;
      }

      res.json({ success: true, message: '已删除' });
    } catch (err) {
      console.error('[FamilyPhotos Delete Error]', err);
      res.status(500).json({ success: false, message: '删除全家福失败' });
    }
  },
);

/**
 * POST /api/families/:familyId/photos/upload
 * 保存用户上传或 Canvas 降级生成的全家福（不触发 AI 生成）
 */
router.post(
  '/:familyId/photos/upload',
  authMiddleware,
  validate({ body: uploadFamilyPhotoSchema }),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId!;
      const familyId = req.params.familyId as string;
      const { photoUrl, photoType, memberCount, memberNames, description } = req.body;

      const isOwner = await familyRepository.isOwner(familyId, userId);
      if (!isOwner) {
        res.status(403).json({ success: false, message: '无权操作该家庭' });
        return;
      }

      const result = await saveUploadedFamilyPhoto({
        familyId,
        userId,
        photoUrl,
        photoType: photoType || 'uploaded',
        memberCount: memberCount ?? 0,
        memberNames: memberNames ?? [],
        description,
      });

      res.json({ success: true, data: { id: result.id } });
    } catch (err) {
      console.error('[FamilyPhotos Upload Error]', err);
      res.status(500).json({ success: false, message: '保存全家福失败' });
    }
  },
);

export default router;