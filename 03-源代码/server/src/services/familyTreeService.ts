/**
 * 家族图谱业务服务层 - 编排家族图谱的核心业务逻辑
 * 职责：家庭归属校验、宠物归属校验、关系管理、血缘管理（含防循环）、图谱聚合、快照管理
 * 所有操作前先验证 family_id 属于当前用户，防止跨用户越权
 *
 * 业务约束：
 * 1. 所有路由先 verifyFamilyOwnership
 * 2. 创建关系/血缘时 verifyPetOwnership 校验涉及的宠物
 * 3. 创建关系：UNIQUE(pet_id_a, pet_id_b, relation_type) 预检 → 409
 * 4. 创建血缘：UNIQUE(parent_id, child_id) 预检 → 409；防循环 → 400
 * 5. 更新关系：仅允许更新 label_a/label_b，至少一个字段
 */
import { pool } from '../db.js';
import {
  RelationshipRepository,
  type RelationshipRow,
  type RelationshipWithPetsRow,
} from '../repositories/relationshipRepository.js';
import {
  LineageRepository,
  type LineageWithPetRow,
} from '../repositories/lineageRepository.js';
import {
  SnapshotRepository,
  type SnapshotRow,
} from '../repositories/snapshotRepository.js';
import { FamilyRepository } from '../repositories/familyRepository.js';
import { PetRepository } from '../repositories/petRepository.js';

/** 创建关系请求参数 */
export interface CreateRelationshipInput {
  pet_id_a: string;
  pet_id_b: string;
  relation_type: string;
  direction?: string;
  label_a?: string;
  label_b?: string;
}

/** 更新关系请求参数 */
export interface UpdateRelationshipInput {
  label_a?: string;
  label_b?: string;
}

/** 创建血缘请求参数 */
export interface CreateLineageInput {
  parent_id: string;
  child_id: string;
  litter_date?: string;
}

/** 创建快照请求参数 */
export interface CreateSnapshotInput {
  layout_type: string;
  graph_data: Record<string, unknown>;
  thumbnail_url?: string;
}

/** 快照列表查询参数 */
export interface SnapshotQueryInput {
  page: number;
  page_size: number;
}

/** 图谱节点 */
export interface TreeNode {
  pet_id: string;
  name: string | null;
  avatar_url: string | null;
  species: string | null;
  role: string | null;
}

/** 图谱边 */
export interface TreeEdge extends RelationshipWithPetsRow {}

/** 图谱响应 */
export interface TreeResponse {
  nodes: TreeNode[];
  edges: TreeEdge[];
}

/** 血亲树响应 */
export interface LineageResponse {
  pet: {
    id: string;
    name: string | null;
    avatar_url: string | null;
    species: string | null;
  };
  parents: LineageWithPetRow[];
  children: LineageWithPetRow[];
  siblings: LineageWithPetRow[];
  mates: RelationshipRow[];
}

/** 快照列表响应 */
export interface SnapshotListResponse {
  items: SnapshotRow[];
  total: number;
  page: number;
  page_size: number;
}

/** 业务错误（带状态码，供路由层捕获） */
export class FamilyTreeError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'FamilyTreeError';
  }
}

const relationshipRepository = new RelationshipRepository();
const lineageRepository = new LineageRepository();
const snapshotRepository = new SnapshotRepository();
const familyRepository = new FamilyRepository();
const petRepository = new PetRepository();

/**
 * 获取家族图谱数据
 * - 校验家庭归属
 * - 查询家庭成员（JOIN pet_profiles）+ 角色（pet_roles）
 * - 查询关系（pet_relationships）
 * - 返回 { nodes, edges }
 */
export async function getTree(
  userId: string,
  familyId: string,
): Promise<TreeResponse> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new FamilyTreeError(403, '无权查看此家庭');
  }

  // 并行查询：家庭成员+角色、关系
  const membersSql = `
    SELECT
      p.id AS pet_id, p.name, p.species,
      COALESCE(p.avatar_photo_url, p.avatar_cartoon_url) AS avatar_url,
      r.role_type, r.assignment
    FROM pet_family_members m
    LEFT JOIN pet_profiles p ON p.id = m.pet_id
    LEFT JOIN pet_roles r ON r.pet_id = m.pet_id AND r.family_id = m.family_id
    WHERE m.family_id = $1
    ORDER BY m.joined_at ASC
  `;
  const [membersResult, edges] = await Promise.all([
    pool.query(membersSql, [familyId]),
    relationshipRepository.findByFamilyId(familyId),
  ]);

  const nodes: TreeNode[] = membersResult.rows.map((row) => ({
    pet_id: row.pet_id,
    name: row.name,
    avatar_url: row.avatar_url,
    species: row.species,
    role: row.assignment ?? null,
  }));

  return { nodes, edges };
}

/**
 * 创建宠物关系
 * - 校验家庭归属
 * - 校验 pet_id_a 和 pet_id_b 都属于当前用户
 * - 检查 UNIQUE 预检，已存在返回 409
 * - 插入记录
 */
export async function createRelationship(
  userId: string,
  familyId: string,
  data: CreateRelationshipInput,
): Promise<RelationshipRow> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new FamilyTreeError(403, '无权操作此家庭');
  }

  // 并行校验两个宠物归属
  const [ownsA, ownsB] = await Promise.all([
    petRepository.isOwner(data.pet_id_a, userId),
    petRepository.isOwner(data.pet_id_b, userId),
  ]);
  if (!ownsA || !ownsB) {
    throw new FamilyTreeError(403, '只能关联自己的宠物');
  }

  // UNIQUE 预检
  const existing = await relationshipRepository.findExisting(
    data.pet_id_a,
    data.pet_id_b,
    data.relation_type,
    familyId,
  );
  if (existing) {
    throw new FamilyTreeError(409, '该关系已存在');
  }

  return relationshipRepository.insert({
    family_id: familyId,
    pet_id_a: data.pet_id_a,
    pet_id_b: data.pet_id_b,
    relation_type: data.relation_type,
    direction: data.direction ?? null,
    label_a: data.label_a ?? null,
    label_b: data.label_b ?? null,
  });
}

/**
 * 更新关系（仅允许更新 label_a/label_b）
 * - 校验家庭归属
 * - 至少一个字段，否则 400
 * - 关系必须存在且属于该家庭，否则 404
 */
export async function updateRelationship(
  userId: string,
  familyId: string,
  relId: string,
  data: UpdateRelationshipInput,
): Promise<RelationshipRow> {
  if (data.label_a === undefined && data.label_b === undefined) {
    throw new FamilyTreeError(400, '没有需要更新的字段');
  }

  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new FamilyTreeError(403, '无权操作此家庭');
  }

  const existing = await relationshipRepository.findByIdAndFamily(relId, familyId);
  if (!existing) {
    throw new FamilyTreeError(404, '关系不存在');
  }

  const updateData: Record<string, unknown> = {};
  if (data.label_a !== undefined) {
    updateData.label_a = data.label_a;
  }
  if (data.label_b !== undefined) {
    updateData.label_b = data.label_b;
  }

  const updated = await relationshipRepository.updateById(relId, updateData);
  if (!updated) {
    throw new FamilyTreeError(404, '关系不存在');
  }
  return updated;
}

/**
 * 删除关系
 * - 校验家庭归属
 * - 关系必须存在且属于该家庭，否则 404
 */
export async function deleteRelationship(
  userId: string,
  familyId: string,
  relId: string,
): Promise<void> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new FamilyTreeError(403, '无权操作此家庭');
  }

  const existing = await relationshipRepository.findByIdAndFamily(relId, familyId);
  if (!existing) {
    throw new FamilyTreeError(404, '关系不存在');
  }

  await relationshipRepository.deleteById(relId);
}

/**
 * 添加血缘关系
 * - 校验家庭归属
 * - 校验 parent_id 和 child_id 都属于当前用户
 * - UNIQUE 预检，已存在返回 409
 * - 防循环：child_id 不能是 parent_id 的祖先，否则 400
 */
export async function createLineage(
  userId: string,
  familyId: string,
  data: CreateLineageInput,
): Promise<{ id: string; parent_id: string; child_id: string; litter_date: string | null; created_at: string | null }> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new FamilyTreeError(403, '无权操作此家庭');
  }

  // 并行校验两个宠物归属
  const [ownsParent, ownsChild] = await Promise.all([
    petRepository.isOwner(data.parent_id, userId),
    petRepository.isOwner(data.child_id, userId),
  ]);
  if (!ownsParent || !ownsChild) {
    throw new FamilyTreeError(403, '只能关联自己的宠物');
  }

  // UNIQUE 预检
  const existing = await lineageRepository.findExisting(data.parent_id, data.child_id);
  if (existing) {
    throw new FamilyTreeError(409, '该血缘关系已存在');
  }

  // 防循环：查询 child_id 的所有祖先，看是否包含 parent_id
  const ancestors = await lineageRepository.findAncestors(data.child_id);
  if (ancestors.has(data.parent_id)) {
    throw new FamilyTreeError(400, '血缘关系存在循环，无法添加');
  }

  return lineageRepository.insert({
    family_id: familyId,
    parent_id: data.parent_id,
    child_id: data.child_id,
    litter_date: data.litter_date ?? null,
  });
}

/**
 * 获取某宠物的血亲树
 * - 校验家庭归属
 * - 校验宠物归属
 * - 并行查询 pet 信息、父母、子女、兄弟姐妹、配偶
 */
export async function getLineage(
  userId: string,
  familyId: string,
  petId: string,
): Promise<LineageResponse> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new FamilyTreeError(403, '无权查看此家庭');
  }

  const ownsPet = await petRepository.isOwner(petId, userId);
  if (!ownsPet) {
    throw new FamilyTreeError(403, '只能查看自己的宠物');
  }

  // 并行查询：宠物基础信息、父母、子女、兄弟姐妹、配偶
  const petSql = `
    SELECT id, name, species,
      COALESCE(avatar_photo_url, avatar_cartoon_url) AS avatar_url
    FROM pet_profiles
    WHERE id = $1
  `;
  const [petResult, parents, children, siblings, mates] = await Promise.all([
    pool.query(petSql, [petId]),
    lineageRepository.findParents(petId),
    lineageRepository.findChildren(petId),
    lineageRepository.findSiblings(petId),
    relationshipRepository.findMatesByPetId(petId),
  ]);

  const petRow = petResult.rows[0];
  if (!petRow) {
    throw new FamilyTreeError(404, '宠物不存在');
  }

  return {
    pet: {
      id: petRow.id,
      name: petRow.name,
      avatar_url: petRow.avatar_url,
      species: petRow.species,
    },
    parents,
    children,
    siblings,
    mates,
  };
}

/**
 * 保存家族图谱快照
 * - 校验家庭归属
 * - 插入记录（graph_data 用 JSON.stringify）
 */
export async function createSnapshot(
  userId: string,
  familyId: string,
  data: CreateSnapshotInput,
): Promise<SnapshotRow> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new FamilyTreeError(403, '无权操作此家庭');
  }

  return snapshotRepository.insertSnapshot({
    family_id: familyId,
    layout_type: data.layout_type,
    graph_data: data.graph_data,
    thumbnail_url: data.thumbnail_url ?? null,
  });
}

/**
 * 获取快照列表（分页）
 * - 校验家庭归属
 * - 查询列表 + 总数（并行）
 */
export async function listSnapshots(
  userId: string,
  familyId: string,
  query: SnapshotQueryInput,
): Promise<SnapshotListResponse> {
  const owns = await familyRepository.isOwner(familyId, userId);
  if (!owns) {
    throw new FamilyTreeError(403, '无权查看此家庭');
  }

  const [items, total] = await Promise.all([
    snapshotRepository.findByFamilyId(familyId, query.page, query.page_size),
    snapshotRepository.countByFamilyId(familyId),
  ]);

  return {
    items,
    total,
    page: query.page,
    page_size: query.page_size,
  };
}
