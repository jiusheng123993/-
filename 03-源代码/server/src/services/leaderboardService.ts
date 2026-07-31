/**
 * 排行榜与角色业务服务层
 * 职责：
 *   - 家庭归属校验（防越权）
 *   - 排行榜查询：优先读快照，快照过期或不存在时实时聚合计算并 upsert
 *   - 角色管理：分配/更新/删除/查询家庭宠物角色
 * 积分维度：健康打卡数 + 动态数 + moment数 + 健康分（100 - 异常数*15）
 * 积分公式：score = checkin_count*10 + feed_count*5 + moment_count*8 + health_score*2
 */
import { pool } from '../db.js';
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
 * 根据周期计算时间范围
 * - weekly: 最近 7 天
 * - monthly: 最近 30 天
 * - all_time: 不限制时间（NULL 表示全量）
 */
function getPeriodRange(period: 'weekly' | 'monthly' | 'all_time'): { since: Date | null } {
  if (period === 'all_time') return { since: null };
  const days = period === 'weekly' ? 7 : 30;
  const since = new Date();
  since.setDate(since.getDate() - days);
  return { since };
}

/**
 * 实时聚合家庭下所有宠物的积分数据
 * 积分维度：健康打卡数 + 动态数 + moment数 + 健康分
 *
 * 数据来源：
 *   - checkin_count / health_score / anomaly_count: pet_health_entries（通过 pet_family_members JOIN）
 *   - feed_count: pet_family_feeds（按 pet_id 统计，含所有 feed_type）
 *   - moment_count: pet_family_feeds（feed_type = 'moment'）
 *
 * 积分公式：score = checkin_count*10 + feed_count*5 + moment_count*8 + health_score*2
 * 健康分：health_score = MAX(0, 100 - anomaly_count*15)
 *
 * @param familyId - 家庭 ID
 * @param period - 周期：weekly/monthly/all_time
 * @returns 排行榜项数组（已按 score 降序排列，含 rank）
 */
async function computeLeaderboard(
  familyId: string,
  period: 'weekly' | 'monthly' | 'all_time',
): Promise<RankingItem[]> {
  const { since } = getPeriodRange(period);
  const params: unknown[] = since ? [familyId, since] : [familyId];

  // 单次聚合查询：统计每只宠物的打卡数、异常数、动态数、moment数
  const result = await pool.query(
    `SELECT
       m.pet_id,
       p.name AS pet_name,
       COALESCE(p.avatar_photo_url, p.avatar_cartoon_url) AS pet_avatar_url,
       COALESCE(checkin_agg.checkin_count, 0) AS checkin_count,
       COALESCE(checkin_agg.anomaly_count, 0) AS anomaly_count,
       COALESCE(feed_agg.feed_count, 0) AS feed_count,
       COALESCE(feed_agg.moment_count, 0) AS moment_count
     FROM pet_family_members m
     JOIN pet_profiles p ON p.id = m.pet_id
     LEFT JOIN (
       SELECT h.pet_id,
              COUNT(*) AS checkin_count,
              COUNT(*) FILTER (WHERE h.has_anomaly) AS anomaly_count
       FROM pet_health_entries h
       WHERE 1=1 ${since ? 'AND h.created_at >= $2' : ''}
       GROUP BY h.pet_id
     ) checkin_agg ON checkin_agg.pet_id = m.pet_id
     LEFT JOIN (
       SELECT f.pet_id,
              COUNT(*) AS feed_count,
              COUNT(*) FILTER (WHERE f.feed_type = 'moment') AS moment_count
       FROM pet_family_feeds f
       WHERE f.family_id = $1 ${since ? 'AND f.created_at >= $2' : ''}
       GROUP BY f.pet_id
     ) feed_agg ON feed_agg.pet_id = m.pet_id
     WHERE m.family_id = $1`,
    params,
  );

  const rows = result.rows as Array<{
    pet_id: string;
    pet_name: string;
    pet_avatar_url: string | null;
    checkin_count: string | number;
    anomaly_count: string | number;
    feed_count: string | number;
    moment_count: string | number;
  }>;

  // 计算积分并构建排行榜项
  const items: RankingItem[] = rows.map((row) => {
    const checkinCount = Number(row.checkin_count);
    const anomalyCount = Number(row.anomaly_count);
    const feedCount = Number(row.feed_count);
    const momentCount = Number(row.moment_count);
    const healthScore = Math.max(0, 100 - anomalyCount * 15);
    const score = checkinCount * 10 + feedCount * 5 + momentCount * 8 + healthScore * 2;

    // 徽章规则
    const badges: string[] = [];
    if (checkinCount >= 7) badges.push('七日打卡');
    if (checkinCount >= 30) badges.push('坚持达人');
    if (momentCount >= 5) badges.push('动态达人');
    if (anomalyCount === 0 && checkinCount > 0) badges.push('健康宝宝');
    if (feedCount >= 10) badges.push('活跃家庭');

    return {
      rank: 0, // 排序后填充
      pet_id: row.pet_id,
      pet_name: row.pet_name,
      pet_avatar_url: row.pet_avatar_url,
      score,
      metrics: {
        checkin_count: checkinCount,
        feed_count: feedCount,
        moment_count: momentCount,
        health_score: healthScore,
      },
      badges,
    };
  });

  // 按 score 降序排序，分配名次
  items.sort((a, b) => b.score - a.score);
  items.forEach((item, index) => {
    item.rank = index + 1;
  });

  return items;
}

/**
 * 刷新排行榜：实时聚合计算并 upsert 快照
 * @returns 刷新后的排行榜响应
 */
export async function refreshLeaderboard(
  userId: string,
  familyId: string,
  period: 'weekly' | 'monthly' | 'all_time',
): Promise<LeaderboardResponse> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new LeaderboardError(404, '家庭不存在');
  }

  const rankings = await computeLeaderboard(familyId, period);
  const snapshot = await snapshotRepository.upsertSnapshot(familyId, period, rankings);

  return {
    period,
    rankings,
    updated_at: snapshot.computed_at,
  };
}

/** 快照过期时间：1 小时（毫秒） */
const SNAPSHOT_TTL_MS = 60 * 60 * 1000;

/**
 * 获取排行榜
 * - 优先读快照
 * - 快照不存在或过期（超过1小时）时实时聚合计算并 upsert
 * - 快照存在且未过期时直接返回
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

  // 快照存在且未过期：直接返回
  if (snapshot) {
    const computedAt = new Date(snapshot.computed_at).getTime();
    const isExpired = Date.now() - computedAt > SNAPSHOT_TTL_MS;
    if (!isExpired) {
      const rankings = Array.isArray(snapshot.rankings)
        ? (snapshot.rankings as RankingItem[])
        : [];
      return {
        period,
        rankings,
        updated_at: snapshot.computed_at,
      };
    }
  }

  // 快照不存在或已过期：实时聚合计算并 upsert
  const rankings = await computeLeaderboard(familyId, period);
  const newSnapshot = await snapshotRepository.upsertSnapshot(familyId, period, rankings);

  return {
    period,
    rankings,
    updated_at: newSnapshot.computed_at,
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
