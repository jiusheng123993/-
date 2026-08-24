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
      // scene 为可选场景（温馨客厅/海边/圣诞树等），customScene 为用户自定义场景描述，
      // 两者均经 schema 白名单/长度校验
      const { style, scene, customScene } = req.body as {
        style: string;
        scene?: string;
        customScene?: string;
      };

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
        // 透传场景给服务层（拼进提示词 + 入库）；未传时服务层用默认场景
        scene: scene as Parameters<typeof generateFamilyPhoto>[0]['scene'],
        // 自定义场景描述原样透传，清洗在服务层统一做（单测可覆盖）
        customScene,
      });

      if (!result.success) {
        // 透传业务错误码与缺失真实形象的成员（前端据此引导用户先生成形象）
        res.status(400).json({
          success: false,
          message: result.message,
          ...(result.code ? { code: result.code } : {}),
          ...(result.missingMembers ? { missingMembers: result.missingMembers } : {}),
        });
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