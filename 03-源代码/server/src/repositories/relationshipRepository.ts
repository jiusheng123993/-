/**
 * 宠物关系数据访问层 - pet_relationships 表的数据库操作
 * 提供宠物关系（朋友/对手/伴侣/配偶等）的 CRUD 与归属校验
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 宠物关系数据行 */
export interface RelationshipRow extends QueryResultRow {
  id: string;
  family_id: string;
  pet_id_a: string;
  pet_id_b: string;
  relation_type: string;
  direction: string | null;
  label_a: string | null;
  label_b: string | null;
  created_at: string;
}

/** 关系列表查询结果（含宠物名字） */
export interface RelationshipWithPetsRow extends RelationshipRow {
  pet_a_name: string | null;
  pet_b_name: string | null;
}

export class RelationshipRepository extends BaseRepository<RelationshipRow> {
  protected tableName = 'pet_relationships';
  protected allowedSortFields: readonly string[] = ['created_at'];

  /**
   * 查询家庭所有关系（JOIN pet_profiles 获取名字）
   */
  async findByFamilyId(familyId: string): Promise<RelationshipWithPetsRow[]> {
    const sql = `
      SELECT
        r.id, r.family_id, r.pet_id_a, r.pet_id_b, r.relation_type,
        r.direction, r.label_a, r.label_b, r.created_at,
        pa.name AS pet_a_name,
        pb.name AS pet_b_name
      FROM pet_relationships r
      LEFT JOIN pet_profiles pa ON pa.id = r.pet_id_a
      LEFT JOIN pet_profiles pb ON pb.id = r.pet_id_b
      WHERE r.family_id = $1
      ORDER BY r.created_at DESC
    `;
    const result = await this.rawQuery<RelationshipWithPetsRow>(sql, [familyId]);
    return result.rows;
  }

  /**
   * 按 ID + family_id 查询关系（用于归属校验，防跨家庭越权）
   */
  async findByIdAndFamily(relId: string, familyId: string): Promise<RelationshipRow | null> {
    return this.findOneWhere('id = $1 AND family_id = $2', [relId, familyId]);
  }

  /**
   * 检查同类型关系是否已存在（UNIQUE 预检，提供 409 而非 500）
   */
  async findExisting(
    petIdA: string,
    petIdB: string,
    relationType: string,
    familyId: string,
  ): Promise<RelationshipRow | null> {
    return this.findOneWhere(
      'pet_id_a = $1 AND pet_id_b = $2 AND relation_type = $3 AND family_id = $4',
      [petIdA, petIdB, relationType, familyId],
    );
  }

  /**
   * 查询涉及某只宠物的所有配偶关系（用于血亲树的 mates 字段）
   * 返回配偶宠物名（pet_a_name / pet_b_name），供前端直接渲染
   */
  async findMatesByPetId(petId: string): Promise<(RelationshipRow & { pet_a_name: string | null; pet_b_name: string | null })[]> {
    const sql = `
      SELECT r.id, r.family_id, r.pet_id_a, r.pet_id_b, r.relation_type,
             r.direction, r.label_a, r.label_b, r.created_at,
             pa.name AS pet_a_name,
             pb.name AS pet_b_name
      FROM pet_relationships r
      LEFT JOIN pet_profiles pa ON pa.id = r.pet_id_a
      LEFT JOIN pet_profiles pb ON pb.id = r.pet_id_b
      WHERE r.relation_type = 'mate'
        AND (r.pet_id_a = $1 OR r.pet_id_b = $1)
      ORDER BY r.created_at DESC
    `;
    const result = await this.rawQuery<RelationshipRow & { pet_a_name: string | null; pet_b_name: string | null }>(sql, [petId]);
    return result.rows;
  }
}
