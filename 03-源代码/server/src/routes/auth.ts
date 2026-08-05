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
import { wxLoginSchema, sendSmsSchema, phoneLoginSchema } from '../schemas/index.js';
import { UserRepository } from '../repositories/userRepository.js';

const router = Router();

const userRepository = new UserRepository();

/**
 * 短信验证码存储（内存实现，生产环境应替换为 Redis + 短信服务商）
 * key: phone → { code, expiresAt }
 */
const smsCodeStore = new Map<string, { code: string; expiresAt: number }>();

/** 验证码有效期（分钟） */
const SMS_CODE_TTL_MINUTES = 5;

/** 生成 6 位随机验证码 */
function generateSmsCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

/**
 * 发送短信验证码（App/H5 手机号登录）
 * 开发环境直接返回验证码便于联调；生产环境需接入短信服务商（阿里云/腾讯云 SMS）
 */
router.post('/send-sms', validate({ body: sendSmsSchema }), async (req: Request, res: Response) => {
  try {
    const { phone } = req.body as { phone: string };

    // 发送频率限制（简单内存限流：同一手机号 60 秒内只能发一次）
    const existing = smsCodeStore.get(phone);
    if (existing && existing.expiresAt - Date.now() > SMS_CODE_TTL_MINUTES * 60 * 1000 - 60 * 1000) {
      res.status(429).json({ success: false, message: '发送过于频繁，请稍后再试' });
      return;
    }

    const code = generateSmsCode();
    smsCodeStore.set(phone, {
      code,
      expiresAt: Date.now() + SMS_CODE_TTL_MINUTES * 60 * 1000,
    });

    // 短信服务商接入 TODO：生产环境需接入阿里云/腾讯云 SMS 发送到用户手机
    // 日志脱敏：仅记录手机号后 4 位；完整验证码只在非生产环境输出便于联调
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[SMS] 开发模式验证码 phone=${phone.slice(-4)} 完整验证码=${code}`);
    } else {
      console.log(`[SMS] 验证码已发送 phone=${phone.slice(-4)}`);
    }

    res.json({
      success: true,
      message: '验证码已发送',
      // 非生产环境返回验证码便于联调，生产环境必须删除该字段
      ...(process.env.NODE_ENV !== 'production' ? { devCode: code } : {}),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Auth SendSms Error]', message);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * 手机号验证码登录（App/H5）
 */
router.post('/login/phone', validate({ body: phoneLoginSchema }), async (req: Request, res: Response) => {
  try {
    const { phone, code } = req.body as { phone: string; code: string };

    const record = smsCodeStore.get(phone);
    if (!record || record.code !== code) {
      res.status(400).json({ success: false, message: '验证码错误' });
      return;
    }
    if (record.expiresAt < Date.now()) {
      smsCodeStore.delete(phone);
      res.status(400).json({ success: false, message: '验证码已过期，请重新获取' });
      return;
    }

    // 验证通过后立即删除验证码（一次性使用）
    smsCodeStore.delete(phone);

    let user = await userRepository.findByPhone(phone);

    if (!user) {
      const newId = uuidv4();
      user = await userRepository.createPhoneUser(newId, phone);
    }

    await userRepository.updateLastActive(user.id);

    const token = jwt.sign({ userId: user.id, phone }, config.jwtSecret, { expiresIn: '7d' });

    res.json({
      success: true,
      data: { token, user: toCamelCase(user as unknown as Record<string, unknown>) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Auth Phone Login Error]', message);
    res.status(500).json({ success: false, message: `服务器内部错误: ${message}` });
  }
});

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

/** POST /api/auth/bind-phone - 微信小程序绑定手机号 */
router.post('/bind-phone', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { code } = req.body as { code: string };

    if (!code) {
      res.status(400).json({ success: false, message: '缺少手机号授权码' });
      return;
    }

    const isDev = !config.wechat.appId || !config.wechat.secret;

    let phoneNumber: string;

    if (isDev) {
      // 开发模式：直接使用 code 作为手机号（仅用于开发测试）
      phoneNumber = code;
    } else {
      // 生产环境：调用微信 getPhoneNumber 接口
      const accessTokenRes = await fetch(
        `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${config.wechat.appId}&secret=${config.wechat.secret}`
      );
      const tokenData = (await accessTokenRes.json()) as { access_token?: string; errcode?: number };

      if (!tokenData.access_token) {
        console.error('[Auth] 获取 access_token 失败:', tokenData.errcode);
        res.status(500).json({ success: false, message: '绑定失败，请稍后重试' });
        return;
      }

      const phoneRes = await fetch(
        `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${tokenData.access_token}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        }
      );
      const phoneData = (await phoneRes.json()) as {
        errcode?: number;
        phone_info?: { purePhoneNumber?: string };
      };

      if (phoneData.errcode !== 0 || !phoneData.phone_info?.purePhoneNumber) {
        console.error('[Auth] 获取手机号失败:', phoneData.errcode);
        res.status(400).json({ success: false, message: '手机号获取失败，请重新授权' });
        return;
      }

      phoneNumber = phoneData.phone_info.purePhoneNumber;
    }

    // 更新用户手机号
    const updatedUser = await userRepository.bindPhone(req.userId!, phoneNumber);

    if (!updatedUser) {
      res.status(404).json({ success: false, message: '用户不存在' });
      return;
    }

    res.json({
      success: true,
      data: { phone: phoneNumber.slice(-4) },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[Auth BindPhone Error]', message);
    res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

export default router;
