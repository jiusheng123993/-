/**
 * 排行榜与角色业务服务层
 * 职责：
 *   - 家庭归属校验（防越权）
 *   - 排行榜查询：优先读快照，无则返回空榜
 *   - 角色管理：分配/更新/删除/查询家庭宠物角色
 * 骨架阶段不实现真实积分聚合，仅返回快照或空数据
 */
import {
  RoleRepository,
  LeaderboardSnapshotRepository,
  type RoleRow,
} from '../repositories/leaderboardRepository.js';
import { FamilyRepository, FamilyMemberRepository } from '../repositories/familyRepository.js';
import { PetRepository } from '../repositories/petRepository.js';

/** 排行榜项 */
export interface RankingItem {
  rank: number;
  pet_id: string;
  pet_name: string;
  pet_avatar_url: string | null;
  score: number;
  metrics: {
    checkin_count: number;
    feed_count: number;
    moment_count: number;
    health_score: number;
  };
  badges: string[];
}

/** 排行榜响应 */
export interface LeaderboardResponse {
  period: 'weekly' | 'monthly' | 'all_time';
  rankings: RankingItem[];
  updated_at: string;
}

/** 角色响应 */
export interface RoleResponse {
  id: string;
  pet_id: string;
  pet_name: string;
  pet_avatar_url: string | null;
  role_type: string;
  role_label: string;
  assignment: string;
  created_at: string;
}

/** 家庭角色集合响应 */
export interface FamilyRolesResponse {
  roles: RoleResponse[];
  available_types: {
    type: string;
    label: string;
    description: string;
    icon: string;
  }[];
}

/** 业务错误（带状态码） */
export class LeaderboardError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'LeaderboardError';
  }
}

const roleRepository = new RoleRepository();
const snapshotRepository = new LeaderboardSnapshotRepository();
const familyRepository = new FamilyRepository();
const familyMemberRepository = new FamilyMemberRepository();
const petRepository = new PetRepository();

/** 角色类型元数据（label/description/icon） */
const ROLE_TYPES: Record<string, { label: string; description: string; icon: string }> = {
  guardian: { label: '守护者', description: '家里最懂事可靠的', icon: '🛡️' },
  comedian: { label: '开心果', description: '总能让家人笑出来', icon: '😄' },
  sleepyhead: { label: '睡神', description: '一天能睡 18 小时', icon: '😴' },
  gourmet: { label: '美食家', description: '吃什么都很香', icon: '🍖' },
  athlete: { label: '运动健将', description: '精力旺盛跑不停', icon: '🏃' },
  princess: { label: '小公主', description: '家里的小公主王子', icon: '👑' },
  explorer: { label: '探险家', description: '对一切充满好奇', icon: '🧭' },
  baby: { label: '宝贝', description: '全家最小的宝贝', icon: '🍼' },
};

/**
 * 校验宠物归属权 + 宠物是否属于该家庭
 */
async function verifyPetInFamily(
  petId: string,
  familyId: string,
  userId: string,
): Promise<boolean> {
  // 1. 宠物归属当前用户
  const ownsPet = await petRepository.isOwner(petId, userId);
  if (!ownsPet) return false;

  // 2. 宠物是家庭成员
  return familyMemberRepository.isMember(familyId, petId);
}

/**
 * 将角色行映射为响应（含宠物信息）
 */
async function toRoleResponse(row: RoleRow): Promise<RoleResponse> {
  const petInfo = await petRepository.findNameAndAvatar(row.pet_id);
  const meta = ROLE_TYPES[row.role_type] ?? { label: row.role_type, description: '', icon: '🐾' };
  return {
    id: row.id,
    pet_id: row.pet_id,
    pet_name: petInfo?.name ?? '未知宠物',
    pet_avatar_url: petInfo?.avatar_url ?? null,
    role_type: row.role_type,
    role_label: meta.label,
    assignment: row.assignment,
    created_at: row.created_at,
  };
}

/**
 * 获取排行榜
 * 骨架阶段：从快照表读取，无快照则返回空榜
 */
export async function getLeaderboard(
  userId: string,
  familyId: string,
  period: 'weekly' | 'monthly' | 'all_time',
): Promise<LeaderboardResponse> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new LeaderboardError(404, '家庭不存在');
  }

  const snapshot = await snapshotRepository.findByFamilyAndPeriod(familyId, period);
  if (!snapshot) {
    return {
      period,
      rankings: [],
      updated_at: new Date().toISOString(),
    };
  }

  const rankings = Array.isArray(snapshot.rankings)
    ? (snapshot.rankings as RankingItem[])
    : [];

  return {
    period,
    rankings,
    updated_at: snapshot.computed_at,
  };
}

/**
 * 获取家庭所有角色
 */
export async function listRoles(
  userId: string,
  familyId: string,
): Promise<FamilyRolesResponse> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new LeaderboardError(404, '家庭不存在');
  }

  const rows = await roleRepository.findByFamilyId(familyId);
  const roles = await Promise.all(rows.map(toRoleResponse));

  return {
    roles,
    available_types: Object.entries(ROLE_TYPES).map(([type, meta]) => ({
      type,
      label: meta.label,
      description: meta.description,
      icon: meta.icon,
    })),
  };
}

/**
 * 分配角色
 * - 家庭归属校验
 * - 宠物归属 + 宠物是家庭成员校验
 * - 同一宠物同一角色类型不可重复（UNIQUE 约束）
 */
export async function assignRole(
  userId: string,
  familyId: string,
  data: { pet_id: string; role_type: string; assignment: string },
): Promise<RoleResponse> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new LeaderboardError(404, '家庭不存在');
  }

  const petInFamily = await verifyPetInFamily(data.pet_id, familyId, userId);
  if (!petInFamily) {
    throw new LeaderboardError(400, '宠物不存在或不属于该家庭');
  }

  const exists = await roleRepository.existsByPetAndType(data.pet_id, data.role_type);
  if (exists) {
    throw new LeaderboardError(409, '该宠物已分配此角色');
  }

  const row = await roleRepository.insert({
    pet_id: data.pet_id,
    family_id: familyId,
    role_type: data.role_type,
    assignment: data.assignment,
  });

  return toRoleResponse(row);
}

/**
 * 更新角色（assignment 和/或 role_type）
 */
export async function updateRole(
  userId: string,
  familyId: string,
  roleId: string,
  data: { assignment?: string; role_type?: string },
): Promise<RoleResponse> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new LeaderboardError(404, '家庭不存在');
  }

  const existing = await roleRepository.findByIdAndFamily(roleId, familyId);
  if (!existing) {
    throw new LeaderboardError(404, '角色不存在');
  }

  // 如果更新 role_type，需检查新类型是否已被该宠物占用
  if (data.role_type && data.role_type !== existing.role_type) {
    const duplicate = await roleRepository.existsByPetAndType(existing.pet_id, data.role_type);
    if (duplicate) {
      throw new LeaderboardError(409, '该宠物已分配此角色类型');
    }
  }

  const updateData: Record<string, unknown> = {};
  if (data.assignment !== undefined) updateData.assignment = data.assignment;
  if (data.role_type !== undefined) updateData.role_type = data.role_type;

  const updated = await roleRepository.updateById(roleId, updateData);
  if (!updated) {
    throw new LeaderboardError(500, '更新失败');
  }

  return toRoleResponse(updated);
}

/**
 * 删除角色
 */
export async function deleteRole(
  userId: string,
  familyId: string,
  roleId: string,
): Promise<void> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new LeaderboardError(404, '家庭不存在');
  }

  const existing = await roleRepository.findByIdAndFamily(roleId, familyId);
  if (!existing) {
    throw new LeaderboardError(404, '角色不存在');
  }

  await roleRepository.deleteById(roleId);
}
