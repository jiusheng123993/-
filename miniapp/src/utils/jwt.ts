// 星寰海 v2.0 - JWT Token 工具函数
import CryptoJS from 'crypto-js';

/** JWT Payload 结构 */
export interface JwtPayload {
  sub: string; // 用户 ID
  openid: string; // 微信 openid
  exp: number; // 过期时间（秒）
  iat: number; // 签发时间（秒）
  [key: string]: unknown;
}

/** Token 解析结果 */
export interface TokenParseResult {
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
}

/**
 * 解码 Base64 URL 安全字符串
 */
function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  return decodeURIComponent(
    CryptoJS.enc.Utf8.stringify(CryptoJS.enc.Base64.parse(base64))
  );
}

/**
 * 解析 JWT Token
 * @param token JWT Token
 */
export function parseToken(token: string): TokenParseResult {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    const [headerB64, payloadB64] = parts;
    JSON.parse(base64UrlDecode(headerB64)); // 验证 header 格式
    const payload = JSON.parse(base64UrlDecode(payloadB64));

    // 验证签名（Mock 模式跳过）
    // 生产环境应使用公钥验证签名

    return {
      valid: true,
      payload: payload as JwtPayload,
    };
  } catch (err) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Token parsing failed',
    };
  }
}

/**
 * 验证 Token 是否有效
 * @param token JWT Token
 * @param checkExpiry 是否检查过期时间
 */
export function verifyToken(token: string, checkExpiry: boolean = true): boolean {
  const result = parseToken(token);

  if (!result.valid || !result.payload) {
    return false;
  }

  if (checkExpiry) {
    const now = Math.floor(Date.now() / 1000);
    if (result.payload.exp && result.payload.exp < now) {
      return false;
    }
  }

  return true;
}

/**
 * 获取 Token 剩余有效期（秒）
 * @param token JWT Token
 */
export function getTokenExpiry(token: string): number | null {
  const result = parseToken(token);

  if (!result.valid || !result.payload) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = result.payload.exp;

  if (!exp) {
    return null;
  }

  return exp - now;
}

/**
 * 检查 Token 是否即将过期（默认 5 分钟内）
 * @param token JWT Token
 * @param thresholdSeconds 提前刷新的阈值（秒）
 */
export function isTokenExpiringSoon(
  token: string,
  thresholdSeconds: number = 5 * 60
): boolean {
  const remaining = getTokenExpiry(token);

  if (remaining === null) {
    return true; // 无法解析，视为需要刷新
  }

  return remaining <= thresholdSeconds;
}

/**
 * 从 Token 中提取用户 ID
 * @param token JWT Token
 */
export function getUserIdFromToken(token: string): string | null {
  const result = parseToken(token);

  if (!result.valid || !result.payload) {
    return null;
  }

  return result.payload.sub || null;
}

/**
 * 从 Token 中提取 openid
 * @param token JWT Token
 */
export function getOpenidFromToken(token: string): string | null {
  const result = parseToken(token);

  if (!result.valid || !result.payload) {
    return null;
  }

  return result.payload.openid || null;
}
