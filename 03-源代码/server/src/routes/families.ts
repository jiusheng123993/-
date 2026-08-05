/**
 * 家庭管理路由 - 宠物家庭/群组的 CRUD
 * 创建管理多宠物家庭，添加/移除成员，查看家庭动态
 * 数据访问全部通过 Repository 层，禁止直接拼接 SQL
 */
import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createFamilySchema, updateFamilySchema, addFamilyMemberSchema, updateFamilyMemberRoleSchema, familyMomentsQuerySchema, familyNewMomentsQuerySchema } from '../schemas/index.js';
import {
  FamilyRepository,
  FamilyMemberRepository,
} from '../repositories/familyRepository.js';
import { PetRepository } from '../repositories/petRepository.js';

const router = Router();

const familyRepository = new FamilyRepository();
const familyMemberRepository = new FamilyMemberRepository();
const petRepository = new PetRepository();

/** 将 snake_case 数据库字段转换为 camelCase（与其他路由保持一致） */
function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function toCamelCaseArray(arr: Record<string, unknown>[]): Record<string, unknown>[] {
  return arr.map(toCamelCase);
}

router.post('/', authMiddleware, validate({ body: createFamilySchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, avatarUrl } = req.body;

    const id = crypto.randomUUID();
    const family = await familyRepository.insert({
      id,
      user_id: userId,
      name: name.trim(),
      avatar_url: avatarUrl || null,
    });

    res.json({ success: true, data: toCamelCase(family as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Families Create Error]', err);
    res.status(500).json({ success: false, message: '创建家庭失败' });
  }
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const families = await familyRepository.findAllByUserWithCount(userId);
    res.json({ success: true, data: toCamelCaseArray(families as unknown as Record<string, unknown>[]) });
  } catch (err) {
    console.error('[Families List Error]', err);
    res.status(500).json({ success: false, message: '获取家庭列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.userId!;

    const family = await familyRepository.findByIdAndUser(id, userId);
    if (!family) {
      res.status(404).json({ success: false, message: '家庭不存在' });
      return;
    }

    const members = await familyMemberRepository.findDetailsByFamilyId(id);

    res.json({
      success: true,
      data: {
        ...toCamelCase(family as unknown as Record<string, unknown>),
        members: toCamelCaseArray(members as unknown as Record<string, unknown>[]),
      },
    });
  } catch (err) {
    console.error('[Families Detail Error]', err);
    res.status(500).json({ success: false, message: '获取家庭详情失败' });
  }
});

router.put('/:id', authMiddleware, validate({ body: updateFamilySchema }), async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const userId = req.userId!;

    const isOwner = await familyRepository.isOwner(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此家庭' });
      return;
    }

    const { name, avatarUrl } = req.body;
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (avatarUrl !== undefined) updateData.avatar_url = avatarUrl;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ success: false, message: '没有需要更新的字段' });
      return;
    }

    const updated = await familyRepository.updateByIdAndUser(familyId, userId, updateData);
    res.json({ success: true, data: toCamelCase(updated as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Families Update Error]', err);
    res.status(500).json({ success: false, message: '更新家庭失败' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const userId = req.userId!;

    const isOwner = await familyRepository.isOwner(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此家庭' });
      return;
    }

    await familyRepository.deleteByIdAndUser(familyId, userId);
    res.json({ success: true, message: '家庭已删除' });
  } catch (err) {
    console.error('[Families Delete Error]', err);
    res.status(500).json({ success: false, message: '删除家庭失败' });
  }
});

router.post('/:id/members', authMiddleware, validate({ body: addFamilyMemberSchema }), async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const userId = req.userId!;

    const isOwner = await familyRepository.isOwner(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此家庭' });
      return;
    }

    const { petId, role } = req.body;

    const isPetOwner = await petRepository.isOwner(petId, userId);
    if (!isPetOwner) {
      res.status(403).json({ success: false, message: '只能添加自己的宠物' });
      return;
    }

    const alreadyMember = await familyMemberRepository.isMember(familyId, petId);
    if (alreadyMember) {
      res.status(409).json({ success: false, message: '该宠物已在家庭中' });
      return;
    }

    const memberId = crypto.randomUUID();
    const member = await familyMemberRepository.insert({
      id: memberId,
      family_id: familyId,
      pet_id: petId,
      role: role || null,
    });

    res.json({ success: true, data: toCamelCase(member as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Families AddMember Error]', err);
    res.status(500).json({ success: false, message: '添加成员失败' });
  }
});

router.delete('/:id/members/:petId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const isOwner = await familyRepository.isOwner(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此家庭' });
      return;
    }

    const deleted = await familyMemberRepository.deleteByFamilyAndPet(familyId, petId);
    if (!deleted) {
      res.status(404).json({ success: false, message: '成员不存在' });
      return;
    }

    res.json({ success: true, message: '成员已移除' });
  } catch (err) {
    console.error('[Families RemoveMember Error]', err);
    res.status(500).json({ success: false, message: '移除成员失败' });
  }
});

/**
 * 按 memberId 删除家庭成员
 * 前端仅持有 memberId（无 petId 映射）时使用此端点
 * 路径使用 /by-id/ 前缀避免与 /:petId 路由冲突
 */
router.delete('/:id/members/by-id/:memberId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const memberId = req.params.memberId as string;
    const userId = req.userId!;

    const isOwner = await familyRepository.isOwner(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此家庭' });
      return;
    }

    const deleted = await familyMemberRepository.deleteByMemberId(memberId, familyId);
    if (!deleted) {
      res.status(404).json({ success: false, message: '成员不存在' });
      return;
    }

    res.json({ success: true, message: '成员已移除' });
  } catch (err) {
    console.error('[Families RemoveMemberById Error]', err);
    res.status(500).json({ success: false, message: '移除成员失败' });
  }
});

/**
 * 更新家庭成员角色
 */
router.patch('/:id/members/:memberId/role', authMiddleware, validate({ body: updateFamilyMemberRoleSchema }), async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const memberId = req.params.memberId as string;
    const userId = req.userId!;
    const { role } = req.body;

    const isOwner = await familyRepository.isOwner(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此家庭' });
      return;
    }

    const updated = await familyMemberRepository.updateMemberRole(memberId, familyId, role);
    if (!updated) {
      res.status(404).json({ success: false, message: '成员不存在' });
      return;
    }

    res.json({ success: true, data: toCamelCase(updated as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Families UpdateMemberRole Error]', err);
    res.status(500).json({ success: false, message: '更新成员角色失败' });
  }
});

// 获取家庭动态 (moments)
router.get('/:id/moments', authMiddleware, validate({ query: familyMomentsQuerySchema }), async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const userId = req.userId!;
    const limit = req.query.limit as unknown as number;

    const isOwner = await familyRepository.isOwner(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权查看此家庭' });
      return;
    }

    const petIds = await familyMemberRepository.findPetIdsByFamilyId(familyId);
    if (petIds.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const moments = await familyMemberRepository.findFamilyMoments(petIds, limit);
    res.json({ success: true, data: moments });
  } catch (err) {
    console.error('[Families Moments Error]', err);
    res.status(500).json({ success: false, message: '获取动态失败' });
  }
});

// 获取家庭新动态 (since timestamp)
router.get('/:id/moments/new', authMiddleware, validate({ query: familyNewMomentsQuerySchema }), async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const userId = req.userId!;
    const since = req.query.since as string;

    const isOwner = await familyRepository.isOwner(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权查看此家庭' });
      return;
    }

    const petIds = await familyMemberRepository.findPetIdsByFamilyId(familyId);
    if (petIds.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const moments = await familyMemberRepository.findNewFamilyMoments(petIds, since);
    res.json({ success: true, data: moments });
  } catch (err) {
    console.error('[Families NewMoments Error]', err);
    res.status(500).json({ success: false, message: '获取新动态失败' });
  }
});

export default router;
