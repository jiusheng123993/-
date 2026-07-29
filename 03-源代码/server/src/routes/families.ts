import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { pool } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

async function verifyFamilyOwnership(familyId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM pet_families WHERE id = $1 AND user_id = $2',
    [familyId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

async function verifyPetOwnership(petId: string, userId: string): Promise<boolean> {
  const result = await pool.query(
    'SELECT 1 FROM pet_profiles WHERE id = $1 AND user_id = $2',
    [petId, userId]
  );
  return (result.rowCount ?? 0) > 0;
}

router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;
    const { name, avatar_url } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ success: false, message: '请提供家庭名称' });
      return;
    }

    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO pet_families (id, user_id, name, avatar_url)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, userId, name.trim(), avatar_url || null]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[Families Create Error]', err);
    res.status(500).json({ success: false, message: '创建家庭失败' });
  }
});

router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = req.userId!;

    const result = await pool.query(
      `SELECT
         f.*,
         COALESCE(
           (SELECT COUNT(*) FROM pet_family_members m WHERE m.family_id = f.id),
           0
         )::INT AS member_count
       FROM pet_families f
       WHERE f.user_id = $1
       ORDER BY f.created_at DESC`,
      [userId]
    );

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error('[Families List Error]', err);
    res.status(500).json({ success: false, message: '获取家庭列表失败' });
  }
});

router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const familyResult = await pool.query(
      'SELECT * FROM pet_families WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (familyResult.rowCount === 0) {
      res.status(404).json({ success: false, message: '家庭不存在' });
      return;
    }

    const membersResult = await pool.query(
      `SELECT m.*, p.name AS pet_name, p.species, p.breed, p.avatar_cartoon_url, p.avatar_photo_url
       FROM pet_family_members m
       JOIN pet_profiles p ON p.id = m.pet_id
       WHERE m.family_id = $1
       ORDER BY m.joined_at ASC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...familyResult.rows[0],
        members: membersResult.rows,
      },
    });
  } catch (err) {
    console.error('[Families Detail Error]', err);
    res.status(500).json({ success: false, message: '获取家庭详情失败' });
  }
});

router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const userId = req.userId!;

    const isOwner = await verifyFamilyOwnership(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此家庭' });
      return;
    }

    const { name, avatar_url } = req.body;

    const setClauses: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ success: false, message: '家庭名称不能为空' });
        return;
      }
      setClauses.push(`name = $${paramIndex++}`);
      values.push(name.trim());
    }

    if (avatar_url !== undefined) {
      setClauses.push(`avatar_url = $${paramIndex++}`);
      values.push(avatar_url);
    }

    if (setClauses.length === 0) {
      res.status(400).json({ success: false, message: '没有需要更新的字段' });
      return;
    }

    setClauses.push(`updated_at = NOW()`);

    values.push(familyId, userId);
    const result = await pool.query(
      `UPDATE pet_families SET ${setClauses.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
       RETURNING *`,
      values
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[Families Update Error]', err);
    res.status(500).json({ success: false, message: '更新家庭失败' });
  }
});

router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const userId = req.userId!;

    const isOwner = await verifyFamilyOwnership(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此家庭' });
      return;
    }

    await pool.query(
      'DELETE FROM pet_families WHERE id = $1 AND user_id = $2',
      [familyId, userId]
    );

    res.json({ success: true, message: '家庭已删除' });
  } catch (err) {
    console.error('[Families Delete Error]', err);
    res.status(500).json({ success: false, message: '删除家庭失败' });
  }
});

router.post('/:id/members', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const userId = req.userId!;

    const isOwner = await verifyFamilyOwnership(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此家庭' });
      return;
    }

    const { pet_id, role } = req.body;

    if (!pet_id) {
      res.status(400).json({ success: false, message: '请提供宠物ID' });
      return;
    }

    const isPetOwner = await verifyPetOwnership(pet_id, userId);
    if (!isPetOwner) {
      res.status(403).json({ success: false, message: '只能添加自己的宠物' });
      return;
    }

    const existingResult = await pool.query(
      'SELECT 1 FROM pet_family_members WHERE family_id = $1 AND pet_id = $2',
      [familyId, pet_id]
    );
    if ((existingResult.rowCount ?? 0) > 0) {
      res.status(409).json({ success: false, message: '该宠物已在家庭中' });
      return;
    }

    const memberId = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO pet_family_members (id, family_id, pet_id, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [memberId, familyId, pet_id, role || null]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error('[Families AddMember Error]', err);
    res.status(500).json({ success: false, message: '添加成员失败' });
  }
});

router.delete('/:id/members/:petId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const petId = req.params.petId as string;
    const userId = req.userId!;

    const isOwner = await verifyFamilyOwnership(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权操作此家庭' });
      return;
    }

    const result = await pool.query(
      'DELETE FROM pet_family_members WHERE family_id = $1 AND pet_id = $2 RETURNING *',
      [familyId, petId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ success: false, message: '成员不存在' });
      return;
    }

    res.json({ success: true, message: '成员已移除' });
  } catch (err) {
    console.error('[Families RemoveMember Error]', err);
    res.status(500).json({ success: false, message: '移除成员失败' });
  }
});

// 获取家庭动态 (moments)
router.get('/:id/moments', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const userId = req.userId!;
    const limit = parseInt(req.query.limit as string) || 20;

    const isOwner = await verifyFamilyOwnership(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权查看此家庭' });
      return;
    }

    // 获取家庭成员的宠物ID列表
    const memberResult = await pool.query(
      'SELECT pet_id FROM pet_family_members WHERE family_id = $1',
      [familyId]
    );
    const petIds = memberResult.rows.map((r: { pet_id: string }) => r.pet_id);

    if (petIds.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const placeholders = petIds.map((_: string, i: number) => `$${i + 1}`).join(',');

    // 聚合健康打卡作为动态
    const { rows } = await pool.query(
      `SELECT
         h.id, h.pet_id AS "petId", h.user_id AS "userId",
         'checkin' AS type,
         json_build_object(
           'poopLevel', h.poop_level,
           'appetiteLevel', h.appetite_level,
           'spiritLevel', h.spirit_level,
           'exerciseLevel', h.exercise_level,
           'weight', h.weight,
           'riskLevel', h.risk_level,
           'note', h.note
         ) AS content,
         h.created_at AS "createdAt"
       FROM pet_health_entries h
       WHERE h.pet_id IN (${placeholders})
       ORDER BY h.created_at DESC
       LIMIT $${petIds.length + 1}`,
      [...petIds, limit]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Families Moments Error]', err);
    res.status(500).json({ success: false, message: '获取动态失败' });
  }
});

// 获取家庭新动态 (since timestamp)
router.get('/:id/moments/new', authMiddleware, async (req: Request, res: Response) => {
  try {
    const familyId = req.params.id as string;
    const userId = req.userId!;
    const since = req.query.since as string;

    if (!since) {
      res.status(400).json({ success: false, message: 'since 参数不能为空' });
      return;
    }

    const isOwner = await verifyFamilyOwnership(familyId, userId);
    if (!isOwner) {
      res.status(403).json({ success: false, message: '无权查看此家庭' });
      return;
    }

    const memberResult = await pool.query(
      'SELECT pet_id FROM pet_family_members WHERE family_id = $1',
      [familyId]
    );
    const petIds = memberResult.rows.map((r: { pet_id: string }) => r.pet_id);

    if (petIds.length === 0) {
      res.json({ success: true, data: [] });
      return;
    }

    const placeholders = petIds.map((_: string, i: number) => `$${i + 1}`).join(',');

    const { rows } = await pool.query(
      `SELECT
         h.id, h.pet_id AS "petId", h.user_id AS "userId",
         'checkin' AS type,
         json_build_object(
           'poopLevel', h.poop_level,
           'appetiteLevel', h.appetite_level,
           'spiritLevel', h.spirit_level,
           'exerciseLevel', h.exercise_level,
           'weight', h.weight,
           'riskLevel', h.risk_level,
           'note', h.note
         ) AS content,
         h.created_at AS "createdAt"
       FROM pet_health_entries h
       WHERE h.pet_id IN (${placeholders}) AND h.created_at > $${petIds.length + 1}
       ORDER BY h.created_at DESC`,
      [...petIds, since]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Families NewMoments Error]', err);
    res.status(500).json({ success: false, message: '获取新动态失败' });
  }
});

export default router;
