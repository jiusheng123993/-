import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export type TaskType = '2d' | '3d';
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface GenerationTask {
  id: string;
  userId: string;
  petId: string;
  taskType: TaskType;
  status: TaskStatus;
  progress: number;
  referencePhotoUrl: string | null;
  resultData: Record<string, unknown> | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function createTask(
  userId: string,
  petId: string,
  taskType: TaskType,
  referencePhotoUrl?: string,
): Promise<GenerationTask> {
  const id = uuidv4();
  const result = await pool.query(
    `INSERT INTO avatar_generation_tasks (id, user_id, pet_id, task_type, status, progress, reference_photo_url)
     VALUES ($1, $2, $3, $4, 'pending', 0, $5)
     RETURNING *`,
    [id, userId, petId, taskType, referencePhotoUrl || null],
  );
  return mapTaskRow(result.rows[0]);
}

export async function updateTaskProgress(taskId: string, progress: number): Promise<void> {
  await pool.query(
    `UPDATE avatar_generation_tasks SET progress = $1, updated_at = now() WHERE id = $2`,
    [Math.min(100, Math.max(0, progress)), taskId],
  );
}

export async function updateTaskStatus(taskId: string, status: TaskStatus, error?: string): Promise<void> {
  await pool.query(
    `UPDATE avatar_generation_tasks SET status = $1, error = $2, updated_at = now() WHERE id = $3`,
    [status, error || null, taskId],
  );
}

export async function updateTaskResult(taskId: string, resultData: Record<string, unknown>): Promise<void> {
  await pool.query(
    `UPDATE avatar_generation_tasks SET result_data = $1, updated_at = now() WHERE id = $2`,
    [JSON.stringify(resultData), taskId],
  );
}

export async function getTask(taskId: string, userId: string): Promise<GenerationTask | null> {
  const result = await pool.query(
    `SELECT * FROM avatar_generation_tasks WHERE id = $1 AND user_id = $2`,
    [taskId, userId],
  );
  if (result.rowCount === 0) return null;
  return mapTaskRow(result.rows[0]);
}

export async function getLatestTaskByPet(
  userId: string,
  petId: string,
  taskType: TaskType,
): Promise<GenerationTask | null> {
  const result = await pool.query(
    `SELECT * FROM avatar_generation_tasks
     WHERE user_id = $1 AND pet_id = $2 AND task_type = $3
     ORDER BY created_at DESC LIMIT 1`,
    [userId, petId, taskType],
  );
  if (result.rowCount === 0) return null;
  return mapTaskRow(result.rows[0]);
}

export async function cleanStaleTasks(): Promise<{ images: number; models: number; tasks: number }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const staleTaskIds = await client.query(
      `SELECT id FROM avatar_generation_tasks WHERE status = 'failed' AND created_at < $1`,
      [cutoff],
    );

    if (staleTaskIds.rowCount === 0) {
      await client.query('COMMIT');
      return { images: 0, models: 0, tasks: 0 };
    }

    const ids = staleTaskIds.rows.map((r: { id: string }) => r.id);

    const imagesResult = await client.query(
      `DELETE FROM avatar_2d_images WHERE task_id = ANY($1)`,
      [ids],
    );

    const modelsResult = await client.query(
      `DELETE FROM avatar_3d_models WHERE task_id = ANY($1)`,
      [ids],
    );

    const tasksResult = await client.query(
      `DELETE FROM avatar_generation_tasks WHERE id = ANY($1)`,
      [ids],
    );

    await client.query('COMMIT');

    return {
      images: imagesResult.rowCount ?? 0,
      models: modelsResult.rowCount ?? 0,
      tasks: tasksResult.rowCount ?? 0,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

function mapTaskRow(row: Record<string, unknown>): GenerationTask {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    petId: row.pet_id as string,
    taskType: row.task_type as TaskType,
    status: row.status as TaskStatus,
    progress: row.progress as number,
    referencePhotoUrl: row.reference_photo_url as string | null,
    resultData: row.result_data as Record<string, unknown> | null,
    error: row.error as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}