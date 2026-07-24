import { pool } from '../db.js';

export interface AccessoryRow {
  id: string;
  name: string;
  slot: 'head' | 'neck' | 'back' | 'body' | 'feet';
  svgPath: string;
  speciesCompat: string[];
  unlockSource: 'default' | 'achievement' | 'paid' | 'member';
  unlockCondition: Record<string, unknown>;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface UserAccessoryRow {
  id: number;
  userId: string;
  accessoryId: string;
  unlockedAt: string;
  unlockSource: string;
}

export interface PetOutfitRow {
  petId: string;
  outfitSlots: Record<string, string | null>;
  updatedAt: string;
}

export interface TryOnHistoryRow {
  id: number;
  userId: string;
  petId: string;
  outfitSnapshot: Record<string, unknown>;
  createdAt: string;
}

export async function findAllActiveAccessories(): Promise<AccessoryRow[]> {
  const result = await pool.query(
    `SELECT id, name, slot, svg_path, species_compat, unlock_source, unlock_condition, sort_order, is_active, created_at
     FROM accessories WHERE is_active = TRUE ORDER BY sort_order, created_at`
  );
  return result.rows.map(mapAccessoryRow);
}

export async function findAccessoriesBySlot(slot: string): Promise<AccessoryRow[]> {
  const result = await pool.query(
    `SELECT id, name, slot, svg_path, species_compat, unlock_source, unlock_condition, sort_order, is_active, created_at
     FROM accessories WHERE is_active = TRUE AND slot = $1 ORDER BY sort_order, created_at`,
    [slot]
  );
  return result.rows.map(mapAccessoryRow);
}

export async function findAccessoryById(id: string): Promise<AccessoryRow | null> {
  const result = await pool.query(
    `SELECT id, name, slot, svg_path, species_compat, unlock_source, unlock_condition, sort_order, is_active, created_at
     FROM accessories WHERE id = $1`,
    [id]
  );
  if (result.rowCount === 0) return null;
  return mapAccessoryRow(result.rows[0]);
}

export async function findUserInventory(userId: string): Promise<UserAccessoryRow[]> {
  const result = await pool.query(
    `SELECT uai.id, uai.user_id, uai.accessory_id, uai.unlocked_at, uai.unlock_source
     FROM user_accessory_inventory uai
     JOIN accessories a ON uai.accessory_id = a.id AND a.is_active = TRUE
     WHERE uai.user_id = $1
     ORDER BY a.sort_order, uai.unlocked_at DESC`,
    [userId]
  );
  return result.rows.map(mapUserAccessoryRow);
}

export async function findUserAccessory(userId: string, accessoryId: string): Promise<UserAccessoryRow | null> {
  const result = await pool.query(
    `SELECT id, user_id, accessory_id, unlocked_at, unlock_source
     FROM user_accessory_inventory WHERE user_id = $1 AND accessory_id = $2`,
    [userId, accessoryId]
  );
  if (result.rowCount === 0) return null;
  return mapUserAccessoryRow(result.rows[0]);
}

export async function insertUserAccessory(userId: string, accessoryId: string, unlockSource: string): Promise<UserAccessoryRow> {
  const result = await pool.query(
    `INSERT INTO user_accessory_inventory (user_id, accessory_id, unlock_source)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, accessory_id) DO NOTHING
     RETURNING id, user_id, accessory_id, unlocked_at, unlock_source`,
    [userId, accessoryId, unlockSource]
  );
  if (result.rowCount === 0) {
    const existing = await findUserAccessory(userId, accessoryId);
    return existing!;
  }
  return mapUserAccessoryRow(result.rows[0]);
}

export async function countUserAccessories(userId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM user_accessory_inventory WHERE user_id = $1`,
    [userId]
  );
  return result.rows[0]?.count ?? 0;
}

export async function findPetOutfit(petId: string): Promise<PetOutfitRow | null> {
  const result = await pool.query(
    `SELECT pet_id, outfit_slots, updated_at FROM pet_outfits WHERE pet_id = $1`,
    [petId]
  );
  if (result.rowCount === 0) return null;
  return mapPetOutfitRow(result.rows[0]);
}

export async function upsertPetOutfit(petId: string, outfitSlots: Record<string, string | null>): Promise<PetOutfitRow> {
  const result = await pool.query(
    `INSERT INTO pet_outfits (pet_id, outfit_slots)
     VALUES ($1, $2)
     ON CONFLICT (pet_id) DO UPDATE SET outfit_slots = $2, updated_at = now()
     RETURNING pet_id, outfit_slots, updated_at`,
    [petId, JSON.stringify(outfitSlots)]
  );
  return mapPetOutfitRow(result.rows[0]);
}

export async function clearPetOutfitSlot(petId: string, slot: string): Promise<PetOutfitRow | null> {
  const result = await pool.query(
    `UPDATE pet_outfits SET outfit_slots = outfit_slots - $2, updated_at = now()
     WHERE pet_id = $1
     RETURNING pet_id, outfit_slots, updated_at`,
    [petId, slot]
  );
  if (result.rowCount === 0) return null;
  return mapPetOutfitRow(result.rows[0]);
}

export async function findTryOnHistory(userId: string, limit: number = 20): Promise<TryOnHistoryRow[]> {
  const result = await pool.query(
    `SELECT id, user_id, pet_id, outfit_snapshot, created_at
     FROM try_on_history WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [userId, Math.min(limit, 20)]
  );
  return result.rows.map(mapTryOnHistoryRow);
}

export async function insertTryOnHistory(userId: string, petId: string, outfitSnapshot: Record<string, unknown>): Promise<TryOnHistoryRow> {
  const result = await pool.query(
    `INSERT INTO try_on_history (user_id, pet_id, outfit_snapshot)
     VALUES ($1, $2, $3)
     RETURNING id, user_id, pet_id, outfit_snapshot, created_at`,
    [userId, petId, JSON.stringify(outfitSnapshot)]
  );
  return mapTryOnHistoryRow(result.rows[0]);
}

export async function updatePetOutfitSummary(petId: string, outfitSummary: Record<string, unknown> | null, themeSuiteUrl: string | null): Promise<void> {
  await pool.query(
    `UPDATE pet_profiles SET outfit_summary = $1, theme_suite_url = $2, updated_at = now() WHERE id = $3`,
    [outfitSummary ? JSON.stringify(outfitSummary) : null, themeSuiteUrl, petId]
  );
}

function mapAccessoryRow(row: Record<string, unknown>): AccessoryRow {
  return {
    id: row.id as string,
    name: row.name as string,
    slot: row.slot as AccessoryRow['slot'],
    svgPath: row.svg_path as string,
    speciesCompat: (row.species_compat as string[]) || [],
    unlockSource: row.unlock_source as AccessoryRow['unlockSource'],
    unlockCondition: (row.unlock_condition as Record<string, unknown>) || {},
    sortOrder: row.sort_order as number,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
  };
}

function mapUserAccessoryRow(row: Record<string, unknown>): UserAccessoryRow {
  return {
    id: row.id as number,
    userId: row.user_id as string,
    accessoryId: row.accessory_id as string,
    unlockedAt: row.unlocked_at as string,
    unlockSource: row.unlock_source as string,
  };
}

function mapPetOutfitRow(row: Record<string, unknown>): PetOutfitRow {
  return {
    petId: row.pet_id as string,
    outfitSlots: (row.outfit_slots as Record<string, string | null>) || {},
    updatedAt: row.updated_at as string,
  };
}

function mapTryOnHistoryRow(row: Record<string, unknown>): TryOnHistoryRow {
  return {
    id: row.id as number,
    userId: row.user_id as string,
    petId: row.pet_id as string,
    outfitSnapshot: (row.outfit_snapshot as Record<string, unknown>) || {},
    createdAt: row.created_at as string,
  };
}
