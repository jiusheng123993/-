import { Router, type Request, type Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();
router.use(authMiddleware);

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

function toCamelCaseArray(arr: Record<string, unknown>[]): Record<string, unknown>[] {
  return arr.map(toCamelCase);
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      name, species, breed, breed_id, gender, birth_date, weight,
      avatar_photo_url, avatar_cartoon_url, avatar_style, photos,
      is_neutered, microchip_id, notes,
    } = req.body;

    if (!name || !species || !breed || !breed_id || !gender || !birth_date) {
      res.status(400).json({
        success: false,
        message: '缺少必填字段: name, species, breed, breed_id, gender, birth_date',
      });
      return;
    }

    const id = uuidv4();
    const { rows } = await pool.query(
      `INSERT INTO pet_profiles
        (id, user_id, name, species, breed, breed_id, gender, birth_date, weight,
         avatar_photo_url, avatar_cartoon_url, avatar_style, photos,
         is_neutered, microchip_id, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       RETURNING *`,
      [
        id, req.userId, name, species, breed, breed_id, gender, birth_date, weight ?? 0,
        avatar_photo_url ?? null, avatar_cartoon_url ?? null, avatar_style ?? null,
        photos ?? [], is_neutered ?? false, microchip_id ?? '', notes ?? '',
      ]
    );

    res.status(201).json({ success: true, data: toCamelCase(rows[0]) });
  } catch (err) {
    console.error('[Pets Create Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM pet_profiles WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json({ success: true, data: toCamelCaseArray(rows) });
  } catch (err) {
    console.error('[Pets List Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    res.json({ success: true, data: toCamelCase(rows[0]) });
  } catch (err) {
    console.error('[Pets Get Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { rows: existing } = await pool.query(
      'SELECT id FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (existing.length === 0) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    const {
      name, species, breed, breed_id, gender, birth_date, weight,
      avatar_photo_url, avatar_cartoon_url, avatar_style, photos,
      is_neutered, microchip_id, notes,
    } = req.body;

    const fieldMap: [unknown, string][] = [
      [name, 'name'],
      [species, 'species'],
      [breed, 'breed'],
      [breed_id, 'breed_id'],
      [gender, 'gender'],
      [birth_date, 'birth_date'],
      [weight, 'weight'],
      [avatar_photo_url, 'avatar_photo_url'],
      [avatar_cartoon_url, 'avatar_cartoon_url'],
      [avatar_style, 'avatar_style'],
      [photos, 'photos'],
      [is_neutered, 'is_neutered'],
      [microchip_id, 'microchip_id'],
      [notes, 'notes'],
    ];

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    for (const [val, col] of fieldMap) {
      if (val !== undefined) {
        updates.push(`${col} = $${idx++}`);
        values.push(val);
      }
    }

    if (updates.length === 0) {
      res.status(400).json({ success: false, message: '没有需要更新的字段' });
      return;
    }

    values.push(req.params.id);
    values.push(req.userId);

    const { rows } = await pool.query(
      `UPDATE pet_profiles SET ${updates.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
      values
    );

    res.json({ success: true, data: toCamelCase(rows[0]) });
  } catch (err) {
    console.error('[Pets Update Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM pet_profiles WHERE id = $1 AND user_id = $2',
      [req.params.id, req.userId]
    );

    if (rowCount === 0) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    res.json({ success: true, message: '删除成功' });
  } catch (err) {
    console.error('[Pets Delete Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.post('/:id/deceased', async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(
      `UPDATE pet_profiles
       SET is_deceased = true, deceased_date = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [req.body.deceased_date || new Date().toISOString().split('T')[0], req.params.id, req.userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: '宠物不存在' });
      return;
    }

    res.json({ success: true, data: toCamelCase(rows[0]) });
  } catch (err) {
    console.error('[Pets Deceased Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
