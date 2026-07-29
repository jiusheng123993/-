import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db.js';
import { config } from '../config.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      res.status(400).json({ success: false, message: '缺少登录凭证 code' });
      return;
    }

    let openid: string;
    const isDev = !config.wechat.appId || !config.wechat.secret;

    if (isDev) {
      openid = code;
    } else {
      const wxRes = await fetch(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${config.wechat.appId}&secret=${config.wechat.secret}&js_code=${code}&grant_type=authorization_code`
      );
      const wxData = (await wxRes.json()) as { openid?: string; errcode?: number; errmsg?: string };

      if (!wxData.openid) {
        console.error('[Auth] 微信 jscode2session 失败:', wxData.errcode, wxData.errmsg);
        res.status(400).json({ success: false, message: '微信登录失败，请重试' });
        return;
      }

      openid = wxData.openid;
    }

    const { rows: existingUsers } = await pool.query('SELECT * FROM users WHERE openid = $1', [openid]);

    let user: Record<string, unknown>;

    if (existingUsers.length > 0) {
      user = existingUsers[0];
      await pool.query('UPDATE users SET last_active = now() WHERE id = $1', [user.id]);
    } else {
      const newId = uuidv4();
      const { rows: newUsers } = await pool.query(
        'INSERT INTO users (id, openid) VALUES ($1, $2) RETURNING *',
        [newId, openid]
      );
      user = newUsers[0];
    }

    const token = jwt.sign({ userId: user.id as string, openid }, config.jwtSecret, { expiresIn: '7d' });

    res.json({
      success: true,
      data: { token, user: toCamelCase(user) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Auth Login Error]', message, err);
    res.status(500).json({ success: false, message: `服务器内部错误: ${message}` });
  }
});

router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId]);

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    res.json({ success: true, data: toCamelCase(rows[0]) });
  } catch (err) {
    console.error('[Auth Profile Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { nickname, avatar_url } = req.body;

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (nickname !== undefined) {
      updates.push(`nickname = $${idx++}`);
      values.push(nickname);
    }
    if (avatar_url !== undefined) {
      updates.push(`avatar_url = $${idx++}`);
      values.push(avatar_url);
    }

    updates.push('last_active = now()');
    values.push(req.userId);

    const { rows } = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (rows.length === 0) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    res.json({ success: true, data: toCamelCase(rows[0]) });
  } catch (err) {
    console.error('[Auth Profile Update Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
