/**
 * Repository 基类 - 统一数据访问层封装
 * 所有数据库操作必须通过 Repository 层，禁止在 Service/Controller 直接写 SQL
 * 强制使用参数化查询，防止 SQL 注入
 */
import { pool } from '../db.js';
import type { Pool, QueryResult, QueryResultRow } from 'pg';

/** 排序字段白名单类型 */
type SortDirection = 'ASC' | 'DESC';

/** 通用查询选项 */
interface QueryOptions {
  orderBy?: string;
  sortDirection?: SortDirection;
  limit?: number;
  offset?: number;
}

/** 允许的排序字段白名单（子类覆盖） */
export abstract class BaseRepository<T extends QueryResultRow> {
  protected db: Pool;
  protected abstract tableName: string;
  protected abstract allowedSortFields: readonly string[];

  constructor() {
    this.db = pool;
  }

  /**
   * 校验排序字段是否在白名单中
   * 防止 SQL 注入：动态字段不允许直接拼接 SQL
   */
  protected validateSortField(field: string): string {
    if (!this.allowedSortFields.includes(field)) {
      throw new Error(`非法排序字段: ${field}`);
    }
    return field;
  }

  /**
   * 校验排序方向
   */
  protected validateSortDirection(dir: string | undefined): SortDirection {
    const upper = dir?.toUpperCase();
    if (upper !== 'ASC' && upper !== 'DESC') {
      return 'DESC';
    }
    return upper;
  }

  /**
   * 按 ID 查询单条记录
   */
  async findById(id: string): Promise<T | null> {
    const result = await this.db.query<T>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  /**
   * 按条件查询单条记录
   * @param conditions - 键值对，AND 连接
   * @param values - 参数值数组（与 conditions 顺序对应）
   */
  async findOneWhere(conditions: string, values: unknown[]): Promise<T | null> {
    const result = await this.db.query<T>(
      `SELECT * FROM ${this.tableName} WHERE ${conditions} LIMIT 1`,
      values,
    );
    return result.rows[0] ?? null;
  }

  /**
   * 按条件查询多条记录（带分页和排序）
   */
  async findManyWhere(
    conditions: string,
    values: unknown[],
    options: QueryOptions = {},
  ): Promise<T[]> {
    const parts: string[] = [`SELECT * FROM ${this.tableName}`];
    const params: unknown[] = [...values];
    let paramIndex = params.length;

    if (conditions) {
      parts.push(`WHERE ${conditions}`);
    }

    if (options.orderBy) {
      const field = this.validateSortField(options.orderBy);
      const dir = this.validateSortDirection(options.sortDirection);
      parts.push(`ORDER BY ${field} ${dir}`);
    }

    if (options.limit !== undefined) {
      paramIndex++;
      params.push(options.limit);
      parts.push(`LIMIT $${paramIndex}`);
    }

    if (options.offset !== undefined) {
      paramIndex++;
      params.push(options.offset);
      parts.push(`OFFSET $${paramIndex}`);
    }

    const result = await this.db.query<T>(parts.join(' '), params);
    return result.rows;
  }

  /**
   * 插入一条记录
   * @param data - 键值对
   * @returns 插入后的完整记录
   */
  async insert(data: Record<string, unknown>): Promise<T> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    const columns = keys.join(', ');

    const result = await this.db.query<T>(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  /**
   * 按 ID 更新记录
   * @param id - 记录 ID
   * @param data - 要更新的字段
   * @returns 更新后的完整记录
   */
  async updateById(id: string, data: Partial<Record<string, unknown>>): Promise<T | null> {
    const keys = Object.keys(data);
    if (keys.length === 0) return this.findById(id);

    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
    values.push(id);

    const result = await this.db.query<T>(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values,
    );
    return result.rows[0] ?? null;
  }

  /**
   * 按 ID 删除记录
   */
  async deleteById(id: string): Promise<boolean> {
    const result = await this.db.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * 统计符合条件的记录数
   * 注意：强制 Number 转换以兼容 mock（返回字符串）和真实 PG（::int 返回数字）
   */
  async countWhere(conditions: string, values: unknown[]): Promise<number> {
    const result = await this.db.query<QueryResultRow>(
      `SELECT COUNT(*)::int as count FROM ${this.tableName} WHERE ${conditions}`,
      values,
    );
    const count = result.rows[0]?.count;
    return count === undefined || count === null ? 0 : Number(count);
  }

  /**
   * 执行原生参数化查询（供复杂查询使用）
   * 注意：调用方必须确保 SQL 中不拼接用户输入
   */
  async rawQuery<R extends QueryResultRow = T>(sql: string, params: unknown[]): Promise<QueryResult<R>> {
    return this.db.query<R>(sql, params);
  }
}
