import { pool } from '../db.js';

export interface ThemeSuiteRow {
  id: string;
  name: string;
  category: 'festival' | 'season' | 'birthday' | 'special';
  promptTemplate: string;
  festivalDate: string | null;
  previewUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export interface ThemeSuiteTaskRow {
  id: string;
  userId: string;
  petId: string;
  suiteId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl: string | null;
  moderationResult: 'pass' | 'review' | 'block' | null;
  quotaConsumed: boolean;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function findAllActiveThemeSuites(): Promise<ThemeSuiteRow[]> {
  const result = await pool.query(
    `SELECT id, name, category, prompt_template, festival_date, preview_url, sort_order, is_active, created_at
     FROM theme_suites WHERE is_active = TRUE ORDER BY sort_order, created_at`
  );
  return result.rows.map(mapThemeSuiteRow);
}

export async function findThemeSuiteById(id: string): Promise<ThemeSuiteRow | null> {
  const result = await pool.query(
    `SELECT id, name, category, prompt_template, festival_date, preview_url, sort_order, is_active, created_at
     FROM theme_suites WHERE id = $1`,
    [id]
  );
  if (result.rowCount === 0) return null;
  return mapThemeSuiteRow(result.rows[0]);
}

export async function findThemeSuitesByCategory(category: string): Promise<ThemeSuiteRow[]> {
  const result = await pool.query(
    `SELECT id, name, category, prompt_template, festival_date, preview_url, sort_order, is_active, created_at
     FROM theme_suites WHERE is_active = TRUE AND category = $1 ORDER BY sort_order, created_at`,
    [category]
  );
  return result.rows.map(mapThemeSuiteRow);
}

export async function findThemeSuiteTask(taskId: string, userId: string): Promise<ThemeSuiteTaskRow | null> {
  const result = await pool.query(
    `SELECT id, user_id, pet_id, suite_id, status, result_url, moderation_result, quota_consumed, retry_count, created_at, updated_at
     FROM theme_suite_tasks WHERE id = $1 AND user_id = $2`,
    [taskId, userId]
  );
  if (result.rowCount === 0) return null;
  return mapThemeSuiteTaskRow(result.rows[0]);
}

export async function findActiveTaskByPet(petId: string): Promise<ThemeSuiteTaskRow | null> {
  const result = await pool.query(
    `SELECT id, user_id, pet_id, suite_id, status, result_url, moderation_result, quota_consumed, retry_count, created_at, updated_at
     FROM theme_suite_tasks
     WHERE pet_id = $1 AND status IN ('pending', 'processing')
     ORDER BY created_at DESC LIMIT 1`,
    [petId]
  );
  if (result.rowCount === 0) return null;
  return mapThemeSuiteTaskRow(result.rows[0]);
}

export async function findActiveTaskByPetForUpdate(petId: string): Promise<ThemeSuiteTaskRow | null> {
  const result = await pool.query(
    `SELECT id, user_id, pet_id, suite_id, status, result_url, moderation_result, quota_consumed, retry_count, created_at, updated_at
     FROM theme_suite_tasks
     WHERE pet_id = $1 AND status IN ('pending', 'processing')
     ORDER BY created_at DESC LIMIT 1
     FOR UPDATE`,
    [petId]
  );
  if (result.rowCount === 0) return null;
  return mapThemeSuiteTaskRow(result.rows[0]);
}

export async function findThemeSuiteTasksByUser(userId: string, limit: number = 20): Promise<ThemeSuiteTaskRow[]> {
  const result = await pool.query(
    `SELECT id, user_id, pet_id, suite_id, status, result_url, moderation_result, quota_consumed, retry_count, created_at, updated_at
     FROM theme_suite_tasks WHERE user_id = $1
     ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return result.rows.map(mapThemeSuiteTaskRow);
}

export async function insertThemeSuiteTask(
  userId: string,
  petId: string,
  suiteId: string
): Promise<ThemeSuiteTaskRow> {
  const result = await pool.query(
    `INSERT INTO theme_suite_tasks (user_id, pet_id, suite_id, status, quota_consumed)
     VALUES ($1, $2, $3, 'pending', TRUE)
     RETURNING id, user_id, pet_id, suite_id, status, result_url, moderation_result, quota_consumed, retry_count, created_at, updated_at`,
    [userId, petId, suiteId]
  );
  return mapThemeSuiteTaskRow(result.rows[0]);
}

export async function updateThemeSuiteTaskStatus(
  taskId: string,
  status: ThemeSuiteTaskRow['status'],
  resultUrl?: string | null,
  moderationResult?: ThemeSuiteTaskRow['moderationResult']
): Promise<void> {
  const sets: string[] = ['status = $1', 'updated_at = now()'];
  const params: unknown[] = [status];
  let paramIdx = 2;

  if (resultUrl !== undefined) {
    sets.push(`result_url = $${paramIdx}`);
    params.push(resultUrl);
    paramIdx++;
  }

  if (moderationResult !== undefined) {
    sets.push(`moderation_result = $${paramIdx}`);
    params.push(moderationResult);
    paramIdx++;
  }

  params.push(taskId);
  await pool.query(
    `UPDATE theme_suite_tasks SET ${sets.join(', ')} WHERE id = $${paramIdx}`,
    params
  );
}

export async function incrementTaskRetryCount(taskId: string): Promise<void> {
  await pool.query(
    `UPDATE theme_suite_tasks SET retry_count = retry_count + 1, updated_at = now() WHERE id = $1`,
    [taskId]
  );
}

export async function countMonthlyThemeSuiteTasks(userId: string): Promise<number> {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM theme_suite_tasks
     WHERE user_id = $1 AND quota_consumed = TRUE AND created_at >= $2`,
    [userId, monthStart]
  );
  return result.rows[0]?.count ?? 0;
}

function mapThemeSuiteRow(row: Record<string, unknown>): ThemeSuiteRow {
  return {
    id: row.id as string,
    name: row.name as string,
    category: row.category as ThemeSuiteRow['category'],
    promptTemplate: row.prompt_template as string,
    festivalDate: row.festival_date as string | null,
    previewUrl: row.preview_url as string | null,
    sortOrder: row.sort_order as number,
    isActive: row.is_active as boolean,
    createdAt: row.created_at as string,
  };
}

function mapThemeSuiteTaskRow(row: Record<string, unknown>): ThemeSuiteTaskRow {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    petId: row.pet_id as string,
    suiteId: row.suite_id as string,
    status: row.status as ThemeSuiteTaskRow['status'],
    resultUrl: row.result_url as string | null,
    moderationResult: row.moderation_result as ThemeSuiteTaskRow['moderationResult'],
    quotaConsumed: row.quota_consumed as boolean,
    retryCount: row.retry_count as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}
