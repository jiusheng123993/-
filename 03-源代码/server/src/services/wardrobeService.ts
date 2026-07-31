/**
 * 衣橱业务服务 - 宠物配饰装备/卸下/解锁的业务逻辑
 * 包含归属校验、槽位校验、成就验证、会员配额检查
 */
import { pool } from '../db.js';
import * as wardrobeRepo from '../repositories/wardrobeRepository.js';
import { sanitizeLog } from '../utils/sanitize.js';
import type { AccessoryRow, UserAccessoryRow, PetOutfitRow, TryOnHistoryRow } from '../repositories/wardrobeRepository.js';

const VALID_SLOTS = ['head', 'neck', 'back', 'body', 'feet'] as const;
type ValidSlot = (typeof VALID_SLOTS)[number];

const FREE_THEME_SUITE_MONTHLY_LIMIT = 3;
const MEMBER_THEME_SUITE_MONTHLY_LIMIT = 10;

const MAX_OUTFIT_SNAPSHOT_SIZE = 2048;
const VALID_OUTFIT_SNAPSHOT_KEYS = new Set(VALID_SLOTS);
const VALID_SNAPSHOT_VALUE_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/;

function validateOutfitSnapshot(snapshot: Record<string, unknown>): void {
  const keys = Object.keys(snapshot);
  if (keys.length > VALID_SLOTS.length) {
    throw new WardrobeError('INVALID_SLOT', 'outfitSnapshot 字段数量超出限制');
  }
  for (const key of keys) {
    if (!VALID_OUTFIT_SNAPSHOT_KEYS.has(key as ValidSlot)) {
      throw new WardrobeError('INVALID_SLOT', `outfitSnapshot 包含非法字段: ${key}`);
    }
    const value = snapshot[key];
    if (value !== null && value !== undefined) {
      if (typeof value !== 'string') {
        throw new WardrobeError('INVALID_SLOT', `outfitSnapshot 字段 ${key} 值必须为字符串或 null`);
      }
      if (!VALID_SNAPSHOT_VALUE_PATTERN.test(value)) {
        throw new WardrobeError('INVALID_SLOT', `outfitSnapshot 字段 ${key} 值格式不合法`);
      }
    }
  }
  const serialized = JSON.stringify(snapshot);
  if (serialized.length > MAX_OUTFIT_SNAPSHOT_SIZE) {
    throw new WardrobeError('INVALID_SLOT', 'outfitSnapshot 数据过大');
  }
}

export interface WardrobeOverview {
  accessories: AccessoryRow[];
  inventory: UserAccessoryRow[];
  outfit: PetOutfitRow | null;
  tryOnHistory: TryOnHistoryRow[];
}

export interface EquipResult {
  outfit: PetOutfitRow;
  equipped: { slot: string; accessoryId: string };
}

export interface UnequipResult {
  outfit: PetOutfitRow | null;
  clearedSlot: string;
}

export async function getWardrobeOverview(userId: string, petId: string): Promise<WardrobeOverview> {
  if (petId) {
    const petResult = await pool.query(
      'SELECT id FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [petId, userId]
    );
    if (petResult.rowCount === 0) {
      throw new WardrobeError('PET_NOT_FOUND', '宠物不存在或无权访问');
    }
  }

  const [accessories, inventory, outfit, tryOnHistory] = await Promise.all([
    wardrobeRepo.findAllActiveAccessories(),
    wardrobeRepo.findUserInventory(userId),
    petId ? wardrobeRepo.findPetOutfit(petId) : Promise.resolve(null),
    wardrobeRepo.findTryOnHistory(userId, 10),
  ]);

  return { accessories, inventory, outfit, tryOnHistory };
}

export async function getAccessoriesBySlot(slot: string): Promise<AccessoryRow[]> {
  if (!slot) {
    return wardrobeRepo.findAllActiveAccessories();
  }
  if (!VALID_SLOTS.includes(slot as ValidSlot)) {
    return [];
  }
  return wardrobeRepo.findAccessoriesBySlot(slot);
}

export async function equipAccessory(
  userId: string,
  petId: string,
  slot: string,
  accessoryId: string
): Promise<EquipResult> {
  if (!VALID_SLOTS.includes(slot as ValidSlot)) {
    throw new WardrobeError('INVALID_SLOT', `无效的槽位: ${slot}`);
  }

  const accessory = await wardrobeRepo.findAccessoryById(accessoryId);
  if (!accessory) {
    throw new WardrobeError('ACCESSORY_NOT_FOUND', '配饰不存在');
  }

  if (accessory.slot !== slot) {
    throw new WardrobeError('SLOT_MISMATCH', `配饰 ${accessoryId} 不属于槽位 ${slot}`);
  }

  const owned = await wardrobeRepo.findUserAccessory(userId, accessoryId);
  if (!owned) {
    throw new WardrobeError('NOT_OWNED', '尚未拥有该配饰');
  }

  const petResult = await pool.query(
    'SELECT id FROM pet_profiles WHERE id = $1 AND user_id = $2',
    [petId, userId]
  );
  if (petResult.rowCount === 0) {
    throw new WardrobeError('PET_NOT_FOUND', '宠物不存在或无权访问');
  }

  const currentOutfit = await wardrobeRepo.findPetOutfit(petId);
  const outfitSlots = currentOutfit ? { ...currentOutfit.outfitSlots } : {};
  outfitSlots[slot] = accessoryId;

  const outfit = await wardrobeRepo.upsertPetOutfit(petId, outfitSlots);

  await wardrobeRepo.updatePetOutfitSummary(petId, { slots: outfitSlots, equippedAt: new Date().toISOString() }, null);

  return { outfit, equipped: { slot, accessoryId } };
}

export async function unequipAccessory(
  userId: string,
  petId: string,
  slot: string
): Promise<UnequipResult> {
  if (!VALID_SLOTS.includes(slot as ValidSlot)) {
    throw new WardrobeError('INVALID_SLOT', `无效的槽位: ${slot}`);
  }

  const petResult = await pool.query(
    'SELECT id FROM pet_profiles WHERE id = $1 AND user_id = $2',
    [petId, userId]
  );
  if (petResult.rowCount === 0) {
    throw new WardrobeError('PET_NOT_FOUND', '宠物不存在或无权访问');
  }

  const outfit = await wardrobeRepo.clearPetOutfitSlot(petId, slot);

  if (outfit) {
    await wardrobeRepo.updatePetOutfitSummary(petId, { slots: outfit.outfitSlots, unequippedAt: new Date().toISOString() }, null);
  }

  return { outfit, clearedSlot: slot };
}

export async function saveTryOnSnapshot(userId: string, petId: string, outfitSnapshot: Record<string, unknown>): Promise<TryOnHistoryRow> {
  validateOutfitSnapshot(outfitSnapshot);

  const petResult = await pool.query(
    'SELECT id FROM pet_profiles WHERE id = $1 AND user_id = $2',
    [petId, userId]
  );
  if (petResult.rowCount === 0) {
    throw new WardrobeError('PET_NOT_FOUND', '宠物不存在或无权访问');
  }

  return wardrobeRepo.insertTryOnHistory(userId, petId, outfitSnapshot);
}

const VALID_UNLOCK_SOURCES = ['default', 'achievement', 'paid', 'member'] as const;

export async function unlockAccessory(
  userId: string,
  accessoryId: string,
  source: string
): Promise<UserAccessoryRow> {
  if (!VALID_UNLOCK_SOURCES.includes(source as (typeof VALID_UNLOCK_SOURCES)[number])) {
    throw new WardrobeError('INVALID_SLOT', '无效的解锁来源');
  }

  const accessory = await wardrobeRepo.findAccessoryById(accessoryId);
  if (!accessory) {
    throw new WardrobeError('ACCESSORY_NOT_FOUND', '配饰不存在');
  }

  const existing = await wardrobeRepo.findUserAccessory(userId, accessoryId);
  if (existing) {
    return existing;
  }

  if (accessory.unlockSource === 'paid') {
    throw new WardrobeError('PAYMENT_REQUIRED', '该配饰需要付费解锁');
  }

  if (accessory.unlockSource === 'member') {
    const membership = await getUserMembership(userId);
    if (!membership.isMember) {
      throw new WardrobeError('MEMBER_ONLY', '该配饰仅限会员使用');
    }
  }

  if (accessory.unlockSource === 'achievement') {
    const condition = accessory.unlockCondition;
    if (condition.achievementId && typeof condition.achievementId === 'string') {
      const achieved = await verifyAchievement(userId, condition.achievementId);
      if (!achieved) {
        throw new WardrobeError('ACHIEVEMENT_LOCKED', '尚未达成解锁条件');
      }
    }
  }

  return wardrobeRepo.insertUserAccessory(userId, accessoryId, accessory.unlockSource);
}

export async function getUserMembership(userId: string): Promise<{ isMember: boolean; status: string }> {
  const result = await pool.query(
    'SELECT tier, status, expires_at FROM memberships WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
    [userId]
  );
  if (result.rowCount === 0) return { isMember: false, status: 'none' };
  const row = result.rows[0] as { tier: string; status: string; expires_at: string | null };
  if (row.status === 'active' && row.expires_at && new Date(row.expires_at) < new Date()) {
    return { isMember: false, status: 'expired' };
  }
  return { isMember: row.tier !== 'free' && row.status === 'active', status: row.status };
}

async function verifyAchievement(userId: string, achievementId: string): Promise<boolean> {
  const safeId = sanitizeLog(achievementId);

  switch (safeId) {
    case 'streak_7':
    case 'streak_30':
    case 'streak_100': {
      const minStreak = safeId === 'streak_7' ? 7 : safeId === 'streak_30' ? 30 : 100;
      const result = await pool.query(
        `SELECT COUNT(DISTINCT date_trunc('day', created_at))::int AS days
         FROM pet_health_entries
         WHERE user_id = $1
           AND created_at >= now() - INTERVAL '1 year'`,
        [userId]
      );
      return (result.rows[0]?.days ?? 0) >= minStreak;
    }

    case 'vaccine_complete': {
      const result = await pool.query(
        `SELECT 1 FROM pet_vaccinations
         WHERE user_id = $1 AND status = 'completed'
         LIMIT 1`,
        [userId]
      );
      return (result.rowCount ?? 0) > 0;
    }

    case 'birthday': {
      const result = await pool.query(
        `SELECT 1 FROM pet_profiles
         WHERE user_id = $1 AND birthday IS NOT NULL
         LIMIT 1`,
        [userId]
      );
      return (result.rowCount ?? 0) > 0;
    }

    default:
      console.warn(`[Wardrobe] Unknown achievement: ${safeId}`);
      return false;
  }
}

export class WardrobeError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'WardrobeError';
  }
}
