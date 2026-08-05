/**
 * 宠物血缘关系数据访问层 - pet_lineage 表的数据库操作
 * 提供父母/子女/兄弟姐妹查询、防循环祖先查询、归属校验
 * 继承 BaseRepository，复用通用 CRUD 能力，强制参数化查询防注入
 *
 * 防循环说明：findAncestors 使用简单递归（最多 5 层），
 * 不实现复杂图算法；如需更深层级可后续扩展为迭代+访问集合
 */
import { BaseRepository } from './baseRepository.js';
import type { QueryResultRow } from 'pg';

/** 血缘关系数据行 */
export interface LineageRow extends QueryResultRow {
  id: string;
  family_id: string | null;
  parent_id: string;
  child_id: string;
  litter_date: string | null;
  created_at: string | null;
}

/** 血亲行（含宠物名字） */
export interface LineageWithPetRow extends LineageRow {
  pet_id: string;
  pet_name: string | null;
  pet_avatar_url: string | null;
  pet_species: string | null;
}

export class LineageRepository extends BaseRepository<LineageRow> {
  protected tableName = 'pet_lineage';
  protected allowedSortFields: readonly string[] = ['created_at'];

  /**
   * 查询某宠物的直接父母（pet_lineage WHERE child_id = petId）
   * 返回父母信息（含宠物基础资料）
   */
  async findParents(petId: string): Promise<LineageWithPetRow[]> {
    const sql = `
      SELECT
        l.id, l.family_id, l.parent_id, l.child_id, l.litter_date, l.created_at,
        p.id AS pet_id, p.name AS pet_name,
        COALESCE(p.avatar_photo_url, p.avatar_cartoon_url) AS pet_avatar_url,
        p.species AS pet_species
      FROM pet_lineage l
      LEFT JOIN pet_profiles p ON p.id = l.parent_id
      WHERE l.child_id = $1
      ORDER BY l.created_at DESC
    `;
    const result = await this.rawQuery<LineageWithPetRow>(sql, [petId]);
    return result.rows;
  }

  /**
   * 查询某宠物的直接子女（pet_lineage WHERE parent_id = petId）
   */
  async findChildren(petId: string): Promise<LineageWithPetRow[]> {
    const sql = `
      SELECT
        l.id, l.family_id, l.parent_id, l.child_id, l.litter_date, l.created_at,
        p.id AS pet_id, p.name AS pet_name,
        COALESCE(p.avatar_photo_url, p.avatar_cartoon_url) AS pet_avatar_url,
        p.species AS pet_species
      FROM pet_lineage l
      LEFT JOIN pet_profiles p ON p.id = l.child_id
      WHERE l.parent_id = $1
      ORDER BY l.created_at DESC
    `;
    const result = await this.rawQuery<LineageWithPetRow>(sql, [petId]);
    return result.rows;
  }

  /**
   * 查询兄弟姐妹（与目标有共同 parent 的其他 pet）
   * 用 DISTINCT 排除目标自己，避免返回自身
   */
  async findSiblings(petId: string): Promise<LineageWithPetRow[]> {
    const sql = `
      SELECT DISTINCT
        l.id, l.family_id, l.parent_id, l.child_id, l.litter_date, l.created_at,
        p.id AS pet_id, p.name AS pet_name,
        COALESCE(p.avatar_photo_url, p.avatar_cartoon_url) AS pet_avatar_url,
        p.species AS pet_species
      FROM pet_lineage l
      LEFT JOIN pet_profiles p ON p.id = l.child_id
      WHERE l.parent_id IN (
        SELECT parent_id FROM pet_lineage WHERE child_id = $1
      )
        AND l.child_id <> $1
      ORDER BY l.created_at DESC
    `;
    const result = await this.rawQuery<LineageWithPetRow>(sql, [petId]);
    return result.rows;
  }

  /**
   * 检查同一对 parent-child 是否已存在（UNIQUE 预检，提供 409）
   */
  async findExisting(parentId: string, childId: string): Promise<LineageRow | null> {
    return this.findOneWhere(
      'parent_id = $1 AND child_id = $2',
      [parentId, childId],
    );
  }

  /**
   * 按 ID 和 family_id 查找血缘关系（用于归属校验 + 删除）
   */
  async findByIdAndFamily(lineageId: string, familyId: string): Promise<LineageRow | null> {
    return this.findOneWhere(
      'id = $1 AND family_id = $2',
      [lineageId, familyId],
    );
  }

  /**
   * 按代查询某宠物的祖先（含宠物信息），支持多代
   * BFS 逐层遍历，返回按代分组的结果
   * @param petId - 起始宠物
   * @param maxDepth - 向上查询代数（1=父母，2=祖辈，3=曾祖）
   * @returns 按代分组的祖先列表，第 0 层为直接父母，以此类推
   */
  async findAncestorsWithInfo(petId: string, maxDepth = 3): Promise<LineageWithPetRow[][]> {
    const levels: LineageWithPetRow[][] = [];
    let currentLevel: string[] = [petId];
    const visited = new Set<string>([petId]);

    for (let depth = 0; depth < maxDepth; depth++) {
      if (currentLevel.length === 0) break;

      const sql = `
        SELECT DISTINCT l.id, l.family_id, l.parent_id, l.child_id, l.litter_date, l.created_at,
          p.id AS pet_id, p.name AS pet_name,
          COALESCE(p.avatar_photo_url, p.avatar_cartoon_url) AS pet_avatar_url,
          p.species AS pet_species
        FROM pet_lineage l
        LEFT JOIN pet_profiles p ON p.id = l.parent_id
        WHERE l.child_id = ANY($1::text[]) AND p.id IS NOT NULL
      `;
      const result = await this.rawQuery<LineageWithPetRow>(sql, [currentLevel]);

      const levelRows: LineageWithPetRow[] = [];
      const nextLevel: string[] = [];
      const seenInLevel = new Set<string>();
      for (const row of result.rows) {
        const pid = row.parent_id as string;
        if (visited.has(pid) || seenInLevel.has(pid)) continue;
        seenInLevel.add(pid);
        visited.add(pid);
        levelRows.push(row);
        nextLevel.push(pid);
      }

      levels.push(levelRows);
      currentLevel = nextLevel;
    }

    return levels;
  }

  /**
   * 按代查询某宠物的后代（含宠物信息），支持多代
   * BFS 逐层遍历，返回按代分组的结果
   * @param petId - 起始宠物
   * @param maxDepth - 向下查询代数（1=子女，2=孙辈，3=曾孙）
   * @returns 按代分组的后代列表，第 0 层为直接子女，以此类推
   */
  async findDescendantsWithInfo(petId: string, maxDepth = 3): Promise<LineageWithPetRow[][]> {
    const levels: LineageWithPetRow[][] = [];
    let currentLevel: string[] = [petId];
    const visited = new Set<string>([petId]);

    for (let depth = 0; depth < maxDepth; depth++) {
      if (currentLevel.length === 0) break;

      const sql = `
        SELECT DISTINCT l.id, l.family_id, l.parent_id, l.child_id, l.litter_date, l.created_at,
          p.id AS pet_id, p.name AS pet_name,
          COALESCE(p.avatar_photo_url, p.avatar_cartoon_url) AS pet_avatar_url,
          p.species AS pet_species
        FROM pet_lineage l
        LEFT JOIN pet_profiles p ON p.id = l.child_id
        WHERE l.parent_id = ANY($1::text[]) AND p.id IS NOT NULL
      `;
      const result = await this.rawQuery<LineageWithPetRow>(sql, [currentLevel]);

      const levelRows: LineageWithPetRow[] = [];
      const nextLevel: string[] = [];
      const seenInLevel = new Set<string>();
      for (const row of result.rows) {
        const pid = row.child_id as string;
        if (visited.has(pid) || seenInLevel.has(pid)) continue;
        seenInLevel.add(pid);
        visited.add(pid);
        levelRows.push(row);
        nextLevel.push(pid);
      }

      levels.push(levelRows);
      currentLevel = nextLevel;
    }

    return levels;
  }

  /**
   * 递归查询某宠物的所有祖先（用于防循环检测）
   * 简单实现：BFS 遍历，最多 5 层，避免无限循环（数据异常时兜底）
   * @returns 祖先 ID 集合
   */
  async findAncestors(petId: string, maxDepth = 5): Promise<Set<string>> {
    const ancestors = new Set<string>();
    let currentLevel: string[] = [petId];
    const visited = new Set<string>([petId]);

    for (let depth = 0; depth < maxDepth; depth++) {
      if (currentLevel.length === 0) break;

      // 一次查询当前层所有 parent
      const sql = `
        SELECT DISTINCT parent_id
        FROM pet_lineage
        WHERE child_id = ANY($1::text[])
      `;
      const result = await this.rawQuery<QueryResultRow>(sql, [currentLevel]);

      const nextLevel: string[] = [];
      for (const row of result.rows) {
        const parentId = row.parent_id as string;
        if (!visited.has(parentId)) {
          visited.add(parentId);
          ancestors.add(parentId);
          nextLevel.push(parentId);
        }
      }
      currentLevel = nextLevel;
    }

    return ancestors;
  }
}
