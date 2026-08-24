/**
 * 家庭管理路由 - 宠物家庭/群组的 CRUD
 * 创建管理多宠物家庭，添加/移除成员，查看家庭动态
 * 数据访问全部通过 Repository 层，禁止直接拼接 SQL
 */
import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createFamilySchema, updateFamilySchema, addFamilyMemberSchema, updateFamilyMemberRoleSchema, familyMomentsQuerySchema, familyNewMomentsQuerySchema, joinFamilySchema, createFamilyUserRelationSchema } from '../schemas/index.js';
import {
  FamilyRepository,
  FamilyMemberRepository,
  FamilyUserRepository,
  FamilyInviteRepository,
  FamilyUserRelationRepository,
  type FamilyUserRelationRow,
} from '../repositories/familyRepository.js';
import { PetRepository } from '../repositories/petRepository.js';
import { postMemberJoinedFeed } from '../services/autoFeedService.js';

const router = Router();

const familyRepository = new FamilyRepository();
const familyMemberRepository = new FamilyMemberRepository();
const familyUserRepository = new FamilyUserRepository();
const familyInviteRepository = new FamilyInviteRepository();
const familyUserRelationRepository = new FamilyUserRelationRepository();
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

    // 多成员共同养宠：创建者自动成为家庭 owner 成员（pet_family_users）
    await familyUserRepository.addUser(id, userId, 'owner');

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

    // 多成员共同养宠：主人或家庭成员均可查看家庭详情
    const isOwner = await familyRepository.isOwner(id, userId);
    const isMember = isOwner || (await familyUserRepository.isFamilyUser(id, userId));
    if (!isMember) {
      res.status(404).json({ success: false, message: '家庭不存在' });
      return;
    }

    const family = await familyRepository.findById(id);
    if (!family) {
      res.status(404).json({ success: false, message: '家庭不存在' });
      return;
    }

    const members = await familyMemberRepository.findDetailsByFamilyId(id);
    // 多成员共同养宠：返回"人"成员列表（含角色，前端展示头像昵称）
    const users = await familyUserRepository.findUsersByFamilyId(id);

    res.json({
      success: true,
      data: {
        ...toCamelCase(family as unknown as Record<string, unknown>),
        members: toCamelCaseArray(members as unknown as Record<string, unknown>[]),
        users: toCamelCaseArray(users as unknown as Record<string, unknown>[]),
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

    // 新成员加入 → 自动发家庭动态
    void postMemberJoinedFeed(familyId, userId, petId);

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

    // 多成员共同养宠：家庭成员可查看家庭动态
    const isOwner = await familyUserRepository.isFamilyUser(familyId, userId);
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

// ============ 多成员共同养宠：家庭成员（人）管理（2026-08-24） ============

/** 生成 6 位邀请码（去除易混淆字符 0O1lI） */
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[crypto.randomInt(chars.length)];
  }
  return code;
}

/**
 * 生成家庭邀请码（仅 owner）
 * 对方凭码 POST /join 加入家庭
 */
router.post('/:id/invites', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const userId = req.userId!;

    const isOwner = await familyUserRepository.isFamilyOwner(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '仅家庭创建者可邀请成员' });
      return;
    }

    const code = generateInviteCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 天有效
    const invite = await familyInviteRepository.createInvite(familyId, userId, code, expiresAt);

    res.status(201).json({ success: true, data: toCamelCase(invite as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Families Invite Error]', err);
    res.status(500).json({ success: false, message: '生成邀请码失败' });
  }
});

/**
 * 凭邀请码加入家庭
 * 校验邀请码有效（未使用未过期）→ 加入 pet_family_users（member）→ 标记码已用
 */
router.post('/join', authMiddleware, validate({ body: joinFamilySchema }), async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { code } = req.body;

    const invite = await familyInviteRepository.findValidByCode(code.trim().toUpperCase());
    if (!invite) {
      res.status(400).json({ success: false, message: '邀请码无效或已过期' });
      return;
    }

    // 已在家庭中（幂等，不重复添加）
    const alreadyMember = await familyUserRepository.isFamilyUser(invite.family_id, userId);
    if (!alreadyMember) {
      await familyUserRepository.addUser(invite.family_id, userId, 'member');
    }
    await familyInviteRepository.markUsed(code.trim().toUpperCase(), userId);

    res.json({ success: true, data: { familyId: invite.family_id } });
  } catch (err) {
    console.error('[Families Join Error]', err);
    res.status(500).json({ success: false, message: '加入家庭失败' });
  }
});

/**
 * 家庭成员（人）列表（主人或成员可读）
 */
router.get('/:id/users', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const userId = req.userId!;

    const isMember = await familyUserRepository.isFamilyUser(familyId, userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: '无权查看此家庭' });
      return;
    }

    const users = await familyUserRepository.findUsersByFamilyId(familyId);
    res.json({ success: true, data: toCamelCaseArray(users as unknown as Record<string, unknown>[]) });
  } catch (err) {
    console.error('[Families Users Error]', err);
    res.status(500).json({ success: false, message: '获取成员列表失败' });
  }
});

/**
 * 移除家庭成员（仅 owner；不能移除 owner 本人）
 */
router.delete('/:id/users/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const operatorId = req.userId!;
    const targetUserId = req.params.userId as string;

    const isOwner = await familyUserRepository.isFamilyOwner(familyId, operatorId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '仅家庭创建者可移除成员' });
      return;
    }
    if (targetUserId === operatorId) {
      res.status(400).json({ success: false, message: '不能移除自己' });
      return;
    }

    const removed = await familyUserRepository.removeUser(familyId, targetUserId);
    if (!removed) {
      res.status(404).json({ success: false, message: '该用户不是家庭成员' });
      return;
    }

    res.json({ success: true, data: null });
  } catch (err) {
    console.error('[Families RemoveUser Error]', err);
    res.status(500).json({ success: false, message: '移除成员失败' });
  }
});

/**
 * 家庭成员（人）关系列表（主人或成员可读）
 * 多成员共同养宠：情侣/父女/兄弟姐妹等任意两人之间的家庭角色关系（2026-08-24）
 */
router.get('/:id/user-relations', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const userId = req.userId!;

    const isMember = await familyUserRepository.isFamilyUser(familyId, userId);
    if (!isMember) {
      res.status(403).json({ success: false, message: '无权查看此家庭' });
      return;
    }

    const relations = await familyUserRelationRepository.listRelations(familyId);
    res.json({ success: true, data: toCamelCaseArray(relations as unknown as Record<string, unknown>[]) });
  } catch (err) {
    console.error('[Families UserRelations Error]', err);
    res.status(500).json({ success: false, message: '获取家庭关系失败' });
  }
});

/**
 * 创建家庭成员（人）关系（仅 owner）
 * 校验：a/b 必须是家庭成员、不能是自己对自已、两人之间最多一条关系
 */
router.post('/:id/user-relations', authMiddleware, validate({ body: createFamilyUserRelationSchema }), async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const operatorId = req.userId!;
    const { userIdA, userIdB, relationType } = req.body as { userIdA: string; userIdB: string; relationType: FamilyUserRelationRow['relation_type'] };

    // 自指是明确的参数错误（无需查库），优先拦截
    if (userIdA === userIdB) {
      res.status(400).json({ success: false, message: '不能给自己设置关系' });
      return;
    }

    const isOwner = await familyUserRepository.isFamilyOwner(familyId, operatorId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '仅家庭创建者可设置成员关系' });
      return;
    }
    // 两人都必须是家庭成员
    const isA = await familyUserRepository.isFamilyUser(familyId, userIdA);
    const isB = await familyUserRepository.isFamilyUser(familyId, userIdB);
    if (!isA || !isB) {
      res.status(400).json({ success: false, message: '关系双方必须是家庭成员' });
      return;
    }

    const relation = await familyUserRelationRepository.createRelation(familyId, userIdA, userIdB, relationType);
    if (!relation) {
      res.status(409).json({ success: false, message: '这两人之间已存在关系' });
      return;
    }

    res.status(201).json({ success: true, data: toCamelCase(relation as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Families CreateUserRelation Error]', err);
    res.status(500).json({ success: false, message: '创建家庭关系失败' });
  }
});

/**
 * 删除家庭成员（人）关系（仅 owner；归属校验：必须属于该家庭）
 */
router.delete('/:id/user-relations/:relationId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const operatorId = req.userId!;
    const relationId = req.params.relationId as string;

    const isOwner = await familyUserRepository.isFamilyOwner(familyId, operatorId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '仅家庭创建者可删除成员关系' });
      return;
    }

    const removed = await familyUserRelationRepository.removeRelation(relationId, familyId);
    if (!removed) {
      res.status(404).json({ success: false, message: '关系不存在' });
      return;
    }

    res.json({ success: true, data: null });
  } catch (err) {
    console.error('[Families RemoveUserRelation Error]', err);
    res.status(500).json({ success: false, message: '删除家庭关系失败' });
  }
});

export default router;
