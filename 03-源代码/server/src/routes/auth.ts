/**
 * 认证路由 - 登录、用户资料管理
 * 处理微信小程序登录（含开发模式降级）、用户资料查询和更新
 */
import { Router, type Request, type Response } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config.js';
import { authMiddleware } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { wxLoginSchema } from '../schemas/index.js';
import { UserRepository } from '../repositories/userRepository.js';

const router = Router();

const userRepository = new UserRepository();

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

router.post('/login', validate({ body: wxLoginSchema }), async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

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

    const existingUser = await userRepository.findByOpenid(openid);

    let user: Record<string, unknown>;

    if (existingUser) {
      user = existingUser as unknown as Record<string, unknown>;
      await userRepository.updateLastActive(user.id as string);
    } else {
      const newId = uuidv4();
      const newUser = await userRepository.createUser(newId, openid);
      user = newUser as unknown as Record<string, unknown>;
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
    const user = await userRepository.findById(req.userId!);

    if (!user) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    res.json({ success: true, data: toCamelCase(user as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Auth Profile Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

router.put('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { nickname, avatar_url } = req.body;

    const updatedUser = await userRepository.updateProfile(req.userId!, { nickname, avatar_url });

    if (!updatedUser) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    res.json({ success: true, data: toCamelCase(updatedUser as unknown as Record<string, unknown>) });
  } catch (err) {
    console.error('[Auth Profile Update Error]', err);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
